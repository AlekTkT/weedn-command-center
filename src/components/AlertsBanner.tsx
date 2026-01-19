'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Bell, ChevronDown, ChevronUp } from 'lucide-react';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  details?: string;
  createdAt: string;
  acknowledged: boolean;
}

interface AlertsResponse {
  success: boolean;
  alerts: Alert[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  checkedAt: string;
}

export default function AlertsBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState({ total: 0, critical: 0, warning: 0, info: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data: AlertsResponse = await res.json();
        setAlerts(data.alerts.filter(a => !dismissedIds.has(a.id)));
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dismissedIds]);

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');

  if (isLoading || activeAlerts.length === 0) {
    return null;
  }

  const hasCritical = criticalAlerts.length > 0;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed top-20 right-4 z-[100] max-w-sm"
    >
      {/* Notification compacte */}
      <div
        className={`rounded-xl shadow-lg cursor-pointer backdrop-blur-sm ${
          hasCritical
            ? 'bg-red-500/90 border border-red-400/50'
            : 'bg-yellow-500/80 border border-yellow-400/50'
        } ${isExpanded ? 'rounded-b-none' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: hasCritical ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: hasCritical ? Infinity : 0, duration: 2 }}
              >
                {hasCritical ? (
                  <AlertTriangle className="text-white" size={16} />
                ) : (
                  <Bell className="text-black" size={16} />
                )}
              </motion.div>

              <span className={`font-medium text-sm ${hasCritical ? 'text-white' : 'text-black'}`}>
                {hasCritical
                  ? `${criticalAlerts.length} alerte(s)`
                  : `${warningAlerts.length} avertissement(s)`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {isExpanded ? (
                <ChevronUp className={hasCritical ? 'text-white' : 'text-black'} size={16} />
              ) : (
                <ChevronDown className={hasCritical ? 'text-white' : 'text-black'} size={16} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des alertes (expandable) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-900/95 backdrop-blur-sm rounded-b-xl max-h-60 overflow-y-auto border border-t-0 border-gray-700"
          >
            <div className="px-3 py-2 space-y-2">
              {activeAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className={`rounded-lg p-3 flex items-start justify-between ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/20 border border-red-500/50'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-500/20 border border-yellow-500/50'
                      : 'bg-blue-500/20 border border-blue-500/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          alert.severity === 'critical'
                            ? 'bg-red-500 text-white'
                            : alert.severity === 'warning'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">{alert.category}</span>
                    </div>
                    <h4 className="font-medium text-white mt-1 text-sm">{alert.title}</h4>
                    <p className="text-xs text-gray-300">{alert.message}</p>
                    {alert.details && (
                      <p className="text-xs text-gray-400 mt-1">{alert.details}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissAlert(alert.id);
                    }}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="text-gray-400" size={14} />
                  </button>
                </motion.div>
              ))}

              {activeAlerts.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  ✅ Aucune alerte active
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
