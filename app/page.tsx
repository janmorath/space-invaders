"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { isMobile as isMobileDevice, isIOS, getDeviceOrientation, isFullscreen, requestFullscreen, vibrate } from './utils/device';
import OrientationWarning from './components/OrientationWarning';
import HomeScreenPrompt from './components/HomeScreenPrompt';

// Use dynamic import with SSR disabled for the Game component
// because it uses browser APIs like requestAnimationFrame
const Game = dynamic(() => import('./components/Game'), {
  ssr: false,
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | null>(null);
  const [isFromHomeScreen, setIsFromHomeScreen] = useState(false);
  const gameWrapperRef = useRef<HTMLDivElement>(null);

  // Enhanced fullscreen function for mobile browsers
  const enterAggressiveFullscreen = async () => {
    // Try to scroll to hide browser UI
    setTimeout(() => window.scrollTo(0, 1), 100);
    
    // Force fixed positioning for viewport
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    // Apply iOS-specific styles
    if (isIOSDevice) {
      document.body.style.height = '120vh'; // Taller to force scroll
      document.body.style.position = 'fixed';
      document.body.classList.add('ios-fullscreen');
        
      // Create a hidden element to force scroll
      const scrollHelper = document.createElement('div');
      scrollHelper.style.position = 'absolute';
      scrollHelper.style.top = '0';
      scrollHelper.style.left = '0';
      scrollHelper.style.width = '100%';
      scrollHelper.style.height = '150vh';
      scrollHelper.style.opacity = '0';
      scrollHelper.style.pointerEvents = 'none';
      scrollHelper.style.zIndex = '-100';
      document.body.appendChild(scrollHelper);
      
      // Multiple scroll attempts to hide UI
      for (let i = 0; i < 5; i++) {
        setTimeout(() => window.scrollTo(0, 1), i * 300);
      }
      
      // Clean up helper element after use
      setTimeout(() => {
        document.body.removeChild(scrollHelper);
      }, 2000);
    }
    
    // Try to request proper fullscreen API
    try {
      await requestFullscreen(document.documentElement);
      vibrate(15);
    } catch (error) {
      console.error('Error requesting fullscreen:', error);
      // Fallback if fullscreen fails
      document.body.classList.add('fullscreen-fallback');
    }
  };

  // Set up client-side state once mounted
  useEffect(() => {
    setIsClient(true);
    setIsMobile(isMobileDevice());
    setIsIOSDevice(isIOS());
    setOrientation(getDeviceOrientation());
    
    // Check if app is running from home screen
    const isStandalone = 
      'standalone' in window.navigator && (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches;
    
    setIsFromHomeScreen(isStandalone);
    
    // Handle orientation changes
    const handleOrientationChange = () => {
      const newOrientation = getDeviceOrientation();
      setOrientation(newOrientation);
      
      const mobile = isMobileDevice();
      
      // Add body class for landscape orientation
      if (newOrientation === 'landscape') {
        document.body.classList.add('landscape-orientation');
        
        // Automatically try fullscreen on landscape for mobile
        if (mobile && !isFromHomeScreen) {
          enterAggressiveFullscreen();
        }
      } else {
        document.body.classList.remove('landscape-orientation');
      }
    };
    
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Set initial orientation class
    handleOrientationChange();
    
    // Apply fullscreen if launched from home screen
    if (isStandalone) {
      setTimeout(() => {
        enterAggressiveFullscreen();
      }, 500);
    }
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isFromHomeScreen]);

  // Handle clicks on the game area to try entering fullscreen
  const handleGameAreaClick = async (e: React.MouseEvent) => {
    // Don't handle clicks on buttons
    if (e.target instanceof HTMLButtonElement) {
      return;
    }
    
    // Try to enter fullscreen on game area click in landscape mode
    if (isMobile && orientation === 'landscape' && !isFullscreen()) {
      enterAggressiveFullscreen();
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
        id="game-wrapper"
        ref={gameWrapperRef}
        onClick={handleGameAreaClick}
        onTouchStart={(e) => {
          // Don't interfere with button clicks
          if (e.target instanceof HTMLButtonElement) {
            return;
          }
          
          // Try to enter fullscreen on touch in landscape mode
          if (isMobile && orientation === 'landscape' && !isFullscreen()) {
            enterAggressiveFullscreen();
          }
        }}
        className={`w-full max-w-[800px] ${
          isMobile ? 'overflow-hidden touch-manipulation' : ''
        } ${
          isIOSDevice ? 'ios-game-container' : ''
        } ${
          orientation === 'landscape' ? 'fullscreen-container flex items-center justify-center' : ''
        }`}
      >
        <div 
          className={`relative ${isMobile ? 'transform-origin-top' : ''}`} 
          style={isMobile ? {
            transform: orientation === 'landscape' 
              ? `scale(${Math.min(window.innerWidth / 800, window.innerHeight / 600)})` 
              : window.innerWidth < 800 ? `scale(${window.innerWidth / 800})` : 'none',
            height: window.innerWidth < 800 ? `${600 * (window.innerWidth / 800)}px` : '600px',
            marginBottom: window.innerWidth < 800 ? '-200px' : '0'
          } : {}}
        >
          <Game fullscreen={isMobile && orientation === 'landscape'} />
        </div>
      </div>
      
      {/* Mobile instructions shown only in portrait mode */}
      {isMobile && orientation === 'portrait' && (
        <div className="mt-6 text-xs text-green-500 text-center">
          <p>For the best experience, rotate your device to landscape mode.</p>
          <p className="mt-1">Tap to shoot, swipe to move!</p>
        </div>
      )}
      
      {/* Footer only shown in portrait */}
      {!orientation || orientation === 'portrait' ? (
        <footer className="mt-8 text-xs text-green-500 text-center">
          <p>Classic Space Invaders - A Next.js Game</p>
        </footer>
      ) : null}

      {/* Show homescreen prompt for mobile devices */}
      {isMobile && !isFromHomeScreen && <HomeScreenPrompt />}
    </main>
  );
}
