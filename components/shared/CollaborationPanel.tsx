import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  SignalIcon,
  LockClosedIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  CollaborationUser,
  PresenceInfo,
  EntityLock,
  collaborationManager
} from '@/utils/collaboration';
import Button from './Button';
import Modal from './Modal';

interface CollaborationPanelProps {
  projectId: string;
  currentUser: {
    id: string;
    name: string;
    email?: string;
  };
  onConnectionChange?: (connected: boolean) => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  projectId,
  currentUser,
  onConnectionChange
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([]);
  const [userPresence, setUserPresence] = useState<Map<string, PresenceInfo>>(new Map());
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // User colors for avatars
  const userColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];

  useEffect(() => {
    connectToCollaboration();

    return () => {
      collaborationManager.disconnect();
    };
  }, [projectId]);

  const connectToCollaboration = async () => {
    try {
      const userColor = userColors[Math.floor(Math.random() * userColors.length)];
      
      await collaborationManager.connect(
        process.env.NEXT_PUBLIC_COLLABORATION_SERVER || 'ws://localhost:3001',
        projectId,
        {
          ...currentUser,
          color: userColor,
          avatar: generateAvatar(currentUser.name)
        }
      );

      setIsConnected(true);
      setConnectionError(null);
      if (onConnectionChange) onConnectionChange(true);

      // Subscribe to presence updates
      const unsubscribePresence = collaborationManager.onPresenceUpdate((presence) => {
        const presenceMap = new Map<string, PresenceInfo>();
        presence.forEach(p => presenceMap.set(p.userId, p));
        setUserPresence(presenceMap);
      });

      // Update online users periodically
      const updateUsers = () => {
        setOnlineUsers(collaborationManager.getOnlineUsers());
      };
      updateUsers();
      const userInterval = setInterval(updateUsers, 5000);

      return () => {
        unsubscribePresence();
        clearInterval(userInterval);
      };

    } catch (error) {
      console.error('Failed to connect to collaboration server:', error);
      setConnectionError('Unable to connect to collaboration server');
      setIsConnected(false);
      if (onConnectionChange) onConnectionChange(false);
    }
  };

  const generateAvatar = (name: string): string => {
    // Generate initials for avatar
    const parts = name.split(' ');
    const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    return initials;
  };

  const getUserPresenceIndicator = (user: CollaborationUser) => {
    const presence = userPresence.get(user.id);
    if (!presence) return null;

    return (
      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        {presence.currentView && (
          <span>Viewing: {presence.currentView}</span>
        )}
        {presence.selection && (
          <span className="ml-2">
            Editing: {presence.selection.entityType}
          </span>
        )}
      </div>
    );
  };

  const getCollaborationStats = () => {
    const stats = collaborationManager.getStatistics();
    return stats;
  };

  const stats = getCollaborationStats();

  return (
    <>
      {/* Collaboration Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <SignalIcon className={`w-4 h-4 ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Online Users */}
          <Button
            onClick={() => setShowUsersModal(true)}
            variant="secondary"
            size="sm"
            leftIcon={<UsersIcon className="w-4 h-4" />}
          >
            {onlineUsers.length} {onlineUsers.length === 1 ? 'User' : 'Users'} Online
          </Button>

          {/* Active Locks */}
          {stats.totalLocks > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <LockClosedIcon className="w-4 h-4" />
              <span>{stats.totalLocks} items locked</span>
              {stats.userLocks > 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  ({stats.userLocks} by you)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Connection Error */}
        {connectionError && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span>{connectionError}</span>
            <Button
              onClick={connectToCollaboration}
              size="sm"
              variant="secondary"
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Users Modal */}
      <Modal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        title="Online Collaborators"
        size="md"
      >
        <div className="space-y-4">
          {onlineUsers.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              No other users online
            </p>
          ) : (
            <div className="space-y-3">
              {onlineUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.avatar}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {user.name}
                      </span>
                      {user.id === currentUser.id && (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    {getUserPresenceIndicator(user)}
                    <div className="text-xs text-slate-400 mt-1">
                      Last active: {new Date(user.lastActive).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Collaboration Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Collaboration Tips
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Locked items show a lock icon and the user's name</li>
              <li>• Changes are synchronized in real-time</li>
              <li>• Use comments to communicate about specific items</li>
              <li>• Your cursor and selection are visible to others</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Collaboration indicator for individual entities
export const CollaborationIndicator: React.FC<{
  entityType: string;
  entityId: string;
  className?: string;
}> = ({ entityType, entityId, className = '' }) => {
  const [lock, setLock] = useState<EntityLock | undefined>();

  useEffect(() => {
    // Check if entity is locked
    const checkLock = () => {
      const entityLock = collaborationManager.getEntityLock(
        entityType as any,
        entityId
      );
      setLock(entityLock);
    };

    checkLock();

    // Subscribe to lock changes
    const unsubscribe = collaborationManager.onEntityChange(
      entityType as any,
      (event) => {
        if (event.entityId === entityId && 
            (event.action === 'lock' || event.action === 'unlock')) {
          checkLock();
        }
      }
    );

    return unsubscribe;
  }, [entityType, entityId]);

  if (!lock) return null;

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <LockClosedIcon className="w-3 h-3 text-yellow-600" />
      <span className="text-yellow-700 dark:text-yellow-300">
        Locked by {lock.userName}
      </span>
    </div>
  );
};

// Real-time cursor component
export const CollaborativeCursor: React.FC<{
  user: CollaborationUser;
  position: { x: number; y: number };
}> = ({ user, position }) => {
  return (
    <div
      className="absolute z-50 pointer-events-none transition-all duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Cursor */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="drop-shadow-lg"
      >
        <path
          d="M2 2 L2 14 L7 9 L10 14 L12 12 L9 7 L14 2 Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* User label */}
      <div
        className="absolute top-4 left-4 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </div>
  );
};

export default CollaborationPanel;