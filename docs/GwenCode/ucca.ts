import { Newtype, newtype } from "./minewt";
import { DisjointSet } from "./disjointset";

// Using wren's type-safe newtypes.
// See https://github.com/kanwren/minewt/tree/master
export type Controller = Newtype<string, { readonly _: unique symbol; }>;
export const Controller = newtype<Controller>();

export type Action = Newtype<string, { readonly _: unique symbol; }>;
export const Action = newtype<Action>();

/**
 * Union type of all four cases of UCCAs.
 *
 * Each type case defines a "uccaType" field typed to a string constant, for pattern matching.
 * For a detailed explanation on discriminating union types, see:
 * https://angelogentileiii.medium.com/pattern-matching-how-discriminated-unions-enhance-your-typescript-development-cef417ef8b01
 *
 * See Kopeikin (2024) Table 4-14 on page 102, with further explanations on page 93.
 */
export type UCCA = ProvidedActionsUCCA | ProvidedSharedActionsUCCA | TemporalActionsUCCA | TemporalSharedActionsUCCA;
export type TemporalActionState = "starts" | "ends";
export type ProvidedActionState = "provided" | "not provided";
export type ActionState = TemporalActionState | ProvidedActionState;

/** Abstraction type 2a (p.93). Is assumed to be in the context of a specifical controller team. */
export interface Abstraction2a<S extends ActionState> {
  abstractionType: "2a";
  action: Action;
  otherActions: Set<Action>;
  /** The state the `action` is set to (provided, not provided, starts, ends). */
  actionState: S;
  /** The state at least one of the `otherActions` is set to. */
  otherActionsState: S;
}

/** Abstraction type 2b (p.93). */
export interface Abstraction2b<S extends ActionState> {
  abstractionType: "2b";
  action: Action;
  controller: Controller;
  otherControllers: Set<Controller>;
  /** The state the `action` is set to for the `controller` (provided, not provided, starts, ends). */
  actionState: S;
  /** The state the `action` is set to for at least one of the `otherControllers`. */
  otherActionsState: S;
}

/** UCCA Abstraction 2a cases 1-2; see Kopeikin (2024) p.93 */
export interface ProvidedActionsUCCA extends Abstraction2a<ProvidedActionState> {
  type: "2a. 1-2";
  uccaTypes: "1-2";
}

export interface ProvidedSharedActionsUCCA extends Abstraction2b<ProvidedActionState> {
  type: "2b. 1-2";
  uccaTypes: "1-2";
}

export interface TemporalActionsUCCA extends Abstraction2a<TemporalActionState> {
  type: "2a. 3-4";
  uccaTypes: "3-4";
}

export interface TemporalSharedActionsUCCA extends Abstraction2b<TemporalActionState> {
  type: "2b. 3-4";
  uccaTypes: "3-4";
}

export interface ActionProps {
  id: Action;
  discrete: boolean;
}

/** As defined on Kopeikin p.101 */
export interface AuthorityTuple {
  controllers: Map<Controller, Set<Action>>,
  actions: Map<Action, ActionProps>,
}

/**
 * Manages state for implementing the UCCA Identification Algorithm (Kopeikin 2024 p.100).
 *
 * This should be executed for a single controller team at a time (a controller team is a set of
 * controllers which share control of at least one process).
 */
class UCCAIdentificationAlgorithm {
  private authority: AuthorityTuple;
  private interchangeable: DisjointSet<Controller>;
  private actionToControllers = new Map<Action, Set<Controller>>();

  constructor(
    authority: AuthorityTuple,
    interchangeable: DisjointSet<Controller>,
  ) {
    this.authority = authority;
    this.interchangeable = interchangeable;

    this.validateInputs();
    this.initialize();
  }

  private validateInputs() {
    const errors: string[] = [];
    const controllerActions = new Set<Action>();
    this.authority.controllers.forEach((actions: Set<Action>, controller: Controller) => {
      actions.forEach((action: Action) => {
        controllerActions.add(action);
        if (!this.authority.actions.has(action)) {
          errors.push(`No action properties provided for ${action}, but was given in controller ${controller}.`);
        }
      })
    });

    this.authority.actions.forEach((props: ActionProps, action: Action) => {
      if (!controllerActions.has(action)) {
        errors.push(`No controller defines action ${action}`);
      }
    });
    if (errors.length > 0) {
      throw new Error(errors.join(" \n"));
    }
  }

  private initialize() {
    this.authority.controllers.forEach((actions: Set<Action>, controller: Controller) => {
      actions.forEach((action: Action) => {
        if (!this.actionToControllers.has(action)) {
          const set = new Set<Controller>();
          set.add(controller);
          this.actionToControllers.set(action, set);
          return;
        }
        const set = this.actionToControllers.get(action);
        set.add(controller);
      });
    });
  }

  /** As per Table 4-14, p.102 */
  private enumerateCombinations(accept: (ucca: UCCA) => void) {
    const providedStates: ProvidedActionState[] = ["provided", "not provided"];
    const temporalStates: TemporalActionState[] = ["starts", "ends"];

    this.authority.actions.forEach((props: ActionProps, action: Action) => {
      const otherActions = new Set<Action>();
      this.authority.actions.forEach((_, other: Action) => {
        if (other !== action) {
          otherActions.add(other);
        }
      });

      // Row 1; 4 cases
      for (const state of providedStates) {
        for (const otherState of providedStates) {
          accept({
            abstractionType: "2a",
            uccaTypes: "1-2",
            type: "2a. 1-2",
            action,
            otherActions,
            actionState: state,
            otherActionsState: otherState,
          });
        }
      }

      // Row 3; 8 cases
      const otherContinuousActions = new Set<Action>(Array.from(otherActions)
        .filter(a => !this.authority.actions.get(a).discrete));
      temporalStates.forEach(actionState => {
        temporalStates.forEach(otherActionsState => {
          const oa = otherActionsState == "ends"
            ? otherContinuousActions : otherActions;
          if (oa.size === 0) {
            return;
          }
          accept({
            type: "2a. 3-4",
            uccaTypes: "3-4",
            abstractionType: "2a",
            action,
            actionState,
            otherActions: oa,
            otherActionsState,
          });
        });
      });

      const controllers = this.actionToControllers.get(action);
      controllers.forEach((controller: Controller) => {
        const otherControllers = new Set<Controller>();
        controllers.forEach((other: Controller) => {
          if (other !== controller) {
            otherControllers.add(other);
          }
        });
        const base = {
          abstractionType: "2b" as "2b", // NB: funky "as ..." is working around limitations of tsc's type inference.
          uccaTypes: "1-2" as "1-2",
          type: "2b. 1-2" as "2b. 1-2",
          action,
          controller,
          otherControllers,
        };
        // Row 2; 3 cases
        accept({
          ...base,
          actionState: "not provided",
          otherActionsState: "not provided",
        });
        for (const otherActionsState of providedStates) {
          accept({
            ...base,
            actionState: "provided",
            otherActionsState,
          });
        }

        // Row 4; 4 cases
        temporalStates.forEach(actionState => {
          temporalStates.forEach(otherActionsState => {
            accept({
              type: "2b. 3-4",
              uccaTypes: "3-4",
              abstractionType: "2b",
              action,
              controller,
              otherControllers,
              actionState,
              otherActionsState,
            });
          });
        });
      });
    });
  }
}

