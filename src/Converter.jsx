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
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50 transition-all duration-300 hover:border-gray-600/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 border-b border-gray-700/50 pb-2">
          V2Ray to Clash Converter
        </h2>
        <div className="flex items-center space-x-2 bg-gray-700/50 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-300">Converter</span>
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-lg font-medium mb-3 text-gray-200 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          V2Ray Links (One per line)
        </label>
        <textarea
          id="v2ray-input"
          className="w-full h-40 p-4 bg-gray-900/70 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm transition-all duration-300 resize-none"
          value={v2rayInput}
          onChange={(e) => setV2rayInput(e.target.value)}
          placeholder="Paste your V2Ray links here, one per line..."
        />
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
            configType === 'minimal' 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20' 
              : 'bg-gray-700/50 text-gray-200 hover:bg-gray-700/70'
          }`}
          onClick={() => setConfigType('minimal')}
        >
          Minimal Config
        </button>
        <button 
          className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
            configType === 'full' 
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20' 
              : 'bg-gray-700/50 text-gray-200 hover:bg-gray-700/70'
          }`}
          onClick={() => setConfigType('full')}
        >
          Full Config
        </button>
        
        <button 
          className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center ${
            loading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/20'
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
              Processing...
            </span>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Convert to Clash
            </>
          )}
        </button>
      </div>
      
      {/* DNS Mode Options */}
      {configType === 'full' && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-200 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
            DNS Mode
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                dnsMode === 'fake-ip' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-gray-700/50 text-gray-200 hover:bg-gray-700/70'
              }`}
              onClick={() => setDnsMode('fake-ip')}
            >
              Fake IP
            </button>
            <button
              className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                dnsMode === 'redir-host' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20' 
                  : 'bg-gray-700/50 text-gray-200 hover:bg-gray-700/70'
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
          <h3 className="text-lg font-medium mb-4 text-gray-200 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Clash Configuration Options
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg transition-all duration-300 hover:bg-gray-700/50">
              <input
                type="checkbox"
                id="best-ping"
                className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                checked={options.bestPing}
                onChange={() => toggleOption('bestPing')}
              />
              <label htmlFor="best-ping" className="text-gray-200">Best Ping</label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg transition-all duration-300 hover:bg-gray-700/50">
              <input
                type="checkbox"
                id="load-balance"
                className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                checked={options.loadBalance}
                onChange={() => toggleOption('loadBalance')}
              />
              <label htmlFor="load-balance" className="text-gray-200">Load Balance</label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg transition-all duration-300 hover:bg-gray-700/50">
              <input
                type="checkbox"
                id="fallback"
                className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                checked={options.fallback}
                onChange={() => toggleOption('fallback')}
              />
              <label htmlFor="fallback" className="text-gray-200">Fallback</label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg transition-all duration-300 hover:bg-gray-700/50">
              <input
                type="checkbox"
                id="all-groups"
                className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                checked={options.allGroups}
                onChange={toggleAllGroups}
              />
              <label htmlFor="all-groups" className="text-gray-200">All Groups</label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg transition-all duration-300 hover:bg-gray-700/50">
              <input
                type="checkbox"
                id="ads-block"
                className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                checked={options.adsBlock}
                onChange={() => toggleOption('adsBlock')}
              />
              <label htmlFor="ads-block" className="text-gray-200">Block Ads</label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg transition-all duration-300 hover:bg-gray-700/50">
              <input
                type="checkbox"
                id="porn-block"
                className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                checked={options.pornBlock}
                onChange={() => toggleOption('pornBlock')}
              />
              <label htmlFor="porn-block" className="text-gray-200">Block Porn</label>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-200 flex items-start">
          <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <div className="mt-6">
        <div className="relative">
          <label className="block text-lg font-medium mb-3 text-gray-200 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
            Clash Configuration
          </label>
          <div className="relative group">
            <textarea
              id="config-output"
              className="w-full h-80 p-5 bg-gray-900/70 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm overflow-auto monospace-font resize-none"
              value={configOutput}
              readOnly
            />
            <button 
              className="absolute top-3 right-3 px-3.5 py-2 bg-gray-700/70 hover:bg-gray-600/80 text-gray-200 rounded-lg text-sm font-medium transition-all duration-300 flex items-center opacity-0 group-hover:opacity-100 backdrop-blur-sm"
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
        </div>
        
        <div className="flex flex-wrap gap-4 mt-5">
          {configType === 'full' ? (
            <button 
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg shadow-green-500/20"
              onClick={() => handleDownload('full')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download Full Config
            </button>
          ) : (
            <button 
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg shadow-green-500/20"
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