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
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
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
      console.log('Orientation changed to:', newOrientation);
      setOrientation(newOrientation);
      
      if (mobile) {
        // Go fullscreen in landscape, exit in portrait
        if (newOrientation === 'landscape') {
          // Only request fullscreen if we're not already in fullscreen
          if (!isFullscreen() && !document.body.classList.contains('ios-fullscreen')) {
            console.log('Requesting fullscreen for landscape');
            setTimeout(() => {
              handleFullscreen();
            }, 300);
          }
        } else if (newOrientation === 'portrait') {
          // Exit fullscreen in portrait mode
          console.log('Exiting fullscreen for portrait');
          try {
            await exitFullscreen();
            setIsFullscreenMode(false);
            document.body.classList.remove('ios-fullscreen', 'fullscreen-fallback');
          } catch (error) {
            console.error('Error exiting fullscreen:', error);
          }
        }
      }
    };

    // Function to handle fullscreen request
    const handleFullscreen = async () => {
      try {
        console.log('Handling fullscreen request');
        // Prefer requesting fullscreen on the document element for better coverage
        await requestFullscreen(document.documentElement);
        setIsFullscreenMode(true);
      } catch (error) {
        console.error('Error enabling fullscreen:', error);
      }
    };

    // Check fullscreen status periodically
    const fullscreenInterval = setInterval(() => {
      if (mobile) {
        const fullscreenStatus = isFullscreen() || document.body.classList.contains('ios-fullscreen');
        if (fullscreenStatus !== isFullscreenMode) {
          console.log('Fullscreen status changed to:', fullscreenStatus);
          setIsFullscreenMode(fullscreenStatus);
        }
      }
    }, 1000);

    // Add event listeners
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Initial orientation check
    handleOrientationChange();

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearInterval(fullscreenInterval);
    };
  }, []);

  // Handle clicks on the game area for fullscreen on iOS devices
  const handleGameAreaClick = async (e: React.MouseEvent) => {
    // Don't trigger fullscreen if clicking on a button
    if (e.target instanceof HTMLButtonElement) {
      return;
    }
    
    e.stopPropagation();
    
    if (isMobileDevice && orientation === 'landscape' && !isFullscreenMode) {
      console.log('Game area clicked, requesting fullscreen');
      await requestFullscreen(document.documentElement);
      vibrate(15);
      setIsFullscreenMode(true);
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
    <main className={`min-h-screen flex flex-col items-center justify-center bg-black p-2 md:p-4 ${isIOSDevice && orientation === 'landscape' ? 'ios-landscape' : ''}`}>
      {/* Only show orientation warning in portrait mode */}
      {orientation === 'portrait' && <OrientationWarning />}
      
      <h1 className="text-2xl md:text-3xl font-bold text-green-500 mb-4">SPACE INVADERS</h1>
      
      {/* Responsive container for the game */}
      <div 
        ref={gameWrapperRef}
        onClick={handleGameAreaClick}
        onTouchStart={(e) => {
          // Don't prevent default for button clicks
          if (e.target instanceof HTMLButtonElement) {
            return;
          }
          
          if (isMobileDevice && orientation === 'landscape' && !isFullscreenMode) {
            e.preventDefault();
            requestFullscreen(document.documentElement);
          }
        }}
        className={`w-full max-w-[800px] ${isMobileDevice ? 'overflow-hidden' : ''} ${isIOSDevice ? 'ios-game-container' : ''}`}
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
      
      {/* Only show fullscreen button in landscape mode when not in fullscreen */}
      {!isFullscreenMode && isMobileDevice && orientation === 'landscape' && (
        <button
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-bold game-control-button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            requestFullscreen(document.documentElement);
            vibrate(20);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Enter Fullscreen
        </button>
      )}
      
      <footer className="mt-8 text-xs text-green-500 text-center">
        <p>Classic Space Invaders - A Next.js Game</p>
      </footer>
    </main>
  );
}
