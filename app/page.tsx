"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { isMobile, getDeviceOrientation, requestFullscreen, isIOS, vibrate, isFullscreen, exitFullscreen } from './utils/device';
import OrientationWarning from './components/OrientationWarning';

// Use dynamic import with SSR disabled for the Game component
// because it uses browser APIs like requestAnimationFrame
const Game = dynamic(() => import('./components/Game'), {
  ssr: false,
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const gameWrapperRef = useRef<HTMLDivElement>(null);

  // Check if we're on the client-side and detect mobile
  useEffect(() => {
    setIsClient(true);
    const mobile = isMobile();
    const iOS = isIOS();
    setIsMobileDevice(mobile);
    setIsIOSDevice(iOS);
    setOrientation(getDeviceOrientation());

    const handleOrientationChange = async () => {
      const newOrientation = getDeviceOrientation();
      setOrientation(newOrientation);
      
      if (mobile) {
        // Apply fullscreen in landscape mode
        if (newOrientation === 'landscape') {
          console.log('Landscape detected, requesting fullscreen');
          // Force fullscreen on landscape orientation
          await requestFullscreen(document.documentElement);
        } 
        // Exit fullscreen in portrait mode
        else if (newOrientation === 'portrait') {
          console.log('Portrait detected, exiting fullscreen');
          await exitFullscreen();
        }
      }
    };

    // Add event listeners for orientation changes
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Force a check when the component mounts
    setTimeout(() => {
      handleOrientationChange();
    }, 500);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Handle clicks on the game area to try entering fullscreen
  const handleGameAreaClick = async (e: React.MouseEvent) => {
    // Don't handle clicks on buttons
    if (e.target instanceof HTMLButtonElement) {
      return;
    }
    
    // Try to enter fullscreen on game area click in landscape mode
    if (isMobileDevice && orientation === 'landscape') {
      console.log('Game area clicked in landscape, requesting fullscreen');
      await requestFullscreen(document.documentElement);
      vibrate(15);
    }
  };

  if (!isClient) {
    // Server-side rendering or initial load
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-green-500">
        <p>Loading Space Invaders...</p>
      </div>
    );
  }

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center bg-black ${orientation === 'landscape' ? 'p-0' : 'p-4'} ${isIOSDevice && orientation === 'landscape' ? 'ios-landscape' : ''}`}>
      {/* Only show orientation warning in portrait mode */}
      {orientation === 'portrait' && <OrientationWarning />}
      
      {!orientation || orientation === 'portrait' ? (
        <h1 className="text-2xl md:text-3xl font-bold text-green-500 mb-4">SPACE INVADERS</h1>
      ) : null}
      
      {/* Responsive container for the game */}
      <div 
        ref={gameWrapperRef}
        onClick={handleGameAreaClick}
        onTouchStart={(e) => {
          // Don't interfere with button clicks
          if (e.target instanceof HTMLButtonElement) {
            return;
          }
          
          // Try to enter fullscreen on touch in landscape mode
          if (isMobileDevice && orientation === 'landscape') {
            requestFullscreen(document.documentElement);
          }
        }}
        className={`w-full max-w-[800px] ${isMobileDevice ? 'overflow-hidden' : ''} ${isIOSDevice ? 'ios-game-container' : ''} ${orientation === 'landscape' ? 'fullscreen-container' : ''}`}
      >
        <div 
          className={`relative ${isMobileDevice ? 'transform-origin-top' : ''}`} 
          style={isMobileDevice ? {
            transform: window.innerWidth < 800 ? `scale(${window.innerWidth / 800})` : 'none',
            height: window.innerWidth < 800 ? `${600 * (window.innerWidth / 800)}px` : '600px',
            marginBottom: window.innerWidth < 800 ? '-200px' : '0'
          } : {}}
        >
          <Game fullscreen={isMobileDevice && orientation === 'landscape'} />
        </div>
      </div>
      
      {isMobileDevice && orientation === 'portrait' && (
        <div className="mt-6 text-xs text-green-500 text-center">
          <p>For the best experience, rotate your device to landscape mode.</p>
          <p className="mt-1">Tap to shoot, swipe to move!</p>
        </div>
      )}
      
      {!orientation || orientation === 'portrait' ? (
        <footer className="mt-8 text-xs text-green-500 text-center">
          <p>Classic Space Invaders - A Next.js Game</p>
        </footer>
      ) : null}
    </main>
  );
}
