/**
 * Performance Dashboard Component
 * Monitor and optimize application performance
 */

import React, { useState, useEffect } from 'react';
import {
  // ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  CircleStackIcon,
  ArrowPathIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { performanceMonitor } from '@/utils/performanceOptimizer';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Switch from '../shared/Switch';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface PerformanceDashboardProps {
  onClose?: () => void;
  className?: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  onClose,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [memoryUsage, setMemoryUsage] = useState<any>(null);
  const [settings, setSettings] = useState({
    enableVirtualScrolling: true,
    enableLazyLoading: true,
    enableMemoization: true,
    enableWebWorkers: true,
    enableBatching: true,
    debugMode: false
  });
  const [_refreshInterval, setRefreshInterval] = useState<NodeJS.Timer | null>(null);

  useEffect(() => {
    updateMetrics();
    updateMemoryUsage();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      updateMetrics();
      updateMemoryUsage();
    }, 2000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const updateMetrics = () => {
    const allMetrics = performanceMonitor.getAllMetrics();
    setMetrics(allMetrics);
  };

  const updateMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryUsage({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });
    }
  };

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    // Apply settings
    if (setting === 'debugMode') {
      localStorage.setItem('debugMode', (!settings.debugMode).toString());
    }
  };

  const clearMetrics = () => {
    performanceMonitor.clear();
    updateMetrics();
  };

  // Prepare chart data
  const metricsChartData = Object.entries(metrics)
    .filter(([_, data]) => data)
    .map(([name, data]) => ({
      name: name.replace(/-/g, ' '),
      avg: data.avg,
      min: data.min,
      max: data.max,
      count: data.count
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const _memoryChartData = memoryUsage ? [
    {
      name: 'Used',
      value: memoryUsage.used / 1024 / 1024,
      percentage: (memoryUsage.used / memoryUsage.total) * 100
    },
    {
      name: 'Available',
      value: (memoryUsage.total - memoryUsage.used) / 1024 / 1024,
      percentage: ((memoryUsage.total - memoryUsage.used) / memoryUsage.total) * 100
    }
  ] : [];

  const getPerformanceScore = () => {
    if (metricsChartData.length === 0) return 100;
    
    const avgResponseTime = metricsChartData.reduce((sum, m) => sum + m.avg, 0) / metricsChartData.length;
    
    // Score based on average response time
    if (avgResponseTime < 16) return 100; // 60fps
    if (avgResponseTime < 50) return 90;
    if (avgResponseTime < 100) return 75;
    if (avgResponseTime < 200) return 60;
    return 40;
  };

  const performanceScore = getPerformanceScore();
  const scoreColor = performanceScore >= 80 ? 'text-green-600' : 
                     performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CpuChipIcon className="w-7 h-7 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold">Performance Monitor</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Real-time performance metrics and optimization settings
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={clearMetrics}
              leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            >
              Clear
            </Button>
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Performance Score */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Performance</h3>
            <div className={`text-3xl font-bold ${scoreColor}`}>
              {performanceScore}%
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <ClockIcon className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-2xl font-bold">
                {metricsChartData.length > 0 
                  ? Math.round(metricsChartData.reduce((sum, m) => sum + m.avg, 0) / metricsChartData.length)
                  : 0}ms
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Response</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BoltIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">
                {Object.keys(metrics).length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Operations</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CircleStackIcon className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">
                {memoryUsage ? Math.round(memoryUsage.used / 1024 / 1024) : 0}MB
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Memory Used</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold">
                {settings.enableVirtualScrolling && settings.enableLazyLoading ? 'ON' : 'OFF'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Optimizations</p>
            </div>
          </div>
        </Card>

        {/* Performance Metrics Chart */}
        {metricsChartData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Operation Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="avg" name="Average" fill="#3B82F6">
                  {metricsChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.avg < 50 ? '#10B981' : entry.avg < 100 ? '#F59E0B' : '#EF4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Memory Usage */}
        {memoryUsage && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Heap Usage</span>
                  <span>{Math.round((memoryUsage.used / memoryUsage.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(memoryUsage.used / memoryUsage.total) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Used</p>
                  <p className="font-semibold">{Math.round(memoryUsage.used / 1024 / 1024)} MB</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Total</p>
                  <p className="font-semibold">{Math.round(memoryUsage.total / 1024 / 1024)} MB</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Limit</p>
                  <p className="font-semibold">{Math.round(memoryUsage.limit / 1024 / 1024)} MB</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Optimization Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CogIcon className="w-5 h-5" />
            Optimization Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Virtual Scrolling</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Render only visible items in long lists
                </p>
              </div>
              <Switch
                checked={settings.enableVirtualScrolling}
                onChange={() => handleSettingChange('enableVirtualScrolling')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lazy Loading</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Load components only when needed
                </p>
              </div>
              <Switch
                checked={settings.enableLazyLoading}
                onChange={() => handleSettingChange('enableLazyLoading')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Memoization</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Cache expensive computation results
                </p>
              </div>
              <Switch
                checked={settings.enableMemoization}
                onChange={() => handleSettingChange('enableMemoization')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Web Workers</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Offload heavy computations to background threads
                </p>
              </div>
              <Switch
                checked={settings.enableWebWorkers}
                onChange={() => handleSettingChange('enableWebWorkers')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Batch Updates</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Group multiple updates together
                </p>
              </div>
              <Switch
                checked={settings.enableBatching}
                onChange={() => handleSettingChange('enableBatching')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Debug Mode</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Show detailed performance logs
                </p>
              </div>
              <Switch
                checked={settings.debugMode}
                onChange={() => handleSettingChange('debugMode')}
              />
            </div>
          </div>
        </Card>

        {/* Performance Tips */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-lg font-semibold mb-3">Performance Tips</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Keep your analysis data organized and remove unused items regularly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Use filters to work with smaller data sets when possible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Enable virtual scrolling for better performance with large lists</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Consider using batch operations for bulk updates</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceDashboard;