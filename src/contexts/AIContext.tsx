import { createContext, useContext, useState, ReactNode } from 'react';

interface AIContextType {
  isGenerating: boolean;
  lastGenerationStatus: 'success' | 'fallback' | null;
  setGenerating: (generating: boolean) => void;
  setLastGenerationStatus: (status: 'success' | 'fallback' | null) => void;
  startGeneration: () => void;
  completeGeneration: (success: boolean) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider = ({ children }: AIProviderProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerationStatus, setLastGenerationStatus] = useState<'success' | 'fallback' | null>(null);

  const setGenerating = (generating: boolean) => {
    setIsGenerating(generating);
  };

  const startGeneration = () => {
    setIsGenerating(true);
    setLastGenerationStatus(null);
  };

  const completeGeneration = (success: boolean) => {
    setIsGenerating(false);
    setLastGenerationStatus(success ? 'success' : 'fallback');
  };

  const value = {
    isGenerating,
    lastGenerationStatus,
    setGenerating,
    setLastGenerationStatus,
    startGeneration,
    completeGeneration,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};
