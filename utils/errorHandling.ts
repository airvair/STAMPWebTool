import { ValidationResult, ValidationError, ValidationWarning } from './ucaValidation';

// Enhanced error handling system to replace alert() calls
export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  timestamp: Date;
  additionalData?: Record<string, any>;
}

export interface UserFeedback {
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  actions?: UserAction[];
  autoClose?: boolean;
  duration?: number; // in milliseconds
}

export interface UserAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export class SafetyAnalysisError extends Error {
  public readonly code: string;
  public readonly severity: 'critical' | 'high' | 'medium' | 'low';
  public readonly context: ErrorContext;
  public readonly userFeedback: UserFeedback;

  constructor(
    code: string,
    message: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    context: ErrorContext,
    userFeedback?: Partial<UserFeedback>
  ) {
    super(message);
    this.name = 'SafetyAnalysisError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.userFeedback = {
      type: severity === 'critical' || severity === 'high' ? 'error' : 'warning',
      title: this.generateUserTitle(),
      message: this.generateUserMessage(),
      autoClose: severity === 'low',
      duration: severity === 'low' ? 5000 : undefined,
      ...userFeedback
    };
  }

  private generateUserTitle(): string {
    switch (this.severity) {
      case 'critical':
        return 'Critical Validation Error';
      case 'high':
        return 'Validation Error';
      case 'medium':
        return 'Validation Warning';
      case 'low':
        return 'Validation Notice';
      default:
        return 'Validation Issue';
    }
  }

  private generateUserMessage(): string {
    return this.message;
  }
}

export class ConcurrentModificationError extends SafetyAnalysisError {
  constructor(entityType: string, entityId: string, context: ErrorContext) {
    super(
      'CONCURRENT_MODIFICATION',
      `${entityType} ${entityId} was modified by another process`,
      'high',
      context,
      {
        title: 'Concurrent Modification Detected',
        message: `The ${entityType} you're editing has been modified by another user. Please refresh and try again.`,
        actions: [
          {
            label: 'Refresh Data',
            action: () => window.location.reload(),
            variant: 'primary'
          }
        ]
      }
    );
  }
}

export class ValidationErrorCollection extends Error {
  public readonly validationResult: ValidationResult;
  public readonly context: ErrorContext;

  constructor(validationResult: ValidationResult, context: ErrorContext) {
    const errorCount = validationResult.errors.length;
    const warningCount = validationResult.warnings.length;
    
    super(
      `Validation failed with ${errorCount} error(s) and ${warningCount} warning(s)`
    );
    
    this.name = 'ValidationErrorCollection';
    this.validationResult = validationResult;
    this.context = context;
  }

  public getUserFeedback(): UserFeedback {
    const { errors, warnings } = this.validationResult;
    const criticalErrors = errors.filter(e => e.severity === 'critical');
    const highErrors = errors.filter(e => e.severity === 'high');

    if (criticalErrors.length > 0) {
      return {
        type: 'error',
        title: 'Critical Validation Errors',
        message: this.formatErrorsForUser(criticalErrors),
        actions: [
          {
            label: 'Fix Required Fields',
            action: () => this.focusFirstErrorField(),
            variant: 'primary'
          }
        ]
      };
    }

    if (highErrors.length > 0) {
      return {
        type: 'error',
        title: 'Validation Errors',
        message: this.formatErrorsForUser(highErrors),
        actions: [
          {
            label: 'Review Issues',
            action: () => this.focusFirstErrorField(),
            variant: 'primary'
          }
        ]
      };
    }

    if (warnings.length > 0) {
      return {
        type: 'warning',
        title: 'Validation Warnings',
        message: this.formatWarningsForUser(warnings),
        autoClose: true,
        duration: 10000
      };
    }

    return {
      type: 'success',
      title: 'Validation Passed',
      message: 'All validation checks passed successfully.',
      autoClose: true,
      duration: 3000
    };
  }

  private formatErrorsForUser(errors: ValidationError[]): string {
    if (errors.length === 1) {
      return errors[0].message;
    }

    return `Please fix the following issues:\n${errors.map((e, i) => 
      `${i + 1}. ${e.message}`
    ).join('\n')}`;
  }

  private formatWarningsForUser(warnings: ValidationWarning[]): string {
    if (warnings.length === 1) {
      const warning = warnings[0];
      return warning.recommendation ? 
        `${warning.message}\n\nRecommendation: ${warning.recommendation}` :
        warning.message;
    }

    return `Please review the following:\n${warnings.map((w, i) => 
      `${i + 1}. ${w.message}${w.recommendation ? ` (${w.recommendation})` : ''}`
    ).join('\n')}`;
  }

  private focusFirstErrorField(): void {
    const firstError = this.validationResult.errors[0];
    if (firstError.field) {
      // Try to focus the field with error
      const element = document.querySelector(`[name="${firstError.field}"], [data-field="${firstError.field}"]`);
      if (element && 'focus' in element) {
        (element as HTMLElement).focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}

/**
 * Enhanced error handler that provides professional feedback instead of alerts
 */
export class ErrorHandler {
  private static feedbackQueue: UserFeedback[] = [];
  private static listeners: ((feedback: UserFeedback) => void)[] = [];

  public static subscribe(listener: (feedback: UserFeedback) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public static handleError(error: Error, context: ErrorContext): void {
    console.error('[SafetyAnalysis Error]', {
      error,
      context,
      timestamp: new Date().toISOString()
    });

    let feedback: UserFeedback;

    if (error instanceof SafetyAnalysisError) {
      feedback = error.userFeedback;
    } else if (error instanceof ValidationErrorCollection) {
      feedback = error.getUserFeedback();
    } else {
      // Generic error handling
      feedback = {
        type: 'error',
        title: 'Unexpected Error',
        message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
        actions: [
          {
            label: 'Retry',
            action: () => window.location.reload(),
            variant: 'primary'
          }
        ]
      };
    }

    this.showFeedback(feedback);
  }

  public static handleValidationResult(
    result: ValidationResult, 
    context: ErrorContext
  ): boolean {
    if (!result.valid) {
      const error = new ValidationErrorCollection(result, context);
      this.handleError(error, context);
      return false;
    }

    // Show warnings if any
    if (result.warnings.length > 0) {
      const feedback: UserFeedback = {
        type: 'warning',
        title: 'Validation Warnings',
        message: result.warnings.map(w => 
          w.recommendation ? `${w.message} (${w.recommendation})` : w.message
        ).join('\n'),
        autoClose: true,
        duration: 8000
      };
      this.showFeedback(feedback);
    }

    return true;
  }

  public static showSuccess(message: string, title = 'Success'): void {
    this.showFeedback({
      type: 'success',
      title,
      message,
      autoClose: true,
      duration: 3000
    });
  }

  public static showInfo(message: string, title = 'Information'): void {
    this.showFeedback({
      type: 'info',
      title,
      message,
      autoClose: true,
      duration: 5000
    });
  }

  public static showFeedback(feedback: UserFeedback): void {
    this.feedbackQueue.push(feedback);
    this.listeners.forEach(listener => listener(feedback));
  }

  public static getFeedbackQueue(): UserFeedback[] {
    return [...this.feedbackQueue];
  }

  public static clearFeedback(): void {
    this.feedbackQueue = [];
  }
}

/**
 * React hook for handling errors in components
 */
export const useErrorHandler = () => {
  const handleError = (error: Error, component: string, action: string) => {
    const context: ErrorContext = {
      component,
      action,
      timestamp: new Date(),
      additionalData: {
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    ErrorHandler.handleError(error, context);
  };

  const validateAndHandle = (
    result: ValidationResult,
    component: string,
    action: string
  ): boolean => {
    const context: ErrorContext = {
      component,
      action,
      timestamp: new Date()
    };

    return ErrorHandler.handleValidationResult(result, context);
  };

  const showSuccess = (message: string, title?: string) => {
    ErrorHandler.showSuccess(message, title);
  };

  const showInfo = (message: string, title?: string) => {
    ErrorHandler.showInfo(message, title);
  };

  return {
    handleError,
    validateAndHandle,
    showSuccess,
    showInfo
  };
};

/**
 * Utility function to create error context easily
 */
export const createErrorContext = (
  component: string,
  action: string,
  additionalData?: Record<string, any>
): ErrorContext => ({
  component,
  action,
  timestamp: new Date(),
  additionalData
});

/**
 * Professional replacement for alert() calls
 */
export const professionalAlert = (
  message: string,
  type: 'error' | 'warning' | 'info' = 'info',
  title?: string
): void => {
  const feedback: UserFeedback = {
    type,
    title: title || (type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information'),
    message,
    autoClose: type !== 'error',
    duration: type === 'error' ? undefined : 5000
  };

  ErrorHandler.showFeedback(feedback);
};

// Type guards for error handling
export const isSafetyAnalysisError = (error: any): error is SafetyAnalysisError => {
  return error instanceof SafetyAnalysisError;
};

export const isValidationErrorCollection = (error: any): error is ValidationErrorCollection => {
  return error instanceof ValidationErrorCollection;
};

export const isConcurrentModificationError = (error: any): error is ConcurrentModificationError => {
  return error instanceof ConcurrentModificationError;
};