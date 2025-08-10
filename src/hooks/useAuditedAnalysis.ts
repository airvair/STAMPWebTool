// Enhanced analysis hook with integrated audit trails
import { useContext, useCallback } from 'react';
import { AnalysisContext } from '@/context/AnalysisContext';
import { UnsafeControlAction, HardwareComponent, FailureMode } from '@/types/types';
import { auditTrail } from '@/utils/audit-trail';

/**
 * Enhanced analysis hook that automatically records audit events
 */
export const useAuditedAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAuditedAnalysis must be used within an AnalysisProvider');
  }

  // Audited UCA operations
  const auditedAddUCA = useCallback(
    (uca: Omit<UnsafeControlAction, 'id' | 'code'>) => {
      const newUCA = context.addUCA(uca);
      // Find the newly created UCA to get its full data including generated ID
      const createdUCA = context.ucas[context.ucas.length - 1];
      if (createdUCA) {
        auditTrail.recordUCACreation(createdUCA);
      }
      return newUCA;
    },
    [context]
  );

  const auditedUpdateUCA = useCallback(
    (id: string, updates: Partial<UnsafeControlAction>) => {
      const oldUCA = context.ucas.find(u => u.id === id);
      const result = context.updateUCA(id, updates);
      const newUCA = context.ucas.find(u => u.id === id);

      if (oldUCA && newUCA) {
        auditTrail.recordUCAModification(oldUCA, newUCA);
      }
      return result;
    },
    [context]
  );

  const auditedDeleteUCA = useCallback(
    (id: string) => {
      const deletedUCA = context.ucas.find(u => u.id === id);
      const result = context.deleteUCA(id);

      if (deletedUCA) {
        auditTrail.recordEvent({
          eventType: 'ENTITY_DELETED',
          entityType: 'UCA',
          entityId: id,
          action: 'DELETE',
          description: `Deleted UCA: ${deletedUCA.code}`,
          oldValue: deletedUCA,
          metadata: {
            changeSize: 'major',
            automatedAction: false,
          },
          complianceContext: {
            standard: 'ARP4761',
            phase: 'Development',
            criticality: 'DAL-C',
            auditRequirement: true,
          },
        });
      }
      return result;
    },
    [context]
  );

  // Audited Hardware Component operations
  const auditedAddHardwareComponent = useCallback(
    (component: Omit<HardwareComponent, 'id'>) => {
      const result = context.addHardwareComponent(component);
      const createdComponent = context.hardwareComponents[context.hardwareComponents.length - 1];
      if (createdComponent) {
        auditTrail.recordHardwareComponentCreation(createdComponent);
      }
      return result;
    },
    [context]
  );

  const auditedUpdateHardwareComponent = useCallback(
    (id: string, updates: Partial<HardwareComponent>) => {
      const oldComponent = context.hardwareComponents.find(c => c.id === id);
      const result = context.updateHardwareComponent(id, updates);
      const newComponent = context.hardwareComponents.find(c => c.id === id);

      if (oldComponent && newComponent) {
        auditTrail.recordEvent({
          eventType: 'ENTITY_UPDATED',
          entityType: 'HARDWARE_COMPONENT',
          entityId: id,
          action: 'UPDATE',
          description: `Modified hardware component: ${newComponent.name}`,
          oldValue: oldComponent,
          newValue: newComponent,
          metadata: {
            changeSize: 'major',
            automatedAction: false,
          },
          complianceContext: {
            standard: 'DO-254',
            phase: 'Development',
            criticality: 'DAL-C',
            auditRequirement: true,
          },
        });
      }
      return result;
    },
    [context]
  );

  const auditedDeleteHardwareComponent = useCallback(
    (id: string) => {
      const deletedComponent = context.hardwareComponents.find(c => c.id === id);
      const result = context.deleteHardwareComponent(id);

      if (deletedComponent) {
        auditTrail.recordEvent({
          eventType: 'ENTITY_DELETED',
          entityType: 'HARDWARE_COMPONENT',
          entityId: id,
          action: 'DELETE',
          description: `Deleted hardware component: ${deletedComponent.name}`,
          oldValue: deletedComponent,
          metadata: {
            changeSize: 'major',
            automatedAction: false,
          },
          complianceContext: {
            standard: 'DO-254',
            phase: 'Development',
            criticality: 'DAL-C',
            auditRequirement: true,
          },
        });
      }
      return result;
    },
    [context]
  );

  // Audited Failure Mode operations
  const auditedAddFailureMode = useCallback(
    (failureMode: Omit<FailureMode, 'id'>) => {
      const result = context.addFailureMode(failureMode);
      const createdFailureMode = context.failureModes[context.failureModes.length - 1];
      if (createdFailureMode) {
        auditTrail.recordEvent({
          eventType: 'ENTITY_CREATED',
          entityType: 'FAILURE_MODE',
          entityId: createdFailureMode.id,
          action: 'CREATE',
          description: `Created failure mode: ${createdFailureMode.failureType} - ${createdFailureMode.description}`,
          newValue: createdFailureMode,
          metadata: {
            changeSize: 'major',
            automatedAction: false,
            validationResults: [
              {
                validationType: 'severity_assessment',
                result: createdFailureMode.severityLevel === 'Critical' ? 'warning' : 'pass',
                message:
                  createdFailureMode.severityLevel === 'Critical'
                    ? 'Critical failure mode requires additional review'
                    : 'Failure mode severity assessed',
                severity: createdFailureMode.severityLevel === 'Critical' ? 'high' : 'low',
              },
            ],
          },
          complianceContext: {
            standard: 'DO-254',
            phase: 'Development',
            criticality: 'DAL-C',
            auditRequirement: true,
          },
        });
      }
      return result;
    },
    [context]
  );

  // Record validation operations
  const recordValidation = useCallback(
    (entityType: string, entityId: string, validationType: string, results: any) => {
      auditTrail.recordValidation(entityType, entityId, validationType, results);
    },
    []
  );

  // Record export operations
  const recordExport = useCallback((reportType: string, entityIds: string[]) => {
    auditTrail.recordExport(reportType, entityIds);
  }, []);

  // Get audit trail for specific entity
  const getEntityAuditTrail = useCallback((entityType: string, entityId: string) => {
    return auditTrail.getEntityAuditTrail(entityType, entityId);
  }, []);

  // Return enhanced context with audited operations
  return {
    ...context,
    // Audited operations replace the original ones
    addUCA: auditedAddUCA,
    updateUCA: auditedUpdateUCA,
    deleteUCA: auditedDeleteUCA,
    addHardwareComponent: auditedAddHardwareComponent,
    updateHardwareComponent: auditedUpdateHardwareComponent,
    deleteHardwareComponent: auditedDeleteHardwareComponent,
    addFailureMode: auditedAddFailureMode,

    // Additional audit operations
    recordSystematicAnalysis,
    recordValidation,
    recordExport,
    getEntityAuditTrail,

    // Access to the audit trail service
    auditTrail,
  };
};

export default useAuditedAnalysis;
