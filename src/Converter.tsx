import React, { useState } from 'react';
import { convertV2rayToConfig, downloadYaml, copyToClipboard } from './converterLogic';

interface ConfigOptions {
  bestPing: boolean;
  loadBalance: boolean;
  fallback: boolean;
  allGroups: boolean;
  adsBlock: boolean;
  pornBlock: boolean;
}

const Converter: React.FC = () => {
  const [v2rayInput, setV2rayInput] = useState<string>('');
  const [configOutput, setConfigOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  
  const [configType, setConfigType] = useState<'minimal' | 'full'>('minimal');
  const [dnsMode, setDnsMode] = useState<'fake-ip' | 'redir-host'>('fake-ip');
  const [options, setOptions] = useState<ConfigOptions>({
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
    } catch (err: any) {
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

  const handleDownload = (type: 'provider' | 'full') => {
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

  const toggleOption = (option: keyof ConfigOptions) => {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="flex flex-col gap-6">
        {/* V2Ray Input Card */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">V2Ray Links</h2>
          <textarea
            id="v2ray-input"
            className="w-full h-48 p-4 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y"
            value={v2rayInput}
            onChange={(e) => setV2rayInput(e.target.value)}
            placeholder="Paste your V2Ray links here, one per line..."
          />
        </div>

        {/* Conversion Options Card */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Options</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Config Type</span>
              <div className="flex items-center gap-2">
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${configType === 'minimal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  onClick={() => setConfigType('minimal')}
                >
                  Minimal
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${configType === 'full' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  onClick={() => setConfigType('full')}
                >
                  Full
                </button>
              </div>
            </div>

            {configType === 'full' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">DNS Mode</span>
                  <div className="flex items-center gap-2">
                    <button 
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dnsMode === 'fake-ip' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      onClick={() => setDnsMode('fake-ip')}
                    >
                      Fake IP
                    </button>
                    <button 
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dnsMode === 'redir-host' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      onClick={() => setDnsMode('redir-host')}
                    >
                      Redir Host
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" checked={options.bestPing} onChange={() => toggleOption('bestPing')} />
                    <span className="text-gray-300">Best Ping</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" checked={options.loadBalance} onChange={() => toggleOption('loadBalance')} />
                    <span className="text-gray-300">Load Balance</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" checked={options.fallback} onChange={() => toggleOption('fallback')} />
                    <span className="text-gray-300">Fallback</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" checked={options.allGroups} onChange={toggleAllGroups} />
                    <span className="text-gray-300">All Groups</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" checked={options.adsBlock} onChange={() => toggleOption('adsBlock')} />
                    <span className="text-gray-300">Block Ads</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" checked={options.pornBlock} onChange={() => toggleOption('pornBlock')} />
                    <span className="text-gray-300">Block Porn</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        <button 
          className={`w-full py-3 rounded-md text-white font-bold transition-colors flex items-center justify-center ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Convert to Clash'
          )}
        </button>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        {/* Output Card */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Clash Configuration</h2>
            <button 
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <textarea
            id="config-output"
            className="w-full h-full min-h-[300px] p-4 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y"
            value={configOutput}
            readOnly
            placeholder="Your Clash configuration will appear here..."
          />
        </div>

        {configOutput && (
          <div className="flex items-center gap-4">
            <button 
              className="w-full py-3 rounded-md text-white font-bold transition-colors bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              onClick={() => handleDownload(configType === 'full' ? 'full' : 'provider')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download {configType === 'full' ? 'Full Config' : 'Proxy Provider'}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-800/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Converter;