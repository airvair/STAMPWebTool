/**
 * Interactive Tutorial Component
 * Guides users through STPA analysis with step-by-step instructions
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  PlayIcon,
  BookOpenIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import {
  trainingModeManager,
  TutorialSession,
  TutorialStep,
  StepType,
  FocusArea
} from '@/utils/trainingMode';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Progress from '../shared/Progress';
import { useAnalysis } from '@/hooks/useAnalysis';

interface InteractiveTutorialProps {
  tutorialId: string;
  userId: string;
  onComplete?: () => void;
  onExit?: () => void;
  className?: string;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  tutorialId,
  userId,
  onComplete,
  onExit,
  className = ''
}) => {
  const [session, setSession] = useState<TutorialSession | null>(null);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | string[]>('');
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [highlightedElements, setHighlightedElements] = useState<string[]>([]);
  const [disabledElements, setDisabledElements] = useState<string[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const __analysisData = useAnalysis();

  // Initialize session
  useEffect(() => {
    try {
      const tutorialSession = trainingModeManager.startTutorial(tutorialId, userId);
      setSession(tutorialSession);
      setCurrentStep(tutorialSession.getCurrentStep());
    } catch (error) {
      console.error('Failed to start tutorial:', error);
    }
  }, [tutorialId, userId]);

  // Apply step effects
  useEffect(() => {
    if (!currentStep) return;

    // Apply highlighting
    if (currentStep.highlightElements) {
      setHighlightedElements(currentStep.highlightElements);
      currentStep.highlightElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.classList.add('tutorial-highlight');
        });
      });
    }

    // Apply disabling
    if (currentStep.disableElements) {
      setDisabledElements(currentStep.disableElements);
      currentStep.disableElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.classList.add('tutorial-disabled');
          el.setAttribute('disabled', 'true');
        });
      });
    }

    // Apply focus area
    if (currentStep.focusArea) {
      applyFocusArea(currentStep.focusArea);
    }

    // Cleanup
    return () => {
      highlightedElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.classList.remove('tutorial-highlight');
        });
      });

      disabledElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.classList.remove('tutorial-disabled');
          el.removeAttribute('disabled');
        });
      });

      removeFocusArea();
    };
  }, [currentStep]);

  const applyFocusArea = (focusArea: FocusArea) => {
    const target = document.querySelector(focusArea.selector);
    if (!target || !overlayRef.current) return;

    const rect = target.getBoundingClientRect();
    const overlay = overlayRef.current;

    // Create spotlight effect
    overlay.style.display = 'block';
    overlay.style.background = `
      radial-gradient(
        ellipse ${rect.width + focusArea.padding * 2}px ${rect.height + focusArea.padding * 2}px at 
        ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px,
        transparent 0%,
        transparent 50%,
        rgba(0, 0, 0, 0.8) 100%
      )
    `;
  };

  const removeFocusArea = () => {
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none';
    }
  };

  const handleNext = async () => {
    if (!session || !currentStep) return;

    // Validate current step if needed
    if (currentStep.validation && !await validateStep()) {
      return;
    }

    // Complete current step
    session.completeCurrentStep();

    // Move to next
    const nextStep = session.nextStep();
    if (nextStep) {
      setCurrentStep(nextStep);
      setQuizAnswer('');
      setQuizFeedback(null);
      setShowHints(false);
      setShowExplanation(false);
    } else {
      // Tutorial completed
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (!session) return;

    const previousStep = session.previousStep();
    if (previousStep) {
      setCurrentStep(previousStep);
      setQuizAnswer('');
      setQuizFeedback(null);
      setShowHints(false);
      setShowExplanation(false);
    }
  };

  const validateStep = async (): Promise<boolean> => {
    if (!currentStep?.validation) return true;

    setIsValidating(true);
    
    try {
      // Get current value based on step type
      let value: any;
      
      if (currentStep.type === StepType.QUIZ) {
        value = quizAnswer;
      } else if (currentStep.action?.target) {
        // Get value from target element
        const target = document.querySelector(currentStep.action.target);
        if (target) {
          value = (target as HTMLInputElement).value || target.textContent;
        }
      }

      // Validate
      let isValid = false;
      switch (currentStep.validation.type) {
        case 'exact':
          isValid = value === currentStep.validation.expected;
          break;
        case 'contains':
          isValid = value?.toString().toLowerCase().includes(
            currentStep.validation.expected?.toLowerCase()
          );
          break;
        case 'custom':
          isValid = currentStep.validation.validator?.(value) || false;
          break;
      }

      if (!isValid) {
        alert(currentStep.validation.errorMessage);
      }

      return isValid;
    } finally {
      setIsValidating(false);
    }
  };

  const handleQuizSubmit = () => {
    if (!session || !currentStep || currentStep.type !== StepType.QUIZ) return;

    // Find the quiz
    const quiz = session.tutorial.quizzes.find(q => 
      currentStep.content.includes(q.question)
    );
    
    if (!quiz) return;

    // Submit answer
    const isCorrect = session.submitQuizAnswer(quiz.id, quizAnswer);
    
    setQuizFeedback({
      correct: isCorrect,
      explanation: quiz.explanation
    });
  };

  const renderStepContent = () => {
    if (!currentStep) return null;

    // Parse markdown-style formatting
    const formatContent = (content: string) => {
      return content
        .split('\n')
        .map((line, idx) => {
          // Bold
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          
          // Lists
          if (line.startsWith('- ')) {
            return <li key={idx} dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
          }
          
          // Numbered lists
          const numberMatch = line.match(/^(\d+)\.\s(.+)/);
          if (numberMatch) {
            return (
              <li key={idx} className="list-decimal" dangerouslySetInnerHTML={{ 
                __html: numberMatch[2] 
              }} />
            );
          }
          
          return <p key={idx} dangerouslySetInnerHTML={{ __html: line }} />;
        });
    };

    return (
      <div className="space-y-4">
        {/* Step content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {formatContent(currentStep.content)}
        </div>

        {/* Quiz UI */}
        {currentStep.type === StepType.QUIZ && renderQuizUI()}

        {/* Action button */}
        {currentStep.action && currentStep.type === StepType.GUIDED_ACTION && (
          <Button
            onClick={() => performAction(currentStep.action!)}
            leftIcon={<PlayIcon className="w-4 h-4" />}
            className="mt-4"
          >
            Perform Action
          </Button>
        )}

        {/* Hints */}
        {currentStep.hints.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <LightBulbIcon className="w-4 h-4" />
              {showHints ? 'Hide' : 'Show'} Hints
              {showHints ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
            </button>
            
            {showHints && (
              <div className="mt-2 space-y-1">
                {currentStep.hints.map((hint, idx) => (
                  <p key={idx} className="text-sm text-slate-600 dark:text-slate-400 pl-6">
                    • {hint}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {currentStep.explanation && (
          <div className="mt-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              <QuestionMarkCircleIcon className="w-4 h-4" />
              {showExplanation ? 'Hide' : 'Show'} Explanation
              {showExplanation ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
            </button>
            
            {showExplanation && (
              <Card className="mt-2 p-4 bg-purple-50 dark:bg-purple-900/20">
                <p className="text-sm">{currentStep.explanation}</p>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderQuizUI = () => {
    // Find the quiz in the current step
    const quiz = session?.tutorial.quizzes.find(q => 
      currentStep?.content.includes(q.question)
    );
    
    if (!quiz) return null;

    return (
      <div className="mt-4 space-y-4">
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="font-medium mb-3">{quiz.question}</h4>
          
          {quiz.type === 'multiple-choice' && quiz.options && (
            <div className="space-y-2">
              {quiz.options.map((option, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="quiz-answer"
                    value={option}
                    checked={quizAnswer === option}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          )}
          
          {quiz.type === 'true-false' && (
            <div className="space-y-2">
              {['true', 'false'].map(option => (
                <label key={option} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="quiz-answer"
                    value={option}
                    checked={quizAnswer === option}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm capitalize">{option}</span>
                </label>
              ))}
            </div>
          )}
          
          {quiz.type === 'fill-blank' && (
            <input
              type="text"
              value={quizAnswer as string}
              onChange={(e) => setQuizAnswer(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Type your answer..."
            />
          )}
          
          <Button
            onClick={handleQuizSubmit}
            disabled={!quizAnswer}
            size="sm"
            className="mt-3"
          >
            Submit Answer
          </Button>
        </Card>
        
        {quizFeedback && (
          <Card className={`p-4 ${
            quizFeedback.correct 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-start gap-3">
              {quizFeedback.correct ? (
                <CheckCircleSolidIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <XMarkIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {quizFeedback.correct ? 'Correct!' : 'Incorrect'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {quizFeedback.explanation}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const performAction = (action: any) => {
    // In a real implementation, this would perform the actual action
    console.log('Performing action:', action);
    
    // Simulate action completion
    setTimeout(() => {
      alert('Action completed! You can now proceed.');
    }, 1000);
  };

  const getStepIcon = (type: StepType) => {
    switch (type) {
      case StepType.INFORMATION:
        return <BookOpenIcon className="w-5 h-5" />;
      case StepType.DEMONSTRATION:
        return <PlayIcon className="w-5 h-5" />;
      case StepType.GUIDED_ACTION:
        return <SparklesIcon className="w-5 h-5" />;
      case StepType.PRACTICE:
        return <AcademicCapIcon className="w-5 h-5" />;
      case StepType.QUIZ:
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
      case StepType.CHECKPOINT:
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (!session || !currentStep) {
    return <div>Loading tutorial...</div>;
  }

  const { tutorial, tutorialProgress } = session;
  const currentStepIndex = tutorial.steps.findIndex(s => s.id === currentStep.id);
  const progress = session.getProgress();

  return (
    <>
      {/* Focus overlay */}
      <div 
        ref={overlayRef} 
        className="fixed inset-0 pointer-events-none z-40"
        style={{ display: 'none' }}
      />

      {/* Tutorial panel */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 shadow-2xl z-50 ${className}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold">{tutorial.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Step {currentStepIndex + 1} of {tutorial.steps.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Progress value={progress} className="w-32" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExit}
                  leftIcon={<XMarkIcon className="w-4 h-4" />}
                >
                  Exit Tutorial
                </Button>
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                {getStepIcon(currentStep.type)}
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  {currentStep.title}
                  {tutorialProgress.completedSteps.includes(currentStep.id) && (
                    <CheckCircleSolidIcon className="w-5 h-5 text-green-600" />
                  )}
                </h4>
                
                {renderStepContent()}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {tutorial.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx < currentStepIndex
                        ? 'bg-blue-600'
                        : idx === currentStepIndex
                        ? 'bg-blue-400'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                onClick={handleNext}
                disabled={isValidating || (currentStep.type === StepType.QUIZ && !quizFeedback?.correct)}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              >
                {currentStepIndex === tutorial.steps.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InteractiveTutorial;