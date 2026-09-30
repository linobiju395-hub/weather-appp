import React from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Send,
  Trash2
} from 'lucide-react';
import { NotificationSettings, NotificationLog } from '../types/weather';
import { playAlertChime, sendSystemNotification, requestNotificationPermission } from '../services/weatherService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
  logs: NotificationLog[];
  onClearLogs: () => void;
  onAddLog: (title: string, message: string, severity: 'critical' | 'warning' | 'advisory' | 'info') => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  logs,
  onClearLogs,
  onAddLog
}) => {
  if (!isOpen) return null;

  const hasPermission = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      onAddLog('Notifications Enabled', 'System alerts active for precipitation and severe shifts.', 'info');
      if (settings.soundEnabled) playAlertChime();
    }
  };

  const handleSendTestNotification = async () => {
    if (settings.soundEnabled) playAlertChime();
    const title = 'Weather Advisory';
    const body = 'Background monitoring active: Rain forecast within the next 45 minutes.';
    await sendSystemNotification(title, { body });
    onAddLog(title, body, 'advisory');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border border-white/10 bg-[#101622] text-slate-100 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Background Alerts</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time desktop notifications for weather changes</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-6 space-y-5">
          {/* Permission card */}
          {!hasPermission ? (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-200">Enable Desktop Notifications</div>
                  <p className="text-slate-300 mt-0.5">Required to receive background weather alerts when this tab is closed.</p>
                </div>
              </div>
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-md bg-amber-500 text-slate-950 font-medium text-xs hover:bg-amber-400 transition-colors flex-shrink-0"
              >
                Allow
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Desktop notifications permitted</span>
              </div>
            </div>
          )}

          {/* Master 24/7 background monitor */}
          <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
            <div>
              <div className="text-sm font-medium text-slate-200">Background Polling</div>
              <div className="text-xs text-slate-400 mt-0.5">Run continuous checks via service worker</div>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, enabled: !settings.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.enabled ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="text-slate-400 block mb-1">Check Frequency</span>
              <select
                value={settings.pollingIntervalMinutes}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, pollingIntervalMinutes: Number(e.target.value) })
                }
                className="w-full px-2 py-1.5 rounded bg-[#0b0f17] border border-white/10 text-slate-200 text-xs focus:outline-none"
              >
                <option value={5}>Every 5 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 1 hour</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-slate-400 block">Sound Alert</span>
                <span className="text-slate-200 font-medium">
                  {settings.soundEnabled ? 'Enabled' : 'Muted'}
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !settings.soundEnabled;
                  onUpdateSettings({ ...settings, soundEnabled: next });
                  if (next) playAlertChime();
                }}
                className="p-1.5 rounded bg-white/[0.06] text-slate-300 hover:text-white"
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Alert topics */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Triggers
            </span>
            {[
              { key: 'rainAlerts', label: 'Rain arriving within 60 minutes' },
              { key: 'severeStormAlerts', label: 'Thunderstorms and severe warnings' },
              { key: 'windAlerts', label: 'High wind gusts (> 45 km/h)' },
              { key: 'extremeTempAlerts', label: 'Extreme heat (UV > 8) or freezing' }
            ].map((t) => (
              <label
                key={t.key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-slate-300 hover:bg-white/[0.04] cursor-pointer"
              >
                <span>{t.label}</span>
                <input
                  type="checkbox"
                  checked={(settings as any)[t.key]}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, [t.key]: e.target.checked })
                  }
                  className="rounded text-sky-500 bg-slate-900 border-white/20"
                />
              </label>
            ))}
          </div>

          {/* Test button */}
          <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
            <button
              onClick={handleSendTestNotification}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 font-medium text-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test Notification</span>
            </button>
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          {/* History */}
          {logs.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Recent Alerts
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto thin-scrollbar">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-medium text-slate-200">{log.title}</span>
                      <p className="text-slate-400 mt-0.5">{log.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
