"use client";

import { useState, useEffect, useRef } from 'react';
import { isMobile, getDeviceOrientation, requestFullscreen } from '../utils/device';

export default function OrientationWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkOrientation = async () => {
      const isMobileDevice = isMobile();
      const orientation = getDeviceOrientation();
      
      if (isMobileDevice && orientation === 'portrait') {
        setShowWarning(true);
      } else {
        setShowWarning(false);
        
        // If on mobile and in landscape, try to go fullscreen
        if (isMobileDevice && orientation === 'landscape') {
          try {
            // Try to request fullscreen on the game wrapper
            // We use a timeout to ensure this happens after the orientation change is complete
            setTimeout(async () => {
              const root = document.documentElement;
              await requestFullscreen(root);
            }, 300);
          } catch (error) {
            console.error('Error enabling fullscreen:', error);
          }
        }
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
    <div className="orientation-warning" ref={wrapperRef}>
      <div className="orientation-warning-icon">⟳</div>
      <h2 className="text-2xl font-bold mb-4">Please Rotate Your Device</h2>
      <p>For the best Space Invaders experience, please rotate your device to landscape mode.</p>
    </div>
  );
} 