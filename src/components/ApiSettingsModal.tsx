import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X, Shield } from 'lucide-react';
import { ApiConfigStatus } from '../types/weather';
import { checkApiConfig } from '../services/weatherService';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ApiConfigStatus | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    status: number;
    message: string;
    payloadPreview?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    const data = await checkApiConfig();
    setConfig(data);
  };

  const handleTestAsynchronousRequest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();

    try {
      const response = await fetch('/api/weather?lat=40.7128&lon=-74.0060&units=metric');
      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          latencyMs,
          status: response.status,
          message: `Asynchronous fetch succeeded. Received condition "${data.current?.condition}" for ${data.location?.name}.`,
          payloadPreview: JSON.stringify(
            {
              status: response.status,
              provider: config?.provider,
              temperature: `${data.current?.temperature}°C`,
              condition: data.current?.condition,
              hourlyPoints: data.hourly?.length,
              dailyPoints: data.daily?.length
            },
            null,
            2
          )
        });
      } else {
        throw new Error(`HTTP error ${response.status}`);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: Math.round(performance.now() - start),
        status: 500,
        message: err.message || 'Request failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border border-white/10 bg-[#101622] text-slate-100 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-semibold text-slate-100">API & Data Source</h2>
            <p className="text-xs text-slate-400 mt-0.5">Asynchronous fetch configuration and custom credentials</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-6 space-y-5 text-xs">
          {/* Status info */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Provider Status</span>
              <span className="font-mono text-emerald-400">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Provider</span>
              <span className="text-slate-200 font-mono capitalize">{config?.provider || 'Open-Meteo'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Custom Key Active</span>
              <span className="text-slate-200 font-mono">{config?.hasCustomKey ? 'Yes' : 'No (Default Source)'}</span>
            </div>
          </div>

          {/* Guide */}
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
            <span className="font-semibold text-slate-200 block">Providing Your Custom API Key & URL</span>
            <p className="text-slate-400 leading-relaxed">
              To supply your own API key and base endpoint (e.g. OpenWeatherMap or WeatherAPI), set the environment variables in your app's configuration:
            </p>
            <div className="p-3 rounded bg-[#0b0f17] border border-white/[0.06] font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
              <div>WEATHER_API_KEY="your_api_key_here"</div>
              <div>WEATHER_API_URL="https://api.openweathermap.org/data/2.5"</div>
              <div>WEATHER_PROVIDER="openweathermap"</div>
            </div>
            <p className="text-slate-500 text-[11px]">
              When set, requests to <code className="text-slate-400 font-mono">/api/weather</code> proxy securely to your custom endpoint without exposing your key in client bundles.
            </p>
          </div>

          {/* Live Request Test */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Test Asynchronous Request</span>
                <span className="text-slate-400">Verify latency and response payload from the server proxy</span>
              </div>
              <button
                onClick={handleTestAsynchronousRequest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.1] hover:bg-white/[0.16] text-white font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing' : 'Run Test'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-md border space-y-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>Status: {testResult.status}</span>
                  </div>
                  <span className="font-mono text-slate-400">{testResult.latencyMs} ms</span>
                </div>
                <p className="text-slate-300">{testResult.message}</p>
                {testResult.payloadPreview && (
                  <pre className="p-2 rounded bg-[#0b0f17] text-[11px] font-mono text-slate-300 border border-white/[0.06] overflow-x-auto">
                    {testResult.payloadPreview}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
