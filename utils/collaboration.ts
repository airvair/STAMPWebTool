/**
 * Real-time Collaboration System for STPA Analysis
 * Enables multiple users to work on the same analysis simultaneously
 */

import { io, Socket } from 'socket.io-client';
import { 
  Loss, 
  Hazard, 
  Controller, 
  ControlAction, 
  UnsafeControlAction, 
  UCCA 
} from '@/types';

export interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  color: string;
  avatar?: string;
  isOnline: boolean;
  lastActive: Date;
  currentView?: string;
  cursor?: { x: number; y: number };
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  users: CollaborationUser[];
  startedAt: Date;
  isActive: boolean;
}

export interface CollaborationEvent {
  id: string;
  type: CollaborationEventType;
  userId: string;
  timestamp: Date;
  entityType: EntityType;
  entityId?: string;
  action: 'create' | 'update' | 'delete' | 'lock' | 'unlock';
  data?: any;
  previousData?: any;
}

export enum CollaborationEventType {
  ENTITY_CREATED = 'entity_created',
  ENTITY_UPDATED = 'entity_updated',
  ENTITY_DELETED = 'entity_deleted',
  ENTITY_LOCKED = 'entity_locked',
  ENTITY_UNLOCKED = 'entity_unlocked',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_CURSOR_MOVED = 'user_cursor_moved',
  USER_SELECTION_CHANGED = 'user_selection_changed',
  COMMENT_ADDED = 'comment_added',
  COMMENT_RESOLVED = 'comment_resolved'
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

export interface EntityLock {
  entityType: EntityType;
  entityId: string;
  userId: string;
  userName: string;
  lockedAt: Date;
  expiresAt: Date;
}

export interface CollaborationComment {
  id: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  replies: CollaborationComment[];
}

export interface PresenceInfo {
  userId: string;
  userName: string;
  color: string;
  currentView: string;
  selection?: {
    entityType: EntityType;
    entityIds: string[];
  };
  cursor?: {
    x: number;
    y: number;
  };
}

/**
 * Collaboration Manager for real-time sync
 */
export class CollaborationManager {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private currentUser: CollaborationUser | null = null;
  private users = new Map<string, CollaborationUser>();
  private locks = new Map<string, EntityLock>();
  private eventHandlers = new Map<string, Set<(event: CollaborationEvent) => void>>();
  private presenceHandlers = new Set<(presence: PresenceInfo[]) => void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Initialize collaboration session
   */
  async connect(
    serverUrl: string,
    projectId: string,
    user: Omit<CollaborationUser, 'isOnline' | 'lastActive'>
  ): Promise<CollaborationSession> {
    return new Promise((resolve, reject) => {
      try {
        // Connect to collaboration server
        this.socket = io(serverUrl, {
          query: {
            projectId,
            userId: user.id,
            userName: user.name
          },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay
        });

        this.currentUser = {
          ...user,
          isOnline: true,
          lastActive: new Date()
        };

        // Setup event handlers
        this.setupSocketHandlers();

        // Handle connection success
        this.socket.on('connect', () => {
          console.log('Connected to collaboration server');
          this.reconnectAttempts = 0;
          
          // Join project session
          this.socket!.emit('join_project', {
            projectId,
            user: this.currentUser
          });
        });

        // Handle session joined
        this.socket.on('session_joined', (session: CollaborationSession) => {
          this.sessionId = session.id;
          session.users.forEach(u => this.users.set(u.id, u));
          resolve(session);
        });

        // Handle connection errors
        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from collaboration session
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.sessionId = null;
    this.users.clear();
    this.locks.clear();
  }

  /**
   * Send entity change event
   */
  sendEntityChange(
    entityType: EntityType,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    data?: any,
    previousData?: any
  ): void {
    if (!this.socket || !this.currentUser) return;

    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: this.getEventType(action),
      userId: this.currentUser.id,
      timestamp: new Date(),
      entityType,
      entityId,
      action,
      data,
      previousData
    };

    this.socket.emit('entity_change', event);
  }

  /**
   * Lock entity for editing
   */
  async lockEntity(entityType: EntityType, entityId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || !this.currentUser) {
        resolve(false);
        return;
      }

      const lockRequest = {
        entityType,
        entityId,
        userId: this.currentUser.id,
        userName: this.currentUser.name
      };

      this.socket.emit('lock_entity', lockRequest, (response: { success: boolean; lock?: EntityLock }) => {
        if (response.success && response.lock) {
          this.locks.set(this.getLockKey(entityType, entityId), response.lock);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  /**
   * Unlock entity
   */
  unlockEntity(entityType: EntityType, entityId: string): void {
    if (!this.socket || !this.currentUser) return;

    const lockKey = this.getLockKey(entityType, entityId);
    const lock = this.locks.get(lockKey);

    if (lock && lock.userId === this.currentUser.id) {
      this.socket.emit('unlock_entity', {
        entityType,
        entityId
      });
      this.locks.delete(lockKey);
    }
  }

  /**
   * Check if entity is locked
   */
  isEntityLocked(entityType: EntityType, entityId: string): boolean {
    const lock = this.locks.get(this.getLockKey(entityType, entityId));
    return !!lock && lock.userId !== this.currentUser?.id;
  }

  /**
   * Get lock info for entity
   */
  getEntityLock(entityType: EntityType, entityId: string): EntityLock | undefined {
    return this.locks.get(this.getLockKey(entityType, entityId));
  }

  /**
   * Update user presence (cursor, selection, etc.)
   */
  updatePresence(presence: Partial<PresenceInfo>): void {
    if (!this.socket || !this.currentUser) return;

    const fullPresence: PresenceInfo = {
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      color: this.currentUser.color,
      currentView: presence.currentView || '',
      selection: presence.selection,
      cursor: presence.cursor
    };

    this.socket.emit('update_presence', fullPresence);
  }

  /**
   * Add comment to entity
   */
  async addComment(
    entityType: EntityType,
    entityId: string,
    text: string
  ): Promise<CollaborationComment> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.currentUser) {
        reject(new Error('Not connected'));
        return;
      }

      const comment = {
        entityType,
        entityId,
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        text
      };

      this.socket.emit('add_comment', comment, (response: { success: boolean; comment?: CollaborationComment }) => {
        if (response.success && response.comment) {
          resolve(response.comment);
        } else {
          reject(new Error('Failed to add comment'));
        }
      });
    });
  }

  /**
   * Subscribe to entity changes
   */
  onEntityChange(
    entityType: EntityType,
    handler: (event: CollaborationEvent) => void
  ): () => void {
    const key = `entity_${entityType}`;
    if (!this.eventHandlers.has(key)) {
      this.eventHandlers.set(key, new Set());
    }
    this.eventHandlers.get(key)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(key)?.delete(handler);
    };
  }

  /**
   * Subscribe to presence updates
   */
  onPresenceUpdate(handler: (presence: PresenceInfo[]) => void): () => void {
    this.presenceHandlers.add(handler);
    return () => {
      this.presenceHandlers.delete(handler);
    };
  }

  /**
   * Get current online users
   */
  getOnlineUsers(): CollaborationUser[] {
    return Array.from(this.users.values()).filter(u => u.isOnline);
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // Handle user joined
    this.socket.on('user_joined', (user: CollaborationUser) => {
      this.users.set(user.id, user);
      this.notifyEventHandlers({
        id: this.generateEventId(),
        type: CollaborationEventType.USER_JOINED,
        userId: user.id,
        timestamp: new Date(),
        entityType: EntityType.LOSS, // Dummy type
        action: 'create',
        data: user
      });
    });

    // Handle user left
    this.socket.on('user_left', (userId: string) => {
      this.users.delete(userId);
      // Remove locks held by user
      for (const [key, lock] of this.locks.entries()) {
        if (lock.userId === userId) {
          this.locks.delete(key);
        }
      }
    });

    // Handle entity changes from other users
    this.socket.on('entity_changed', (event: CollaborationEvent) => {
      if (event.userId !== this.currentUser?.id) {
        this.notifyEventHandlers(event);
      }
    });

    // Handle entity locked
    this.socket.on('entity_locked', (lock: EntityLock) => {
      this.locks.set(this.getLockKey(lock.entityType, lock.entityId), lock);
      if (lock.userId !== this.currentUser?.id) {
        this.notifyEventHandlers({
          id: this.generateEventId(),
          type: CollaborationEventType.ENTITY_LOCKED,
          userId: lock.userId,
          timestamp: new Date(),
          entityType: lock.entityType,
          entityId: lock.entityId,
          action: 'lock',
          data: lock
        });
      }
    });

    // Handle entity unlocked
    this.socket.on('entity_unlocked', ({ entityType, entityId }: { entityType: EntityType; entityId: string }) => {
      this.locks.delete(this.getLockKey(entityType, entityId));
    });

    // Handle presence updates
    this.socket.on('presence_updated', (presenceList: PresenceInfo[]) => {
      this.presenceHandlers.forEach(handler => handler(presenceList));
    });

    // Handle reconnection
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      // Re-join session
      if (this.sessionId && this.currentUser) {
        this.socket!.emit('rejoin_session', {
          sessionId: this.sessionId,
          userId: this.currentUser.id
        });
      }
    });

    // Handle disconnection
    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket!.connect();
      }
    });
  }

  /**
   * Notify event handlers
   */
  private notifyEventHandlers(event: CollaborationEvent): void {
    // Notify general handlers
    const generalHandlers = this.eventHandlers.get('*') || new Set();
    generalHandlers.forEach(handler => handler(event));

    // Notify entity-specific handlers
    const entityHandlers = this.eventHandlers.get(`entity_${event.entityType}`) || new Set();
    entityHandlers.forEach(handler => handler(event));
  }

  /**
   * Get event type from action
   */
  private getEventType(action: 'create' | 'update' | 'delete'): CollaborationEventType {
    switch (action) {
      case 'create':
        return CollaborationEventType.ENTITY_CREATED;
      case 'update':
        return CollaborationEventType.ENTITY_UPDATED;
      case 'delete':
        return CollaborationEventType.ENTITY_DELETED;
    }
  }

  /**
   * Generate lock key
   */
  private getLockKey(entityType: EntityType, entityId: string): string {
    return `${entityType}:${entityId}`;
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Conflict resolution for concurrent edits
   */
  resolveConflict<T extends { id: string; updatedAt?: Date }>(
    localEntity: T,
    remoteEntity: T,
    strategy: 'local' | 'remote' | 'merge' | 'manual' = 'remote'
  ): T {
    switch (strategy) {
      case 'local':
        return localEntity;
      
      case 'remote':
        return remoteEntity;
      
      case 'merge':
        // Simple merge - prefer remote for conflicting fields
        return {
          ...localEntity,
          ...remoteEntity,
          id: localEntity.id // Preserve ID
        };
      
      case 'manual':
        // Would trigger UI for manual resolution
        // For now, default to remote
        return remoteEntity;
      
      default:
        return remoteEntity;
    }
  }

  /**
   * Get collaboration statistics
   */
  getStatistics(): {
    onlineUsers: number;
    totalLocks: number;
    userLocks: number;
  } {
    const onlineUsers = this.getOnlineUsers().length;
    const totalLocks = this.locks.size;
    const userLocks = Array.from(this.locks.values()).filter(
      lock => lock.userId === this.currentUser?.id
    ).length;

    return {
      onlineUsers,
      totalLocks,
      userLocks
    };
  }
}

// Export singleton instance
export const collaborationManager = new CollaborationManager();

/**
 * React hook for collaboration
 */
export function useCollaboration() {
  // This would be implemented as a React hook
  // For now, just export the manager
  return collaborationManager;
}