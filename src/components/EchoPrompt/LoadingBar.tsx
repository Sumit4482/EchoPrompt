import { useEffect, useState } from "react";

interface LoadingBarProps {
  isVisible: boolean;
  duration?: number; // Expected duration in milliseconds
  className?: string;
}

const LoadingBar = ({ 
  isVisible, 
  duration = 3000, 
  className = "" 
}: LoadingBarProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 95); // Cap at 95% until completion
      setProgress(newProgress);
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, duration]);

  useEffect(() => {
    if (isVisible) {
      // Complete the progress bar when visible
      const timer = setTimeout(() => {
        setProgress(100);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] animate-fade-in ${className}`}>
      <div className="h-[2px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600"
          style={{
            width: `${progress}%`,
            transition: 'width 120ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.6), 0 0 4px rgba(139, 92, 246, 0.4)',
          }}
        />
      </div>
    </div>
  );
};

export default LoadingBar;
