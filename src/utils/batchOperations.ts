/**
 * Batch Operations for UCAs
 * Enables efficient bulk creation, update, and deletion operations
 */

import { 
  UnsafeControlAction, 
  Controller, 
  ControlAction, 
  // Hazard,
  UCAType
} from '@/types/types';
import { v4 as uuidv4 } from 'uuid';

export interface BatchOperation<T> {
  type: 'create' | 'update' | 'delete';
  items: T[];
  metadata?: {
    reason?: string;
    timestamp?: Date;
    userId?: string;
  };
}

export interface BatchResult<T> {
  success: boolean;
  processed: number;
  failed: number;
  results: BatchItemResult<T>[];
  errors: BatchError[];
}

export interface BatchItemResult<T> {
  item: T;
  success: boolean;
  error?: string;
  id?: string;
}

export interface BatchError {
  itemIndex: number;
  error: string;
  item?: any;
}

export interface UCAbatchCreateOptions {
  controllers: Controller[];
  controlActions: ControlAction[];
  ucaTypes: UCAType[];
  hazardIds?: string[];
  contextTemplate?: string;
  autoGenerateCode?: boolean;
  skipExisting?: boolean;
}


/**
 * Batch Operations Manager
 */
export class BatchOperationsManager {
  
  /**
   * Batch create UCAs based on systematic analysis
   */
  async batchCreateUCAs(
    options: UCAbatchCreateOptions,
    existingUCAs: UnsafeControlAction[]
  ): Promise<BatchResult<UnsafeControlAction>> {
    const results: BatchItemResult<UnsafeControlAction>[] = [];
    const errors: BatchError[] = [];
    let processed = 0;
    let failed = 0;

    try {
      // Generate all combinations
      const combinations = this.generateUCACombinations(options);
      
      for (let i = 0; i < combinations.length; i++) {
        const combo = combinations[i];
        
        try {
          // Check if already exists
          if (options.skipExisting && this.ucaExists(combo, existingUCAs)) {
            results.push({
              item: combo as UnsafeControlAction,
              success: false,
              error: 'UCA already exists'
            });
            failed++;
            continue;
          }

          // Validate the UCA
          const validation = this.validateUCA(combo);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          // Create the UCA
          const newUCA = {
            ...combo,
            id: uuidv4(),
            code: options.autoGenerateCode ? this.generateUCACode(combo, processed + 1) : combo.code || ''
          } as UnsafeControlAction;

          results.push({
            item: newUCA,
            success: true,
            id: newUCA.id
          });
          processed++;

        } catch (error) {
          errors.push({
            itemIndex: i,
            error: error instanceof Error ? error.message : 'Unknown error',
            item: combo
          });
          results.push({
            item: combo as any,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          failed++;
        }
      }

      return {
        success: failed === 0,
        processed,
        failed,
        results,
        errors
      };

    } catch (error) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        results: [],
        errors: [{
          itemIndex: -1,
          error: error instanceof Error ? error.message : 'Batch operation failed'
        }]
      };
    }
  }


  /**
   * Batch update UCAs
   */
  async batchUpdateUCAs(
    ucas: UnsafeControlAction[],
    updates: Partial<UnsafeControlAction>
  ): Promise<BatchResult<UnsafeControlAction>> {
    const results: BatchItemResult<UnsafeControlAction>[] = [];
    const errors: BatchError[] = [];
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < ucas.length; i++) {
      const uca = ucas[i];

      try {
        const updatedUCA = {
          ...uca,
          ...updates,
          id: uca.id // Preserve ID
        };

        // Validate the updated UCA
        const validation = this.validateUCA(updatedUCA);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        results.push({
          item: updatedUCA,
          success: true,
          id: updatedUCA.id
        });
        processed++;

      } catch (error) {
        errors.push({
          itemIndex: i,
          error: error instanceof Error ? error.message : 'Update failed',
          item: uca
        });
        results.push({
          item: uca,
          success: false,
          error: error instanceof Error ? error.message : 'Update failed'
        });
        failed++;
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      results,
      errors
    };
  }

  /**
   * Batch delete items
   */
  async batchDelete<T extends { id: string }>(
    items: T[]
  ): Promise<BatchResult<T>> {
    const results: BatchItemResult<T>[] = [];
    const errors: BatchError[] = [];

    // In a real implementation, this would handle actual deletion
    // For now, we'll simulate successful deletion
    items.forEach((item, _index) => {
      results.push({
        item,
        success: true,
        id: item.id
      });
    });

    return {
      success: true,
      processed: items.length,
      failed: 0,
      results,
      errors
    };
  }

  /**
   * Generate UCA combinations based on options
   */
  private generateUCACombinations(options: UCAbatchCreateOptions): Partial<UnsafeControlAction>[] {
    const combinations: Partial<UnsafeControlAction>[] = [];

    for (const controller of options.controllers) {
      const controllerActions = options.controlActions.filter(
        ca => ca.controllerId === controller.id
      );

      for (const action of controllerActions) {
        for (const ucaType of options.ucaTypes) {
          const context = this.generateContext(
            options.contextTemplate,
            controller,
            action,
            ucaType
          );

          combinations.push({
            controllerId: controller.id,
            controlActionId: action.id,
            ucaType,
            description: this.generateUCADescription(controller, action, ucaType),
            context,
            hazardIds: options.hazardIds || []
          });
        }
      }
    }

    return combinations;
  }


  /**
   * Generate context from template
   */
  private generateContext(
    template: string | undefined,
    controller: Controller,
    action: ControlAction,
    ucaType: UCAType
  ): string {
    if (!template) {
      return this.getDefaultContext(ucaType);
    }

    return template
      .replace('{controller}', controller.name)
      .replace('{action}', `${action.verb} ${action.object}`)
      .replace('{ucaType}', ucaType);
  }


  /**
   * Generate UCA description
   */
  private generateUCADescription(
    controller: Controller,
    action: ControlAction,
    ucaType: UCAType
  ): string {
    const actionText = `${action.verb} ${action.object}`;

    switch (ucaType) {
      case UCAType.NotProvided:
        return `${controller.name} does not provide ${actionText} when required`;
      case UCAType.ProvidedUnsafe:
        return `${controller.name} provides ${actionText} when unsafe`;
      case UCAType.TooEarly:
        return `${controller.name} provides ${actionText} too early`;
      case UCAType.TooLate:
        return `${controller.name} provides ${actionText} too late`;
      case UCAType.WrongOrder:
        return `${controller.name} provides ${actionText} in wrong order`;
      case UCAType.TooLong:
        return `${controller.name} provides ${actionText} for too long`;
      case UCAType.TooShort:
        return `${controller.name} provides ${actionText} for too short`;
      default:
        return `${controller.name} ${actionText} - ${ucaType}`;
    }
  }


  /**
   * Get default context for UCA type
   */
  private getDefaultContext(ucaType: UCAType): string {
    const contexts: Record<UCAType, string> = {
      [UCAType.NotProvided]: 'When system conditions require the control action',
      [UCAType.ProvidedUnsafe]: 'When providing the control action creates hazardous conditions',
      [UCAType.TooEarly]: 'Before required preconditions are satisfied',
      [UCAType.TooLate]: 'After the safe time window has passed',
      [UCAType.WrongOrder]: 'When action sequence requirements are violated',
      [UCAType.TooLong]: 'When extended duration exceeds safe limits',
      [UCAType.TooShort]: 'When insufficient duration prevents desired effect'
    };

    return contexts[ucaType] || 'Under specific conditions';
  }

  /**
   * Generate UCA code
   */
  private generateUCACode(uca: Partial<UnsafeControlAction>, index: number): string {
    const typePrefix = {
      [UCAType.NotProvided]: 'NP',
      [UCAType.ProvidedUnsafe]: 'PU',
      [UCAType.TooEarly]: 'TE',
      [UCAType.TooLate]: 'TL',
      [UCAType.WrongOrder]: 'WO',
      [UCAType.TooLong]: 'TLG',
      [UCAType.TooShort]: 'TS'
    };

    const prefix = typePrefix[uca.ucaType!] || 'UCA';
    return `${prefix}-${String(index).padStart(3, '0')}`;
  }


  /**
   * Check if UCA already exists
   */
  private ucaExists(uca: Partial<UnsafeControlAction>, existing: UnsafeControlAction[]): boolean {
    return existing.some(e =>
      e.controllerId === uca.controllerId &&
      e.controlActionId === uca.controlActionId &&
      e.ucaType === uca.ucaType
    );
  }


  /**
   * Validate UCA
   */
  private validateUCA(uca: Partial<UnsafeControlAction>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!uca.controllerId) errors.push('Controller ID is required');
    if (!uca.controlActionId) errors.push('Control Action ID is required');
    if (!uca.ucaType) errors.push('UCA Type is required');
    if (!uca.description || uca.description.length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    if (!uca.context || uca.context.length < 10) {
      errors.push('Context must be at least 10 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }


  /**
   * Export batch results to CSV
   */
  exportBatchResultsToCSV<T>(result: BatchResult<T>, filename: string): void {
    const csvRows: string[] = [];
    
    // Header
    csvRows.push('Status,Item ID,Error,Details');
    
    // Data rows
    result.results.forEach((itemResult, _index) => {
      const status = itemResult.success ? 'Success' : 'Failed';
      const id = itemResult.id || 'N/A';
      const error = itemResult.error || '';
      const details = JSON.stringify(itemResult.item).replace(/"/g, '""');
      
      csvRows.push(`"${status}","${id}","${error}","${details}"`);
    });

    // Create and download CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const batchOperationsManager = new BatchOperationsManager();