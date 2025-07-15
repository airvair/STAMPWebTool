import { Controller, ControlPath, SystemComponent } from '@/types/types';

interface ControllerLevel {
  level: number;
  controllers: Controller[];
}

interface ControllerWithHierarchy extends Controller {
  hierarchyLevel: number;
  sortOrder: number; // left to right ordering within level
}

/**
 * Determines the hierarchy level of controllers in the control structure.
 * Level 0 is the highest (no incoming control paths from other controllers)
 * Higher numbers are lower in the hierarchy
 */
export function analyzeControllerHierarchy(
  controllers: Controller[],
  controlPaths: ControlPath[],
  _systemComponents: SystemComponent[]
): ControllerWithHierarchy[] {
  // Create adjacency lists for the control structure graph
  const controllerGraph = new Map<string, Set<string>>();
  const reverseGraph = new Map<string, Set<string>>();
  
  // Initialize graphs
  controllers.forEach(ctrl => {
    controllerGraph.set(ctrl.id, new Set());
    reverseGraph.set(ctrl.id, new Set());
  });

  // Build the graph based on control paths
  controlPaths.forEach(path => {
    const sourceId = path.sourceControllerId;
    const targetId = path.targetId;
    
    // Only consider paths between controllers (not to system components)
    if (controllers.some(c => c.id === targetId)) {
      controllerGraph.get(sourceId)?.add(targetId);
      reverseGraph.get(targetId)?.add(sourceId);
    }
  });

  // Find hierarchy levels using topological sort approach
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  
  // DFS to find the maximum depth from top-level controllers
  function findDepth(controllerId: string): number {
    if (levels.has(controllerId)) {
      return levels.get(controllerId)!;
    }
    
    visited.add(controllerId);
    
    const parents = reverseGraph.get(controllerId) || new Set();
    if (parents.size === 0) {
      // Top-level controller (no incoming control paths from other controllers)
      levels.set(controllerId, 0);
      return 0;
    }
    
    let maxParentLevel = -1;
    parents.forEach(parentId => {
      const parentLevel = findDepth(parentId);
      maxParentLevel = Math.max(maxParentLevel, parentLevel);
    });
    
    const level = maxParentLevel + 1;
    levels.set(controllerId, level);
    return level;
  }

  // Calculate levels for all controllers
  controllers.forEach(ctrl => {
    if (!visited.has(ctrl.id)) {
      findDepth(ctrl.id);
    }
  });

  // Group controllers by level
  const levelGroups = new Map<number, Controller[]>();
  controllers.forEach(ctrl => {
    const level = levels.get(ctrl.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(ctrl);
  });

  // Sort controllers within each level (left to right based on x position if available)
  const result: ControllerWithHierarchy[] = [];
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => b - a); // Bottom to top
  
  sortedLevels.forEach(level => {
    const controllersAtLevel = levelGroups.get(level)!;
    
    // Sort by x position if available, otherwise by name
    controllersAtLevel.sort((a, b) => {
      if (a.x !== undefined && b.x !== undefined) {
        return a.x - b.x;
      }
      return a.name.localeCompare(b.name);
    });
    
    controllersAtLevel.forEach((ctrl, index) => {
      result.push({
        ...ctrl,
        hierarchyLevel: level,
        sortOrder: index
      });
    });
  });

  return result;
}

/**
 * Gets controllers starting from the bottom of the hierarchy, moving left to right
 */
export function getControllersBottomUp(
  controllers: Controller[],
  controlPaths: ControlPath[],
  systemComponents: SystemComponent[]
): Controller[] {
  const hierarchicalControllers = analyzeControllerHierarchy(controllers, controlPaths, systemComponents);
  return hierarchicalControllers.map(({ hierarchyLevel: _hierarchyLevel, sortOrder: _sortOrder, ...controller }) => controller);
}

/**
 * Groups controllers by their hierarchy level
 */
export function groupControllersByLevel(
  controllers: Controller[],
  controlPaths: ControlPath[],
  systemComponents: SystemComponent[]
): ControllerLevel[] {
  const hierarchicalControllers = analyzeControllerHierarchy(controllers, controlPaths, systemComponents);
  
  const levelMap = new Map<number, Controller[]>();
  hierarchicalControllers.forEach(ctrl => {
    if (!levelMap.has(ctrl.hierarchyLevel)) {
      levelMap.set(ctrl.hierarchyLevel, []);
    }
    levelMap.get(ctrl.hierarchyLevel)!.push(ctrl);
  });
  
  // Convert to array and sort by level (bottom to top)
  const levels: ControllerLevel[] = [];
  const sortedLevels = Array.from(levelMap.keys()).sort((a, b) => b - a);
  
  sortedLevels.forEach(level => {
    levels.push({
      level,
      controllers: levelMap.get(level)!
    });
  });
  
  return levels;
}

/**
 * Determines if a controller is at the bottom of the hierarchy
 * (has no outgoing control paths to other controllers)
 */
export function isBottomLevelController(
  controllerId: string,
  controllers: Controller[],
  controlPaths: ControlPath[]
): boolean {
  const outgoingPaths = controlPaths.filter(path => path.sourceControllerId === controllerId);
  
  // Check if any outgoing paths go to other controllers
  const hasControllerTargets = outgoingPaths.some(path => 
    controllers.some(ctrl => ctrl.id === path.targetId)
  );
  
  return !hasControllerTargets;
}

/**
 * Gets the next controller in the guided workflow sequence
 */
export function getNextController(
  currentControllerId: string | null,
  controllers: Controller[],
  controlPaths: ControlPath[],
  systemComponents: SystemComponent[]
): Controller | null {
  const orderedControllers = getControllersBottomUp(controllers, controlPaths, systemComponents);
  
  if (!currentControllerId) {
    return orderedControllers[0] || null;
  }
  
  const currentIndex = orderedControllers.findIndex(c => c.id === currentControllerId);
  if (currentIndex === -1 || currentIndex === orderedControllers.length - 1) {
    return null;
  }
  
  return orderedControllers[currentIndex + 1];
}

/**
 * Gets the next controller within the same hierarchy level (lateral movement)
 */
export function getNextControllerInLevel(
  currentControllerId: string,
  controllers: Controller[],
  controlPaths: ControlPath[],
  systemComponents: SystemComponent[]
): Controller | null {
  const hierarchicalControllers = analyzeControllerHierarchy(controllers, controlPaths, systemComponents);
  const currentController = hierarchicalControllers.find(c => c.id === currentControllerId);
  
  if (!currentController) return null;
  
  // Find controllers at the same level
  const controllersAtLevel = hierarchicalControllers.filter(c => 
    c.hierarchyLevel === currentController.hierarchyLevel
  ).sort((a, b) => a.sortOrder - b.sortOrder);
  
  const currentIndex = controllersAtLevel.findIndex(c => c.id === currentControllerId);
  if (currentIndex === -1 || currentIndex === controllersAtLevel.length - 1) {
    return null;
  }
  
  return controllersAtLevel[currentIndex + 1];
}

/**
 * Gets the first controller in the next hierarchy level (upward movement)
 */
export function getFirstControllerInNextLevel(
  currentHierarchyLevel: number,
  controllers: Controller[],
  controlPaths: ControlPath[],
  systemComponents: SystemComponent[]
): Controller | null {
  const hierarchicalControllers = analyzeControllerHierarchy(controllers, controlPaths, systemComponents);
  
  // Find the next level up (lower level number)
  const nextLevel = currentHierarchyLevel - 1;
  const controllersAtNextLevel = hierarchicalControllers.filter(c => 
    c.hierarchyLevel === nextLevel
  ).sort((a, b) => a.sortOrder - b.sortOrder);
  
  return controllersAtNextLevel[0] || null;
}

/**
 * Gets all controllers at a specific hierarchy level, sorted left to right
 */
export function getControllersAtLevel(
  level: number,
  controllers: Controller[],
  controlPaths: ControlPath[],
  systemComponents: SystemComponent[]
): Controller[] {
  const hierarchicalControllers = analyzeControllerHierarchy(controllers, controlPaths, systemComponents);
  
  return hierarchicalControllers
    .filter(c => c.hierarchyLevel === level)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ hierarchyLevel: _hierarchyLevel, sortOrder: _sortOrder, ...controller }) => controller);
}

/**
 * Gets the hierarchy level of a specific controller
 */
export function getControllerLevel(
  controllerId: string,
  controllers: Controller[],
  controlPaths: ControlPath[],
  systemComponents: SystemComponent[]
): number | null {
  const hierarchicalControllers = analyzeControllerHierarchy(controllers, controlPaths, systemComponents);
  const controller = hierarchicalControllers.find(c => c.id === controllerId);
  return controller?.hierarchyLevel ?? null;
}

/**
 * Advanced navigation for guided workflow - follows proper STPA methodology
 */
export function getNextControllerAdvanced(
  currentControllerId: string | null,
  controllers: Controller[],
  controlPaths: ControlPath[],
  systemComponents: SystemComponent[]
): { controller: Controller | null; movement: 'lateral' | 'upward' | 'complete' } {
  if (!currentControllerId) {
    const orderedControllers = getControllersBottomUp(controllers, controlPaths, systemComponents);
    return { 
      controller: orderedControllers[0] || null, 
      movement: 'lateral' 
    };
  }
  
  const currentLevel = getControllerLevel(currentControllerId, controllers, controlPaths, systemComponents);
  if (currentLevel === null) {
    return { controller: null, movement: 'complete' };
  }
  
  // Try lateral movement first (same level)
  const nextInLevel = getNextControllerInLevel(currentControllerId, controllers, controlPaths, systemComponents);
  if (nextInLevel) {
    return { controller: nextInLevel, movement: 'lateral' };
  }
  
  // Try upward movement (next level up)
  const nextLevelController = getFirstControllerInNextLevel(currentLevel, controllers, controlPaths, systemComponents);
  if (nextLevelController) {
    return { controller: nextLevelController, movement: 'upward' };
  }
  
  // No more controllers
  return { controller: null, movement: 'complete' };
}