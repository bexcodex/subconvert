// V2Ray to Clash conversion logic
import yaml from 'js-yaml';

// Main conversion function
export async function convertV2rayToConfig(v2rayLinks, options = {}, customServerSettings = {}) {
  // Split input by lines
  const links = v2rayLinks.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (links.length === 0) {
    throw new Error("No valid V2Ray links found");
  }
  
  // Process each link
  const parsedLinks = links.map((link) => parseV2rayLink(link));

  // Apply custom server/bug if enabled
  if (customServerSettings.enabled && customServerSettings.value) {
    parsedLinks.forEach(link => {
      // Store original values before modification
      const originalServer = link.server;
      const originalSni = link.sni;
      const originalWsHost = link.wsHost;
      
      // Change server to bughost
      link.server = customServerSettings.value;

      if (customServerSettings.isWildcard) {
        // Wildcard Mode: servername/sni/host = bughost.domainasli
        if (link.type === "vmess" || link.type === "vless" || link.type === "trojan") {
          link.sni = `${customServerSettings.value}.${originalSni}`;
        }

        // For websocket (ws) and HTTP Upgrade
        if (link.network === "ws" || link.type === "ss") {
          link.wsHost = `${customServerSettings.value}.${originalWsHost}`;
        }

        // For GRPC - use sni field
        if (link.network === "grpc") {
          link.sni = `${customServerSettings.value}.${originalSni}`;
        }
      }
      // If Non-Wildcard Mode, sni/servername/host remain original (no changes needed)
    });
  }

  // Generate Clash config
  return generateClashConfig(parsedLinks, options);
}

// Parsing functions for different protocols
function parseV2rayLink(link) {
  try {
    if (link.startsWith("vmess://")) {
      return parseVmessLink(link);
    } else if (link.startsWith("vless://")) {
      return parseVlessLink(link);
    } else if (link.startsWith("trojan://")) {
      return parseTrojanLink(link);
    } else if (link.startsWith("ss://")) {
      return parseShadowsocksLink(link);
    } else {
      throw new Error(`Unsupported protocol in link: ${link}`);
    }
  } catch (error) {
    console.error("Error parsing link:", error);
    throw new Error(`Failed to parse link: ${link}`);
  }
}

function parseVmessLink(link) {
  // Remove vmess:// prefix and decode base64
  const base64Content = link.replace("vmess://", "");
  let config;
  try {
    const decodedContent = atob(base64Content);
    config = JSON.parse(decodedContent);
  } catch (error) {
    throw new Error("Invalid VMess link format");
  }
  
  // Check if it's HTTP Upgrade
  const isHttpUpgrade = config["v2ray-http-upgrade"] === true || config["v2ray-http-upgrade"] === "true";
  // If HTTP Upgrade is enabled, network should be 'ws'
  const networkType = isHttpUpgrade ? "ws" : (config.net || "tcp");
  
  return {
    type: "vmess",
    name: config.ps || "VMess Server",
    server: config.add,
    port: Number.parseInt(config.port),
    uuid: config.id,
    alterId: Number.parseInt(config.aid || "0"),
    cipher: config.scy || "auto",
    tls: config.tls === "tls",
    network: networkType,
    wsPath: config.path || "",
    wsHost: config.host || config.add,
    grpcServiceName: config["grpc-service-name"] || config.path || "",
    httpUpgrade: isHttpUpgrade,
    sni: config.sni || config.add,
    skipCertVerify: true,
  };
}

function parseVlessLink(link) {
  // Format: vless://uuid@server:port?params#name
  try {
    // Remove vless:// prefix
    const content = link.replace("vless://", "");
    // Split into parts
    const [userInfo, rest] = content.split("@");
    const [serverPort, paramsAndName] = rest.split("?");
    const [server, port] = serverPort.split(":");
    // Parse params and name
    const params = {};
    let name = "";
    if (paramsAndName) {
      const [paramsStr, encodedName] = paramsAndName.split("#");
      name = encodedName ? decodeURIComponent(encodedName) : "VLESS Server";
      // Parse params
      paramsStr.split("&").forEach((param) => {
        const [key, value] = param.split("=");
        params[key] = value ? decodeURIComponent(value) : "";
      });
    }
    // Check if it's HTTP Upgrade
    const isHttpUpgrade = params["v2ray-http-upgrade"] === "true" || params["v2ray-http-upgrade"] === "1";
    // If HTTP Upgrade is enabled, network should be 'ws'
    const networkType = isHttpUpgrade ? "ws" : (params.type || "tcp");
    
    return {
      type: "vless",
      name: name,
      server: server,
      port: Number.parseInt(port),
      uuid: userInfo,
      tls: params.security === "tls",
      network: networkType,
      wsPath: params.path || "",
      wsHost: params.host || server,
      grpcServiceName: params.serviceName || params["grpc-service-name"] || "",
      httpUpgrade: isHttpUpgrade,
      sni: params.sni || server,
      skipCertVerify: true,
    };
  } catch (error) {
    throw new Error("Invalid VLESS link format");
  }
}

function parseTrojanLink(link) {
  // Format: trojan://password@server:port?params#name
  try {
    // Remove trojan:// prefix
    const content = link.replace("trojan://", "");
    // Split into parts
    const [password, rest] = content.split("@");
    const [serverPort, paramsAndName] = rest.split("?");
    const [server, port] = serverPort.split(":");
    // Parse params and name
    const params = {};
    let name = "";
    if (paramsAndName) {
      const [paramsStr, encodedName] = paramsAndName.split("#");
      name = encodedName ? decodeURIComponent(encodedName) : "Trojan Server";
      // Parse params
      paramsStr.split("&").forEach((param) => {
        const [key, value] = param.split("=");
        params[key] = value ? decodeURIComponent(value) : "";
      });
    }
    // Check if it's HTTP Upgrade
    const isHttpUpgrade = params["v2ray-http-upgrade"] === "true" || params["v2ray-http-upgrade"] === "1";
    // If HTTP Upgrade is enabled, network should be 'ws'
    const networkType = isHttpUpgrade ? "ws" : (params.type || "tcp");
    
    return {
      type: "trojan",
      name: name,
      server: server,
      port: Number.parseInt(port),
      password: password,
      tls: params.security === "tls" || true,
      network: networkType,
      wsPath: params.path || "",
      wsHost: params.host || server,
      grpcServiceName: params.serviceName || params["grpc-service-name"] || "",
      httpUpgrade: isHttpUpgrade,
      sni: params.sni || server,
      skipCertVerify: true,
    };
  } catch (error) {
    throw new Error("Invalid Trojan link format");
  }
}

function parseShadowsocksLink(link) {
  // Format: ss://base64(method:password)@server:port?params#name
  try {
    // Remove ss:// prefix
    const content = link.replace("ss://", "");
    let userInfo,
      serverPort,
      name,
      params = {};
    // Check if the link contains @ (SIP002 format)
    if (content.includes("@")) {
      const [encodedUserInfo, rest] = content.split("@");
      let serverPortStr, paramsNamePart;
      // Check if there are URL parameters
      if (rest.includes("?")) {
        const [serverPortPart, tempParamsNamePart] = rest.split("?");
        serverPortStr = serverPortPart;
        paramsNamePart = tempParamsNamePart;
      } else {
        // No params, just server:port#name
        const [serverPortPart, encodedName] = rest.split("#");
        serverPortStr = serverPortPart;
        name = encodedName ? decodeURIComponent(encodedName) : "SS Server";
      }

      // Parse params and name if paramsNamePart exists
      if (paramsNamePart) {
        const [paramsStr, encodedName] = paramsNamePart.split("#");
        name = encodedName ? decodeURIComponent(encodedName) : "SS Server";
        // Parse params
        paramsStr.split("&").forEach((param) => {
          const [key, value] = param.split("=");
          params[key] = value ? decodeURIComponent(value) : "";
        });
      }

      // Decode user info (method:password)
      try {
        userInfo = atob(encodedUserInfo);
      } catch (e) {
        // If decoding fails, it might be URL encoded
        userInfo = decodeURIComponent(encodedUserInfo);
      }
      serverPort = serverPortStr;
    } else {
      // Legacy format: base64(method:password@server:port)
      const [encodedData, encodedName] = content.split("#");
      const decodedData = atob(encodedData);
      // Split into method:password and server:port
      const atIndex = decodedData.lastIndexOf("@");
      userInfo = decodedData.substring(0, atIndex);
      serverPort = decodedData.substring(atIndex + 1);
      name = encodedName ? decodeURIComponent(encodedName) : "SS Server";
    }

    // Parse user info
    const [method, password] = userInfo.split(":");
    // Parse server and port
    const [server, port] = serverPort.split(":");
    return {
      type: "ss",
      name: name,
      server: server,
      port: Number.parseInt(port),
      cipher: method,
      password: password,
      udp: false,
      tls: params.security === "tls" || (params.plugin_opts && params.plugin_opts.includes("tls=1")),
      wsPath: params.path || (params.plugin_opts ? (params.plugin_opts.match(/path=([^;]+)/) || ["", ""])[1] : ""),
      wsHost: params.host || (params.plugin_opts ? (params.plugin_opts.match(/host=([^;]+)/) || ["", ""])[1] : server),
      sni: params.sni || server,
      skipCertVerify: true,
    };
  } catch (error) {
    console.error("Invalid Shadowsocks link format:", error);
    throw new Error("Invalid Shadowsocks link format");
  }
}

// Generate Clash configuration
function generateClashConfig(parsedLinks, options = {}) {
  const {
    isFullConfig = false,
    useFakeIp = true,
    bestPing = true,
    loadBalance = false,
    fallback = false,
    allGroups = false,
    adsBlock = true,
    pornBlock = true,
  } = options;
  
  let config = `# Clash Configuration\n# Generated by V2Ray to Clash Converter\n# Date: ${new Date().toISOString()}\n`;

  if (isFullConfig) {
    config += `port: 7890\nsocks-port: 7891\nallow-lan: true\nmode: rule\nlog-level: info\nexternal-controller: 127.0.0.1:9090\ndns:\n  enable: true\n  listen: 0.0.0.0:53\n  ${useFakeIp ? "enhanced-mode: fake-ip" : "enhanced-mode: redir-host"}\n  nameserver:\n    - 8.8.8.8\n    - 1.1.1.1\n    - https://dns.cloudflare.com/dns-query\n  fallback:\n    - 1.0.0.1\n    - 8.8.4.4\n    - https://dns.google/dns-query\n`;
    if (adsBlock || pornBlock) {
      config += `rule-providers:\n`;
      if (adsBlock) {
        config += `  ⛔ ADS:\n    type: http\n    behavior: domain\n    url: "https://raw.githubusercontent.com/malikshi/open_clash/refs/heads/main/rule_provider/rule_basicads.yaml"\n    path: "./rule_provider/rule_basicads.yaml"\n    interval: 86400\n`;
      }
      if (pornBlock) {
        config += `  🔞 Porn:\n    type: http\n    behavior: domain\n    url: "https://raw.githubusercontent.com/malikshi/open_clash/refs/heads/main/rule_provider/rule_porn.yaml"\n    path: "./rule_provider/rule_porn.yaml"\n    interval: 86400\n`;
      }
    }
  }
  
  config += `proxies:`;
  // Add all proxies
  parsedLinks.forEach((link, index) => {
    config += "\n";
    if (link.type === "vmess") {
      config += `  - name: "[${index + 1}]-${link.name}"\n    type: vmess\n    server: ${link.server}\n    port: ${link.port}\n    uuid: ${link.uuid}\n    alterId: ${link.alterId || 0}\n    cipher: ${link.cipher || "auto"}\n    udp: true\n    tls: ${link.tls}\n    skip-cert-verify: ${link.skipCertVerify || true}\n`;
      if (link.tls && link.sni) {
        config += `    servername: ${link.sni}\n`;
      }
      if (link.network === "ws") {
        config += `    network: ws\n    ws-opts:\n      path: ${link.wsPath || "/"}\n      headers:\n        Host: ${link.wsHost || link.server}\n`;
        if (link.httpUpgrade) {
          config += `      v2ray-http-upgrade: true\n`;
        }
      } else if (link.network === "grpc") {
        config += `    network: grpc\n    grpc-opts:\n      grpc-service-name: ${link.grpcServiceName}\n`;
      }
    } else if (link.type === "vless") {
      config += `  - name: "[${index + 1}]-${link.name}"\n    type: vless\n    server: ${link.server}\n    port: ${link.port}\n    uuid: ${link.uuid}\n    udp: true\n    tls: ${link.tls}\n    skip-cert-verify: ${link.skipCertVerify || true}\n`;
      if (link.tls && link.sni) {
        config += `    servername: ${link.sni}\n`;
      }
      if (link.network === "ws") {
        config += `    network: ws\n    ws-opts:\n      path: ${link.wsPath || "/"}\n      headers:\n        Host: ${link.wsHost || link.server}\n`;
        if (link.httpUpgrade) {
          config += `      v2ray-http-upgrade: true\n`;
        }
      } else if (link.network === "grpc") {
        config += `    network: grpc\n    grpc-opts:\n      grpc-service-name: ${link.grpcServiceName}\n`;
      }
    } else if (link.type === "trojan") {
      config += `  - name: "[${index + 1}]-${link.name}"\n    type: trojan\n    server: ${link.server}\n    port: ${link.port}\n    password: ${link.password}\n    udp: true\n    skip-cert-verify: ${link.skipCertVerify || true}\n`;
      if (link.sni) {
        config += `    sni: ${link.sni}\n`;
      }
      if (link.network === "ws") {
        config += `    network: ws\n    ws-opts:\n      path: ${link.wsPath || "/"}\n      headers:\n        Host: ${link.wsHost || link.server}\n`;
        if (link.httpUpgrade) {
          config += `      v2ray-http-upgrade: true\n`;
        }
      } else if (link.network === "grpc") {
        config += `    network: grpc\n    grpc-opts:\n      grpc-service-name: ${link.grpcServiceName}\n`;
      }
    } else if (link.type === "ss") {
      config += `  - name: "[${index + 1}]-${link.name}"\n    server: ${link.server}\n    port: ${link.port}\n    type: ss\n    cipher: ${link.cipher || "none"}\n    password: ${link.password}\n    plugin: v2ray-plugin\n    client-fingerprint: chrome\n    udp: false\n    plugin-opts:\n      mode: websocket\n      host: ${link.wsHost || link.server}\n      path: ${link.wsPath || ""}\n      tls: ${link.tls}\n      mux: false\n      skip-cert-verify: true\n    headers:\n      custom: value\n      ip-version: dual\n      v2ray-http-upgrade: false\n      v2ray-http-upgrade-fast-open: false\n`;
    }
  });

  if (isFullConfig) {
    // Create a list of proxy names first to avoid duplication
    const proxyNames = parsedLinks.map((link, index) => `"[${index + 1}]-${link.name}"`);
    config += `\nproxy-groups:\n  - name: "V2RAY-TO-CLASH"\n    type: select\n    proxies:\n      - SELECTOR\n`;
    if (bestPing) config += `      - BEST-PING\n`;
    if (loadBalance) config += `      - LOAD-BALANCE\n`;
    if (fallback) config += `      - FALLBACK\n`;
    config += `      - DIRECT\n      - REJECT\n`;

    // Add SELECTOR group
    config += `  - name: "SELECTOR"\n    type: select\n    proxies:\n      - DIRECT\n      - REJECT\n`;
    // Add all proxy names to the SELECTOR group only once
    proxyNames.forEach((name) => {
      config += `      - ${name}\n`;
    });

    // Add proxy groups based on options
    if (bestPing) {
      config += `  - name: "BEST-PING"\n    type: url-test\n    url: http://www.gstatic.com/generate_204\n    interval: 300\n    tolerance: 50\n    proxies:\n`;
      // Add all proxy names to the url-test group
      proxyNames.forEach((name) => {
        config += `      - ${name}\n`;
      });
    }
    if (loadBalance) {
      config += `  - name: "LOAD-BALANCE"\n    type: load-balance\n    url: http://www.gstatic.com/generate_204\n    interval: 300\n    strategy: round-robin\n    proxies:\n`;
      // Add all proxy names to the load-balance group
      proxyNames.forEach((name) => {
        config += `      - ${name}\n`;
      });
    }
    if (fallback) {
      config += `  - name: "FALLBACK"\n    type: fallback\n    url: http://www.gstatic.com/generate_204\n    interval: 300\n    proxies:\n`;
      // Add all proxy names to the fallback group
      proxyNames.forEach((name) => {
        config += `      - ${name}\n`;
      });
    }

    // Add rule groups if needed
    if (adsBlock) {
      config += `  - name: "ADS"\n    type: select\n    proxies:\n      - REJECT\n      - DIRECT\n`;
      if (bestPing) config += `      - BEST-PING\n`;
      if (loadBalance) config += `      - LOAD-BALANCE\n`;
      if (fallback) config += `      - FALLBACK\n`;
    }
    if (pornBlock) {
      config += `  - name: "PORN"\n    type: select\n    proxies:\n      - REJECT\n      - DIRECT\n`;
      if (bestPing) config += `      - BEST-PING\n`;
      if (loadBalance) config += `      - LOAD-BALANCE\n`;
      if (fallback) config += `      - FALLBACK\n`;
    }

    // Add rules
    config += `rules:\n`;
    if (adsBlock) {
      config += `  - RULE-SET,⛔ ADS,ADS\n`;
    }
    if (pornBlock) {
      config += `  - RULE-SET,🔞 Porn,PORN\n`;
    }
    config += `  - IP-CIDR,192.168.0.0/16,DIRECT\n  - IP-CIDR,10.0.0.0/8,DIRECT\n  - IP-CIDR,172.16.0.0/12,DIRECT\n  - IP-CIDR,127.0.0.0/8,DIRECT\n  - MATCH,V2RAY-TO-CLASH\n`;
  }
  return config;
}

// Download function
export function downloadYaml(content, filename) {
  // Create a blob with the YAML content
  const blob = new Blob([content], { type: "text/yaml" });
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  // Create a temporary link element
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // Trigger the download
  document.body.appendChild(a);
  a.click();
  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copy to clipboard function
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy: ", err);
    // Fallback method
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  }
}