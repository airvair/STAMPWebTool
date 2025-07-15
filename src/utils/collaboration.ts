/**
 * Collaboration Utility
 * Manages real-time collaboration features for STPA analysis
 */

export interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  color: string;
  avatar: string;
  lastActive: Date;
}

export interface PresenceInfo {
  userId: string;
  currentView?: string;
  selection?: {
    entityType: string;
    entityId: string;
  };
  cursorPosition?: {
    x: number;
    y: number;
  };
}

export interface EntityLock {
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  lockedAt: Date;
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'entity_changed' | 'presence_updated';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface CollaborationStatistics {
  totalUsers: number;
  totalLocks: number;
  userLocks: number;
  messageCount: number;
}

class CollaborationManager {
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private onlineUsers: CollaborationUser[] = [];
  private entityLocks: Map<string, EntityLock> = new Map();
  private presenceCallbacks: ((presence: PresenceInfo[]) => void)[] = [];
  private entityCallbacks: Map<string, ((event: any) => void)[]> = new Map();
  private currentUser: CollaborationUser | null = null;

  async connect(
    serverUrl: string,
    projectId: string,
    user: CollaborationUser
  ): Promise<void> {
    try {
      this.websocket = new WebSocket(`${serverUrl}?project=${projectId}`);
      this.currentUser = user;

      this.websocket.onopen = () => {
        this.isConnected = true;
        this.send({
          type: 'user_join',
          user: user
        });
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse collaboration message:', error);
        }
      };

      this.websocket.onclose = () => {
        this.isConnected = false;
        this.websocket = null;
      };

      this.websocket.onerror = (error) => {
        console.error('Collaboration WebSocket error:', error);
        throw new Error('Failed to connect to collaboration server');
      };

    } catch (error) {
      console.error('Collaboration connection error:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.onlineUsers = [];
    this.entityLocks.clear();
  }

  getOnlineUsers(): CollaborationUser[] {
    return [...this.onlineUsers];
  }

  getEntityLock(entityType: string, entityId: string): EntityLock | undefined {
    const key = `${entityType}:${entityId}`;
    return this.entityLocks.get(key);
  }

  lockEntity(entityType: string, entityId: string): boolean {
    if (!this.currentUser) return false;

    const key = `${entityType}:${entityId}`;
    const existingLock = this.entityLocks.get(key);
    
    if (existingLock && existingLock.userId !== this.currentUser.id) {
      return false; // Already locked by another user
    }

    const lock: EntityLock = {
      entityType,
      entityId,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      lockedAt: new Date()
    };

    this.entityLocks.set(key, lock);
    this.send({
      type: 'entity_lock',
      entityType,
      entityId,
      lock
    });

    return true;
  }

  unlockEntity(entityType: string, entityId: string): boolean {
    if (!this.currentUser) return false;

    const key = `${entityType}:${entityId}`;
    const existingLock = this.entityLocks.get(key);
    
    if (!existingLock || existingLock.userId !== this.currentUser.id) {
      return false; // Not locked by current user
    }

    this.entityLocks.delete(key);
    this.send({
      type: 'entity_unlock',
      entityType,
      entityId
    });

    return true;
  }

  updatePresence(presence: PresenceInfo): void {
    this.send({
      type: 'presence_update',
      presence
    });
  }

  onPresenceUpdate(callback: (presence: PresenceInfo[]) => void): () => void {
    this.presenceCallbacks.push(callback);
    return () => {
      const index = this.presenceCallbacks.indexOf(callback);
      if (index >= 0) {
        this.presenceCallbacks.splice(index, 1);
      }
    };
  }

  onEntityChange(entityType: string, callback: (event: any) => void): () => void {
    if (!this.entityCallbacks.has(entityType)) {
      this.entityCallbacks.set(entityType, []);
    }
    
    const callbacks = this.entityCallbacks.get(entityType)!;
    callbacks.push(callback);
    
    return () => {
      const index = callbacks.indexOf(callback);
      if (index >= 0) {
        callbacks.splice(index, 1);
      }
    };
  }

  getStatistics(): CollaborationStatistics {
    const userLocks = Array.from(this.entityLocks.values())
      .filter(lock => this.currentUser && lock.userId === this.currentUser.id).length;

    return {
      totalUsers: this.onlineUsers.length,
      totalLocks: this.entityLocks.size,
      userLocks,
      messageCount: 0 // Could be tracked if needed
    };
  }

  private send(data: any): void {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(data));
    }
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'users_updated':
        this.onlineUsers = data.users || [];
        break;
        
      case 'entity_locked':
        if (data.lock) {
          const key = `${data.lock.entityType}:${data.lock.entityId}`;
          this.entityLocks.set(key, data.lock);
          this.notifyEntityCallbacks(data.lock.entityType, {
            action: 'lock',
            entityId: data.lock.entityId,
            lock: data.lock
          });
        }
        break;
        
      case 'entity_unlocked':
        if (data.entityType && data.entityId) {
          const key = `${data.entityType}:${data.entityId}`;
          this.entityLocks.delete(key);
          this.notifyEntityCallbacks(data.entityType, {
            action: 'unlock',
            entityId: data.entityId
          });
        }
        break;
        
      case 'presence_updated':
        if (data.presence) {
          this.presenceCallbacks.forEach(callback => {
            try {
              callback(data.presence);
            } catch (error) {
              console.error('Error in presence callback:', error);
            }
          });
        }
        break;
        
      default:
        console.log('Unknown collaboration message type:', data.type);
    }
  }

  private notifyEntityCallbacks(entityType: string, event: any): void {
    const callbacks = this.entityCallbacks.get(entityType) || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in entity callback:', error);
      }
    });
  }
}

export const collaborationManager = new CollaborationManager();