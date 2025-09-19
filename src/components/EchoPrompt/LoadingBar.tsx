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
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 transition-all duration-300 ease-out shadow-lg"
          style={{ 
            width: `${progress}%`,
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
          }}
        />
      </div>
    </div>
  );
};

export default LoadingBar;
