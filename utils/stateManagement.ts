import { UnsafeControlAction, UCCA, Controller, ControlAction, Hazard, Loss, CausalScenario, Requirement } from '@/types';
import { ValidationResult } from './ucaValidation';
import { ErrorHandler, SafetyAnalysisError, createErrorContext } from './errorHandling';

// Enhanced state management for UCA/UCCA analysis with robust error handling and bidirectional links

// Bidirectional link interfaces
export interface TraceableEntity {
  id: string;
  upstream: string[];   // IDs of entities that lead to this one
  downstream: string[]; // IDs of entities that derive from this one
}

export interface TraceabilityLink {
  sourceId: string;
  sourceType: 'loss' | 'hazard' | 'uca' | 'ucca' | 'scenario' | 'requirement';
  targetId: string;
  targetType: 'loss' | 'hazard' | 'uca' | 'ucca' | 'scenario' | 'requirement';
  strength: number; // 0-1, relationship strength
}

export interface TraceabilityGraph {
  nodes: Map<string, TraceabilityNode> | Set<string>;
  links: TraceabilityLink[];
}

export interface TraceabilityNode {
  id: string;
  type: 'loss' | 'hazard' | 'uca' | 'ucca' | 'scenario' | 'requirement';
  label: string;
  data: any;
  analysisStatus: 'complete' | 'partial' | 'pending';
}

export interface AnalysisState {
  ucas: UnsafeControlAction[];
  uccas: UCCA[];
  losses: Loss[];
  hazards: Hazard[];
  scenarios: CausalScenario[];
  requirements: Requirement[];
  traceabilityLinks: TraceabilityLink[];
  pendingChanges: PendingChange[];
  lastSaved: Date | null;
  isDirty: boolean;
  isLoading: boolean;
  errors: AnalysisError[];
}

export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'uca' | 'ucca';
  entityId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface AnalysisError {
  id: string;
  type: 'validation' | 'persistence' | 'network' | 'conflict';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  context: any;
  timestamp: Date;
  resolved: boolean;
  retryable: boolean;
}

export interface StateOperation {
  id: string;
  type: 'batch' | 'single';
  operations: OperationStep[];
  rollbackOperations: OperationStep[];
  completed: boolean;
  failed: boolean;
}

export interface OperationStep {
  action: 'create' | 'update' | 'delete';
  entityType: 'uca' | 'ucca';
  entityId: string;
  data?: any;
  previousData?: any;
}

/**
 * Enhanced state manager with transaction support and error recovery
 */
export class AnalysisStateManager {
  private state: AnalysisState;
  private listeners: ((state: AnalysisState) => void)[] = [];
  private operationHistory: StateOperation[] = [];
  private autoSaveTimer: NodeJS.Timeout | null = null;
  // TODO: Implement conflict resolution queue when needed
  // private _conflictResolutionQueue: PendingChange[] = [];

  constructor(initialState?: Partial<AnalysisState>) {
    this.state = {
      ucas: [],
      uccas: [],
      losses: [],
      hazards: [],
      scenarios: [],
      requirements: [],
      traceabilityLinks: [],
      pendingChanges: [],
      lastSaved: null,
      isDirty: false,
      isLoading: false,
      errors: [],
      ...initialState
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: AnalysisState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current state (immutable)
   */
  getState(): Readonly<AnalysisState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Update state with error handling and validation
   */
  private updateState(updater: (state: AnalysisState) => AnalysisState): void {
    try {
      const newState = updater({ ...this.state });
      this.state = newState;
      this.notifyListeners();
      this.scheduleAutoSave();
    } catch (error) {
      this.handleStateError(error as Error, 'State update failed');
    }
  }

  /**
   * Add UCA with comprehensive error handling
   */
  async addUCA(
    ucaData: Omit<UnsafeControlAction, 'id' | 'code'>,
    controllers: Controller[],
    controlActions: ControlAction[],
    hazards: Hazard[]
  ): Promise<string | null> {
    const operationId = this.generateOperationId();
    
    try {
      // Validate before adding
      const validation = await this.validateUCAData(ucaData, controllers, controlActions, hazards);
      if (!validation.valid) {
        throw new SafetyAnalysisError(
          'UCA_VALIDATION_FAILED',
          'UCA validation failed',
          'high',
          createErrorContext('AnalysisStateManager', 'addUCA'),
          {
            title: 'UCA Validation Failed',
            message: validation.errors.map(e => e.message).join('. ')
          }
        );
      }

      // Create UCA with generated ID and code
      const newUCA: UnsafeControlAction = {
        ...ucaData,
        id: this.generateEntityId(),
        code: this.generateUCACode(ucaData, controlActions)
      };

      // Create operation for rollback capability
      const operation: StateOperation = {
        id: operationId,
        type: 'single',
        operations: [{
          action: 'create',
          entityType: 'uca',
          entityId: newUCA.id,
          data: newUCA
        }],
        rollbackOperations: [{
          action: 'delete',
          entityType: 'uca',
          entityId: newUCA.id
        }],
        completed: false,
        failed: false
      };

      // Update state
      this.updateState(state => ({
        ...state,
        ucas: [...state.ucas, newUCA],
        isDirty: true,
        errors: state.errors.filter(e => e.type !== 'validation') // Clear validation errors
      }));

      // Record operation
      this.recordOperation(operation);

      // Queue for persistence
      await this.queuePendingChange({
        id: this.generateChangeId(),
        type: 'create',
        entityType: 'uca',
        entityId: newUCA.id,
        data: newUCA,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      });

      return newUCA.id;

    } catch (error) {
      this.handleEntityError(error as Error, 'Failed to add UCA', operationId);
      return null;
    }
  }

  /**
   * Update UCA with optimistic updates and rollback capability
   */
  async updateUCA(
    ucaId: string,
    updates: Partial<UnsafeControlAction>,
    controllers: Controller[],
    controlActions: ControlAction[],
    hazards: Hazard[]
  ): Promise<boolean> {
    const operationId = this.generateOperationId();
    
    try {
      const existingUCA = this.state.ucas.find(u => u.id === ucaId);
      if (!existingUCA) {
        throw new SafetyAnalysisError(
          'UCA_NOT_FOUND',
          'UCA not found for update',
          'high',
          createErrorContext('AnalysisStateManager', 'updateUCA'),
          {
            title: 'UCA Not Found',
            message: `Cannot update UCA ${ucaId} - it does not exist`
          }
        );
      }

      const updatedUCA = { ...existingUCA, ...updates };

      // Validate updated UCA
      const validation = await this.validateUCAData(updatedUCA, controllers, controlActions, hazards);
      if (!validation.valid) {
        throw new SafetyAnalysisError(
          'UCA_VALIDATION_FAILED',
          'Updated UCA validation failed',
          'high',
          createErrorContext('AnalysisStateManager', 'updateUCA'),
          {
            title: 'Update Validation Failed',
            message: validation.errors.map(e => e.message).join('. ')
          }
        );
      }

      // Create rollback operation
      const operation: StateOperation = {
        id: operationId,
        type: 'single',
        operations: [{
          action: 'update',
          entityType: 'uca',
          entityId: ucaId,
          data: updatedUCA,
          previousData: existingUCA
        }],
        rollbackOperations: [{
          action: 'update',
          entityType: 'uca',
          entityId: ucaId,
          data: existingUCA
        }],
        completed: false,
        failed: false
      };

      // Optimistic update
      this.updateState(state => ({
        ...state,
        ucas: state.ucas.map(u => u.id === ucaId ? updatedUCA : u),
        isDirty: true
      }));

      this.recordOperation(operation);

      // Queue for persistence
      await this.queuePendingChange({
        id: this.generateChangeId(),
        type: 'update',
        entityType: 'uca',
        entityId: ucaId,
        data: updatedUCA,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      });

      return true;

    } catch (error) {
      this.handleEntityError(error as Error, 'Failed to update UCA', operationId);
      return false;
    }
  }

  /**
   * Delete UCA with confirmation and rollback capability
   */
  async deleteUCA(ucaId: string): Promise<boolean> {
    const operationId = this.generateOperationId();
    
    try {
      const existingUCA = this.state.ucas.find(u => u.id === ucaId);
      if (!existingUCA) {
        throw new SafetyAnalysisError(
          'UCA_NOT_FOUND',
          'UCA not found for deletion',
          'medium',
          createErrorContext('AnalysisStateManager', 'deleteUCA')
        );
      }

      // Create rollback operation
      const operation: StateOperation = {
        id: operationId,
        type: 'single',
        operations: [{
          action: 'delete',
          entityType: 'uca',
          entityId: ucaId,
          previousData: existingUCA
        }],
        rollbackOperations: [{
          action: 'create',
          entityType: 'uca',
          entityId: ucaId,
          data: existingUCA
        }],
        completed: false,
        failed: false
      };

      // Optimistic deletion
      this.updateState(state => ({
        ...state,
        ucas: state.ucas.filter(u => u.id !== ucaId),
        isDirty: true
      }));

      this.recordOperation(operation);

      // Queue for persistence
      await this.queuePendingChange({
        id: this.generateChangeId(),
        type: 'delete',
        entityType: 'uca',
        entityId: ucaId,
        data: null,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      });

      return true;

    } catch (error) {
      this.handleEntityError(error as Error, 'Failed to delete UCA', operationId);
      return false;
    }
  }

  /**
   * Batch operations with transaction support
   */
  async executeBatchOperation(operations: OperationStep[]): Promise<boolean> {
    const operationId = this.generateOperationId();
    const rollbackOperations: OperationStep[] = [];

    try {
      // Start transaction
      this.updateState(state => ({ ...state, isLoading: true }));

      // Prepare rollback operations
      for (const op of operations) {
        if (op.action === 'create') {
          rollbackOperations.unshift({
            action: 'delete',
            entityType: op.entityType,
            entityId: op.entityId
          });
        } else if (op.action === 'update') {
          const existing = this.findEntity(op.entityType, op.entityId);
          rollbackOperations.unshift({
            action: 'update',
            entityType: op.entityType,
            entityId: op.entityId,
            data: existing
          });
        } else if (op.action === 'delete') {
          const existing = this.findEntity(op.entityType, op.entityId);
          rollbackOperations.unshift({
            action: 'create',
            entityType: op.entityType,
            entityId: op.entityId,
            data: existing
          });
        }
      }

      // Execute operations
      for (const operation of operations) {
        await this.executeOperation(operation);
      }

      // Record successful transaction
      this.recordOperation({
        id: operationId,
        type: 'batch',
        operations,
        rollbackOperations,
        completed: true,
        failed: false
      });

      this.updateState(state => ({ ...state, isLoading: false, isDirty: true }));
      return true;

    } catch (error) {
      // Rollback on failure
      await this.rollbackOperation(operationId, rollbackOperations);
      this.handleEntityError(error as Error, 'Batch operation failed', operationId);
      return false;
    }
  }

  /**
   * Rollback operation
   */
  private async rollbackOperation(_operationId: string, rollbackOperations: OperationStep[]): Promise<void> {
    try {
      for (const operation of rollbackOperations) {
        await this.executeOperation(operation, true);
      }
      
      this.updateState(state => ({ ...state, isLoading: false }));
      
      ErrorHandler.showInfo('Operation rolled back successfully', 'Rollback Complete');
    } catch (rollbackError) {
      this.handleStateError(rollbackError as Error, 'Rollback failed - state may be inconsistent');
    }
  }

  /**
   * Validate UCA data
   */
  private async validateUCAData(
    ucaData: Partial<UnsafeControlAction>,
    controllers: Controller[],
    controlActions: ControlAction[],
    hazards: Hazard[]
  ): Promise<ValidationResult> {
    // Import validation function dynamically to avoid circular dependencies
    const { validateUCA } = await import('./ucaValidation');
    return validateUCA(ucaData, controllers, controlActions, hazards);
  }

  /**
   * Queue pending change for persistence
   */
  private async queuePendingChange(change: PendingChange): Promise<void> {
    this.updateState(state => ({
      ...state,
      pendingChanges: [...state.pendingChanges, change]
    }));

    // Attempt immediate persistence
    await this.processPendingChanges();
  }

  /**
   * Process pending changes with retry logic
   */
  private async processPendingChanges(): Promise<void> {
    const pendingChanges = [...this.state.pendingChanges];
    
    for (const change of pendingChanges) {
      try {
        await this.persistChange(change);
        
        // Remove from pending on success
        this.updateState(state => ({
          ...state,
          pendingChanges: state.pendingChanges.filter(c => c.id !== change.id),
          lastSaved: new Date()
        }));
        
      } catch (error) {
        // Retry logic
        if (change.retryCount < change.maxRetries) {
          this.updateState(state => ({
            ...state,
            pendingChanges: state.pendingChanges.map(c => 
              c.id === change.id ? { ...c, retryCount: c.retryCount + 1 } : c
            )
          }));
          
          // Schedule retry
          setTimeout(() => this.processPendingChanges(), 1000 * (change.retryCount + 1));
        } else {
          // Max retries exceeded
          this.handlePersistenceError(error as Error, change);
        }
      }
    }
  }

  /**
   * Persist change (to be implemented with actual persistence layer)
   */
  private async persistChange(_change: PendingChange): Promise<void> {
    // This would integrate with your actual persistence layer
    // For now, simulate success/failure
    if (Math.random() < 0.1) { // 10% failure rate for testing
      throw new Error('Simulated persistence failure');
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Handle persistence errors
   */
  private handlePersistenceError(error: Error, change: PendingChange): void {
    const analysisError: AnalysisError = {
      id: this.generateErrorId(),
      type: 'persistence',
      severity: 'high',
      message: `Failed to persist ${change.entityType} ${change.type}: ${error.message}`,
      context: { change, error: error.message },
      timestamp: new Date(),
      resolved: false,
      retryable: true
    };

    this.updateState(state => ({
      ...state,
      errors: [...state.errors, analysisError],
      pendingChanges: state.pendingChanges.filter(c => c.id !== change.id)
    }));

    ErrorHandler.handleError(error, createErrorContext('AnalysisStateManager', 'persistChange'));
  }

  /**
   * Auto-save functionality
   */
  private scheduleAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setTimeout(() => {
      this.processPendingChanges();
    }, 5000); // Auto-save after 5 seconds of inactivity
  }

  /**
   * Utility methods
   */
  private generateEntityId(): string {
    return `uca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUCACode(ucaData: Omit<UnsafeControlAction, 'id' | 'code'>, controlActions: ControlAction[]): string {
    const action = controlActions.find(ca => ca.id === ucaData.controlActionId);
    const actionCode = action ? `${action.verb.substring(0, 3).toUpperCase()}${action.object.substring(0, 3).toUpperCase()}` : 'UCA';
    const typeCode = ucaData.ucaType.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const sequence = this.state.ucas.length + 1;
    return `${actionCode}-${typeCode}-${sequence.toString().padStart(3, '0')}`;
  }

  private findEntity(entityType: 'uca' | 'ucca', entityId: string): any {
    if (entityType === 'uca') {
      return this.state.ucas.find(u => u.id === entityId);
    } else {
      return this.state.uccas.find(u => u.id === entityId);
    }
  }

  private async executeOperation(_operation: OperationStep, _isRollback = false): Promise<void> {
    // Implementation depends on the specific operation
    // This would integrate with the actual state update mechanisms
  }

  private recordOperation(operation: StateOperation): void {
    this.operationHistory.push(operation);
    
    // Keep only last 50 operations for memory management
    if (this.operationHistory.length > 50) {
      this.operationHistory = this.operationHistory.slice(-50);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  private handleStateError(error: Error, message: string): void {
    const analysisError: AnalysisError = {
      id: this.generateErrorId(),
      type: 'validation',
      severity: 'critical',
      message,
      context: { error: error.message },
      timestamp: new Date(),
      resolved: false,
      retryable: false
    };

    this.state.errors.push(analysisError);
    ErrorHandler.handleError(error, createErrorContext('AnalysisStateManager', 'handleStateError'));
  }

  private handleEntityError(error: Error, message: string, operationId: string): void {
    const analysisError: AnalysisError = {
      id: this.generateErrorId(),
      type: 'validation',
      severity: 'high',
      message,
      context: { error: error.message, operationId },
      timestamp: new Date(),
      resolved: false,
      retryable: true
    };

    this.updateState(state => ({
      ...state,
      errors: [...state.errors, analysisError],
      isLoading: false
    }));

    ErrorHandler.handleError(error, createErrorContext('AnalysisStateManager', 'handleEntityError'));
  }

  /**
   * Bidirectional link management methods
   */

  /**
   * Add a traceability link between two entities
   */
  addTraceabilityLink(
    sourceId: string,
    sourceType: TraceabilityLink['sourceType'],
    targetId: string,
    targetType: TraceabilityLink['targetType'],
    strength: number = 1.0
  ): void {
    const link: TraceabilityLink = {
      sourceId,
      sourceType,
      targetId,
      targetType,
      strength
    };

    this.updateState(state => ({
      ...state,
      traceabilityLinks: [...state.traceabilityLinks, link],
      isDirty: true
    }));
  }

  /**
   * Remove a traceability link
   */
  removeTraceabilityLink(sourceId: string, targetId: string): void {
    this.updateState(state => ({
      ...state,
      traceabilityLinks: state.traceabilityLinks.filter(
        link => !(link.sourceId === sourceId && link.targetId === targetId)
      ),
      isDirty: true
    }));
  }

  /**
   * Get all upstream entities for a given entity
   */
  getUpstreamEntities(entityId: string): TraceabilityNode[] {
    const upstreamNodes: TraceabilityNode[] = [];
    const visited = new Set<string>();

    const traverse = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const upstreamLinks = this.state.traceabilityLinks.filter(
        link => link.targetId === currentId
      );

      upstreamLinks.forEach(link => {
        const node = this.createTraceabilityNode(link.sourceId, link.sourceType);
        if (node && !upstreamNodes.some(n => n.id === node.id)) {
          upstreamNodes.push(node);
          traverse(link.sourceId);
        }
      });
    };

    traverse(entityId);
    return upstreamNodes;
  }

  /**
   * Get all downstream entities for a given entity
   */
  getDownstreamEntities(entityId: string): TraceabilityNode[] {
    const downstreamNodes: TraceabilityNode[] = [];
    const visited = new Set<string>();

    const traverse = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const downstreamLinks = this.state.traceabilityLinks.filter(
        link => link.sourceId === currentId
      );

      downstreamLinks.forEach(link => {
        const node = this.createTraceabilityNode(link.targetId, link.targetType);
        if (node && !downstreamNodes.some(n => n.id === node.id)) {
          downstreamNodes.push(node);
          traverse(link.targetId);
        }
      });
    };

    traverse(entityId);
    return downstreamNodes;
  }

  /**
   * Generate a complete traceability graph
   */
  generateTraceabilityGraph(): TraceabilityGraph {
    const nodes = new Map<string, TraceabilityNode>();

    // Add all entities as nodes
    this.state.losses.forEach(loss => {
      const node = this.createTraceabilityNode(loss.id, 'loss');
      if (node) nodes.set(loss.id, node);
    });

    this.state.hazards.forEach(hazard => {
      const node = this.createTraceabilityNode(hazard.id, 'hazard');
      if (node) nodes.set(hazard.id, node);
    });

    this.state.ucas.forEach(uca => {
      const node = this.createTraceabilityNode(uca.id, 'uca');
      if (node) nodes.set(uca.id, node);
    });

    this.state.uccas.forEach(ucca => {
      const node = this.createTraceabilityNode(ucca.id, 'ucca');
      if (node) nodes.set(ucca.id, node);
    });

    this.state.scenarios.forEach(scenario => {
      const node = this.createTraceabilityNode(scenario.id, 'scenario');
      if (node) nodes.set(scenario.id, node);
    });

    this.state.requirements.forEach(requirement => {
      const node = this.createTraceabilityNode(requirement.id, 'requirement');
      if (node) nodes.set(requirement.id, node);
    });

    return {
      nodes,
      links: [...this.state.traceabilityLinks]
    };
  }

  /**
   * Build traceability graph (alias for generateTraceabilityGraph)
   */
  buildTraceabilityGraph(
    losses: any[],
    hazards: any[],
    ucas: any[],
    uccas: any[],
    scenarios: any[],
    requirements: any[]
  ): TraceabilityGraph {
    // Update state with provided data
    this.state.losses = losses;
    this.state.hazards = hazards;
    this.state.ucas = ucas;
    this.state.uccas = uccas;
    this.state.scenarios = scenarios;
    this.state.requirements = requirements;
    
    // Generate and return the graph
    return this.generateTraceabilityGraph();
  }

  /**
   * Validate traceability completeness
   */
  validateTraceability(): {
    isComplete: boolean;
    orphanedEntities: string[];
    missingLinks: string[];
  } {
    const orphanedEntities: string[] = [];
    const missingLinks: string[] = [];

    // Check losses have downstream hazards
    this.state.losses.forEach(loss => {
      const hasDownstream = this.state.traceabilityLinks.some(
        link => link.sourceId === loss.id && link.targetType === 'hazard'
      );
      if (!hasDownstream) {
        orphanedEntities.push(`Loss "${loss.title}" has no linked hazards`);
      }
    });

    // Check hazards have upstream losses and downstream UCAs/UCCAs
    this.state.hazards.forEach(hazard => {
      const hasUpstream = this.state.traceabilityLinks.some(
        link => link.targetId === hazard.id && link.sourceType === 'loss'
      );
      if (!hasUpstream) {
        missingLinks.push(`Hazard "${hazard.title}" is not linked to any losses`);
      }

      const hasDownstream = this.state.traceabilityLinks.some(
        link => link.sourceId === hazard.id && (link.targetType === 'uca' || link.targetType === 'ucca')
      );
      if (!hasDownstream) {
        missingLinks.push(`Hazard "${hazard.title}" has no linked UCAs or UCCAs`);
      }
    });

    // Check UCAs have upstream hazards and downstream scenarios
    this.state.ucas.forEach(uca => {
      const hasUpstream = this.state.traceabilityLinks.some(
        link => link.targetId === uca.id && link.sourceType === 'hazard'
      );
      if (!hasUpstream) {
        missingLinks.push(`UCA "${uca.code}" is not linked to any hazards`);
      }

      const hasDownstream = this.state.traceabilityLinks.some(
        link => link.sourceId === uca.id && link.targetType === 'scenario'
      );
      if (!hasDownstream) {
        missingLinks.push(`UCA "${uca.code}" has no causal scenarios`);
      }
    });

    return {
      isComplete: orphanedEntities.length === 0 && missingLinks.length === 0,
      orphanedEntities,
      missingLinks
    };
  }

  /**
   * Get traceability path between two entities
   */
  getTraceabilityPath(sourceId: string, targetId: string): TraceabilityNode[] {
    const path: TraceabilityNode[] = [];
    const visited = new Set<string>();

    const findPath = (currentId: string, targetId: string, currentPath: string[]): string[] | null => {
      if (currentId === targetId) return currentPath;
      if (visited.has(currentId)) return null;
      
      visited.add(currentId);

      const downstreamLinks = this.state.traceabilityLinks.filter(
        link => link.sourceId === currentId
      );

      for (const link of downstreamLinks) {
        const result = findPath(link.targetId, targetId, [...currentPath, link.targetId]);
        if (result) return result;
      }

      return null;
    };

    const pathIds = findPath(sourceId, targetId, [sourceId]);
    if (pathIds) {
      pathIds.forEach(id => {
        const node = this.findTraceabilityNode(id);
        if (node) path.push(node);
      });
    }

    return path;
  }

  /**
   * Create a traceability node from an entity
   */
  private createTraceabilityNode(
    entityId: string,
    entityType: TraceabilityLink['sourceType']
  ): TraceabilityNode | null {
    let entity: any;
    let label: string;

    switch (entityType) {
      case 'loss':
        entity = this.state.losses.find(l => l.id === entityId);
        label = entity?.title || 'Unknown Loss';
        break;
      case 'hazard':
        entity = this.state.hazards.find(h => h.id === entityId);
        label = entity?.title || 'Unknown Hazard';
        break;
      case 'uca':
        entity = this.state.ucas.find(u => u.id === entityId);
        label = entity?.code || 'Unknown UCA';
        break;
      case 'ucca':
        entity = this.state.uccas.find(u => u.id === entityId);
        label = entity?.code || 'Unknown UCCA';
        break;
      case 'scenario':
        entity = this.state.scenarios.find(s => s.id === entityId);
        label = entity?.code || 'Unknown Scenario';
        break;
      case 'requirement':
        entity = this.state.requirements.find(r => r.id === entityId);
        label = entity?.code || 'Unknown Requirement';
        break;
      default:
        return null;
    }

    if (!entity) return null;

    return {
      id: entityId,
      type: entityType,
      label,
      data: entity,
      analysisStatus: this.getEntityAnalysisStatus(entity, entityType)
    };
  }

  /**
   * Find a traceability node by ID
   */
  private findTraceabilityNode(entityId: string): TraceabilityNode | null {
    // Try each entity type
    const types: TraceabilityLink['sourceType'][] = ['loss', 'hazard', 'uca', 'ucca', 'scenario', 'requirement'];
    
    for (const type of types) {
      const node = this.createTraceabilityNode(entityId, type);
      if (node) return node;
    }

    return null;
  }

  /**
   * Determine analysis status of an entity
   */
  private getEntityAnalysisStatus(
    entity: any,
    entityType: TraceabilityLink['sourceType']
  ): 'complete' | 'partial' | 'pending' {
    const hasDownstream = this.state.traceabilityLinks.some(
      link => link.sourceId === entity.id
    );
    const hasUpstream = this.state.traceabilityLinks.some(
      link => link.targetId === entity.id
    );

    if (entityType === 'loss' && hasDownstream) return 'complete';
    if (entityType === 'requirement' && hasUpstream) return 'complete';
    if (hasUpstream && hasDownstream) return 'complete';
    if (hasUpstream || hasDownstream) return 'partial';
    return 'pending';
  }
}

// Global state manager instance
export const analysisStateManager = new AnalysisStateManager();
export const stateManager = analysisStateManager;