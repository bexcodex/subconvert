import React, { useState } from 'react';
import yaml from 'js-yaml';
import QRCode from 'qrcode.react';

// Protocol conversion functions
const parseV2RayLink = (link) => {
  try {
    const url = new URL(link);
    const protocol = url.protocol.replace(':', '').toLowerCase();
    
    const config = {
      name: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'V2Ray Server',
      type: '',
      server: url.hostname,
      port: parseInt(url.port) || 443,
    };

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
  return {
    name: vmessData.ps,
    type: 'vmess',
    server: vmessData.add,
    port: parseInt(vmessData.port),
    uuid: vmessData.id,
    alterId: parseInt(vmessData.aid) || 0,
    cipher: vmessData.scy || 'auto',
    network: vmessData.net || 'tcp',
    tls: vmessData.tls === 'tls' ? true : false,
    sni: vmessData.sni || vmessData.host || '',
    host: vmessData.host || '',
    path: vmessData.path || '/',
    headerType: vmessData.type || 'none',
    alpn: vmessData.alpn || '',
    fingerprint: vmessData.fp || '',
    reality: {
      enabled: vmessData.pbk && vmessData.sid && vmessData.spx ? true : false,
      publicKey: vmessData.pbk || '',
      shortId: vmessData.sid || '',
      spiderX: vmessData.spx || '',
      fingerprint: vmessData.fp || 'chrome',
    }
  };
};

const parseVLessLink = (link) => {
  const url = new URL(link);
  const params = new URLSearchParams(url.search);
  
  return {
    name: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'VLess Server',
    type: 'vless',
    server: url.hostname,
    port: parseInt(url.port) || 443,
    uuid: url.username,
    flow: params.get('flow') || '',
    network: params.get('type') || 'tcp',
    tls: params.get('security') === 'tls' || params.get('security') === 'reality',
    reality: {
      enabled: params.get('security') === 'reality',
      publicKey: params.get('pbk') || '',
      shortId: params.get('sid') || '',
      spiderX: params.get('spx') || '',
      fingerprint: params.get('fp') || 'chrome',
    },
    sni: params.get('sni') || params.get('host') || '',
    host: params.get('host') || '',
    path: params.get('path') || '/',
    headerType: params.get('headerType') || 'none',
    alpn: params.get('alpn') || '',
  };
};

const parseTrojanLink = (link) => {
  const url = new URL(link);
  const params = new URLSearchParams(url.search);
  
  return {
    name: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'Trojan Server',
    type: 'trojan',
    server: url.hostname,
    port: parseInt(url.port) || 443,
    password: url.username,
    sni: params.get('sni') || url.hostname,
    alpn: params.get('alpn') || '',
    skipCertVerify: params.get('allowInsecure') === '1',
    network: params.get('type') || 'tcp',
    fp: params.get('fp') || 'randomized',
    tls: true,
    reality: {
      enabled: params.get('security') === 'reality',
      publicKey: params.get('pbk') || '',
      shortId: params.get('sid') || '',
      spiderX: params.get('spx') || '',
      fingerprint: params.get('fp') || 'chrome',
    },
  };
};

const parseShadowsocksLink = (link) => {
  const url = new URL(link);
  const [method, password] = atob(url.username).split(':');
  
  return {
    name: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'Shadowsocks Server',
    type: 'ss',
    server: url.hostname,
    port: parseInt(url.port) || 8388,
    cipher: method,
    password: password,
    plugin: url.searchParams.get('plugin') || '',
    pluginOpts: url.searchParams.get('plugin-opts') || '',
  };
};

const parseSSRLink = (link) => {
  const base64Data = link.replace('ssr://', '');
  const decoded = atob(base64Data);
  const parts = decoded.split(':');
  
  if (parts.length < 6) throw new Error('Invalid SSR link format');
  
  const [server, port, protocol, method, obfs, base64Params] = parts;
  const paramsStr = atob(base64Params);
  const params = new URLSearchParams('?' + paramsStr);
  
  return {
    name: params.get('remarks') || 'SSR Server',
    type: 'ssr',
    server: server,
    port: parseInt(port),
    cipher: method,
    password: atob(params.get('password')),
    protocol: protocol,
    protocolParam: atob(params.get('protoparam') || ''),
    obfs: obfs,
    obfsParam: atob(params.get('obfsparam') || ''),
  };
};

const parseHTTPProxyLink = (link) => {
  const url = new URL(link);
  const params = new URLSearchParams(url.search);
  
  return {
    name: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'HTTP Proxy',
    type: 'http',
    server: url.hostname,
    port: parseInt(url.port) || 80,
    username: url.username || '',
    password: url.password || '',
    tls: url.protocol === 'https:',
    sni: params.get('sni') || '',
  };
};

const generateClashYAML = (config, settings) => {
  // Create proxy configuration
  const proxies = [config];
  
  // Create proxy groups
  const proxyGroups = [];
  
  // Add load balancing group if enabled
  if (settings.loadBalance) {
    proxyGroups.push({
      name: "LoadBalance",
      type: "load-balance",
      strategy: "round-robin",
      proxies: [config.name],
      use: ["sub1"], // using all subscriptions
      interval: 300,
      tolerance: 50,
    });
  }
  
  // Add fallback group if enabled
  if (settings.fallback) {
    proxyGroups.push({
      name: "Fallback",
      type: "fallback",
      proxies: [config.name, "DIRECT"],
      use: ["sub1"],
      interval: 300,
      tolerance: 50,
    });
  }
  
  // Add URL test group if enabled
  if (settings.urlTest) {
    proxyGroups.push({
      name: "URLTest",
      type: "url-test",
      proxies: [config.name],
      use: ["sub1"],
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
    });
  }
  
  // Add default proxy groups
  proxyGroups.push(
    {
      name: "Proxy",
      type: "select",
      proxies: settings.loadBalance 
        ? ["LoadBalance", "Fallback", "URLTest", config.name] 
        : settings.fallback 
          ? ["Fallback", "URLTest", config.name] 
          : settings.urlTest 
            ? ["URLTest", config.name] 
            : [config.name, "DIRECT"],
    },
    {
      name: "Final",
      type: "select",
      proxies: ["Proxy", "DIRECT", "REJECT"],
    }
  );
  
  // Create rules based on settings
  const rules = [];
  
  // Block ads if enabled
  if (settings.blockAds) {
    rules.push(
      "DOMAIN-SUFFIX,ad.com,REJECT",
      "DOMAIN-SUFFIX,adsrvr.org,REJECT",
      "DOMAIN-SUFFIX,doubleclick.net,REJECT",
      "DOMAIN-SUFFIX,googleadservices.com,REJECT",
      "DOMAIN-SUFFIX,googlesyndication.com,REJECT",
      "DOMAIN-SUFFIX,googletagmanager.com,REJECT",
      "DOMAIN-SUFFIX,googletagservices.com,REJECT",
      "DOMAIN-SUFFIX,googlesyndication.com,REJECT",
      "DOMAIN-SUFFIX,adnxs.com,REJECT",
      "DOMAIN-SUFFIX,mathtag.com,REJECT",
      "DOMAIN-SUFFIX,ads-twitter.com,REJECT",
      "DOMAIN-SUFFIX,ads.linkedin.com,REJECT",
      "DOMAIN-SUFFIX,ads.pinterest.com,REJECT",
      "DOMAIN-SUFFIX,ads-api.twitter.com,REJECT",
      "DOMAIN-SUFFIX,ads.yahoo.com,REJECT",
      "DOMAIN-SUFFIX,analytics.google.com,REJECT",
      "DOMAIN-SUFFIX,stats.g.doubleclick.net,REJECT",
      "DOMAIN-SUFFIX,google-analytics.com,REJECT",
      "DOMAIN-SUFFIX,analytics.google.com,REJECT",
      "DOMAIN-SUFFIX,doubleclick.com,REJECT",
      "DOMAIN-SUFFIX,googleadservices.com,REJECT",
      "DOMAIN-SUFFIX,googlesyndication.com,REJECT",
      "DOMAIN-SUFFIX,googletagmanager.com,REJECT",
      "DOMAIN-SUFFIX,googletagservices.com,REJECT",
      "DOMAIN-SUFFIX,google-analytics.com,REJECT",
      "DOMAIN-SUFFIX,googleapis.com,REJECT",
      "DOMAIN-SUFFIX,googleusercontent.com,REJECT",
      "DOMAIN-SUFFIX,googlevideo.com,REJECT",
      "DOMAIN-SUFFIX,googlesyndication.com,REJECT",
      "DOMAIN-SUFFIX,googles.com,REJECT",
      "DOMAIN-SUFFIX,googleadservices.com,REJECT",
      "DOMAIN-SUFFIX,google-analytics.com,REJECT",
      "DOMAIN-SUFFIX,googleapis.com,REJECT",
      "DOMAIN-SUFFIX,googleusercontent.com,REJECT",
      "DOMAIN-SUFFIX,googlevideo.com,REJECT",
      "DOMAIN-SUFFIX,googlesyndication.com,REJECT",
      "DOMAIN-SUFFIX,googles.com,REJECT",
      "DOMAIN-SUFFIX,googleadservices.com,REJECT",
      "DOMAIN-SUFFIX,google-analytics.com,REJECT",
      "DOMAIN-SUFFIX,googleapis.com,REJECT",
      "DOMAIN-SUFFIX,googleusercontent.com,REJECT",
      "DOMAIN-SUFFIX,googlevideo.com,REJECT",
      "DOMAIN-SUFFIX,googlesyndication.com,REJECT",
      "DOMAIN-SUFFIX,googles.com,REJECT"
    );
  }
  
  // Default rules
  rules.push(
    "DOMAIN-SUFFIX,ipify.org,DIRECT",
    "DOMAIN-SUFFIX,ip-api.com,DIRECT",
    "DOMAIN-SUFFIX,ipv4.google.com,DIRECT",
    "DOMAIN-SUFFIX,ipv6.google.com,DIRECT",
    "DOMAIN-SUFFIX,bing.com,DIRECT",
    "DOMAIN-SUFFIX,bing.net,DIRECT",
    "GEOIP,CN,DIRECT",
    "MATCH,Final"
  );
  
  const clashConfig = {
    port: 7890,
    socks-port: 7891,
    allow-lan: true,
    mode: "rule",
    log-level: "info",
    external-controller: "127.0.0.1:9090",
    proxies: proxies,
    'proxy-groups': proxyGroups,
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