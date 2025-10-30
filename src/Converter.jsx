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
    <div className="bg-dark-800 rounded-xl p-6 shadow-2xl border border-dark-700">
      <h2 className="text-2xl font-bold mb-6 text-blue-400 border-b border-dark-700 pb-2">V2Ray to Clash Converter</h2>
      
      <div className="mb-6">
        <label className="block text-lg font-medium mb-2 text-gray-200">V2Ray Links (One per line):</label>
        <textarea
          id="v2ray-input"
          className="w-full h-40 p-4 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          value={v2rayInput}
          onChange={(e) => setV2rayInput(e.target.value)}
          placeholder="Paste your V2Ray links here, one per line..."
        />
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            configType === 'minimal' 
              ? 'bg-blue-600 text-white' 
              : 'bg-dark-700 text-gray-200 hover:bg-dark-600'
          }`}
          onClick={() => setConfigType('minimal')}
        >
          Minimal Config
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            configType === 'full' 
              ? 'bg-blue-600 text-white' 
              : 'bg-dark-700 text-gray-200 hover:bg-dark-600'
          }`}
          onClick={() => setConfigType('full')}
        >
          Full Config
        </button>
        
        <button 
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            loading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Converting...
            </span>
          ) : 'Convert to Clash'}
        </button>
      </div>
      
      {/* DNS Mode Options */}
      {configType === 'full' && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-200">DNS Mode:</h3>
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dnsMode === 'fake-ip' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-dark-700 text-gray-200 hover:bg-dark-600'
              }`}
              onClick={() => setDnsMode('fake-ip')}
            >
              Fake IP
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dnsMode === 'redir-host' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-dark-700 text-gray-200 hover:bg-dark-600'
              }`}
              onClick={() => setDnsMode('redir-host')}
            >
              Redir Host
            </button>
          </div>
        </div>
      )}
      
      {/* Clash Configuration Options */}
      {configType === 'full' && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-200">Clash Configuration Options:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="best-ping"
                className="w-4 h-4 text-blue-600 bg-dark-700 border-dark-600 rounded focus:ring-blue-500"
                checked={options.bestPing}
                onChange={() => toggleOption('bestPing')}
              />
              <label htmlFor="best-ping" className="text-gray-200">Best Ping</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="load-balance"
                className="w-4 h-4 text-blue-600 bg-dark-700 border-dark-600 rounded focus:ring-blue-500"
                checked={options.loadBalance}
                onChange={() => toggleOption('loadBalance')}
              />
              <label htmlFor="load-balance" className="text-gray-200">Load Balance</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="fallback"
                className="w-4 h-4 text-blue-600 bg-dark-700 border-dark-600 rounded focus:ring-blue-500"
                checked={options.fallback}
                onChange={() => toggleOption('fallback')}
              />
              <label htmlFor="fallback" className="text-gray-200">Fallback</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="all-groups"
                className="w-4 h-4 text-blue-600 bg-dark-700 border-dark-600 rounded focus:ring-blue-500"
                checked={options.allGroups}
                onChange={toggleAllGroups}
              />
              <label htmlFor="all-groups" className="text-gray-200">All Groups</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ads-block"
                className="w-4 h-4 text-blue-600 bg-dark-700 border-dark-600 rounded focus:ring-blue-500"
                checked={options.adsBlock}
                onChange={() => toggleOption('adsBlock')}
              />
              <label htmlFor="ads-block" className="text-gray-200">Block Ads</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="porn-block"
                className="w-4 h-4 text-blue-600 bg-dark-700 border-dark-600 rounded focus:ring-blue-500"
                checked={options.pornBlock}
                onChange={() => toggleOption('pornBlock')}
              />
              <label htmlFor="porn-block" className="text-gray-200">Block Porn</label>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          {error}
        </div>
      )}
      
      <div className="mt-6">
        <div className="relative">
          <label className="block text-lg font-medium mb-2 text-gray-200">Clash Configuration:</label>
          <textarea
            id="config-output"
            className="w-full h-80 p-4 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs overflow-auto monospace-font"
            value={configOutput}
            readOnly
          />
          <button 
            className="absolute top-2 right-2 px-3 py-1.5 bg-dark-600 hover:bg-dark-500 text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4">
          {configType === 'full' ? (
            <button 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center"
              onClick={() => handleDownload('full')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download Full Config
            </button>
          ) : (
            <button 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center"
              onClick={() => handleDownload('provider')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download Proxy Provider
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Converter;