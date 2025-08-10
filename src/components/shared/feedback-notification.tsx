import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import React, { useState, useEffect } from 'react';
import { UserFeedback, UserAction, ErrorHandler } from '@/utils/error-handling';
import Button from './button';

interface FeedbackNotificationProps {
  feedback: UserFeedback;
  onClose: () => void;
}

const FeedbackNotification: React.FC<FeedbackNotificationProps> = ({ feedback, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (feedback.autoClose && feedback.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, feedback.duration);

      return () => clearTimeout(timer);
    }
  }, [feedback.autoClose, feedback.duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (feedback.type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (feedback.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const getTitleColorClasses = () => {
    switch (feedback.type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'info':
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  const getMessageColorClasses = () => {
    switch (feedback.type) {
      case 'success':
        return 'text-green-700 dark:text-green-300';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'error':
        return 'text-red-700 dark:text-red-300';
      case 'info':
      default:
        return 'text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-full max-w-md transform rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${getColorClasses()} `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${getTitleColorClasses()}`}>{feedback.title}</h3>

          <div className={`mt-1 text-sm ${getMessageColorClasses()}`}>
            {feedback.message.split('\n').map((line, index) => (
              <div key={index} className={index > 0 ? 'mt-1' : ''}>
                {line}
              </div>
            ))}
          </div>

          {feedback.actions && feedback.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {feedback.actions.map((action: UserAction, index: number) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant === 'danger' ? 'secondary' : action.variant || 'primary'}
                  onClick={() => {
                    action.action();
                    if (action.variant !== 'secondary') {
                      handleClose();
                    }
                  }}
                  className={
                    action.variant === 'danger'
                      ? 'text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200'
                      : ''
                  }
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className={`inline-flex rounded-md p-1.5 focus:ring-2 focus:ring-offset-2 focus:outline-none ${feedback.type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-500 dark:text-green-400 dark:hover:bg-green-900/50' : ''} ${feedback.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-900/50' : ''} ${feedback.type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/50' : ''} ${feedback.type === 'info' ? 'text-blue-500 hover:bg-blue-100 focus:ring-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/50' : ''} `}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface FeedbackContainerProps {
  children: React.ReactNode;
}

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<UserFeedback[]>([]);

  useEffect(() => {
    const unsubscribe = ErrorHandler.subscribe((feedback: UserFeedback) => {
      setNotifications(prev => [...prev, feedback]);
    });

    return unsubscribe;
  }, []);

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {children}

      {/* Notification container */}
      <div className="pointer-events-none fixed top-0 right-0 z-50 space-y-4 p-4">
        {notifications.map((feedback, index) => (
          <div key={index} className="pointer-events-auto">
            <FeedbackNotification feedback={feedback} onClose={() => removeNotification(index)} />
          </div>
        ))}
      </div>
    </>
  );
};

export default FeedbackNotification;
