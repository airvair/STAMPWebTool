import React, { useState } from 'react';
import {
  ClockIcon,
  EyeIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';
import Button from './Button';
import { auditTrail } from '../../utils/auditTrail';

interface EntityAuditTrailProps {
  entityType: string;
  entityId: string;
  className?: string;
  maxEvents?: number;
  showTitle?: boolean;
  compact?: boolean;
}

const EntityAuditTrail: React.FC<EntityAuditTrailProps> = ({
  entityType,
  entityId,
  className = '',
  maxEvents = 10,
  showTitle = true,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const events = auditTrail.getEntityAuditTrail(entityType, entityId).slice(0, maxEvents);

  const getEventIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'UPDATE':
        return <InformationCircleIcon className="w-4 h-4 text-blue-600" />;
      case 'DELETE':
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case 'VALIDATE':
        return <ShieldCheckIcon className="w-4 h-4 text-purple-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-slate-600" />;
    }
  };

  const getValidationBadge = (result: string) => {
    const badgeClasses = {
      pass: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      fail: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      info: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    };
    
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${badgeClasses[result as keyof typeof badgeClasses] || badgeClasses.info}`}>
        {result}
      </span>
    );
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  if (events.length === 0) {
    return (
      <div className={`text-center py-4 text-slate-500 dark:text-slate-400 ${className}`}>
        <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No audit events found</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Recent Activity ({events.length})
            </h4>
            {events.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                {isExpanded ? 'Show Less' : 'Show All'}
                {isExpanded ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronRightIcon className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        )}

        <div className="space-y-1">
          {(isExpanded ? events : events.slice(0, 3)).map((event) => (
            <div key={event.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs">
              {getEventIcon(event.action)}
              <span className="flex-1 text-slate-700 dark:text-slate-300">{event.description}</span>
              <span className="text-slate-500 dark:text-slate-400 shrink-0">
                {formatTimestamp(event.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {showTitle && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Audit Trail ({events.length} events)
          </h3>
        </div>
      )}

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {events.map((event) => (
          <div key={event.id} className="p-4">
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
                  
                  <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>by {event.userName}</span>
                    <span>{formatTimestamp(event.timestamp)}</span>
                    {event.metadata.automatedAction && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded">
                        Automated
                      </span>
                    )}
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
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded text-xs">
                        {event.complianceContext.standard}
                      </span>
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded text-xs">
                        {event.complianceContext.phase}
                      </span>
                      {event.complianceContext.auditRequirement && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded text-xs">
                          Audit Required
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {(event.oldValue || event.newValue) && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<EyeIcon className="w-4 h-4" />}
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                >
                  {selectedEvent === event.id ? 'Hide' : 'Details'}
                </Button>
              )}
            </div>

            {/* Expanded Details */}
            {selectedEvent === event.id && (event.oldValue || event.newValue) && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.oldValue && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Previous Value:</p>
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
        ))}
      </div>
    </div>
  );
};

export default EntityAuditTrail;