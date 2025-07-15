/**
 * Temporal Logic Formulations for Type 3-4 UCCAs
 * Implements Linear Temporal Logic (LTL) for analyzing timing-related unsafe control actions
 */

import { ControlAction, Controller, UCCA } from '@/types/types';

export enum TemporalOperator {
  // Basic LTL operators
  Next = 'X',          // Next state
  Eventually = 'F',    // Eventually (future)
  Always = 'G',        // Always (globally)
  Until = 'U',         // Until
  WeakUntil = 'W',     // Weak until
  Release = 'R'        // Release
}

export enum TimingConstraint {
  TooEarly = 'too_early',
  TooLate = 'too_late',
  TooLong = 'too_long',
  TooShort = 'too_short',
  WrongOrder = 'wrong_order'
}

export interface TemporalFormula {
  id: string;
  operator: TemporalOperator;
  constraint: TimingConstraint;
  leftOperand: ControlActionProposition | TemporalFormula;
  rightOperand?: ControlActionProposition | TemporalFormula;
  timebound?: TimeConstraint;
  description: string;
}

export interface ControlActionProposition {
  controllerId: string;
  actionId: string;
  isProvided: boolean;
  timing?: number; // Milliseconds
}

export interface TimeConstraint {
  min?: number; // Minimum time in milliseconds
  max?: number; // Maximum time in milliseconds
  reference?: 'absolute' | 'relative';
}

export interface TemporalUCCA extends UCCA {
  temporalFormula: TemporalFormula;
  violationScenarios: ViolationScenario[];
}

export interface ViolationScenario {
  id: string;
  sequence: TimedEvent[];
  violatesFormula: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface TimedEvent {
  timestamp: number;
  controllerId: string;
  actionId: string;
  provided: boolean;
}

/**
 * Temporal Logic Engine for Type 3-4 UCCA Analysis
 */
export class TemporalLogicEngine {
  /**
   * Generate temporal formulas for Type 3-4 UCCAs
   */
  generateTemporalFormulas(
    controllers: Controller[],
    actions: ControlAction[],
    timingConstraint: TimingConstraint
  ): TemporalFormula[] {
    const formulas: TemporalFormula[] = [];

    switch (timingConstraint) {
      case TimingConstraint.TooEarly:
        formulas.push(...this.generateTooEarlyFormulas(controllers, actions));
        break;
      case TimingConstraint.TooLate:
        formulas.push(...this.generateTooLateFormulas(controllers, actions));
        break;
      case TimingConstraint.TooLong:
        formulas.push(...this.generateTooLongFormulas(controllers, actions));
        break;
      case TimingConstraint.TooShort:
        formulas.push(...this.generateTooShortFormulas(controllers, actions));
        break;
      case TimingConstraint.WrongOrder:
        formulas.push(...this.generateWrongOrderFormulas(controllers, actions));
        break;
    }

    return formulas;
  }

  /**
   * Generate formulas for "too early" timing violations
   */
  private generateTooEarlyFormulas(
    _controllers: Controller[],
    actions: ControlAction[]
  ): TemporalFormula[] {
    const formulas: TemporalFormula[] = [];

    // For each pair of actions that have a precedence relationship
    for (let i = 0; i < actions.length; i++) {
      for (let j = 0; j < actions.length; j++) {
        if (i === j) continue;

        const action1 = actions[i];
        const action2 = actions[j];

        // Check if action1 should precede action2
        if (this.hasPrecedenceRelation(action1, action2)) {
          const formula: TemporalFormula = {
            id: `too-early-${action1.id}-${action2.id}`,
            operator: TemporalOperator.Until,
            constraint: TimingConstraint.TooEarly,
            leftOperand: {
              controllerId: action2.controllerId,
              actionId: action2.id,
              isProvided: false
            },
            rightOperand: {
              controllerId: action1.controllerId,
              actionId: action1.id,
              isProvided: true
            },
            description: `${action2.verb} ${action2.object} must not be provided until ${action1.verb} ${action1.object} is provided`
          };

          formulas.push(formula);
        }
      }
    }

    return formulas;
  }

  /**
   * Generate formulas for "too late" timing violations
   */
  private generateTooLateFormulas(
    _controllers: Controller[],
    actions: ControlAction[]
  ): TemporalFormula[] {
    const formulas: TemporalFormula[] = [];

    // For actions with critical timing requirements
    actions.forEach(action => {
      if (this.isCriticalTiming(action)) {
        const formula: TemporalFormula = {
          id: `too-late-${action.id}`,
          operator: TemporalOperator.Eventually,
          constraint: TimingConstraint.TooLate,
          leftOperand: {
            controllerId: action.controllerId,
            actionId: action.id,
            isProvided: true
          },
          timebound: {
            max: this.getCriticalTimebound(action),
            reference: 'relative'
          },
          description: `${action.verb} ${action.object} must be provided within ${this.getCriticalTimebound(action)}ms`
        };

        formulas.push(formula);
      }
    });

    return formulas;
  }

  /**
   * Generate formulas for "too long" duration violations
   */
  private generateTooLongFormulas(
    _controllers: Controller[],
    actions: ControlAction[]
  ): TemporalFormula[] {
    const formulas: TemporalFormula[] = [];

    // For actions that should have limited duration
    actions.forEach(action => {
      if (this.hasMaxDuration(action)) {
        const formula: TemporalFormula = {
          id: `too-long-${action.id}`,
          operator: TemporalOperator.Always,
          constraint: TimingConstraint.TooLong,
          leftOperand: {
            controllerId: action.controllerId,
            actionId: action.id,
            isProvided: true
          },
          timebound: {
            max: this.getMaxDuration(action),
            reference: 'absolute'
          },
          description: `${action.verb} ${action.object} must not be applied for more than ${this.getMaxDuration(action)}ms`
        };

        formulas.push(formula);
      }
    });

    return formulas;
  }

  /**
   * Generate formulas for "too short" duration violations
   */
  private generateTooShortFormulas(
    _controllers: Controller[],
    actions: ControlAction[]
  ): TemporalFormula[] {
    const formulas: TemporalFormula[] = [];

    // For actions that require minimum duration
    actions.forEach(action => {
      if (this.hasMinDuration(action)) {
        const formula: TemporalFormula = {
          id: `too-short-${action.id}`,
          operator: TemporalOperator.Always,
          constraint: TimingConstraint.TooShort,
          leftOperand: {
            controllerId: action.controllerId,
            actionId: action.id,
            isProvided: true
          },
          timebound: {
            min: this.getMinDuration(action),
            reference: 'absolute'
          },
          description: `${action.verb} ${action.object} must be applied for at least ${this.getMinDuration(action)}ms`
        };

        formulas.push(formula);
      }
    });

    return formulas;
  }

  /**
   * Generate formulas for wrong order violations
   */
  private generateWrongOrderFormulas(
    _controllers: Controller[],
    actions: ControlAction[]
  ): TemporalFormula[] {
    const formulas: TemporalFormula[] = [];

    // For action sequences that must occur in specific order
    const sequences = this.identifyActionSequences(actions);

    sequences.forEach(sequence => {
      for (let i = 0; i < sequence.length - 1; i++) {
        const currentAction = sequence[i];
        const nextAction = sequence[i + 1];

        const formula: TemporalFormula = {
          id: `wrong-order-${currentAction.id}-${nextAction.id}`,
          operator: TemporalOperator.Next,
          constraint: TimingConstraint.WrongOrder,
          leftOperand: {
            controllerId: currentAction.controllerId,
            actionId: currentAction.id,
            isProvided: true
          },
          rightOperand: {
            controllerId: nextAction.controllerId,
            actionId: nextAction.id,
            isProvided: true
          },
          description: `${nextAction.verb} ${nextAction.object} must follow ${currentAction.verb} ${currentAction.object}`
        };

        formulas.push(formula);
      }
    });

    return formulas;
  }

  /**
   * Evaluate a temporal formula against a sequence of events
   */
  evaluateFormula(
    formula: TemporalFormula,
    events: TimedEvent[]
  ): { satisfied: boolean; violations: ViolationScenario[] } {
    const violations: ViolationScenario[] = [];
    let satisfied = true;

    switch (formula.operator) {
      case TemporalOperator.Until:
        satisfied = this.evaluateUntil(formula, events, violations);
        break;
      case TemporalOperator.Eventually:
        satisfied = this.evaluateEventually(formula, events, violations);
        break;
      case TemporalOperator.Always:
        satisfied = this.evaluateAlways(formula, events, violations);
        break;
      case TemporalOperator.Next:
        satisfied = this.evaluateNext(formula, events, violations);
        break;
    }

    return { satisfied, violations };
  }

  /**
   * Evaluate Until operator: φ U ψ
   * φ must hold until ψ becomes true
   */
  private evaluateUntil(
    formula: TemporalFormula,
    events: TimedEvent[],
    violations: ViolationScenario[]
  ): boolean {
    const leftProp = formula.leftOperand as ControlActionProposition;
    const rightProp = formula.rightOperand as ControlActionProposition;

    let leftSatisfied = true;
    let rightOccurred = false;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Check if right operand is satisfied
      if (this.matchesProposition(event, rightProp)) {
        rightOccurred = true;
        break;
      }

      // Check if left operand is violated before right occurs
      if (!this.matchesProposition(event, leftProp)) {
        leftSatisfied = false;
        
        // Create violation scenario
        violations.push({
          id: `violation-${formula.id}-${i}`,
          sequence: events.slice(0, i + 1),
          violatesFormula: formula.id,
          severity: 'high',
          description: `${leftProp.actionId} was not maintained until ${rightProp.actionId}`
        });
        break;
      }
    }

    return leftSatisfied && rightOccurred;
  }

  /**
   * Evaluate Eventually operator: F φ
   * φ must become true at some point
   */
  private evaluateEventually(
    formula: TemporalFormula,
    events: TimedEvent[],
    violations: ViolationScenario[]
  ): boolean {
    const prop = formula.leftOperand as ControlActionProposition;
    const timebound = formula.timebound;

    let satisfied = false;
    const startTime = events[0]?.timestamp || 0;

    for (const event of events) {
      if (this.matchesProposition(event, prop)) {
        // Check timebound if specified
        if (timebound?.max && (event.timestamp - startTime) > timebound.max) {
          violations.push({
            id: `violation-${formula.id}-late`,
            sequence: events,
            violatesFormula: formula.id,
            severity: 'critical',
            description: `Action occurred ${event.timestamp - startTime}ms after trigger (max: ${timebound.max}ms)`
          });
          return false;
        }
        satisfied = true;
        break;
      }
    }

    if (!satisfied) {
      violations.push({
        id: `violation-${formula.id}-never`,
        sequence: events,
        violatesFormula: formula.id,
        severity: 'critical',
        description: `Required action never occurred`
      });
    }

    return satisfied;
  }

  /**
   * Evaluate Always operator: G φ
   * φ must hold in all states
   */
  private evaluateAlways(
    formula: TemporalFormula,
    events: TimedEvent[],
    violations: ViolationScenario[]
  ): boolean {
    const prop = formula.leftOperand as ControlActionProposition;
    const timebound = formula.timebound;
    
    let actionStartTime: number | null = null;
    let satisfied = true;

    for (const event of events) {
      if (this.matchesProposition(event, prop)) {
        if (!actionStartTime) {
          actionStartTime = event.timestamp;
        }

        // Check duration constraints
        if (timebound && actionStartTime) {
          const duration = event.timestamp - actionStartTime;
          
          if (timebound.max && duration > timebound.max) {
            violations.push({
              id: `violation-${formula.id}-duration`,
              sequence: events,
              violatesFormula: formula.id,
              severity: 'high',
              description: `Action duration ${duration}ms exceeds maximum ${timebound.max}ms`
            });
            satisfied = false;
          }
          
          if (timebound.min && !prop.isProvided && duration < timebound.min) {
            violations.push({
              id: `violation-${formula.id}-duration`,
              sequence: events,
              violatesFormula: formula.id,
              severity: 'high',
              description: `Action duration ${duration}ms below minimum ${timebound.min}ms`
            });
            satisfied = false;
          }
        }
      } else if (actionStartTime) {
        // Action stopped
        actionStartTime = null;
      }
    }

    return satisfied;
  }

  /**
   * Evaluate Next operator: X φ
   * φ must hold in the next state
   */
  private evaluateNext(
    formula: TemporalFormula,
    events: TimedEvent[],
    violations: ViolationScenario[]
  ): boolean {
    const leftProp = formula.leftOperand as ControlActionProposition;
    const rightProp = formula.rightOperand as ControlActionProposition;

    for (let i = 0; i < events.length - 1; i++) {
      const currentEvent = events[i];
      const nextEvent = events[i + 1];

      if (this.matchesProposition(currentEvent, leftProp)) {
        if (!this.matchesProposition(nextEvent, rightProp)) {
          violations.push({
            id: `violation-${formula.id}-${i}`,
            sequence: [currentEvent, nextEvent],
            violatesFormula: formula.id,
            severity: 'medium',
            description: `Expected ${rightProp.actionId} after ${leftProp.actionId}`
          });
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if an event matches a proposition
   */
  private matchesProposition(event: TimedEvent, prop: ControlActionProposition): boolean {
    return event.controllerId === prop.controllerId &&
           event.actionId === prop.actionId &&
           event.provided === prop.isProvided;
  }

  /**
   * Helper methods for domain-specific logic
   */
  private hasPrecedenceRelation(action1: ControlAction, action2: ControlAction): boolean {
    // Domain-specific precedence rules
    const precedenceRules = [
      { first: 'arm', second: 'launch' },
      { first: 'check', second: 'proceed' },
      { first: 'request', second: 'approve' },
      { first: 'initialize', second: 'operate' }
    ];

    return precedenceRules.some(rule =>
      action1.verb.toLowerCase().includes(rule.first) &&
      action2.verb.toLowerCase().includes(rule.second)
    );
  }

  private isCriticalTiming(action: ControlAction): boolean {
    const criticalKeywords = ['emergency', 'abort', 'stop', 'brake', 'eject'];
    return criticalKeywords.some(keyword =>
      action.verb.toLowerCase().includes(keyword) ||
      action.object.toLowerCase().includes(keyword)
    );
  }

  private getCriticalTimebound(action: ControlAction): number {
    // Return timebound in milliseconds based on criticality
    if (action.verb.toLowerCase().includes('emergency')) return 1000; // 1 second
    if (action.verb.toLowerCase().includes('abort')) return 2000; // 2 seconds
    return 5000; // 5 seconds default
  }

  private hasMaxDuration(action: ControlAction): boolean {
    const durationLimitedActions = ['hold', 'press', 'maintain', 'apply'];
    return durationLimitedActions.some(keyword =>
      action.verb.toLowerCase().includes(keyword)
    );
  }

  private getMaxDuration(action: ControlAction): number {
    // Return max duration in milliseconds
    if (action.verb.toLowerCase().includes('hold')) return 10000; // 10 seconds
    if (action.verb.toLowerCase().includes('press')) return 5000; // 5 seconds
    return 30000; // 30 seconds default
  }

  private hasMinDuration(action: ControlAction): boolean {
    const minDurationActions = ['warm', 'stabilize', 'charge', 'initialize'];
    return minDurationActions.some(keyword =>
      action.verb.toLowerCase().includes(keyword)
    );
  }

  private getMinDuration(action: ControlAction): number {
    // Return min duration in milliseconds
    if (action.verb.toLowerCase().includes('warm')) return 30000; // 30 seconds
    if (action.verb.toLowerCase().includes('stabilize')) return 10000; // 10 seconds
    return 5000; // 5 seconds default
  }

  private identifyActionSequences(actions: ControlAction[]): ControlAction[][] {
    // Identify common action sequences that must occur in order
    const sequences: ControlAction[][] = [];
    
    // Example: startup sequence
    const startupActions = actions.filter(a =>
      ['power', 'initialize', 'configure', 'start'].some(keyword =>
        a.verb.toLowerCase().includes(keyword)
      )
    );
    
    if (startupActions.length > 1) {
      sequences.push(startupActions);
    }

    // Example: shutdown sequence
    const shutdownActions = actions.filter(a =>
      ['stop', 'shutdown', 'power off'].some(keyword =>
        a.verb.toLowerCase().includes(keyword) || a.object.toLowerCase().includes(keyword)
      )
    );
    
    if (shutdownActions.length > 1) {
      sequences.push(shutdownActions.reverse());
    }

    return sequences;
  }

  /**
   * Generate natural language description of temporal formula
   */
  describeFormula(formula: TemporalFormula): string {
    const descriptions: Record<TimingConstraint, (f: TemporalFormula) => string> = {
      [TimingConstraint.TooEarly]: (f) => {
        const left = f.leftOperand as ControlActionProposition;
        const right = f.rightOperand as ControlActionProposition;
        return `Action ${left.actionId} must not occur before ${right.actionId}`;
      },
      [TimingConstraint.TooLate]: (f) => {
        const prop = f.leftOperand as ControlActionProposition;
        return `Action ${prop.actionId} must occur within ${f.timebound?.max}ms`;
      },
      [TimingConstraint.TooLong]: (f) => {
        const prop = f.leftOperand as ControlActionProposition;
        return `Action ${prop.actionId} must not last longer than ${f.timebound?.max}ms`;
      },
      [TimingConstraint.TooShort]: (f) => {
        const prop = f.leftOperand as ControlActionProposition;
        return `Action ${prop.actionId} must last at least ${f.timebound?.min}ms`;
      },
      [TimingConstraint.WrongOrder]: (f) => {
        const left = f.leftOperand as ControlActionProposition;
        const right = f.rightOperand as ControlActionProposition;
        return `Action ${right.actionId} must immediately follow ${left.actionId}`;
      }
    };

    return descriptions[formula.constraint]?.(formula) || formula.description;
  }
}

// Export singleton instance
export const temporalLogicEngine = new TemporalLogicEngine();