import yaml from 'js-yaml';

// Define types
interface ConfigOptions {
  isFullConfig?: boolean;
  useFakeIp?: boolean;
  bestPing?: boolean;
  loadBalance?: boolean;
  fallback?: boolean;
  allGroups?: boolean;
  adsBlock?: boolean;
  pornBlock?: boolean;
}

interface V2RayLink {
  type: string;
  name: string;
  server: string;
  port: number;
  uuid?: string;
  password?: string;
  cipher?: string;
  alterId?: number;
  tls: boolean;
  network: string;
  wsPath?: string;
  wsHost?: string;
  grpcServiceName?: string;
  httpUpgrade?: boolean;
  sni?: string;
  skipCertVerify: boolean;
  uniqueName?: string;
}

interface ParsedLink extends V2RayLink {
  uniqueName: string;
}

export async function convertV2rayToConfig(v2rayLinks: string, options: ConfigOptions = {}): Promise<string> {
  const links = v2rayLinks.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (links.length === 0) {
    throw new Error("No valid V2Ray links found");
  }
  
  const parsedLinks = links.map((link) => parseV2rayLink(link));

  return generateClashConfig(parsedLinks, options);
}

function parseV2rayLink(link: string): V2RayLink {
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

function parseVmessLink(link: string): V2RayLink {
  const base64Content = link.replace("vmess://", "");
  let config: any;
  try {
    const decodedContent = atob(base64Content);
    config = JSON.parse(decodedContent);
  } catch (error) {
    throw new Error("Invalid VMess link format");
  }
  
  const isHttpUpgrade = config["v2ray-http-upgrade"] === true || config["v2ray-http-upgrade"] === "true";
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

function parseVlessLink(link: string): V2RayLink {
  try {
    const content = link.replace("vless://", "");
    const [userInfo, rest] = content.split("@");
    const [serverPort, paramsAndName] = rest.split("?");
    const [server, port] = serverPort.split(":");
    const params: Record<string, string> = {};
    let name = "";
    if (paramsAndName) {
      const [paramsStr, encodedName] = paramsAndName.split("#");
      name = encodedName ? decodeURIComponent(encodedName) : "VLESS Server";
      paramsStr.split("&").forEach((param) => {
        const [key, value] = param.split("=");
        params[key] = value ? decodeURIComponent(value) : "";
      });
    }
    const isHttpUpgrade = params["v2ray-http-upgrade"] === "true" || params["v2ray-http-upgrade"] === "1";
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

function parseTrojanLink(link: string): V2RayLink {
  try {
    const content = link.replace("trojan://", "");
    const [password, rest] = content.split("@");
    const [serverPort, paramsAndName] = rest.split("?");
    const [server, port] = serverPort.split(":");
    const params: Record<string, string> = {};
    let name = "";
    if (paramsAndName) {
      const [paramsStr, encodedName] = paramsAndName.split("#");
      name = encodedName ? decodeURIComponent(encodedName) : "Trojan Server";
      paramsStr.split("&").forEach((param) => {
        const [key, value] = param.split("=");
        params[key] = value ? decodeURIComponent(value) : "";
      });
    }
    const isHttpUpgrade = params["v2ray-http-upgrade"] === "true" || params["v2ray-http-upgrade"] === "1";
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

function parseShadowsocksLink(link: string): V2RayLink {
  try {
    const content = link.replace("ss://", "");
    let userInfo: string,
      serverPort: string,
      name: string = "",
      params: Record<string, string> = {};
    if (content.includes("@")) {
      const [encodedUserInfo, rest] = content.split("@");
      let serverPortStr: string = "", paramsNamePart: string = "";
      if (rest.includes("?")) {
        const [serverPortPart, tempParamsNamePart] = rest.split("?");
        serverPortStr = serverPortPart;
        paramsNamePart = tempParamsNamePart;
      } else {
        const [serverPortPart, encodedName] = rest.split("#");
        serverPortStr = serverPortPart;
        name = encodedName ? decodeURIComponent(encodedName) : "SS Server";
      }

      if (paramsNamePart) {
        const [paramsStr, encodedName] = paramsNamePart.split("#");
        name = encodedName ? decodeURIComponent(encodedName) : "SS Server";
        paramsStr.split("&").forEach((param) => {
          const [key, value] = param.split("=");
          params[key] = value ? decodeURIComponent(value) : "";
        });
      }

      try {
        userInfo = atob(encodedUserInfo);
      } catch (e) {
        userInfo = decodeURIComponent(encodedUserInfo);
      }
      serverPort = serverPortStr;
    } else {
      const [encodedData, encodedName] = content.split("#");
      const decodedData = atob(encodedData);
      const atIndex = decodedData.lastIndexOf("@");
      userInfo = decodedData.substring(0, atIndex);
      serverPort = decodedData.substring(atIndex + 1);
      name = encodedName ? decodeURIComponent(encodedName) : "SS Server";
    }

    const [method, password] = userInfo.split(":");
    const [server, port] = serverPort.split(":");
    return {
      type: "ss",
      name: name,
      server: server,
      port: Number.parseInt(port),
      cipher: method,
      password: password,
      udp: false,
      tls: params.security === "tls" || (params.plugin_opts && params.plugin_opts.includes("tls=1")) || false,
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

function generateClashConfig(parsedLinks: V2RayLink[], options: ConfigOptions = {}): string {
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
  
  const proxyNames: string[] = [];
  const usedNames = new Set<string>();
  
  const linksWithUniqueNames: ParsedLink[] = parsedLinks.map((link) => {
    let uniqueName = link.name;
    
    let counter = 1;
    while (usedNames.has(uniqueName)) {
      const match = uniqueName.match(/^(.+?)\s*\[(\d+)\]$/);
      if (match) {
        const baseName = match[1];
        const currentCounter = parseInt(match[2]);
        uniqueName = `${baseName} [${currentCounter + 1}]`;
      } else {
        uniqueName = `${link.name} [${++counter}]`;
      }
    }
    
    usedNames.add(uniqueName);
    proxyNames.push(uniqueName);
    
    return {
      ...link,
      uniqueName
    };
  });
  
  config += `proxies:`;
  linksWithUniqueNames.forEach((link) => {
    config += "\n";
    if (link.type === "vmess") {
      config += `  - name: "${link.uniqueName}"\n    type: vmess\n    server: ${link.server}\n    port: ${link.port}\n    uuid: ${link.uuid}\n    alterId: ${link.alterId || 0}\n    cipher: ${link.cipher || "auto"}\n    udp: true\n    tls: ${link.tls}\n    skip-cert-verify: ${link.skipCertVerify || true}\n`;
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
      config += `  - name: "${link.uniqueName}"\n    type: vless\n    server: ${link.server}\n    port: ${link.port}\n    uuid: ${link.uuid}\n    udp: true\n    tls: ${link.tls}\n    skip-cert-verify: ${link.skipCertVerify || true}\n`;
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
      config += `  - name: "${link.uniqueName}"\n    type: trojan\n    server: ${link.server}\n    port: ${link.port}\n    password: ${link.password}\n    udp: true\n    skip-cert-verify: ${link.skipCertVerify || true}\n`;
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
      config += `  - name: "${link.uniqueName}"\n    server: ${link.server}\n    port: ${link.port}\n    type: ss\n    cipher: ${link.cipher || "none"}\n    password: ${link.password}\n    plugin: v2ray-plugin\n    client-fingerprint: chrome\n    udp: false\n    plugin-opts:\n      mode: websocket\n      host: ${link.wsHost || link.server}\n      path: ${link.wsPath || ""}\n      tls: ${link.tls}\n      mux: false\n      skip-cert-verify: true\n    headers:\n      custom: value\n      ip-version: dual\n      v2ray-http-upgrade: false\n      v2ray-http-upgrade-fast-open: false\n`;
    }
  });

  if (isFullConfig) {
    config += `\nproxy-groups:\n  - name: "V2RAY-TO-CLASH"\n    type: select\n    proxies:\n      - SELECTOR\n`;
    if (bestPing) config += `      - BEST-PING\n`;
    if (loadBalance) config += `      - LOAD-BALANCE\n`;
    if (fallback) config += `      - FALLBACK\n`;
    config += `      - DIRECT\n      - REJECT\n`;

    config += `  - name: "SELECTOR"\n    type: select\n    proxies:\n      - DIRECT\n      - REJECT\n`;
    proxyNames.forEach((name) => {
      config += `      - ${name}\n`;
    });

    if (bestPing) {
      config += `  - name: "BEST-PING"\n    type: url-test\n    url: http://www.gstatic.com/generate_204\n    interval: 300\n    tolerance: 50\n    proxies:\n`;
      proxyNames.forEach((name) => {
        config += `      - ${name}\n`;
      });
    }
    if (loadBalance) {
      config += `  - name: "LOAD-BALANCE"\n    type: load-balance\n    url: http://www.gstatic.com/generate_204\n    interval: 300\n    strategy: round-robin\n    proxies:\n`;
      proxyNames.forEach((name) => {
        config += `      - ${name}\n`;
      });
    }
    if (fallback) {
      config += `  - name: "FALLBACK"\n    type: fallback\n    url: http://www.gstatic.com/generate_204\n    interval: 300\n    proxies:\n`;
      proxyNames.forEach((name) => {
        config += `      - ${name}\n`;
      });
    }

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

export function downloadYaml(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy: ", err);
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