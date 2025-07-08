import React, { useState } from 'react';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/solid';
import AuditTrailDashboard from '../shared/AuditTrailDashboard';
import Button from '../shared/Button';
import { auditTrail } from '../../utils/auditTrail';

interface AuditTrailPageProps {
  className?: string;
}

const AuditTrailPage: React.FC<AuditTrailPageProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'compliance' | 'reports' | 'settings'>('dashboard');

  const generateComplianceReport = () => {
    const complianceEvents = auditTrail.getComplianceEvents();
    const summary = auditTrail.generateSummary();
    
    const report = {
      title: 'Safety Compliance Audit Report',
      generatedAt: new Date().toISOString(),
      summary: {
        totalEvents: complianceEvents.length,
        complianceRequiredEvents: complianceEvents.filter(e => e.complianceContext?.auditRequirement).length,
        standards: [...new Set(complianceEvents.map(e => e.complianceContext?.standard).filter(Boolean))],
        validationStats: summary.complianceStats
      },
      events: complianceEvents.slice(0, 100) // Limit for demo
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateStpaComplianceReport = () => {
    const stpaEvents = auditTrail.queryEvents({
      eventType: 'SYSTEMATIC_ANALYSIS',
      limit: 1000
    }).concat(
      auditTrail.queryEvents({
        eventType: 'VALIDATION_PERFORMED',
        limit: 1000
      })
    );

    const report = {
      title: 'MIT STPA Methodology Compliance Report',
      generatedAt: new Date().toISOString(),
      methodology: 'MIT-STPA-2023',
      compliance: {
        ucaCreationEvents: auditTrail.queryEvents({ entityType: 'UCA', eventType: 'ENTITY_CREATED' }).length,
        uccaCreationEvents: auditTrail.queryEvents({ entityType: 'UCCA', eventType: 'ENTITY_CREATED' }).length,
        systematicAnalysisEvents: stpaEvents.filter(e => e.eventType === 'SYSTEMATIC_ANALYSIS').length,
        validationEvents: stpaEvents.filter(e => e.eventType === 'VALIDATION_PERFORMED').length
      },
      events: stpaEvents.slice(0, 50)
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stpa-compliance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const TabButton: React.FC<{ id: string; label: string; icon: React.ReactNode; count?: number }> = ({ 
    id, label, icon, count 
  }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === id
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`px-2 py-1 rounded-full text-xs ${
          activeTab === id
            ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const summary = auditTrail.generateSummary();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Safety Audit Trail</h1>
            <p className="text-blue-100 max-w-2xl">
              Comprehensive audit logging for safety-critical systems analysis. 
              Track all changes, validations, and compliance events for regulatory documentation.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{summary.totalEvents}</div>
            <div className="text-blue-100 text-sm">Total Events</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex space-x-1">
          <TabButton
            id="dashboard"
            label="Audit Dashboard"
            icon={<ChartBarIcon className="w-5 h-5" />}
            count={summary.totalEvents}
          />
          <TabButton
            id="compliance"
            label="Compliance Events"
            icon={<ShieldCheckIcon className="w-5 h-5" />}
            count={auditTrail.getComplianceEvents().length}
          />
          <TabButton
            id="reports"
            label="Reports"
            icon={<DocumentTextIcon className="w-5 h-5" />}
          />
          <TabButton
            id="settings"
            label="Settings"
            icon={<Cog6ToothIcon className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <AuditTrailDashboard
          showFilters={true}
          showSummary={true}
          maxEvents={100}
        />
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Regulatory Compliance Tracking
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  This section tracks all events that require regulatory audit trails for aviation safety standards 
                  including ARP4761, DO-178C, DO-254, and ARP4754A compliance.
                </p>
              </div>
            </div>
          </div>

          <AuditTrailDashboard
            showFilters={true}
            showSummary={false}
            maxEvents={200}
          />
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Compliance Reports
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Generate comprehensive audit reports for regulatory submissions and internal compliance reviews.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldCheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                      Full Compliance Report
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Complete audit trail with all compliance events, validations, and regulatory context.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={generateComplianceReport}
                  leftIcon={<DocumentTextIcon className="w-4 h-4" />}
                  className="w-full"
                >
                  Generate Report
                </Button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <ClockIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                      STPA Methodology Report
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      MIT STPA methodology compliance including systematic analysis and validation events.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={generateStpaComplianceReport}
                  leftIcon={<DocumentTextIcon className="w-4 h-4" />}
                  className="w-full"
                >
                  Generate Report
                </Button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <h5 className="font-medium text-slate-800 dark:text-slate-100 mb-2">Report Statistics</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Total Events:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 ml-2">
                    {summary.totalEvents}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Validations:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 ml-2">
                    {summary.complianceStats.totalValidations}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Passed:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400 ml-2">
                    {summary.complianceStats.passedValidations}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Warnings:</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400 ml-2">
                    {summary.complianceStats.warningsCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Audit Trail Configuration
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-3">Compliance Standards</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['ARP4761', 'DO-178C', 'DO-254', 'ARP4754A', 'ISO26262'].map(standard => (
                    <div key={standard} className="flex items-center">
                      <input
                        type="checkbox"
                        id={standard}
                        defaultChecked={true}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={standard} className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                        {standard}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-3">Event Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Entity Creation',
                    'Entity Updates',
                    'Entity Deletion',
                    'Validations',
                    'Systematic Analysis',
                    'Export Operations'
                  ].map(eventType => (
                    <div key={eventType} className="flex items-center">
                      <input
                        type="checkbox"
                        id={eventType}
                        defaultChecked={true}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={eventType} className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                        {eventType}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-3">Retention Policy</h4>
                <div className="max-w-xs">
                  <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800">
                    <option value="1">1 Year</option>
                    <option value="3">3 Years</option>
                    <option value="5" selected>5 Years</option>
                    <option value="7">7 Years</option>
                    <option value="10">10 Years</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Aviation safety records typically require 5-10 year retention
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="primary">
                  Save Configuration
                </Button>
                <Button variant="secondary">
                  Export Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailPage;