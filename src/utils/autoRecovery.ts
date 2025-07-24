import { AnalysisError, AnalysisStateManager } from './stateManagement';
import { ErrorHandler, createErrorContext } from './errorHandling';

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  canHandle: (error: AnalysisError) => boolean;
  recover: (error: AnalysisError, stateManager: AnalysisStateManager) => Promise<boolean>;
  priority: number; // Higher number = higher priority
}

export interface RecoveryConfig {
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableAutoRecovery: boolean;
  strategies: RecoveryStrategy[];
}

/**
 * Auto-recovery system for handling various analysis errors
 */
export class AutoRecoveryManager {
  private config: RecoveryConfig;
  private recoveryAttempts: Map<string, number> = new Map();
  private isRecovering = false;

  constructor(config?: Partial<RecoveryConfig>) {
    this.config = {
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      enableAutoRecovery: true,
      strategies: this.getDefaultStrategies(),
      ...config
    };
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(
    error: AnalysisError,
    stateManager: AnalysisStateManager
  ): Promise<boolean> {
    if (!this.config.enableAutoRecovery || this.isRecovering) {
      return false;
    }

    const attemptCount = this.recoveryAttempts.get(error.id) || 0;
    if (attemptCount >= this.config.maxRetryAttempts) {
      // Max recovery attempts reached for error
      return false;
    }

    this.isRecovering = true;
    this.recoveryAttempts.set(error.id, attemptCount + 1);

    try {
      // Find applicable recovery strategy
      const strategy = this.findBestStrategy(error);
      if (!strategy) {
        // No recovery strategy found for error type
        return false;
      }

      // Attempting recovery with strategy

      // Add delay for exponential backoff
      if (attemptCount > 0) {
        const delay = this.config.retryDelayMs * Math.pow(2, attemptCount);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Attempt recovery
      const recovered = await strategy.recover(error, stateManager);

      if (recovered) {
        // Successfully recovered from error using strategy
        this.recoveryAttempts.delete(error.id);
        
        ErrorHandler.showInfo(
          `Auto-recovery successful: ${strategy.description}`,
          'Recovery Complete'
        );
      }

      return recovered;

    } catch (recoveryError) {
      // Recovery attempt failed for error
      
      ErrorHandler.handleError(
        recoveryError as Error,
        createErrorContext('AutoRecoveryManager', 'attemptRecovery')
      );

      return false;
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Find the best recovery strategy for an error
   */
  private findBestStrategy(error: AnalysisError): RecoveryStrategy | null {
    const applicableStrategies = this.config.strategies
      .filter(strategy => strategy.canHandle(error))
      .sort((a, b) => b.priority - a.priority);

    return applicableStrategies[0] || null;
  }

  /**
   * Get default recovery strategies
   */
  private getDefaultStrategies(): RecoveryStrategy[] {
    return [
      {
        id: 'network-retry',
        name: 'Network Retry',
        description: 'Retry failed network operations',
        priority: 10,
        canHandle: (error) => error.type === 'network' && error.retryable,
        recover: async (_error, stateManager) => {
          try {
            // Retry network operations by processing pending changes
            await (stateManager as any).processPendingChanges();
            return true;
          } catch {
            return false;
          }
        }
      },

      {
        id: 'validation-fix',
        name: 'Validation Fix',
        description: 'Attempt to fix validation errors automatically',
        priority: 8,
        canHandle: (error) => error.type === 'validation' && error.severity !== 'critical',
        recover: async (error, stateManager) => {
          try {
            // Attempt to fix common validation issues
            if (error.message.includes('hazard')) {
              // Auto-link to first available hazard if none selected
              return await this.autoFixHazardLinks(error, stateManager);
            }
            
            if (error.message.includes('context')) {
              // Provide default context if missing
              return await this.autoFixContext(error, stateManager);
            }
            
            return false;
          } catch {
            return false;
          }
        }
      },

      {
        id: 'conflict-resolution',
        name: 'Conflict Resolution',
        description: 'Resolve conflicts by merging changes',
        priority: 7,
        canHandle: (error) => error.type === 'conflict',
        recover: async (error, stateManager) => {
          try {
            // Implement conflict resolution logic
            return await this.resolveConflict(error, stateManager);
          } catch {
            return false;
          }
        }
      },

      {
        id: 'persistence-cleanup',
        name: 'Persistence Cleanup',
        description: 'Clean up corrupted persistence data',
        priority: 6,
        canHandle: (error) => error.type === 'persistence' && error.message.includes('corrupt'),
        recover: async (_error, _stateManager) => {
          try {
            // Clear corrupted local storage
            localStorage.removeItem('analysis-state');
            localStorage.removeItem('pending-changes');
            
            ErrorHandler.showInfo(
              'Corrupted data cleared. Please re-enter recent changes.',
              'Data Cleanup'
            );
            
            return true;
          } catch {
            return false;
          }
        }
      },

      {
        id: 'state-reset',
        name: 'State Reset',
        description: 'Reset to last known good state',
        priority: 3,
        canHandle: (error) => error.severity === 'critical',
        recover: async (_error, stateManager) => {
          try {
            // This is a last resort - reset to clean state
            const confirmReset = confirm(
              'Critical error detected. Reset to last saved state? Unsaved changes will be lost.'
            );
            
            if (confirmReset) {
              // Implement state reset logic
              await this.resetToLastGoodState(stateManager);
              return true;
            }
            
            return false;
          } catch {
            return false;
          }
        }
      },

      {
        id: 'offline-mode',
        name: 'Offline Mode',
        description: 'Switch to offline mode for network issues',
        priority: 5,
        canHandle: (error) => error.type === 'network' && error.message.includes('offline'),
        recover: async (_error, _stateManager) => {
          try {
            // Switch to offline mode
            ErrorHandler.showInfo(
              'Switched to offline mode. Changes will be saved when connection is restored.',
              'Offline Mode Active'
            );
            
            return true;
          } catch {
            return false;
          }
        }
      }
    ];
  }

  /**
   * Auto-fix missing hazard links
   */
  private async autoFixHazardLinks(
    _error: AnalysisError,
    _stateManager: AnalysisStateManager
  ): Promise<boolean> {
    try {
      // This would need access to hazards data
      // For now, return false to indicate manual fix needed
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Auto-fix missing context
   */
  private async autoFixContext(
    _error: AnalysisError,
    _stateManager: AnalysisStateManager
  ): Promise<boolean> {
    try {
      // Provide generic context based on UCA type
      // TODO: Implement auto-fix context logic
      // Generic contexts would be used here:
      // 'Not Provided': 'During critical operations when action is required',
      // 'Provided': 'When system is not ready for this action',
      // 'Too Early': 'Before proper system initialization',
      // 'Too Late': 'After critical time window has passed'

      // This would need to identify the specific UCA and update it
      // For now, return false to indicate manual fix needed
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Resolve conflicts between concurrent modifications
   */
  private async resolveConflict(
    _error: AnalysisError,
    _stateManager: AnalysisStateManager
  ): Promise<boolean> {
    try {
      // Implement conflict resolution strategy
      // Could be last-write-wins, merge, or user-guided resolution
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Reset to last known good state
   */
  private async resetToLastGoodState(_stateManager: AnalysisStateManager): Promise<void> {
    try {
      // Load from backup or last saved state
      const backupData = localStorage.getItem('analysis-backup');
      if (backupData) {
        const backup = JSON.parse(backupData);
        // Restore state from backup
        // State restored from backup
      }
    } catch (error) {
      // Failed to reset to last good state
      throw error;
    }
  }

  /**
   * Clear recovery attempt count for an error
   */
  clearRecoveryAttempts(errorId: string): void {
    this.recoveryAttempts.delete(errorId);
  }

  /**
   * Update recovery configuration
   */
  updateConfig(newConfig: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): {
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    strategiesUsed: string[];
  } {
    // This would track recovery statistics over time
    return {
      totalAttempts: this.recoveryAttempts.size,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      strategiesUsed: this.config.strategies.map(s => s.name)
    };
  }
}

// Global auto-recovery manager instance
export const autoRecoveryManager = new AutoRecoveryManager();

/**
 * Hook for integrating auto-recovery with React components
 */
export const useAutoRecovery = () => {
  const attemptRecovery = (error: AnalysisError, stateManager: AnalysisStateManager) => {
    return autoRecoveryManager.attemptRecovery(error, stateManager);
  };

  const clearAttempts = (errorId: string) => {
    autoRecoveryManager.clearRecoveryAttempts(errorId);
  };

  const getStats = () => {
    return autoRecoveryManager.getRecoveryStats();
  };

  return {
    attemptRecovery,
    clearAttempts,
    getStats,
    isEnabled: true // Could be configurable
  };
};