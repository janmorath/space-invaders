"use client";

import { useState, useEffect } from 'react';
import { isMobile } from '../utils/device';

export default function OrientationWarning() {
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    const checkOrientation = () => {
      if (isMobile() && window.innerHeight > window.innerWidth) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };
    
    // Check on initial load
    checkOrientation();
    
    // Add event listener for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  
  if (!showWarning) return null;
  
  return (
    <div className="orientation-warning">
      <div className="orientation-warning-icon">⟳</div>
      <h2 className="text-2xl font-bold mb-4">Please Rotate Your Device</h2>
      <p>For the best Space Invaders experience, please rotate your device to landscape mode.</p>
    </div>
  );
} 