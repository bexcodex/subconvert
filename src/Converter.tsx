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

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-text">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-gray-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-full' : ''}`}></div>
    </div>
  </label>
);

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column */}
      <div className="flex flex-col gap-6">
        {/* V2Ray Input Card */}
        <div className="bg-primary border border-border rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-bold text-text-heading mb-4">V2Ray Links</h2>
          <textarea
            id="v2ray-input"
            className="w-full h-48 p-4 bg-background border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm resize-y"
            value={v2rayInput}
            onChange={(e) => setV2rayInput(e.target.value)}
            placeholder="Paste your V2Ray links here, one per line..."
          />
        </div>

        {/* Conversion Options Card */}
        <div className="bg-primary border border-border rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-bold text-text-heading mb-4">Options</h2>
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-text font-medium">Config Type</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${configType === 'minimal' ? 'bg-accent text-white' : 'bg-gray-700 text-text hover:bg-gray-600'}`}
                  onClick={() => setConfigType('minimal')}
                >
                  Minimal
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${configType === 'full' ? 'bg-accent text-white' : 'bg-gray-700 text-text hover:bg-gray-600'}`}
                  onClick={() => setConfigType('full')}
                >
                  Full
                </button>
              </div>
            </div>

            {configType === 'full' && (
              <>
                <div>
                  <span className="text-text font-medium">DNS Mode</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button 
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dnsMode === 'fake-ip' ? 'bg-accent text-white' : 'bg-gray-700 text-text hover:bg-gray-600'}`}
                      onClick={() => setDnsMode('fake-ip')}
                    >
                      Fake IP
                    </button>
                    <button 
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dnsMode === 'redir-host' ? 'bg-accent text-white' : 'bg-gray-700 text-text hover:bg-gray-600'}`}
                      onClick={() => setDnsMode('redir-host')}
                    >
                      Redir Host
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <Toggle checked={options.adsBlock} onChange={() => toggleOption('adsBlock')} label="Block Ads" />
                    <Toggle checked={options.pornBlock} onChange={() => toggleOption('pornBlock')} label="Block Porn" />
                    <Toggle checked={options.allGroups} onChange={toggleAllGroups} label="All Groups" />
                    <Toggle checked={options.bestPing} onChange={() => toggleOption('bestPing')} label="Best Ping" />
                    <Toggle checked={options.loadBalance} onChange={() => toggleOption('loadBalance')} label="Load Balance" />
                    <Toggle checked={options.fallback} onChange={() => toggleOption('fallback')} label="Fallback" />
                </div>
              </>
            )}
          </div>
        </div>

        <button 
          className={`w-full py-3 rounded-md text-white font-bold transition-transform transform hover:scale-105 flex items-center justify-center ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
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
        <div className="bg-primary border border-border rounded-lg shadow-lg p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-heading">Clash Configuration</h2>
            <button 
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-text rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <textarea
            id="config-output"
            className="w-full flex-grow h-full min-h-[400px] p-4 bg-background border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm resize-y"
            value={configOutput}
            readOnly
            placeholder="Your Clash configuration will appear here..."
          />
        </div>

        {configOutput && (
          <button 
            className="w-full py-3 rounded-md text-white font-bold transition-transform transform hover:scale-105 bg-accent hover:bg-accent-hover flex items-center justify-center gap-2"
            onClick={() => handleDownload(configType === 'full' ? 'full' : 'provider')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download {configType === 'full' ? 'Full Config' : 'Proxy Provider'}
          </button>
        )}

        {error && (
          <div className="bg-error/20 border border-error/50 text-error px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Converter;
