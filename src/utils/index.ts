// Utils barrel exports
export * from './collaboration';
export * from './constants';

// Export from apiClient but rename BatchOperation and BatchResult to avoid conflicts
export { 
  APIClient,
  createAPIClient,
  type BatchOperation as ApiBatchOperation,
  type BatchResult as ApiBatchResult,
  type APIConfig,
  type APIResponse,
  type PaginatedResponse,
  type QueryParams,
  type WebhookConfig,
  WebhookEvent
} from './apiClient';

export * from './auditTrail';
export * from './autoRecovery';

// Export from batchOperations with their own names
export {
  type BatchOperation,
  type BatchResult,
  type BatchItemResult,
  type BatchError,
  type UCAbatchCreateOptions,
  BatchOperationsManager,
  batchOperationsManager
} from './batchOperations';

export * from './completenessChecker';
export * from './controlStructureHierarchy';
export * from './errorHandling';
export * from './hardwareUCAIntegration';
export * from './importExport';
export * from './mitStpaCompliance';
export * from './performanceOptimizer';
export * from './reportExport';
export * from './reportGenerator';
export * from './riskScoring';
export * from './smartContextBuilder';
export * from './smartSearch';
export * from './smartUcaSuggestions';
export * from './stateManagement';
export * from './storageManager';
export * from './temporalLogic';
export * from './trainingMode';
export * from './ucaValidation';
