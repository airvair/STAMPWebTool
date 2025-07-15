/**
 * Training Mode Manager
 * Interactive tutorials and guided walkthroughs for STPA analysis
 */

import { 
  UnsafeControlAction, 
  UCAType
} from '@/types/types';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: TutorialCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  prerequisites: string[];
  objectives: string[];
  steps: TutorialStep[];
  quizzes: Quiz[];
  practiceExercise?: PracticeExercise;
  certificate?: Certificate;
}

export enum TutorialCategory {
  STPA_BASICS = 'stpa_basics',
  LOSS_HAZARD = 'loss_hazard',
  CONTROL_STRUCTURE = 'control_structure',
  UCA_ANALYSIS = 'uca_analysis',
  UCCA_ANALYSIS = 'ucca_analysis',
  CAUSAL_SCENARIOS = 'causal_scenarios',
  REQUIREMENTS = 'requirements',
  ADVANCED_FEATURES = 'advanced_features',
  INDUSTRY_SPECIFIC = 'industry_specific'
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  type: StepType;
  action?: TutorialAction;
  validation?: StepValidation;
  hints: string[];
  explanation?: string;
  focusArea?: FocusArea;
  highlightElements?: string[];
  disableElements?: string[];
}

export enum StepType {
  INFORMATION = 'information',
  DEMONSTRATION = 'demonstration',
  GUIDED_ACTION = 'guided_action',
  PRACTICE = 'practice',
  QUIZ = 'quiz',
  CHECKPOINT = 'checkpoint'
}

export interface TutorialAction {
  type: 'click' | 'input' | 'drag' | 'select' | 'multi-step';
  target: string;
  value?: any;
  sequence?: TutorialAction[];
}

export interface StepValidation {
  type: 'exact' | 'contains' | 'custom';
  expected?: any;
  validator?: (value: any) => boolean;
  errorMessage: string;
}

export interface FocusArea {
  selector: string;
  padding: number;
  description?: string;
}

export interface Quiz {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'matching';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

export interface PracticeExercise {
  id: string;
  title: string;
  scenario: string;
  tasks: ExerciseTask[];
  solution: any;
  hints: string[];
}

export interface ExerciseTask {
  id: string;
  description: string;
  expectedOutcome: string;
  validation: (result: any) => boolean;
}

export interface Certificate {
  id: string;
  name: string;
  issueDate: Date;
  completionTime: number;
  score: number;
}

export interface TutorialProgress {
  tutorialId: string;
  currentStepId: string;
  completedSteps: string[];
  quizScores: Record<string, number>;
  startedAt: Date;
  lastAccessedAt: Date;
  completed: boolean;
  certificate?: Certificate;
}

export interface UserProgress {
  userId: string;
  tutorials: Record<string, TutorialProgress>;
  achievements: Achievement[];
  totalPoints: number;
  level: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt: Date;
}

/**
 * Training Mode Manager
 */
export class TrainingModeManager {
  private tutorials = new Map<string, Tutorial>();
  private userProgress = new Map<string, UserProgress>();
  // private activeSession: TutorialSession | null = null;

  constructor() {
    this.initializeTutorials();
  }

  /**
   * Initialize built-in tutorials
   */
  private initializeTutorials() {
    // STPA Basics Tutorial
    this.addTutorial({
      id: 'stpa-basics',
      title: 'Introduction to STPA',
      description: 'Learn the fundamentals of System-Theoretic Process Analysis',
      category: TutorialCategory.STPA_BASICS,
      difficulty: 'beginner',
      estimatedMinutes: 20,
      prerequisites: [],
      objectives: [
        'Understand what STPA is and why it\'s important',
        'Learn the key concepts and terminology',
        'Understand the STPA process flow',
        'Know when to use STPA vs traditional methods'
      ],
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to STPA',
          content: 'System-Theoretic Process Analysis (STPA) is a powerful hazard analysis technique based on systems theory. Unlike traditional methods, STPA considers the entire system including human, organizational, and software aspects.',
          type: StepType.INFORMATION,
          hints: ['STPA was developed by Dr. Nancy Leveson at MIT'],
          focusArea: {
            selector: '.main-content',
            padding: 20
          },
          highlightElements: []
        },
        {
          id: 'key-concepts',
          title: 'Key Concepts',
          content: 'STPA is built on several key concepts:\n\n1. **Losses**: Undesirable outcomes we want to prevent\n2. **Hazards**: System states that can lead to losses\n3. **Control Structure**: How system components interact\n4. **Unsafe Control Actions**: Control actions that can lead to hazards',
          type: StepType.INFORMATION,
          hints: ['These concepts form the foundation of any STPA analysis'],
          highlightElements: []
        },
        {
          id: 'process-overview',
          title: 'The STPA Process',
          content: 'STPA follows a systematic process:\n\n1. Define losses and hazards\n2. Model the control structure\n3. Identify unsafe control actions\n4. Identify causal scenarios\n5. Derive safety requirements',
          type: StepType.DEMONSTRATION,
          hints: ['Each step builds on the previous one'],
          action: {
            type: 'multi-step',
            target: '',
            sequence: [
              { type: 'click', target: '#step-1-tab' },
              { type: 'click', target: '#step-2-tab' },
              { type: 'click', target: '#step-3-tab' },
              { type: 'click', target: '#step-4-tab' },
              { type: 'click', target: '#step-5-tab' }
            ]
          }
        }
      ],
      quizzes: [
        {
          id: 'basics-quiz-1',
          question: 'What does STPA stand for?',
          type: 'multiple-choice',
          options: [
            'System Theory Process Application',
            'System-Theoretic Process Analysis',
            'Safety Testing Protocol Analysis',
            'Systematic Technical Performance Analysis'
          ],
          correctAnswer: 'System-Theoretic Process Analysis',
          explanation: 'STPA stands for System-Theoretic Process Analysis, a hazard analysis method based on systems theory.',
          points: 10
        },
        {
          id: 'basics-quiz-2',
          question: 'STPA considers only technical failures in its analysis.',
          type: 'true-false',
          correctAnswer: 'false',
          explanation: 'STPA considers the entire system including human, organizational, and software aspects, not just technical failures.',
          points: 10
        }
      ]
    });

    // Loss and Hazard Definition Tutorial
    this.addTutorial({
      id: 'loss-hazard-definition',
      title: 'Defining Losses and Hazards',
      description: 'Learn how to properly identify and define losses and hazards',
      category: TutorialCategory.LOSS_HAZARD,
      difficulty: 'beginner',
      estimatedMinutes: 25,
      prerequisites: ['stpa-basics'],
      objectives: [
        'Understand the difference between losses and hazards',
        'Learn how to write effective loss statements',
        'Learn how to derive hazards from losses',
        'Practice creating losses and hazards'
      ],
      steps: [
        {
          id: 'what-is-loss',
          title: 'What is a Loss?',
          content: 'A loss is something of value to stakeholders that can be lost. Losses are stated in terms of unacceptable consequences, not their causes.',
          type: StepType.INFORMATION,
          hints: ['Think about what the stakeholders care about most'],
          highlightElements: ['#losses-section']
        },
        {
          id: 'create-loss',
          title: 'Creating Your First Loss',
          content: 'Let\'s create a loss. Click the "Add Loss" button and enter: "Loss of human life or injury"',
          type: StepType.GUIDED_ACTION,
          action: {
            type: 'click',
            target: '#add-loss-button'
          },
          validation: {
            type: 'contains',
            expected: 'human life',
            errorMessage: 'Make sure your loss mentions "human life" or "injury"'
          },
          hints: ['Losses should be stated at a high level', 'Focus on consequences, not causes']
        },
        {
          id: 'what-is-hazard',
          title: 'What is a Hazard?',
          content: 'A hazard is a system state or condition that, together with environmental conditions, can lead to a loss.',
          type: StepType.INFORMATION,
          hints: ['Hazards are more specific than losses'],
          highlightElements: ['#hazards-section']
        },
        {
          id: 'create-hazard',
          title: 'Creating a Hazard',
          content: 'Now create a hazard linked to your loss. Think about what system conditions could lead to loss of life.',
          type: StepType.PRACTICE,
          validation: {
            type: 'custom',
            validator: (value) => value.linkedLosses && value.linkedLosses.length > 0,
            errorMessage: 'Make sure to link your hazard to at least one loss'
          },
          hints: ['Example: "Aircraft altitude too low during approach"', 'Hazards describe system states, not component failures']
        }
      ],
      quizzes: [
        {
          id: 'loss-hazard-quiz-1',
          question: 'Which of the following is a properly stated loss?',
          type: 'multiple-choice',
          options: [
            'Sensor failure',
            'Loss of mission',
            'Software bug causes crash',
            'Pilot error'
          ],
          correctAnswer: 'Loss of mission',
          explanation: 'Losses should state unacceptable consequences (what we lose), not causes or failures.',
          points: 15
        }
      ],
      practiceExercise: {
        id: 'loss-hazard-exercise',
        title: 'Autonomous Vehicle Safety',
        scenario: 'You are analyzing an autonomous vehicle system. Identify at least 3 losses and 5 hazards.',
        tasks: [
          {
            id: 'identify-losses',
            description: 'Identify 3 losses for an autonomous vehicle',
            expectedOutcome: 'At least 3 valid losses identified',
            validation: (result) => result.losses && result.losses.length >= 3
          },
          {
            id: 'identify-hazards',
            description: 'Identify 5 hazards and link them to losses',
            expectedOutcome: 'At least 5 hazards with proper links',
            validation: (result) => result.hazards && result.hazards.length >= 5
          }
        ],
        solution: {
          losses: [
            'Loss of human life or injury to vehicle occupants',
            'Loss of human life or injury to other road users',
            'Loss of property (vehicle or infrastructure damage)'
          ],
          hazards: [
            'Vehicle violates minimum separation distance',
            'Vehicle enters intersection against traffic signal',
            'Vehicle speed inappropriate for conditions',
            'Vehicle in wrong lane or off roadway',
            'Vehicle fails to stop when required'
          ]
        },
        hints: [
          'Think about all stakeholders: passengers, pedestrians, other drivers',
          'Hazards should describe unsafe vehicle states or behaviors'
        ]
      }
    });

    // UCA Analysis Tutorial
    this.addTutorial({
      id: 'uca-analysis',
      title: 'Identifying Unsafe Control Actions',
      description: 'Master the systematic identification of UCAs',
      category: TutorialCategory.UCA_ANALYSIS,
      difficulty: 'intermediate',
      estimatedMinutes: 30,
      prerequisites: ['loss-hazard-definition'],
      objectives: [
        'Understand the four types of UCAs',
        'Learn systematic UCA identification',
        'Practice creating comprehensive UCAs',
        'Understand context and timing'
      ],
      steps: [
        {
          id: 'uca-types',
          title: 'Four Types of UCAs',
          content: 'UCAs fall into four categories:\n\n1. **Not Providing**: Control action required but not provided\n2. **Providing**: Control action provided when it shouldn\'t be\n3. **Too Early/Late**: Timing is wrong\n4. **Stopped Too Soon/Applied Too Long**: Duration is wrong',
          type: StepType.INFORMATION,
          hints: ['Consider each type for every control action'],
          highlightElements: []
        },
        {
          id: 'systematic-approach',
          title: 'Systematic UCA Identification',
          content: 'For each control action, systematically consider:\n\n1. When should it be provided?\n2. When should it NOT be provided?\n3. What timing constraints exist?\n4. What duration constraints exist?',
          type: StepType.DEMONSTRATION,
          hints: ['Use guide words to ensure completeness'],
          focusArea: {
            selector: '#uca-analysis-section',
            padding: 20
          }
        },
        {
          id: 'create-uca',
          title: 'Create Your First UCA',
          content: 'Select a control action and create a UCA. Consider the context carefully.',
          type: StepType.GUIDED_ACTION,
          action: {
            type: 'click',
            target: '#add-uca-button'
          },
          validation: {
            type: 'custom',
            validator: (value) => value.type && value.context && value.linkedHazards?.length > 0,
            errorMessage: 'Ensure you specify type, context, and link to hazards'
          },
          hints: ['Context is crucial - when does this become unsafe?', 'Link to relevant hazards']
        }
      ],
      quizzes: [],
      practiceExercise: {
        id: 'uca-exercise',
        title: 'Aircraft Landing System',
        scenario: 'Analyze the "Deploy Landing Gear" control action for an aircraft.',
        tasks: [
          {
            id: 'identify-ucas',
            description: 'Identify at least one UCA for each of the four types',
            expectedOutcome: '4 UCAs covering all types',
            validation: (result) => {
              const types = new Set(result.ucas.map((u: UnsafeControlAction) => u.ucaType));
              return types.size === 4;
            }
          }
        ],
        solution: {
          ucas: [
            {
              type: UCAType.NotProvided,
              context: 'During landing approach when gear deployment is required'
            },
            {
              type: UCAType.ProvidedUnsafe,
              context: 'At cruise altitude when gear deployment would cause structural damage'
            },
            {
              type: UCAType.TooLate,
              context: 'Too late during landing approach, insufficient time to lock'
            },
            {
              type: UCAType.TooShort,
              context: 'Stopped before fully deployed and locked'
            }
          ]
        },
        hints: ['Consider normal operations and edge cases', 'Think about timing and sequencing']
      }
    });

    // Add more tutorials...
  }

  /**
   * Add a tutorial
   */
  addTutorial(tutorial: Tutorial) {
    this.tutorials.set(tutorial.id, tutorial);
  }

  /**
   * Get all tutorials
   */
  getTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  /**
   * Get tutorials by category
   */
  getTutorialsByCategory(category: TutorialCategory): Tutorial[] {
    return Array.from(this.tutorials.values()).filter(t => t.category === category);
  }

  /**
   * Get recommended tutorials for user
   */
  getRecommendedTutorials(userId: string): Tutorial[] {
    const progress = this.userProgress.get(userId);
    if (!progress) {
      // New user - recommend beginner tutorials
      return this.getTutorials().filter(t => t.difficulty === 'beginner');
    }

    // Find tutorials with unmet prerequisites
    const completedIds = Object.keys(progress.tutorials)
      .filter(id => progress.tutorials[id].completed);

    return this.getTutorials().filter(t => {
      // Not completed
      if (completedIds.includes(t.id)) return false;
      
      // Prerequisites met
      return t.prerequisites.every(p => completedIds.includes(p));
    }).slice(0, 5);
  }

  /**
   * Start a tutorial session
   */
  startTutorial(tutorialId: string, userId: string): TutorialSession {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) {
      throw new Error(`Tutorial ${tutorialId} not found`);
    }

    // Get or create user progress
    let userProgress = this.userProgress.get(userId);
    if (!userProgress) {
      userProgress = {
        userId,
        tutorials: {},
        achievements: [],
        totalPoints: 0,
        level: 1
      };
      this.userProgress.set(userId, userProgress);
    }

    // Get or create tutorial progress
    let tutorialProgress = userProgress.tutorials[tutorialId];
    if (!tutorialProgress) {
      tutorialProgress = {
        tutorialId,
        currentStepId: tutorial.steps[0].id,
        completedSteps: [],
        quizScores: {},
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        completed: false
      };
      userProgress.tutorials[tutorialId] = tutorialProgress;
    }

    // Create session
    const session = new TutorialSession(
      tutorial,
      tutorialProgress,
      userProgress,
      this.onSessionUpdate.bind(this)
    );

    // this.activeSession = session;
    return session;
  }

  /**
   * Handle session updates
   */
  private onSessionUpdate(session: TutorialSession) {
    const { tutorialProgress, userProgress } = session;
    
    // Update last accessed
    tutorialProgress.lastAccessedAt = new Date();

    // Check for completion
    if (tutorialProgress.completedSteps.length === session.tutorial.steps.length) {
      this.completeTutorial(session);
    }

    // Check for achievements
    this.checkAchievements(userProgress);

    // Save progress
    this.saveProgress(userProgress);
  }

  /**
   * Complete a tutorial
   */
  private completeTutorial(session: TutorialSession) {
    const { tutorial, tutorialProgress, userProgress } = session;

    // Mark as completed
    tutorialProgress.completed = true;

    // Calculate score
    const quizScore = this.calculateQuizScore(tutorial, tutorialProgress);
    
    // Issue certificate if score is sufficient
    if (quizScore >= 70) {
      tutorialProgress.certificate = {
        id: `cert-${tutorial.id}-${Date.now()}`,
        name: tutorial.title,
        issueDate: new Date(),
        completionTime: Date.now() - tutorialProgress.startedAt.getTime(),
        score: quizScore
      };
    }

    // Award points
    const points = tutorial.estimatedMinutes * 10 + quizScore;
    userProgress.totalPoints += points;
    
    // Check level up
    const newLevel = Math.floor(userProgress.totalPoints / 1000) + 1;
    if (newLevel > userProgress.level) {
      userProgress.level = newLevel;
      this.awardAchievement(userProgress, {
        id: `level-${newLevel}`,
        name: `Level ${newLevel} Analyst`,
        description: `Reached level ${newLevel} in STPA proficiency`,
        icon: '🎓',
        points: 100 * newLevel,
        unlockedAt: new Date()
      });
    }
  }

  /**
   * Calculate quiz score
   */
  private calculateQuizScore(tutorial: Tutorial, progress: TutorialProgress): number {
    if (tutorial.quizzes.length === 0) return 100;

    const totalPoints = tutorial.quizzes.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = tutorial.quizzes.reduce((sum, q) => 
      sum + (progress.quizScores[q.id] || 0), 0
    );

    return Math.round((earnedPoints / totalPoints) * 100);
  }

  /**
   * Check and award achievements
   */
  private checkAchievements(userProgress: UserProgress) {
    const achievements = [
      {
        id: 'first-tutorial',
        name: 'First Steps',
        description: 'Complete your first tutorial',
        condition: () => Object.values(userProgress.tutorials).some(t => t.completed),
        icon: '🎯',
        points: 50
      },
      {
        id: 'quick-learner',
        name: 'Quick Learner',
        description: 'Complete 5 tutorials',
        condition: () => Object.values(userProgress.tutorials).filter(t => t.completed).length >= 5,
        icon: '⚡',
        points: 200
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Score 100% on a quiz',
        condition: () => Object.values(userProgress.tutorials).some(t => 
          Object.values(t.quizScores).some(score => score === 100)
        ),
        icon: '💯',
        points: 100
      }
    ];

    achievements.forEach(achievement => {
      if (!userProgress.achievements.find(a => a.id === achievement.id) && 
          achievement.condition()) {
        this.awardAchievement(userProgress, {
          ...achievement,
          unlockedAt: new Date()
        });
      }
    });
  }

  /**
   * Award an achievement
   */
  private awardAchievement(userProgress: UserProgress, achievement: Achievement) {
    userProgress.achievements.push(achievement);
    userProgress.totalPoints += achievement.points;
  }

  /**
   * Save user progress
   */
  private saveProgress(userProgress: UserProgress) {
    // In a real app, this would persist to a database
    localStorage.setItem(`training-progress-${userProgress.userId}`, JSON.stringify(userProgress));
  }

  /**
   * Load user progress
   */
  loadProgress(userId: string): UserProgress | null {
    const saved = localStorage.getItem(`training-progress-${userId}`);
    if (saved) {
      const progress = JSON.parse(saved);
      // Convert date strings back to Date objects
      Object.values(progress.tutorials).forEach((t: any) => {
        t.startedAt = new Date(t.startedAt);
        t.lastAccessedAt = new Date(t.lastAccessedAt);
        if (t.certificate) {
          t.certificate.issueDate = new Date(t.certificate.issueDate);
        }
      });
      progress.achievements.forEach((a: any) => {
        a.unlockedAt = new Date(a.unlockedAt);
      });
      this.userProgress.set(userId, progress);
      return progress;
    }
    return null;
  }

  /**
   * Get user statistics
   */
  getUserStats(userId: string): UserStats {
    const progress = this.userProgress.get(userId);
    if (!progress) {
      return {
        tutorialsCompleted: 0,
        totalPoints: 0,
        level: 1,
        averageScore: 0,
        totalTime: 0,
        achievements: 0,
        certificates: 0
      };
    }

    const completedTutorials = Object.values(progress.tutorials).filter(t => t.completed);
    const totalTime = completedTutorials.reduce((sum, t) => 
      sum + (t.lastAccessedAt.getTime() - t.startedAt.getTime()), 0
    );
    const averageScore = completedTutorials.length > 0
      ? completedTutorials.reduce((sum, t) => sum + (t.certificate?.score || 0), 0) / completedTutorials.length
      : 0;

    return {
      tutorialsCompleted: completedTutorials.length,
      totalPoints: progress.totalPoints,
      level: progress.level,
      averageScore,
      totalTime,
      achievements: progress.achievements.length,
      certificates: completedTutorials.filter(t => t.certificate).length
    };
  }
}

/**
 * Tutorial Session
 */
export class TutorialSession {
  constructor(
    public tutorial: Tutorial,
    public tutorialProgress: TutorialProgress,
    public userProgress: UserProgress,
    private onUpdate: (session: TutorialSession) => void
  ) {}

  /**
   * Get current step
   */
  getCurrentStep(): TutorialStep {
    return this.tutorial.steps.find(s => s.id === this.tutorialProgress.currentStepId)!;
  }

  /**
   * Move to next step
   */
  nextStep(): TutorialStep | null {
    const currentIndex = this.tutorial.steps.findIndex(s => s.id === this.tutorialProgress.currentStepId);
    if (currentIndex < this.tutorial.steps.length - 1) {
      const nextStep = this.tutorial.steps[currentIndex + 1];
      this.tutorialProgress.currentStepId = nextStep.id;
      if (!this.tutorialProgress.completedSteps.includes(this.tutorial.steps[currentIndex].id)) {
        this.tutorialProgress.completedSteps.push(this.tutorial.steps[currentIndex].id);
      }
      this.onUpdate(this);
      return nextStep;
    }
    return null;
  }

  /**
   * Move to previous step
   */
  previousStep(): TutorialStep | null {
    const currentIndex = this.tutorial.steps.findIndex(s => s.id === this.tutorialProgress.currentStepId);
    if (currentIndex > 0) {
      const previousStep = this.tutorial.steps[currentIndex - 1];
      this.tutorialProgress.currentStepId = previousStep.id;
      this.onUpdate(this);
      return previousStep;
    }
    return null;
  }

  /**
   * Complete current step
   */
  completeCurrentStep() {
    const currentStep = this.getCurrentStep();
    if (!this.tutorialProgress.completedSteps.includes(currentStep.id)) {
      this.tutorialProgress.completedSteps.push(currentStep.id);
      this.onUpdate(this);
    }
  }

  /**
   * Submit quiz answer
   */
  submitQuizAnswer(quizId: string, answer: string | string[]): boolean {
    const quiz = this.tutorial.quizzes.find(q => q.id === quizId);
    if (!quiz) return false;

    const isCorrect = Array.isArray(quiz.correctAnswer)
      ? JSON.stringify((quiz.correctAnswer as string[]).sort()) === JSON.stringify((answer as string[]).sort())
      : quiz.correctAnswer === answer;

    this.tutorialProgress.quizScores[quizId] = isCorrect ? quiz.points : 0;
    this.onUpdate(this);
    
    return isCorrect;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    return Math.round((this.tutorialProgress.completedSteps.length / this.tutorial.steps.length) * 100);
  }
}

/**
 * User statistics
 */
export interface UserStats {
  tutorialsCompleted: number;
  totalPoints: number;
  level: number;
  averageScore: number;
  totalTime: number;
  achievements: number;
  certificates: number;
}

// Export singleton instance
export const trainingModeManager = new TrainingModeManager();