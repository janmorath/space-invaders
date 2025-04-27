"use client";

import { useState, useEffect, useRef } from 'react';
import { isMobile, getDeviceOrientation, requestFullscreen, vibrate, exitFullscreen } from '../utils/device';

export default function OrientationWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkOrientation = async () => {
      const isMobileDevice = isMobile();
      const orientation = getDeviceOrientation();
      
      // Only show warning in portrait mode
      if (isMobileDevice && orientation === 'portrait') {
        setShowWarning(true);
        
        // Exit fullscreen when in portrait
        try {
          await exitFullscreen();
          document.body.classList.remove('ios-fullscreen', 'fullscreen-fallback');
        } catch (error) {
          console.log('Error exiting fullscreen:', error);
        }
      } else {
        // Hide warning and enter fullscreen when in landscape
        setShowWarning(false);
        
        if (isMobileDevice && orientation === 'landscape') {
          try {
            // Force fullscreen on landscape orientation
            await requestFullscreen(document.documentElement);
            // Give haptic feedback when entering fullscreen
            vibrate(30);
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