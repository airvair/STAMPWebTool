// Comprehensive audit trail system for safety compliance
export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  sessionId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  metadata: {
    applicationVersion: string;
    methodologyVersion: string;
    changeSize?: 'minor' | 'major' | 'critical';
    automatedAction?: boolean;
    validationResults?: Array<{
      validationType: string;
      result: 'pass' | 'fail' | 'warning';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  };
  complianceContext?: {
    standard: string;
    phase: string;
    criticality: string;
    auditRequirement: boolean;
  };
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  entityType?: string;
  entityId?: string;
  eventType?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByEntity: Record<string, number>;
  eventsByUser: Record<string, number>;
  timeRange: {
    earliest: Date;
    latest: Date;
  };
  complianceStats: {
    totalValidations: number;
    passedValidations: number;
    failedValidations: number;
    warningsCount: number;
  };
}

/**
 * Comprehensive audit trail service for safety compliance
 */
export class AuditTrailService {
  private events: AuditEvent[] = [];
  private sessionId: string;
  private currentUser: {
    id: string;
    name: string;
    role: string;
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.currentUser = {
      id: 'system-user',
      name: 'System User',
      role: 'Safety Engineer'
    };
  }

  /**
   * Record a new audit event
   */
  recordEvent(params: {
    eventType: string;
    entityType: string;
    entityId: string;
    action: string;
    description: string;
    oldValue?: any;
    newValue?: any;
    metadata?: Partial<AuditEvent['metadata']>;
    complianceContext?: AuditEvent['complianceContext'];
  }): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userRole: this.currentUser.role,
      sessionId: this.sessionId,
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      description: params.description,
      oldValue: params.oldValue,
      newValue: params.newValue,
      metadata: {
        applicationVersion: '1.0.0',
        methodologyVersion: 'MIT-STPA-2023',
        ...params.metadata
      },
      complianceContext: params.complianceContext
    };

    this.events.push(event);
    this.notifyAuditEvent(event);
  }

  /**
   * Record UCA creation event
   */
  recordUCACreation(uca: any): void {
    this.recordEvent({
      eventType: 'ENTITY_CREATED',
      entityType: 'UCA',
      entityId: uca.id,
      action: 'CREATE',
      description: `Created UCA: ${uca.code} - ${uca.ucaType}`,
      newValue: uca,
      metadata: {
        changeSize: 'major',
        automatedAction: false,
        validationResults: [
          {
            validationType: 'mit_stpa',
            result: 'pass',
            message: 'UCA follows MIT STPA methodology',
            severity: 'low'
          }
        ]
      },
      complianceContext: {
        standard: 'ARP4761',
        phase: 'Development',
        criticality: 'DAL-C',
        auditRequirement: true
      }
    });
  }

  /**
   * Record UCA modification event
   */
  recordUCAModification(oldUca: any, newUca: any): void {
    this.recordEvent({
      eventType: 'ENTITY_UPDATED',
      entityType: 'UCA',
      entityId: newUca.id,
      action: 'UPDATE',
      description: `Modified UCA: ${newUca.code}`,
      oldValue: oldUca,
      newValue: newUca,
      metadata: {
        changeSize: this.calculateChangeSize(oldUca, newUca),
        automatedAction: false
      },
      complianceContext: {
        standard: 'ARP4761',
        phase: 'Development',
        criticality: 'DAL-C',
        auditRequirement: true
      }
    });
  }

  /**
   * Record UCCA creation event
   */
  recordUCCACreation(ucca: any): void {
    this.recordEvent({
      eventType: 'ENTITY_CREATED',
      entityType: 'UCCA',
      entityId: ucca.id,
      action: 'CREATE',
      description: `Created UCCA: ${ucca.uccaType} involving ${ucca.involvedControllerIds.length} controllers`,
      newValue: ucca,
      metadata: {
        changeSize: 'major',
        automatedAction: ucca.isSystematic || false,
        validationResults: [
          {
            validationType: 'completeness',
            result: ucca.involvedControllerIds.length >= 2 ? 'pass' : 'fail',
            message: ucca.involvedControllerIds.length >= 2 ? 'UCCA involves multiple controllers' : 'UCCA should involve at least 2 controllers',
            severity: ucca.involvedControllerIds.length >= 2 ? 'low' : 'high'
          }
        ]
      },
      complianceContext: {
        standard: 'ARP4761',
        phase: 'Development',
        criticality: 'DAL-C',
        auditRequirement: true
      }
    });
  }

  /**
   * Record systematic analysis event
   */
  recordSystematicAnalysis(results: any[]): void {
    this.recordEvent({
      eventType: 'SYSTEMATIC_ANALYSIS',
      entityType: 'ANALYSIS_SESSION',
      entityId: this.sessionId,
      action: 'VALIDATE',
      description: `Performed systematic UCCA analysis, found ${results.length} potential combinations`,
      newValue: { resultsCount: results.length, results: results.slice(0, 5) },
      metadata: {
        changeSize: 'major',
        automatedAction: true,
        validationResults: [
          {
            validationType: 'systematic_completeness',
            result: results.length > 0 ? 'pass' : 'warning',
            message: results.length > 0 ? `Found ${results.length} potential UCCAs` : 'No potential UCCAs identified',
            severity: results.length > 0 ? 'low' : 'medium'
          }
        ]
      },
      complianceContext: {
        standard: 'ARP4761',
        phase: 'Development',
        criticality: 'DAL-C',
        auditRequirement: true
      }
    });
  }

  /**
   * Record hardware component analysis
   */
  recordHardwareComponentCreation(component: any): void {
    this.recordEvent({
      eventType: 'ENTITY_CREATED',
      entityType: 'HARDWARE_COMPONENT',
      entityId: component.id,
      action: 'CREATE',
      description: `Created hardware component: ${component.name} (${component.type})`,
      newValue: component,
      metadata: {
        changeSize: 'major',
        automatedAction: false
      },
      complianceContext: {
        standard: 'DO-254',
        phase: 'Development',
        criticality: 'DAL-C',
        auditRequirement: true
      }
    });
  }

  /**
   * Record validation event
   */
  recordValidation(entityType: string, entityId: string, validationType: string, results: any): void {
    this.recordEvent({
      eventType: 'VALIDATION_PERFORMED',
      entityType: entityType,
      entityId: entityId,
      action: 'VALIDATE',
      description: `Performed ${validationType} validation`,
      newValue: results,
      metadata: {
        changeSize: 'minor',
        automatedAction: true,
        validationResults: Array.isArray(results) ? results : [results]
      },
      complianceContext: {
        standard: 'ARP4761',
        phase: 'Verification',
        criticality: 'DAL-C',
        auditRequirement: true
      }
    });
  }

  /**
   * Record export/report generation
   */
  recordExport(reportType: string, entityIds: string[]): void {
    this.recordEvent({
      eventType: 'EXPORT_GENERATED',
      entityType: 'REPORT',
      entityId: this.generateEventId(),
      action: 'EXPORT',
      description: `Generated ${reportType} report for ${entityIds.length} entities`,
      newValue: { reportType, entityCount: entityIds.length, entityIds },
      metadata: {
        changeSize: 'minor',
        automatedAction: false
      },
      complianceContext: {
        standard: 'ARP4761',
        phase: 'Documentation',
        criticality: 'DAL-C',
        auditRequirement: true
      }
    });
  }

  /**
   * Query audit events
   */
  queryEvents(query: AuditQuery): AuditEvent[] {
    let filteredEvents = [...this.events];

    if (query.startDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= query.endDate!);
    }

    if (query.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === query.userId);
    }

    if (query.entityType) {
      filteredEvents = filteredEvents.filter(event => event.entityType === query.entityType);
    }

    if (query.entityId) {
      filteredEvents = filteredEvents.filter(event => event.entityId === query.entityId);
    }

    if (query.eventType) {
      filteredEvents = filteredEvents.filter(event => event.eventType === query.eventType);
    }

    if (query.action) {
      filteredEvents = filteredEvents.filter(event => event.action === query.action);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    return filteredEvents.slice(offset, offset + limit);
  }

  /**
   * Generate audit summary
   */
  generateSummary(query?: AuditQuery): AuditSummary {
    const events = query ? this.queryEvents(query) : this.events;

    const eventsByType: Record<string, number> = {};
    const eventsByEntity: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};
    let totalValidations = 0;
    let passedValidations = 0;
    let failedValidations = 0;
    let warningsCount = 0;

    events.forEach(event => {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      
      // Count by entity
      eventsByEntity[event.entityType] = (eventsByEntity[event.entityType] || 0) + 1;
      
      // Count by user
      eventsByUser[event.userName] = (eventsByUser[event.userName] || 0) + 1;

      // Count validations
      if (event.metadata.validationResults) {
        event.metadata.validationResults.forEach(result => {
          totalValidations++;
          if (result.result === 'pass') passedValidations++;
          if (result.result === 'fail') failedValidations++;
          if (result.result === 'warning') warningsCount++;
        });
      }
    });

    const timestamps = events.map(e => e.timestamp.getTime());
    const earliest = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date();
    const latest = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date();

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByEntity,
      eventsByUser,
      timeRange: { earliest, latest },
      complianceStats: {
        totalValidations,
        passedValidations,
        failedValidations,
        warningsCount
      }
    };
  }

  /**
   * Get audit trail for specific entity
   */
  getEntityAuditTrail(entityType: string, entityId: string): AuditEvent[] {
    return this.queryEvents({ entityType, entityId, limit: 1000 });
  }

  /**
   * Get compliance events
   */
  getComplianceEvents(standard?: string): AuditEvent[] {
    const events = this.events.filter(event => 
      event.complianceContext?.auditRequirement === true &&
      (standard ? event.complianceContext.standard === standard : true)
    );
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Export audit trail to JSON
   */
  exportAuditTrail(query?: AuditQuery): string {
    const events = query ? this.queryEvents(query) : this.events;
    const summary = this.generateSummary(query);
    
    const auditReport = {
      metadata: {
        generatedAt: new Date(),
        generatedBy: this.currentUser.name,
        version: '1.0.0',
        totalEvents: events.length
      },
      summary,
      events
    };

    return JSON.stringify(auditReport, null, 2);
  }

  private generateEventId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChangeSize(oldValue: any, newValue: any): 'minor' | 'major' | 'critical' {
    if (!oldValue) return 'major';
    
    // Simple heuristic - can be enhanced
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);
    const changeRatio = Math.abs(oldStr.length - newStr.length) / oldStr.length;
    
    if (changeRatio > 0.5) return 'critical';
    if (changeRatio > 0.1) return 'major';
    return 'minor';
  }

  private notifyAuditEvent(event: AuditEvent): void {
    // Log to console for development
    console.log(`[AUDIT] ${event.eventType}: ${event.description}`, {
      entity: `${event.entityType}:${event.entityId}`,
      user: event.userName,
      timestamp: event.timestamp.toISOString()
    });

    // In production, this would send to logging service, database, etc.
  }
}

// Global audit trail instance
export const auditTrail = new AuditTrailService();