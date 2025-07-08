/**
 * Version Control System for STPA Analysis
 * Tracks changes, enables history viewing, and supports branching/merging
 */

import { 
  Loss, 
  Hazard, 
  Controller, 
  ControlAction, 
  UnsafeControlAction, 
  UCCA,
  CausalScenario,
  Requirement
} from '@/types';
import { STAPAnalysisData } from './importExport';

export interface Version {
  id: string;
  version: string;
  parentVersion?: string;
  branch: string;
  timestamp: Date;
  author: {
    id: string;
    name: string;
    email?: string;
  };
  message: string;
  tags: string[];
  changes: ChangeSet;
  snapshot?: STAPAnalysisData; // Optional full snapshot for major versions
}

export interface ChangeSet {
  additions: EntityChange[];
  modifications: EntityChange[];
  deletions: EntityChange[];
  summary: {
    totalChanges: number;
    byEntityType: Record<string, number>;
  };
}

export interface EntityChange {
  entityType: EntityType;
  entityId: string;
  changeType: 'add' | 'modify' | 'delete';
  previousValue?: any;
  newValue?: any;
  path?: string[]; // For nested property changes
  timestamp: Date;
}

export enum EntityType {
  LOSS = 'loss',
  HAZARD = 'hazard',
  CONTROLLER = 'controller',
  CONTROL_ACTION = 'control_action',
  UCA = 'uca',
  UCCA = 'ucca',
  SCENARIO = 'scenario',
  REQUIREMENT = 'requirement'
}

export interface Branch {
  name: string;
  currentVersion: string;
  createdFrom: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
  };
  isProtected: boolean;
  description?: string;
}

export interface MergeConflict {
  entityType: EntityType;
  entityId: string;
  path?: string[];
  baseValue: any;
  currentValue: any;
  incomingValue: any;
  resolution?: 'current' | 'incoming' | 'manual';
  manualValue?: any;
}

export interface MergeResult {
  success: boolean;
  conflicts: MergeConflict[];
  merged: EntityChange[];
  version?: Version;
}

export interface DiffResult {
  changes: ChangeSet;
  statistics: {
    totalAdditions: number;
    totalModifications: number;
    totalDeletions: number;
    conflictingChanges: number;
  };
}

/**
 * Version Control Manager
 */
export class VersionControlManager {
  private versions = new Map<string, Version>();
  private branches = new Map<string, Branch>();
  private currentBranch = 'main';
  private currentVersion: string | null = null;
  private uncommittedChanges: EntityChange[] = [];
  private baseSnapshot: STAPAnalysisData | null = null;

  constructor() {
    // Initialize with main branch
    this.branches.set('main', {
      name: 'main',
      currentVersion: '',
      createdFrom: '',
      createdAt: new Date(),
      author: { id: 'system', name: 'System' },
      isProtected: true
    });
  }

  /**
   * Track a change to an entity
   */
  trackChange(
    entityType: EntityType,
    entityId: string,
    changeType: 'add' | 'modify' | 'delete',
    previousValue?: any,
    newValue?: any,
    path?: string[]
  ): void {
    const change: EntityChange = {
      entityType,
      entityId,
      changeType,
      previousValue,
      newValue,
      path,
      timestamp: new Date()
    };

    this.uncommittedChanges.push(change);
  }

  /**
   * Commit current changes
   */
  async commit(
    message: string,
    author: { id: string; name: string; email?: string },
    tags: string[] = []
  ): Promise<Version> {
    if (this.uncommittedChanges.length === 0) {
      throw new Error('No changes to commit');
    }

    const changeSet = this.organizeChanges(this.uncommittedChanges);
    const versionId = this.generateVersionId();
    const versionNumber = this.generateVersionNumber();

    const version: Version = {
      id: versionId,
      version: versionNumber,
      parentVersion: this.currentVersion || undefined,
      branch: this.currentBranch,
      timestamp: new Date(),
      author,
      message,
      tags,
      changes: changeSet
    };

    // Store version
    this.versions.set(versionId, version);
    this.currentVersion = versionId;

    // Update branch
    const branch = this.branches.get(this.currentBranch);
    if (branch) {
      branch.currentVersion = versionId;
    }

    // Clear uncommitted changes
    this.uncommittedChanges = [];

    return version;
  }

  /**
   * Create a new branch
   */
  createBranch(
    branchName: string,
    fromVersion?: string,
    author?: { id: string; name: string },
    description?: string
  ): Branch {
    if (this.branches.has(branchName)) {
      throw new Error(`Branch ${branchName} already exists`);
    }

    const baseVersion = fromVersion || this.currentVersion || '';
    
    const branch: Branch = {
      name: branchName,
      currentVersion: baseVersion,
      createdFrom: baseVersion,
      createdAt: new Date(),
      author: author || { id: 'system', name: 'System' },
      isProtected: false,
      description
    };

    this.branches.set(branchName, branch);
    return branch;
  }

  /**
   * Switch to a different branch
   */
  async switchBranch(branchName: string): Promise<void> {
    if (!this.branches.has(branchName)) {
      throw new Error(`Branch ${branchName} does not exist`);
    }

    if (this.uncommittedChanges.length > 0) {
      throw new Error('Cannot switch branches with uncommitted changes');
    }

    this.currentBranch = branchName;
    const branch = this.branches.get(branchName)!;
    this.currentVersion = branch.currentVersion;
  }

  /**
   * Merge branches
   */
  async mergeBranch(
    sourceBranch: string,
    targetBranch: string,
    author: { id: string; name: string; email?: string },
    strategy: 'merge' | 'rebase' = 'merge'
  ): Promise<MergeResult> {
    const source = this.branches.get(sourceBranch);
    const target = this.branches.get(targetBranch);

    if (!source || !target) {
      throw new Error('Invalid branch names');
    }

    // Find common ancestor
    const commonAncestor = this.findCommonAncestor(
      source.currentVersion,
      target.currentVersion
    );

    // Get changes from both branches since common ancestor
    const sourceChanges = this.getChangesSince(commonAncestor, source.currentVersion);
    const targetChanges = this.getChangesSince(commonAncestor, target.currentVersion);

    // Detect conflicts
    const conflicts = this.detectConflicts(sourceChanges, targetChanges);

    if (conflicts.length > 0) {
      return {
        success: false,
        conflicts,
        merged: []
      };
    }

    // Merge changes
    const mergedChanges = this.mergeChangeSets(sourceChanges, targetChanges);

    // Create merge commit
    const mergeVersion = await this.commit(
      `Merge branch '${sourceBranch}' into '${targetBranch}'`,
      author,
      ['merge']
    );

    return {
      success: true,
      conflicts: [],
      merged: mergedChanges.additions.concat(mergedChanges.modifications),
      version: mergeVersion
    };
  }

  /**
   * Get version history
   */
  getHistory(
    branch?: string,
    limit?: number,
    since?: Date
  ): Version[] {
    const targetBranch = branch || this.currentBranch;
    const branchInfo = this.branches.get(targetBranch);
    
    if (!branchInfo) {
      return [];
    }

    const history: Version[] = [];
    let currentVersionId = branchInfo.currentVersion;

    while (currentVersionId && history.length < (limit || Infinity)) {
      const version = this.versions.get(currentVersionId);
      if (!version) break;

      if (since && version.timestamp < since) break;

      history.push(version);
      currentVersionId = version.parentVersion || '';
    }

    return history;
  }

  /**
   * Checkout a specific version
   */
  async checkout(versionId: string): Promise<STAPAnalysisData | null> {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    if (this.uncommittedChanges.length > 0) {
      throw new Error('Cannot checkout with uncommitted changes');
    }

    // If version has a snapshot, return it
    if (version.snapshot) {
      return version.snapshot;
    }

    // Otherwise, reconstruct state by applying changes from initial state
    return this.reconstructState(versionId);
  }

  /**
   * Compare two versions
   */
  diff(versionId1: string, versionId2: string): DiffResult {
    const version1 = this.versions.get(versionId1);
    const version2 = this.versions.get(versionId2);

    if (!version1 || !version2) {
      throw new Error('Invalid version IDs');
    }

    // Get all changes between versions
    const changes = this.getChangesBetween(versionId1, versionId2);

    const statistics = {
      totalAdditions: changes.additions.length,
      totalModifications: changes.modifications.length,
      totalDeletions: changes.deletions.length,
      conflictingChanges: 0 // Would be calculated based on overlapping changes
    };

    return {
      changes,
      statistics
    };
  }

  /**
   * Create a tag for a version
   */
  tagVersion(versionId: string, tag: string): void {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
    }
  }

  /**
   * Get current uncommitted changes
   */
  getUncommittedChanges(): EntityChange[] {
    return [...this.uncommittedChanges];
  }

  /**
   * Discard uncommitted changes
   */
  discardChanges(): void {
    this.uncommittedChanges = [];
  }

  /**
   * Export version history
   */
  exportHistory(branch?: string): string {
    const history = this.getHistory(branch);
    return JSON.stringify(history, null, 2);
  }

  /**
   * Import version history
   */
  importHistory(historyJson: string): void {
    try {
      const history = JSON.parse(historyJson) as Version[];
      history.forEach(version => {
        this.versions.set(version.id, version);
      });
    } catch (error) {
      throw new Error('Invalid history format');
    }
  }

  /**
   * Private helper methods
   */
  private organizeChanges(changes: EntityChange[]): ChangeSet {
    const additions: EntityChange[] = [];
    const modifications: EntityChange[] = [];
    const deletions: EntityChange[] = [];
    const byEntityType: Record<string, number> = {};

    changes.forEach(change => {
      // Track by entity type
      byEntityType[change.entityType] = (byEntityType[change.entityType] || 0) + 1;

      // Organize by change type
      switch (change.changeType) {
        case 'add':
          additions.push(change);
          break;
        case 'modify':
          modifications.push(change);
          break;
        case 'delete':
          deletions.push(change);
          break;
      }
    });

    return {
      additions,
      modifications,
      deletions,
      summary: {
        totalChanges: changes.length,
        byEntityType
      }
    };
  }

  private generateVersionId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVersionNumber(): string {
    const history = this.getHistory();
    const major = Math.floor(history.length / 100) + 1;
    const minor = Math.floor((history.length % 100) / 10);
    const patch = history.length % 10;
    return `${major}.${minor}.${patch}`;
  }

  private findCommonAncestor(versionId1: string, versionId2: string): string {
    const ancestors1 = this.getAncestors(versionId1);
    const ancestors2 = this.getAncestors(versionId2);

    for (const ancestor of ancestors1) {
      if (ancestors2.includes(ancestor)) {
        return ancestor;
      }
    }

    return '';
  }

  private getAncestors(versionId: string): string[] {
    const ancestors: string[] = [];
    let current = versionId;

    while (current) {
      ancestors.push(current);
      const version = this.versions.get(current);
      current = version?.parentVersion || '';
    }

    return ancestors;
  }

  private getChangesSince(fromVersion: string, toVersion: string): ChangeSet {
    const changes: EntityChange[] = [];
    let current = toVersion;

    while (current && current !== fromVersion) {
      const version = this.versions.get(current);
      if (!version) break;

      changes.push(
        ...version.changes.additions,
        ...version.changes.modifications,
        ...version.changes.deletions
      );

      current = version.parentVersion || '';
    }

    return this.organizeChanges(changes);
  }

  private getChangesBetween(versionId1: string, versionId2: string): ChangeSet {
    const commonAncestor = this.findCommonAncestor(versionId1, versionId2);
    const changes1 = this.getChangesSince(commonAncestor, versionId1);
    const changes2 = this.getChangesSince(commonAncestor, versionId2);

    // Combine changes (simplified - in reality would need to handle conflicts)
    const allChanges = [
      ...changes1.additions,
      ...changes1.modifications,
      ...changes1.deletions,
      ...changes2.additions,
      ...changes2.modifications,
      ...changes2.deletions
    ];

    return this.organizeChanges(allChanges);
  }

  private detectConflicts(changes1: ChangeSet, changes2: ChangeSet): MergeConflict[] {
    const conflicts: MergeConflict[] = [];
    const processedEntities = new Set<string>();

    // Check for conflicting modifications
    changes1.modifications.forEach(change1 => {
      const key = `${change1.entityType}:${change1.entityId}`;
      const change2 = changes2.modifications.find(
        c => c.entityType === change1.entityType && c.entityId === change1.entityId
      );

      if (change2 && !processedEntities.has(key)) {
        processedEntities.add(key);
        conflicts.push({
          entityType: change1.entityType,
          entityId: change1.entityId,
          path: change1.path,
          baseValue: change1.previousValue,
          currentValue: change1.newValue,
          incomingValue: change2.newValue
        });
      }
    });

    // Check for modify-delete conflicts
    changes1.modifications.forEach(change1 => {
      const deleted = changes2.deletions.find(
        c => c.entityType === change1.entityType && c.entityId === change1.entityId
      );

      if (deleted) {
        conflicts.push({
          entityType: change1.entityType,
          entityId: change1.entityId,
          baseValue: change1.previousValue,
          currentValue: change1.newValue,
          incomingValue: null
        });
      }
    });

    return conflicts;
  }

  private mergeChangeSets(changes1: ChangeSet, changes2: ChangeSet): ChangeSet {
    // Simple merge - combine non-conflicting changes
    const merged: EntityChange[] = [];
    const processed = new Set<string>();

    // Add all changes, avoiding duplicates
    [...changes1.additions, ...changes2.additions].forEach(change => {
      const key = `${change.entityType}:${change.entityId}:add`;
      if (!processed.has(key)) {
        processed.add(key);
        merged.push(change);
      }
    });

    [...changes1.modifications, ...changes2.modifications].forEach(change => {
      const key = `${change.entityType}:${change.entityId}:modify`;
      if (!processed.has(key)) {
        processed.add(key);
        merged.push(change);
      }
    });

    [...changes1.deletions, ...changes2.deletions].forEach(change => {
      const key = `${change.entityType}:${change.entityId}:delete`;
      if (!processed.has(key)) {
        processed.add(key);
        merged.push(change);
      }
    });

    return this.organizeChanges(merged);
  }

  private async reconstructState(versionId: string): Promise<STAPAnalysisData | null> {
    // This would reconstruct the full state by applying all changes
    // from the initial state up to the specified version
    // For now, return null (would be implemented with actual state reconstruction)
    return null;
  }

  /**
   * Get statistics about version control
   */
  getStatistics(): {
    totalVersions: number;
    totalBranches: number;
    uncommittedChanges: number;
    averageChangesPerVersion: number;
  } {
    const versions = Array.from(this.versions.values());
    const totalChanges = versions.reduce(
      (sum, v) => sum + v.changes.summary.totalChanges,
      0
    );

    return {
      totalVersions: this.versions.size,
      totalBranches: this.branches.size,
      uncommittedChanges: this.uncommittedChanges.length,
      averageChangesPerVersion: versions.length > 0 ? totalChanges / versions.length : 0
    };
  }
}

// Export singleton instance
export const versionControlManager = new VersionControlManager();