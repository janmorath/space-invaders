"use client";

import { useState, useEffect, useRef } from 'react';
import { isMobile, getDeviceOrientation, requestFullscreen, vibrate, exitFullscreen } from '../utils/device';

export default function OrientationWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Function to handle manual fullscreen request
  const handleFullscreenRequest = async () => {
    try {
      // Encourage the user to rotate their device
      vibrate([50, 100, 50]);
      
      // Hide the warning
      setShowWarning(false);
    } catch (error) {
      console.error('Error requesting fullscreen:', error);
    }
  };
  
  useEffect(() => {
    const checkOrientation = async () => {
      const isMobileDevice = isMobile();
      const orientation = getDeviceOrientation();
      
      // Show warning if portrait, hide if landscape
      if (isMobileDevice && orientation === 'portrait') {
        setShowWarning(true);
        
        // Exit fullscreen when in portrait mode
        try {
          await exitFullscreen();
        } catch (error) {
          console.log('Error exiting fullscreen:', error);
        }
      } else {
        setShowWarning(false);
        
        // Go fullscreen when in landscape mode
        if (isMobileDevice && orientation === 'landscape') {
          try {
            // Use a timeout to ensure the orientation change is complete
            setTimeout(async () => {
              await requestFullscreen(document.documentElement);
            }, 500);
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
      <p className="mb-6">For the best Space Invaders experience, please rotate your device to landscape mode.</p>
      
      <button 
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold game-control-button"
        onClick={handleFullscreenRequest}
        onTouchStart={(e) => e.preventDefault()}
      >
        Rotate & Go Fullscreen
      </button>
    </div>
  );
} 