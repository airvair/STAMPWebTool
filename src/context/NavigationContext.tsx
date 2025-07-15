import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnalysisType } from '@/types/types';

export type AnalysisStep = 
  | 'scope'
  | 'control-structure'
  | 'uca'
  | 'scenarios'
  | 'requirements';

interface NavigationContextType {
  currentStep: AnalysisStep;
  stepHistory: AnalysisStep[];
  analysisType: AnalysisType | null;
  navigateToStep: (step: AnalysisStep) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  setAnalysisType: (type: AnalysisType) => void;
  resetNavigation: () => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('scope');
  const [stepHistory, setStepHistory] = useState<AnalysisStep[]>(['scope']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);

  const navigateToStep = useCallback((step: AnalysisStep) => {
    setCurrentStep(step);
    
    // Add to history, removing any forward history
    setStepHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(step);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < stepHistory.length - 1;

  const goBack = useCallback(() => {
    if (canGoBack) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentStep(stepHistory[newIndex]);
    }
  }, [canGoBack, historyIndex, stepHistory]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentStep(stepHistory[newIndex]);
    }
  }, [canGoForward, historyIndex, stepHistory]);

  const resetNavigation = useCallback(() => {
    setCurrentStep('scope');
    setStepHistory(['scope']);
    setHistoryIndex(0);
    setAnalysisType(null);
  }, []);

  const value: NavigationContextType = {
    currentStep,
    stepHistory,
    analysisType,
    navigateToStep,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    setAnalysisType,
    resetNavigation,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};