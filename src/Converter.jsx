import React, { useState } from 'react';
import { convertV2rayToConfig, downloadYaml, copyToClipboard } from './converterLogic.js';

const Converter = () => {
  const [v2rayInput, setV2rayInput] = useState('');
  const [configOutput, setConfigOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // State for configuration options
  const [configType, setConfigType] = useState('minimal'); // 'minimal' or 'full'
  const [dnsMode, setDnsMode] = useState('fake-ip'); // 'fake-ip' or 'redir-host'
  const [options, setOptions] = useState({
    bestPing: false,
    loadBalance: false,
    fallback: false,
    allGroups: false,
    adsBlock: true,
    pornBlock: true,
  });

  const handleConvert = async () => {
    if (!v2rayInput.trim()) {
      setError('Please enter V2Ray links to convert');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Prepare options for conversion
      const conversionOptions = {
        isFullConfig: configType === 'full',
        useFakeIp: dnsMode === 'fake-ip',
        ...options
      };
      
      const result = await convertV2rayToConfig(
        v2rayInput, 
        conversionOptions
      );
      
      setConfigOutput(result);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to convert V2Ray links. Please check your input.');
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (configOutput) {
      const success = await copyToClipboard(configOutput);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownload = (type) => {
    if (!configOutput) {
      setError('No content to download. Please convert first.');
      return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    let filename;
    
    if (type === 'provider') {
      filename = `proxy_provider_${timestamp}.yaml`;
    } else {
      filename = `config_${timestamp}.yaml`;
    }
    
    downloadYaml(configOutput, filename);
  };

  const toggleOption = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const toggleAllGroups = () => {
    const newState = !options.allGroups;
    setOptions(prev => ({
      ...prev,
      allGroups: newState,
      bestPing: newState,
      loadBalance: newState,
      fallback: newState
    }));
  };

  return (
    <div className="converter-container">
      <h2 className="section-title">V2Ray to Clash Converter</h2>
      
      <div className="input-section">
        <label className="label">V2Ray Links (One per line):</label>
        <textarea
          id="v2ray-input"
          className="textarea"
          value={v2rayInput}
          onChange={(e) => setV2rayInput(e.target.value)}
          placeholder="Paste your V2Ray links here, one per line..."
        />
      </div>
      
      <div className="button-group">
        <button 
          className={`btn btn-primary ${configType === 'minimal' ? 'active' : ''}`}
          onClick={() => setConfigType('minimal')}
        >
          Minimal Config
        </button>
        <button 
          className={`btn btn-primary ${configType === 'full' ? 'active' : ''}`}
          onClick={() => setConfigType('full')}
        >
          Full Config
        </button>
        
        <button 
          className="btn btn-primary"
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? 'Converting...' : 'Convert to Clash'}
        </button>
      </div>
      
      {/* DNS Mode Options */}
      {configType === 'full' && (
        <div className="option-section">
          <h3 className="label">DNS Mode:</h3>
          <div className="button-group">
            <button
              className={`btn ${dnsMode === 'fake-ip' ? 'btn-outline active' : 'btn-secondary'}`}
              onClick={() => setDnsMode('fake-ip')}
            >
              Fake IP
            </button>
            <button
              className={`btn ${dnsMode === 'redir-host' ? 'btn-outline active' : 'btn-secondary'}`}
              onClick={() => setDnsMode('redir-host')}
            >
              Redir Host
            </button>
          </div>
        </div>
      )}
      
      {/* Clash Configuration Options */}
      {configType === 'full' && (
        <div className="option-section">
          <h3 className="label">Clash Configuration Options:</h3>
          <div className="option-grid">
            <div className="option-item">
              <input
                type="checkbox"
                id="best-ping"
                checked={options.bestPing}
                onChange={() => toggleOption('bestPing')}
              />
              <label htmlFor="best-ping">Best Ping</label>
            </div>
            
            <div className="option-item">
              <input
                type="checkbox"
                id="load-balance"
                checked={options.loadBalance}
                onChange={() => toggleOption('loadBalance')}
              />
              <label htmlFor="load-balance">Load Balance</label>
            </div>
            
            <div className="option-item">
              <input
                type="checkbox"
                id="fallback"
                checked={options.fallback}
                onChange={() => toggleOption('fallback')}
              />
              <label htmlFor="fallback">Fallback</label>
            </div>
            
            <div className="option-item">
              <input
                type="checkbox"
                id="all-groups"
                checked={options.allGroups}
                onChange={toggleAllGroups}
              />
              <label htmlFor="all-groups">All Groups</label>
            </div>
            
            <div className="option-item">
              <input
                type="checkbox"
                id="ads-block"
                checked={options.adsBlock}
                onChange={() => toggleOption('adsBlock')}
              />
              <label htmlFor="ads-block">Block Ads</label>
            </div>
            
            <div className="option-item">
              <input
                type="checkbox"
                id="porn-block"
                checked={options.pornBlock}
                onChange={() => toggleOption('pornBlock')}
              />
              <label htmlFor="porn-block">Block Porn</label>
            </div>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="loading-indicator">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Converting V2Ray links to Clash configuration...</span>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}
      
      <div className="output-section">
        <div className="output-container">
          <label className="label">Clash Configuration:</label>
          <textarea
            id="config-output"
            className="output-textarea"
            value={configOutput}
            readOnly
          />
          <button 
            className="btn btn-secondary copy-btn"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <i className="fas fa-check"></i> Copied!
              </>
            ) : (
              <>
                <i className="far fa-copy"></i> Copy
              </>
            )}
          </button>
        </div>
        
        <div className="button-group" style={{ marginTop: '1rem' }}>
          {configType === 'full' ? (
            <button 
              className="btn btn-success"
              onClick={() => handleDownload('full')}
            >
              <i className="fas fa-download"></i> Download Full Config
            </button>
          ) : (
            <button 
              className="btn btn-success"
              onClick={() => handleDownload('provider')}
            >
              <i className="fas fa-download"></i> Download Proxy Provider
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Converter;