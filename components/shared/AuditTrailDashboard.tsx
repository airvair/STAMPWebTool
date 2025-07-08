import React, { useState, useMemo } from 'react';
import {
  ClockIcon,
  DocumentArrowDownIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  EyeIcon,
  FunnelIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';
import Button from './Button';
import Select from './Select';
import Input from './Input';
import { auditTrail, AuditEvent, AuditQuery } from '../../utils/auditTrail';

interface AuditTrailDashboardProps {
  className?: string;
  entityType?: string;
  entityId?: string;
  showFilters?: boolean;
  showSummary?: boolean;
  maxEvents?: number;
}

const AuditTrailDashboard: React.FC<AuditTrailDashboardProps> = ({
  className = '',
  entityType,
  entityId,
  showFilters = true,
  showSummary = true,
  maxEvents = 50
}) => {
  const [query, setQuery] = useState<AuditQuery>({
    entityType,
    entityId,
    limit: maxEvents
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  // Get audit events and summary
  const events = useMemo(() => auditTrail.queryEvents(query), [query]);
  const summary = useMemo(() => auditTrail.generateSummary(query), [query]);

  const handleFilterChange = (field: keyof AuditQuery, value: any) => {
    setQuery(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    const auditData = auditTrail.exportAuditTrail(query);
    const blob = new Blob([auditData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getEventIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'UPDATE':
        return <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'DELETE':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'VALIDATE':
        return <ShieldCheckIcon className="w-5 h-5 text-purple-600" />;
      case 'EXPORT':
        return <DocumentArrowDownIcon className="w-5 h-5 text-indigo-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-slate-600" />;
    }
  };

  const getValidationBadge = (result: string) => {
    switch (result) {
      case 'pass':
        return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded text-xs font-medium">Pass</span>;
      case 'fail':
        return <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded text-xs font-medium">Fail</span>;
      case 'warning':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 rounded text-xs font-medium">Warning</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 rounded text-xs font-medium">Info</span>;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(new Date(timestamp));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      {showSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Events</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Validations</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.complianceStats.totalValidations}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {summary.complianceStats.passedValidations} passed
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Warnings</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.complianceStats.warningsCount}</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {summary.complianceStats.failedValidations} failed
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center">
              <UserIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Users</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {Object.keys(summary.eventsByUser).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FunnelIcon className="w-5 h-5" />
              Audit Filters
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant="secondary"
                size="sm"
              >
                {showAdvancedFilters ? 'Simple' : 'Advanced'}
              </Button>
              <Button
                onClick={handleExport}
                variant="secondary"
                size="sm"
                leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
              >
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Select
              label="Event Type"
              value={query.eventType || ''}
              onChange={(e) => handleFilterChange('eventType', e.target.value || undefined)}
              options={[
                { value: '', label: 'All Events' },
                { value: 'ENTITY_CREATED', label: 'Created' },
                { value: 'ENTITY_UPDATED', label: 'Updated' },
                { value: 'ENTITY_DELETED', label: 'Deleted' },
                { value: 'VALIDATION_PERFORMED', label: 'Validated' },
                { value: 'SYSTEMATIC_ANALYSIS', label: 'Analysis' },
                { value: 'EXPORT_GENERATED', label: 'Export' }
              ]}
            />

            <Select
              label="Entity Type"
              value={query.entityType || ''}
              onChange={(e) => handleFilterChange('entityType', e.target.value || undefined)}
              options={[
                { value: '', label: 'All Entities' },
                { value: 'UCA', label: 'UCAs' },
                { value: 'UCCA', label: 'UCCAs' },
                { value: 'HARDWARE_COMPONENT', label: 'Hardware' },
                { value: 'HAZARD', label: 'Hazards' },
                { value: 'CONTROLLER', label: 'Controllers' },
                { value: 'ANALYSIS_SESSION', label: 'Sessions' }
              ]}
            />

            <Select
              label="Action"
              value={query.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
              options={[
                { value: '', label: 'All Actions' },
                { value: 'CREATE', label: 'Create' },
                { value: 'UPDATE', label: 'Update' },
                { value: 'DELETE', label: 'Delete' },
                { value: 'VALIDATE', label: 'Validate' },
                { value: 'EXPORT', label: 'Export' }
              ]}
            />

            <Input
              label="User ID"
              value={query.userId || ''}
              onChange={(e) => handleFilterChange('userId', e.target.value || undefined)}
              placeholder="Filter by user..."
            />

            {showAdvancedFilters && (
              <>
                <Input
                  label="Start Date"
                  type="datetime-local"
                  value={query.startDate ? query.startDate.toISOString().slice(0, -8) : ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                />

                <Input
                  label="End Date"
                  type="datetime-local"
                  value={query.endDate ? query.endDate.toISOString().slice(0, -8) : ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                />

                <Input
                  label="Entity ID"
                  value={query.entityId || ''}
                  onChange={(e) => handleFilterChange('entityId', e.target.value || undefined)}
                  placeholder="Specific entity ID..."
                />

                <Select
                  label="Limit"
                  value={query.limit?.toString() || '50'}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  options={[
                    { value: '25', label: '25 events' },
                    { value: '50', label: '50 events' },
                    { value: '100', label: '100 events' },
                    { value: '250', label: '250 events' },
                    { value: '500', label: '500 events' }
                  ]}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Audit Events ({events.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit events found matching the current filters.</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getEventIcon(event.action)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {event.description}
                        </p>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded text-xs">
                          {event.action}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                        <span>{event.entityType}: {event.entityId.slice(0, 8)}...</span>
                        <span>by {event.userName}</span>
                        <span>{formatTimestamp(event.timestamp)}</span>
                      </div>

                      {/* Validation Results */}
                      {event.metadata.validationResults && event.metadata.validationResults.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.metadata.validationResults.map((result, index) => (
                            <div key={index} className="flex items-center gap-1">
                              {getValidationBadge(result.result)}
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {result.validationType}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Compliance Context */}
                      {event.complianceContext && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded text-xs">
                            {event.complianceContext.standard}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded text-xs">
                            {event.complianceContext.phase}
                          </span>
                          {event.complianceContext.auditRequirement && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded text-xs">
                              Audit Required
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<EyeIcon className="w-4 h-4" />}
                  >
                    Details
                  </Button>
                </div>

                {/* Expanded Details */}
                {selectedEvent?.id === event.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Event Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Event ID:</span> {event.id}</p>
                          <p><span className="font-medium">Session ID:</span> {event.sessionId}</p>
                          <p><span className="font-medium">User Role:</span> {event.userRole}</p>
                          <p><span className="font-medium">Automated:</span> {event.metadata.automatedAction ? 'Yes' : 'No'}</p>
                          <p><span className="font-medium">Change Size:</span> {event.metadata.changeSize || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Technical Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">App Version:</span> {event.metadata.applicationVersion}</p>
                          <p><span className="font-medium">Methodology:</span> {event.metadata.methodologyVersion}</p>
                        </div>
                      </div>
                    </div>

                    {(event.oldValue || event.newValue) && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Data Changes</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {event.oldValue && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Old Value:</p>
                              <pre className="text-xs bg-slate-100 dark:bg-slate-700 p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(event.oldValue, null, 2)}
                              </pre>
                            </div>
                          )}
                          {event.newValue && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New Value:</p>
                              <pre className="text-xs bg-slate-100 dark:bg-slate-700 p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(event.newValue, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrailDashboard;