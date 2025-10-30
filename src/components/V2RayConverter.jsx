import React, { useState } from 'react';
import yaml from 'js-yaml';
import QRCode from 'qrcode.react';

// Protocol conversion functions
const parseV2RayLink = (link) => {
  try {
    const url = new URL(link);
    const protocol = url.protocol.replace(':', '').toLowerCase();
    
    switch (protocol) {
      case 'vmess':
        return parseVMessLink(link);
      case 'vless':
        return parseVLessLink(link);
      case 'trojan':
        return parseTrojanLink(link);
      case 'shadowsocks':
      case 'ss':
        return parseShadowsocksLink(link);
      case 'ssr':
        return parseSSRLink(link);
      case 'http':
      case 'https':
        return parseHTTPProxyLink(link);
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  } catch (error) {
    throw new Error(`Invalid link format: ${error.message}`);
  }
};

const parseVMessLink = (link) => {
  const vmessData = JSON.parse(atob(link.replace('vmess://', '')));
  
  const config = {
    name: vmessData.ps || 'VMess Server',
    type: 'vmess',
    server: vmessData.add,
    port: parseInt(vmessData.port),
    uuid: vmessData.id,
    alterId: parseInt(vmessData.aid) || 0,
    cipher: vmessData.scy || 'auto',
  };
  
  // TLS settings
  if (vmessData.tls === 'tls') {
    config.tls = true;
    if (vmessData.sni) config.servername = vmessData.sni;
    if (vmessData.alpn) config.alpn = vmessData.alpn;
    if (vmessData.fp) config.fingerprint = vmessData.fp;
  }
  
  // Network settings
  config.network = vmessData.net || 'tcp';
  
  if (config.network === 'ws') {
    if (vmessData.path) config.wsPath = vmessData.path;
    if (vmessData.host) config.wsHeaders = { Host: vmessData.host };
  } else if (config.network === 'grpc') {
    if (vmessData.path) config.grpcServiceName = vmessData.path;
  } else if (config.network === 'h2' || config.network === 'http') {
    if (vmessData.path) config.h2Path = vmessData.path;
    if (vmessData.host) config.h2Host = [vmessData.host];
  } else if (config.network === 'tcp') {
    if (vmessData.type && vmessData.type !== 'none') {
      config.tcpHeaders = { type: vmessData.type };
      if (vmessData.host) config.tcpHeaders.request = { headers: { Host: [vmessData.host] } };
      if (vmessData.path) config.tcpHeaders.request = { path: [vmessData.path] };
    }
  }
  
  // Reality settings
  if (vmessData.pbk && vmessData.sid) {
    config.realityOpts = {
      publicKey: vmessData.pbk,
      shortId: vmessData.sid
    };
    if (vmessData.spx) config.realityOpts.spiderX = vmessData.spx;
    if (vmessData.fp) config.realityOpts.fingerprint = vmessData.fp;
  }
  
  return config;
};

const parseVLessLink = (link) => {
  const url = new URL(link);
  const params = new URLSearchParams(url.search);
  
  const config = {
    name: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'VLess Server',
    type: 'vless',
    server: url.hostname,
    port: parseInt(url.port) || 443,
    uuid: url.username,
  };
  
  // Flow for VLESS
  const flow = params.get('flow');
  if (flow) config.flow = flow;
  
  // Network settings
  config.network = params.get('type') || 'tcp';
  
  // TLS settings
  const security = params.get('security');
  if (security === 'tls') {
    config.tls = true;
  } else if (security === 'reality') {
    config.tls = true;
    config.realityOpts = {
      publicKey: params.get('pbk') || '',
      shortId: params.get('sid') || ''
    };
    if (params.get('spx')) config.realityOpts.spiderX = params.get('spx');
    if (params.get('fp')) config.realityOpts.fingerprint = params.get('fp');
  }
  
  // SNI
  const sni = params.get('sni') || params.get('host');
  if (sni) config.servername = sni;
  
  // Network-specific settings
  if (config.network === 'ws') {
    const path = params.get('path') || '/';
    config.wsPath = path;
    const host = params.get('host');
    if (host) config.wsHeaders = { Host: host };
  } else if (config.network === 'grpc') {
    const serviceName = params.get('serviceName') || params.get('path') || 'gRPC';
    config.grpcServiceName = serviceName;
    if (params.get('mode') === 'multi') config.grpcMultiMode = true;
  } else if (config.network === 'h2' || config.network === 'http') {
    const path = params.get('path');
    if (path) config.h2Path = path;
    const host = params.get('host');
    if (host) config.h2Host = [host];
  } else if (config.network === 'tcp') {
    const headerType = params.get('headerType');
    if (headerType && headerType !== 'none') {
      config.tcpHeaders = { type: headerType };
    }
  }
  
  // ALPN
  const alpn = params.get('alpn');
  if (alpn) config.alpn = alpn;
  
  return config;
};

const parseTrojanLink = (link) => {
  const url = new URL(link);
  const params = new URLSearchParams(url.search);
  
  const config = {
    name: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'Trojan Server',
    type: 'trojan',
    server: url.hostname,
    port: parseInt(url.port) || 443,
    password: url.username, // The password is in the username part of the URL
  };
  
  // TLS settings
  config.tls = true;
  
  const sni = params.get('sni') || url.hostname;
  if (sni) config.servername = sni;
  
  if (params.get('alpn')) config.alpn = params.get('alpn');
  
  // Skip certificate verification
  if (params.get('allowInsecure') === '1' || params.get('allowInsecure') === 'true') {
    config.skipCertVerify = true;
  }
  
  // Network settings
  config.network = params.get('type') || 'tcp';
  
  if (params.get('fp')) config.fingerprint = params.get('fp');
  
  // Reality settings
  if (params.get('security') === 'reality') {
    config.realityOpts = {
      publicKey: params.get('pbk') || '',
      shortId: params.get('sid') || ''
    };
    if (params.get('spx')) config.realityOpts.spiderX = params.get('spx');
    if (params.get('fp')) config.realityOpts.fingerprint = params.get('fp');
  }
  
  // Network-specific settings
  if (config.network === 'ws') {
    const path = params.get('path') || '/';
    config.wsPath = path;
    const host = params.get('host');
    if (host) config.wsHeaders = { Host: host };
  } else if (config.network === 'grpc') {
    const serviceName = params.get('serviceName') || params.get('path') || 'gRPC';
    config.grpcServiceName = serviceName;
  }
  
  return config;
};

const parseShadowsocksLink = (link) => {
  const url = new URL(link);
  const [method, password] = atob(url.username).split(':');
  
  const config = {
    name: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'Shadowsocks Server',
    type: 'ss',
    server: url.hostname,
    port: parseInt(url.port) || 8388,
    cipher: method,
    password: password,
  };
  
  // Plugin support
  const plugin = url.searchParams.get('plugin');
  if (plugin) {
    const [pluginName, pluginOpts] = plugin.split(';');
    config.plugin = pluginName;
    if (pluginOpts) {
      // Parse plugin options
      const pluginOptions = {};
      pluginOpts.split('&').forEach(opt => {
        const [key, value] = opt.split('=');
        pluginOptions[key] = value ? decodeURIComponent(value) : '';
      });
      config.pluginOpts = pluginOptions;
    }
  }
  
  return config;
};

const parseSSRLink = (link) => {
  const base64Data = link.replace('ssr://', '');
  const decoded = atob(base64Data);
  const parts = decoded.split(':');
  
  if (parts.length < 6) throw new Error('Invalid SSR link format');
  
  const [server, port, protocol, method, obfs, base64Params] = parts;
  const paramsStr = atob(base64Params);
  const params = new URLSearchParams('?' + paramsStr);
  
  const config = {
    name: params.get('remarks') || 'SSR Server',
    type: 'ssr',
    server: server,
    port: parseInt(port),
    cipher: method,
    password: atob(params.get('password')),
    protocol: protocol,
    obfs: obfs,
  };
  
  if (params.get('protoparam')) config.protocolParam = atob(params.get('protoparam'));
  if (params.get('obfsparam')) config.obfsParam = atob(params.get('obfsparam'));
  
  return config;
};

const parseHTTPProxyLink = (link) => {
  const url = new URL(link);
  
  const config = {
    name: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'HTTP Proxy',
    type: 'http',
    server: url.hostname,
    port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
  };
  
  if (url.username) config.username = url.username;
  if (url.password) config.password = url.password;
  
  // Enable TLS if HTTPS
  if (url.protocol === 'https:') {
    config.tls = true;
    const sni = new URLSearchParams(url.search).get('sni');
    if (sni) config.servername = sni;
  }
  
  return config;
};

const generateClashYAML = (config, settings) => {
  // Create proxy configuration
  const proxies = [config];
  
  // Create proxy groups
  const proxyGroups = [];
  
  // Add URL test group if enabled
  if (settings.urlTest) {
    proxyGroups.push({
      name: "Auto",
      type: "url-test",
      proxies: [config.name],
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
    });
  }
  
  // Add fallback group if enabled
  if (settings.fallback) {
    proxyGroups.push({
      name: "Fallback",
      type: "fallback",
      proxies: [config.name],
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
    });
  }
  
  // Add load balancing group if enabled
  if (settings.loadBalance) {
    proxyGroups.push({
      name: "LoadBalance",
      type: "load-balance",
      proxies: [config.name],
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      strategy: "round-robin"
    });
  }
  
  // Add default proxy groups
  proxyGroups.push(
    {
      name: "Proxy",
      type: "select",
      proxies: settings.urlTest 
        ? ["Auto", config.name, "DIRECT"] 
        : settings.fallback 
          ? ["Fallback", config.name, "DIRECT"] 
          : settings.loadBalance 
            ? ["LoadBalance", config.name, "DIRECT"] 
            : [config.name, "DIRECT"],
    },
    {
      name: "AsianTV",
      type: "select",
      proxies: ["DIRECT", config.name],
    },
    {
      name: "GlobalTV",
      type: "select",
      proxies: [config.name, "DIRECT"],
    },
    {
      name: "Microsoft",
      type: "select",
      proxies: [config.name, "DIRECT"],
    },
    {
      name: "Apple",
      type: "select",
      proxies: [config.name, "DIRECT", "Proxy"],
    },
    {
      name: "AdBlock",
      type: "select",
      proxies: ["REJECT", "DIRECT"],
    },
    {
      name: "Final",
      type: "select",
      proxies: ["Proxy", "DIRECT"],
    }
  );
  
  // Create rules based on settings
  const rules = [];
  
  // Block ads if enabled
  if (settings.blockAds) {
    rules.push(
      "DOMAIN-SUFFIX,ad.com,AdBlock",
      "DOMAIN-SUFFIX,adsrvr.org,AdBlock",
      "DOMAIN-SUFFIX,doubleclick.net,AdBlock",
      "DOMAIN-SUFFIX,googleadservices.com,AdBlock",
      "DOMAIN-SUFFIX,googlesyndication.com,AdBlock",
      "DOMAIN-SUFFIX,googletagmanager.com,AdBlock",
      "DOMAIN-SUFFIX,googletagservices.com,AdBlock",
      "DOMAIN-SUFFIX,adnxs.com,AdBlock",
      "DOMAIN-SUFFIX,mathtag.com,AdBlock",
      "DOMAIN-SUFFIX,ads-twitter.com,AdBlock",
      "DOMAIN-SUFFIX,ads.linkedin.com,AdBlock",
      "DOMAIN-SUFFIX,ads.pinterest.com,AdBlock",
      "DOMAIN-SUFFIX,ads-api.twitter.com,AdBlock",
      "DOMAIN-SUFFIX,ads.yahoo.com,AdBlock",
      "DOMAIN-SUFFIX,analytics.google.com,AdBlock",
      "DOMAIN-SUFFIX,stats.g.doubleclick.net,AdBlock",
      "DOMAIN-SUFFIX,google-analytics.com,AdBlock",
      "DOMAIN-SUFFIX,doubleclick.com,AdBlock",
      "DOMAIN-SUFFIX,googleadservices.com,AdBlock",
      "DOMAIN-SUFFIX,googlesyndication.com,AdBlock",
      "DOMAIN-SUFFIX,googletagmanager.com,AdBlock",
      "DOMAIN-SUFFIX,googletagservices.com,AdBlock",
      "DOMAIN-SUFFIX,google-analytics.com,AdBlock",
      "DOMAIN-SUFFIX,googleapis.com,AdBlock",
      "DOMAIN-SUFFIX,googleusercontent.com,AdBlock",
      "DOMAIN-SUFFIX,googlevideo.com,AdBlock",
      "DOMAIN-SUFFIX,googlesyndication.com,AdBlock",
      "DOMAIN-SUFFIX,googles.com,AdBlock",
      "DOMAIN-SUFFIX,googleadservices.com,AdBlock",
      "DOMAIN-SUFFIX,google-analytics.com,AdBlock",
      "DOMAIN-SUFFIX,googleapis.com,AdBlock",
      "DOMAIN-SUFFIX,googleusercontent.com,AdBlock",
      "DOMAIN-SUFFIX,googlevideo.com,AdBlock",
      "DOMAIN-SUFFIX,googlesyndication.com,AdBlock",
      "DOMAIN-SUFFIX,googles.com,AdBlock",
      "DOMAIN-SUFFIX,googleadservices.com,AdBlock",
      "DOMAIN-SUFFIX,google-analytics.com,AdBlock",
      "DOMAIN-SUFFIX,googleapis.com,AdBlock",
      "DOMAIN-SUFFIX,googleusercontent.com,AdBlock",
      "DOMAIN-SUFFIX,googlevideo.com,AdBlock",
      "DOMAIN-SUFFIX,googlesyndication.com,AdBlock",
      "DOMAIN-SUFFIX,googles.com,AdBlock"
    );
  }
  
  // Default rules
  rules.push(
    "DOMAIN-SUFFIX,clash.razord.top,DIRECT",
    "DOMAIN-SUFFIX,ipinfo.io,DIRECT",
    "DOMAIN-SUFFIX,ip-api.com,DIRECT",
    "DOMAIN-SUFFIX,ipv4.google.com,DIRECT",
    "DOMAIN-SUFFIX,ipv6.google.com,DIRECT",
    "DOMAIN-SUFFIX,bing.com,DIRECT",
    "DOMAIN-SUFFIX,bing.net,DIRECT",
    
    // Apple
    "DOMAIN-SUFFIX,aaplimg.com,Apple",
    "DOMAIN-SUFFIX,apple.co,Apple",
    "DOMAIN-SUFFIX,apple.com,Apple",
    "DOMAIN-SUFFIX,apple.com.cn,Apple",
    "DOMAIN-SUFFIX,icloud.com,Apple",
    "DOMAIN-SUFFIX,icloud.com.cn,Apple",
    
    // Microsoft
    "DOMAIN-SUFFIX,microsoft.com,Microsoft",
    "DOMAIN-SUFFIX,microsoft.com.cn,Microsoft",
    "DOMAIN-SUFFIX,office.com,Microsoft",
    "DOMAIN-SUFFIX,office.net,Microsoft",
    "DOMAIN-SUFFIX,hotmail.com,Microsoft",
    "DOMAIN-SUFFIX,outlook.com,Microsoft",
    
    // Asian TV
    "DOMAIN-SUFFIX,mytvsuper.com,AsianTV",
    "DOMAIN-SUFFIX,hk01.com,AsianTV",
    "DOMAIN-SUFFIX,now.com,AsianTV",
    
    // Global TV
    "DOMAIN-SUFFIX,netflix.com,GlobalTV",
    "DOMAIN-SUFFIX,netflix.net,GlobalTV",
    "DOMAIN-SUFFIX,nflxext.com,GlobalTV",
    "DOMAIN-SUFFIX,nflximg.com,GlobalTV",
    "DOMAIN-SUFFIX,nflximg.net,GlobalTV",
    "DOMAIN-SUFFIX,nflxso.net,GlobalTV",
    "DOMAIN-SUFFIX,nflxvideo.net,GlobalTV",
    "DOMAIN-SUFFIX,youtube.com,GlobalTV",
    "DOMAIN-SUFFIX,googlevideo.com,GlobalTV",
    
    "GEOIP,CN,DIRECT",
    "MATCH,Final"
  );
  
  const clashConfig = {
    mixed_port: 7890,
    allow_lan: true,
    mode: "rule",
    log_level: "info",
    external_controller: "127.0.0.1:9090",
    proxies: proxies,
    "proxy-groups": proxyGroups,
    rules: rules,
  };
  
  return yaml.dump(clashConfig, { lineWidth: -1 });
};

const V2RayConverter = () => {
  const [inputLinks, setInputLinks] = useState('');
  const [outputYaml, setOutputYaml] = useState('');
  const [activeTab, setActiveTab] = useState('yaml');
  const [showQRCode, setShowQRCode] = useState(false);
  const [settings, setSettings] = useState({
    loadBalance: true,
    blockAds: true,
    urlTest: true,
    fallback: true,
  });
  
  const handleConvert = () => {
    const links = inputLinks.split('\n').filter(link => link.trim() !== '');
    const configs = [];
    
    for (const link of links) {
      try {
        const config = parseV2RayLink(link.trim());
        configs.push(config);
      } catch (error) {
        alert(`Error parsing link: ${link}\n${error.message}`);
        return;
      }
    }
    
    if (configs.length === 0) {
      alert('No valid links found');
      return;
    }
    
    // Generate a combined YAML configuration
    const combinedYaml = configs.map(config => generateClashYAML(config, settings)).join('\n');
    setOutputYaml(combinedYaml);
    setActiveTab('yaml');
  };
  
  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputYaml);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  
  const downloadYaml = () => {
    const blob = new Blob([outputYaml], { type: 'application/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clash_config.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="converter-container">
      <div className="input-section">
        <h3>V2Ray Links (One per line)</h3>
        <textarea
          value={inputLinks}
          onChange={(e) => setInputLinks(e.target.value)}
          placeholder="Paste your V2Ray links here, one per line..."
        />
      </div>
      
      <div className="settings-section">
        <h3>Advanced Settings</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <input
              type="checkbox"
              id="loadBalance"
              checked={settings.loadBalance}
              onChange={() => handleSettingChange('loadBalance')}
            />
            <label htmlFor="loadBalance">Enable Load Balancing</label>
          </div>
          
          <div className="setting-item">
            <input
              type="checkbox"
              id="blockAds"
              checked={settings.blockAds}
              onChange={() => handleSettingChange('blockAds')}
            />
            <label htmlFor="blockAds">Block Ads</label>
          </div>
          
          <div className="setting-item">
            <input
              type="checkbox"
              id="urlTest"
              checked={settings.urlTest}
              onChange={() => handleSettingChange('urlTest')}
            />
            <label htmlFor="urlTest">URL Test</label>
          </div>
          
          <div className="setting-item">
            <input
              type="checkbox"
              id="fallback"
              checked={settings.fallback}
              onChange={() => handleSettingChange('fallback')}
            />
            <label htmlFor="fallback">Fallback</label>
          </div>
        </div>
      </div>
      
      <div className="button-group">
        <button onClick={handleConvert}>Convert to Clash YAML</button>
        <button className="secondary" onClick={copyToClipboard} disabled={!outputYaml}>
          Copy to Clipboard
        </button>
        <button className="secondary" onClick={downloadYaml} disabled={!outputYaml}>
          Download YAML
        </button>
        <button 
          className="secondary" 
          onClick={() => setShowQRCode(!showQRCode)} 
          disabled={!outputYaml}
        >
          {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
        </button>
      </div>
      
      {showQRCode && outputYaml && (
        <div className="qr-code">
          <QRCode value={btoa(outputYaml)} size={256} />
        </div>
      )}
      
      {outputYaml && (
        <div className="output-section">
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'yaml' ? 'active' : ''}`}
              onClick={() => setActiveTab('yaml')}
            >
              YAML
            </div>
            <div 
              className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </div>
          </div>
          
          <div className="tab-content">
            {activeTab === 'yaml' ? (
              <textarea readOnly value={outputYaml} />
            ) : (
              <div>
                <h4>Configuration Preview</h4>
                <pre>{JSON.stringify(yaml.load(outputYaml), null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default V2RayConverter;