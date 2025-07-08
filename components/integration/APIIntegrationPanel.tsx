/**
 * API Integration Panel Component
 * UI for configuring and managing API connections
 */

import React, { useState, useEffect } from 'react';
import {
  LinkIcon,
  ServerIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  BoltIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAPI, useAPIHealth, useAPIWebhooks } from '@/hooks/useAPI';
import { APIConfig, WebhookEvent } from '@/utils/apiClient';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Checkbox from '../shared/Checkbox';
import Card from '../shared/Card';
import Modal from '../shared/Modal';
import { format } from 'date-fns';

interface APIIntegrationPanelProps {
  onConfigChange?: (config: APIConfig) => void;
}

const APIIntegrationPanel: React.FC<APIIntegrationPanelProps> = ({
  onConfigChange
}) => {
  // API configuration
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [timeout, setTimeout] = useState(30000);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(300); // 5 minutes

  // Connection state
  const [isConfigured, setIsConfigured] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Webhook configuration
  const [webhookURL, setWebhookURL] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [webhookActive, setWebhookActive] = useState(true);

  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('apiConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setBaseURL(config.baseURL || '');
        setApiKey(config.apiKey || '');
        setTimeout(config.timeout || 30000);
        setRetryAttempts(config.retryAttempts || 3);
        setIsConfigured(!!config.baseURL);
      } catch (err) {
        console.error('Failed to load API configuration');
      }
    }
  }, []);

  // Initialize API hook
  const apiConfig: APIConfig | undefined = isConfigured ? {
    baseURL,
    apiKey,
    timeout,
    retryAttempts
  } : undefined;

  const {
    client,
    isLoading,
    error,
    lastSync,
    sync,
    configure
  } = useAPI(apiConfig, {
    autoSync,
    syncInterval,
    onError: (err) => console.error('API sync error:', err),
    onSuccess: (msg) => console.log('API sync success:', msg)
  });

  // Health monitoring
  const health = useAPIHealth(client, 60); // Check every minute

  // Webhook management
  const {
    webhooks,
    isLoading: webhooksLoading,
    error: webhooksError,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    refresh: refreshWebhooks
  } = useAPIWebhooks(client);

  const handleSaveConfiguration = () => {
    const config: APIConfig = {
      baseURL,
      apiKey,
      timeout,
      retryAttempts
    };

    // Save to localStorage
    localStorage.setItem('apiConfig', JSON.stringify(config));

    // Configure API client
    configure(config);
    setIsConfigured(true);

    if (onConfigChange) {
      onConfigChange(config);
    }
  };

  const handleTestConnection = async () => {
    if (!client) return;

    setShowTestModal(true);
  };

  const handleCreateWebhook = async () => {
    if (!client) return;

    try {
      await createWebhook({
        url: webhookURL,
        events: selectedEvents,
        active: webhookActive
      });

      // Reset form
      setWebhookURL('');
      setSelectedEvents([]);
      setWebhookActive(true);
      setShowWebhookModal(false);
    } catch (err) {
      console.error('Failed to create webhook:', err);
    }
  };

  const handleToggleWebhook = async (id: string, active: boolean) => {
    try {
      await updateWebhook(id, { active });
    } catch (err) {
      console.error('Failed to update webhook:', err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      try {
        await deleteWebhook(id);
      } catch (err) {
        console.error('Failed to delete webhook:', err);
      }
    }
  };

  const getHealthIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  const getHealthColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-800';
    }
  };

  const webhookEventOptions = [
    { value: WebhookEvent.LOSS_CREATED, label: 'Loss Created' },
    { value: WebhookEvent.LOSS_UPDATED, label: 'Loss Updated' },
    { value: WebhookEvent.LOSS_DELETED, label: 'Loss Deleted' },
    { value: WebhookEvent.HAZARD_CREATED, label: 'Hazard Created' },
    { value: WebhookEvent.HAZARD_UPDATED, label: 'Hazard Updated' },
    { value: WebhookEvent.HAZARD_DELETED, label: 'Hazard Deleted' },
    { value: WebhookEvent.UCA_CREATED, label: 'UCA Created' },
    { value: WebhookEvent.UCA_UPDATED, label: 'UCA Updated' },
    { value: WebhookEvent.UCA_DELETED, label: 'UCA Deleted' },
    { value: WebhookEvent.REQUIREMENT_CREATED, label: 'Requirement Created' },
    { value: WebhookEvent.REQUIREMENT_UPDATED, label: 'Requirement Updated' },
    { value: WebhookEvent.ANALYSIS_COMPLETED, label: 'Analysis Completed' }
  ];

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ServerIcon className="w-5 h-5" />
            API Configuration
          </h3>
          {isConfigured && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor()}`}>
              <div className="flex items-center gap-2">
                {getHealthIcon()}
                <span className="capitalize">{health.status}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Input
            label="API Base URL"
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            placeholder="https://api.example.com"
            leftIcon={<LinkIcon className="w-5 h-5 text-slate-400" />}
          />

          <Input
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            leftIcon={<KeyIcon className="w-5 h-5 text-slate-400" />}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Timeout (ms)"
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value))}
              min={1000}
              max={300000}
            />

            <Input
              label="Retry Attempts"
              type="number"
              value={retryAttempts}
              onChange={(e) => setRetryAttempts(parseInt(e.target.value))}
              min={0}
              max={10}
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveConfiguration}
                variant="primary"
                disabled={!baseURL}
              >
                Save Configuration
              </Button>

              {isConfigured && (
                <Button
                  onClick={handleTestConnection}
                  variant="secondary"
                  leftIcon={<BoltIcon className="w-4 h-4" />}
                >
                  Test Connection
                </Button>
              )}
            </div>

            {health.version && (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                API Version: {health.version}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Sync Settings */}
      {isConfigured && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ArrowPathIcon className="w-5 h-5" />
            Synchronization Settings
          </h3>

          <div className="space-y-4">
            <Checkbox
              id="auto-sync"
              label="Enable automatic synchronization"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
            />

            {autoSync && (
              <Select
                label="Sync Interval"
                value={syncInterval.toString()}
                onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                options={[
                  { value: '60', label: 'Every minute' },
                  { value: '300', label: 'Every 5 minutes' },
                  { value: '600', label: 'Every 10 minutes' },
                  { value: '1800', label: 'Every 30 minutes' },
                  { value: '3600', label: 'Every hour' }
                ]}
              />
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                onClick={sync}
                variant="secondary"
                leftIcon={<ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                disabled={isLoading}
              >
                {isLoading ? 'Syncing...' : 'Sync Now'}
              </Button>

              {lastSync && (
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  Last sync: {format(lastSync, 'MMM d, HH:mm')}
                </span>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Webhooks */}
      {isConfigured && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Webhooks</h3>
            <Button
              onClick={() => setShowWebhookModal(true)}
              size="sm"
              leftIcon={<LinkIcon className="w-4 h-4" />}
            >
              Add Webhook
            </Button>
          </div>

          {webhooksLoading ? (
            <div className="text-center py-8 text-slate-500">Loading webhooks...</div>
          ) : webhooksError ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{webhooksError}</p>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No webhooks configured
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{webhook.url}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {webhook.events.length} events • {webhook.active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={webhook.active}
                      onChange={(e) => handleToggleWebhook(webhook.id, e.target.checked)}
                    />
                    <Button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      size="sm"
                      variant="secondary"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Webhook Modal */}
      <Modal
        isOpen={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        title="Add Webhook"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Webhook URL"
            value={webhookURL}
            onChange={(e) => setWebhookURL(e.target.value)}
            placeholder="https://example.com/webhook"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Events
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {webhookEventOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  id={option.value}
                  label={option.label}
                  checked={selectedEvents.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedEvents([...selectedEvents, option.value]);
                    } else {
                      setSelectedEvents(selectedEvents.filter(ev => ev !== option.value));
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <Checkbox
            id="webhook-active"
            label="Active"
            checked={webhookActive}
            onChange={(e) => setWebhookActive(e.target.checked)}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => setShowWebhookModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWebhook}
              disabled={!webhookURL || selectedEvents.length === 0}
            >
              Create Webhook
            </Button>
          </div>
        </div>
      </Modal>

      {/* Test Connection Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="API Connection Test"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center py-8">
            {health.status === 'unknown' ? (
              <div className="flex flex-col items-center gap-4">
                <ArrowPathIcon className="w-12 h-12 text-slate-400 animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Testing connection...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className={`p-3 rounded-full ${
                  health.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' :
                  health.status === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {getHealthIcon()}
                </div>
                <div>
                  <p className="font-medium text-lg capitalize">{health.status}</p>
                  {health.version && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Version: {health.version}
                    </p>
                  )}
                  {health.uptime && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Uptime: {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => setShowTestModal(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default APIIntegrationPanel;