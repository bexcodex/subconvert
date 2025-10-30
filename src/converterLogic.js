import yaml from 'js-yaml';

export async function convertV2rayToConfig(v2rayLinks, options = {}) {
  const links = v2rayLinks.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (links.length === 0) {
    throw new Error("No valid V2Ray links found");
  }
  
  const parsedLinks = links.map((link) => parseV2rayLink(link));

  return generateClashConfig(parsedLinks, options);
}

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
  const base64Content = link.replace("vmess://", "");
  let config;
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

function parseVlessLink(link) {
  try {
    const content = link.replace("vless://", "");
    const [userInfo, rest] = content.split("@");
    const [serverPort, paramsAndName] = rest.split("?");
    const [server, port] = serverPort.split(":");
    const params = {};
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

function parseTrojanLink(link) {
  try {
    const content = link.replace("trojan://", "");
    const [password, rest] = content.split("@");
    const [serverPort, paramsAndName] = rest.split("?");
    const [server, port] = serverPort.split(":");
    const params = {};
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

function parseShadowsocksLink(link) {
  try {
    const content = link.replace("ss://", "");
    let userInfo,
      serverPort,
      name,
      params = {};
    if (content.includes("@")) {
      const [encodedUserInfo, rest] = content.split("@");
      let serverPortStr, paramsNamePart;
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
    config += `port: 7890\nsocks-port: 7891\nallow-lan: true\nmode: rule\nlog-level: info\nexternal-controller: 127.0.0.1:9090\ndns:\n  enable: true\n  listen: 0.0.0.0:53\n  ${useFakeIp ? 