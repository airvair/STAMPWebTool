/**
 * Training Dashboard Component
 * Shows available tutorials, user progress, and achievements
 */

import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  TrophyIcon,
  ClockIcon,
  ChartBarIcon,
  StarIcon,
  FireIcon,
  LockClosedIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  BookOpenIcon,
  SparklesIcon,
  PuzzlePieceIcon,
  BeakerIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import {
  trainingModeManager,
  Tutorial,
  TutorialCategory,
  UserProgress,
  UserStats
} from '@/utils/trainingMode';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import Progress from '../shared/Progress';
import Tabs from '../shared/Tabs';
import InteractiveTutorial from './InteractiveTutorial';
import { format } from 'date-fns';

interface TrainingDashboardProps {
  userId: string;
  onClose?: () => void;
  className?: string;
}

const TrainingDashboard: React.FC<TrainingDashboardProps> = ({
  userId,
  onClose,
  className = ''
}) => {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [recommendedTutorials, setRecommendedTutorials] = useState<Tutorial[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TutorialCategory | 'all'>('all');
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [showCertificates, setShowCertificates] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  // Load user data
  useEffect(() => {
    // Load progress
    const progress = trainingModeManager.loadProgress(userId) || {
      userId,
      tutorials: {},
      achievements: [],
      totalPoints: 0,
      level: 1
    };
    setUserProgress(progress);

    // Get stats
    const stats = trainingModeManager.getUserStats(userId);
    setUserStats(stats);

    // Get tutorials
    const allTutorials = trainingModeManager.getTutorials();
    setTutorials(allTutorials);

    // Get recommendations
    const recommended = trainingModeManager.getRecommendedTutorials(userId);
    setRecommendedTutorials(recommended);
  }, [userId]);

  const handleTutorialComplete = () => {
    setActiveTutorial(null);
    
    // Reload data
    const progress = trainingModeManager.loadProgress(userId);
    if (progress) {
      setUserProgress(progress);
      setUserStats(trainingModeManager.getUserStats(userId));
      setRecommendedTutorials(trainingModeManager.getRecommendedTutorials(userId));
    }
  };

  const getCategoryIcon = (category: TutorialCategory) => {
    const icons: Record<TutorialCategory, React.ReactElement> = {
      [TutorialCategory.STPA_BASICS]: <BookOpenIcon className="w-5 h-5" />,
      [TutorialCategory.LOSS_HAZARD]: <FireIcon className="w-5 h-5" />,
      [TutorialCategory.CONTROL_STRUCTURE]: <PuzzlePieceIcon className="w-5 h-5" />,
      [TutorialCategory.UCA_ANALYSIS]: <BeakerIcon className="w-5 h-5" />,
      [TutorialCategory.UCCA_ANALYSIS]: <SparklesIcon className="w-5 h-5" />,
      [TutorialCategory.CAUSAL_SCENARIOS]: <RocketLaunchIcon className="w-5 h-5" />,
      [TutorialCategory.REQUIREMENTS]: <CheckCircleIcon className="w-5 h-5" />,
      [TutorialCategory.ADVANCED_FEATURES]: <StarIcon className="w-5 h-5" />,
      [TutorialCategory.INDUSTRY_SPECIFIC]: <TrophyIcon className="w-5 h-5" />
    };
    return icons[category];
  };

  const getCategoryName = (category: TutorialCategory): string => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const _getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'advanced':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTutorialProgress = (tutorialId: string): number => {
    if (!userProgress) return 0;
    const progress = userProgress.tutorials[tutorialId];
    if (!progress) return 0;
    if (progress.completed) return 100;
    
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return 0;
    
    return Math.round((progress.completedSteps.length / tutorial.steps.length) * 100);
  };

  const isLocked = (tutorial: Tutorial): boolean => {
    if (!userProgress || tutorial.prerequisites.length === 0) return false;
    
    return !tutorial.prerequisites.every(prereq => 
      userProgress.tutorials[prereq]?.completed
    );
  };

  const filteredTutorials = selectedCategory === 'all' 
    ? tutorials 
    : tutorials.filter(t => t.category === selectedCategory);

  if (activeTutorial) {
    return (
      <InteractiveTutorial
        tutorialId={activeTutorial}
        userId={userId}
        onComplete={handleTutorialComplete}
        onExit={() => setActiveTutorial(null)}
      />
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AcademicCapIcon className="w-7 h-7 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">STPA Training Center</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Learn STPA methodology through interactive tutorials
              </p>
            </div>
          </div>
          
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <StarIcon className="w-5 h-5 text-yellow-500" />
                <p className="text-2xl font-bold">{userStats.level}</p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Level</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrophyIcon className="w-5 h-5 text-purple-500" />
                <p className="text-2xl font-bold">{userStats.totalPoints}</p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Points</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <p className="text-2xl font-bold">{userStats.tutorialsCompleted}</p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ChartBarIcon className="w-5 h-5 text-blue-500" />
                <p className="text-2xl font-bold">{userStats.averageScore.toFixed(0)}%</p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Score</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAchievements(true)}
              className="inline-flex items-center gap-2"
            >
              <TrophyIcon className="w-4 h-4" />
              {userStats.achievements} Achievements
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCertificates(true)}
              className="inline-flex items-center gap-2"
            >
              <AcademicCapIcon className="w-4 h-4" />
              {userStats.certificates} Certificates
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          tabs={[
            { id: 'recommended', label: 'Recommended', badge: recommendedTutorials.length },
            { id: 'all', label: 'All Tutorials', badge: tutorials.length },
            { id: 'progress', label: 'My Progress' }
          ]}
          defaultTab="recommended"
        >
          {(activeTab) => (
            <div className="h-full overflow-y-auto p-6">
              {activeTab === 'recommended' && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Recommended for You</h3>
                  
                  {recommendedTutorials.length === 0 ? (
                    <Card className="p-8 text-center">
                      <TrophyIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-600 dark:text-slate-400">
                        You've completed all available tutorials! Check back later for new content.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendedTutorials.map(tutorial => (
                        <TutorialCard
                          key={tutorial.id}
                          tutorial={tutorial}
                          progress={getTutorialProgress(tutorial.id)}
                          locked={isLocked(tutorial)}
                          onStart={() => setActiveTutorial(tutorial.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'all' && (
                <div className="space-y-6">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      All Categories
                    </button>
                    
                    {Object.values(TutorialCategory).map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          selectedCategory === category
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {getCategoryIcon(category)}
                        {getCategoryName(category)}
                      </button>
                    ))}
                  </div>

                  {/* Tutorials Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTutorials.map(tutorial => (
                      <TutorialCard
                        key={tutorial.id}
                        tutorial={tutorial}
                        progress={getTutorialProgress(tutorial.id)}
                        locked={isLocked(tutorial)}
                        onStart={() => setActiveTutorial(tutorial.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'progress' && userProgress && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Your Learning Journey</h3>
                  
                  {/* Progress Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* In Progress */}
                    <div>
                      <h4 className="font-medium mb-3">In Progress</h4>
                      <div className="space-y-3">
                        {Object.entries(userProgress.tutorials)
                          .filter(([_, progress]) => !progress.completed && progress.completedSteps.length > 0)
                          .map(([tutorialId, progress]) => {
                            const tutorial = tutorials.find(t => t.id === tutorialId);
                            if (!tutorial) return null;
                            
                            return (
                              <Card key={tutorialId} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium">{tutorial.title}</h5>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {Math.round((progress.completedSteps.length / tutorial.steps.length) * 100)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={(progress.completedSteps.length / tutorial.steps.length) * 100} 
                                  className="mb-3"
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500">
                                    Last accessed {format(progress.lastAccessedAt, 'MMM d, yyyy')}
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={() => setActiveTutorial(tutorialId)}
                                  >
                                    Continue
                                  </Button>
                                </div>
                              </Card>
                            );
                          })}
                      </div>
                      
                      {Object.values(userProgress.tutorials).filter(p => !p.completed && p.completedSteps.length > 0).length === 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No tutorials in progress
                        </p>
                      )}
                    </div>

                    {/* Completed */}
                    <div>
                      <h4 className="font-medium mb-3">Completed</h4>
                      <div className="space-y-3">
                        {Object.entries(userProgress.tutorials)
                          .filter(([_, progress]) => progress.completed)
                          .map(([tutorialId, progress]) => {
                            const tutorial = tutorials.find(t => t.id === tutorialId);
                            if (!tutorial) return null;
                            
                            return (
                              <Card key={tutorialId} className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                    <div>
                                      <h5 className="font-medium">{tutorial.title}</h5>
                                      <p className="text-xs text-slate-500">
                                        Completed {format(progress.lastAccessedAt, 'MMM d, yyyy')}
                                      </p>
                                    </div>
                                  </div>
                                  {progress.certificate && (
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-green-600">
                                        {progress.certificate.score}%
                                      </p>
                                      <p className="text-xs text-slate-500">Score</p>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                      </div>
                      
                      {Object.values(userProgress.tutorials).filter(p => p.completed).length === 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No completed tutorials yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Tabs>
      </div>

      {/* Achievements Modal */}
      <Modal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        title="Your Achievements"
        size="lg"
      >
        {userProgress?.achievements.length === 0 ? (
          <div className="text-center py-8">
            <TrophyIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              Complete tutorials to unlock achievements!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userProgress?.achievements.map(achievement => (
              <Card key={achievement.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">
                        {format(achievement.unlockedAt, 'MMM d, yyyy')}
                      </span>
                      <span className="text-sm font-medium text-purple-600">
                        +{achievement.points} pts
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      {/* Certificates Modal */}
      <Modal
        isOpen={showCertificates}
        onClose={() => setShowCertificates(false)}
        title="Your Certificates"
        size="lg"
      >
        {userStats?.certificates === 0 ? (
          <div className="text-center py-8">
            <AcademicCapIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              Complete tutorials with a score of 70% or higher to earn certificates!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userProgress && Object.entries(userProgress.tutorials)
              .filter(([_, progress]) => progress.certificate)
              .map(([tutorialId, progress]) => {
                const tutorial = tutorials.find(t => t.id === tutorialId);
                if (!tutorial || !progress.certificate) return null;
                
                return (
                  <Card key={tutorialId} className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{progress.certificate.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {tutorial.category.split('_').map(w => 
                            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                          ).join(' ')} Certification
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span>
                            Score: <strong>{progress.certificate.score}%</strong>
                          </span>
                          <span>
                            Issued: {format(progress.certificate.issueDate, 'MMMM d, yyyy')}
                          </span>
                          <span>
                            Time: {formatTime(Math.round(progress.certificate.completionTime / 60000))}
                          </span>
                        </div>
                      </div>
                      <div className="text-4xl">🏆</div>
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </Modal>
    </div>
  );
};

/**
 * Tutorial Card Component
 */
interface TutorialCardProps {
  tutorial: Tutorial;
  progress: number;
  locked: boolean;
  onStart: () => void;
}

const TutorialCard: React.FC<TutorialCardProps> = ({
  tutorial,
  progress,
  locked,
  onStart
}) => {
  const getCategoryIcon = (category: TutorialCategory) => {
    const icons: Record<TutorialCategory, React.ReactElement> = {
      [TutorialCategory.STPA_BASICS]: <BookOpenIcon className="w-5 h-5" />,
      [TutorialCategory.LOSS_HAZARD]: <FireIcon className="w-5 h-5" />,
      [TutorialCategory.CONTROL_STRUCTURE]: <PuzzlePieceIcon className="w-5 h-5" />,
      [TutorialCategory.UCA_ANALYSIS]: <BeakerIcon className="w-5 h-5" />,
      [TutorialCategory.UCCA_ANALYSIS]: <SparklesIcon className="w-5 h-5" />,
      [TutorialCategory.CAUSAL_SCENARIOS]: <RocketLaunchIcon className="w-5 h-5" />,
      [TutorialCategory.REQUIREMENTS]: <CheckCircleIcon className="w-5 h-5" />,
      [TutorialCategory.ADVANCED_FEATURES]: <StarIcon className="w-5 h-5" />,
      [TutorialCategory.INDUSTRY_SPECIFIC]: <TrophyIcon className="w-5 h-5" />
    };
    return icons[category];
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'advanced':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
    }
  };

  return (
    <Card className={`p-5 ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            {getCategoryIcon(tutorial.category)}
          </div>
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              {tutorial.title}
              {locked && <LockClosedIcon className="w-4 h-4 text-slate-400" />}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(tutorial.difficulty)}`}>
                {tutorial.difficulty}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {tutorial.estimatedMinutes} min
              </span>
            </div>
          </div>
        </div>
        
        {progress === 100 && (
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
        )}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
        {tutorial.description}
      </p>

      {/* Objectives */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          What you'll learn:
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
          {tutorial.objectives.slice(0, 2).map((obj, idx) => (
            <li key={idx} className="flex items-start gap-1">
              <span>•</span>
              <span>{obj}</span>
            </li>
          ))}
          {tutorial.objectives.length > 2 && (
            <li className="text-slate-500">• +{tutorial.objectives.length - 2} more</li>
          )}
        </ul>
      </div>

      {/* Progress */}
      {progress > 0 && progress < 100 && (
        <Progress value={progress} className="mb-3" />
      )}

      {/* Prerequisites */}
      {tutorial.prerequisites.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500">
            Prerequisites: {tutorial.prerequisites.join(', ')}
          </p>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={onStart}
        disabled={locked}
        size="sm"
        className="w-full inline-flex items-center justify-center gap-2"
      >
        <PlayCircleIcon className="w-4 h-4" />
        {progress === 0 ? 'Start' : progress === 100 ? 'Review' : 'Continue'}
      </Button>
    </Card>
  );
};

export default TrainingDashboard;