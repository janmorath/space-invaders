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
      
      // Add body class for landscape orientation
      if (newOrientation === 'landscape') {
        document.body.classList.add('landscape-orientation');
      } else {
        document.body.classList.remove('landscape-orientation');
      }
      
      console.log('Orientation changed to:', newOrientation);
    };
    
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Set initial orientation class
    handleOrientationChange();
    
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
    if (isMobile && orientation === 'landscape' && !isFullscreen()) {
      console.log('Home - Game area clicked in landscape, requesting fullscreen');
      try {
        await requestFullscreen(document.documentElement);
        // Add body class to ensure proper styling
        document.body.classList.add('ios-fullscreen');
        vibrate(15);
      } catch (error) {
        console.error('Error requesting fullscreen on click:', error);
        // Fallback if fullscreen fails
        document.body.classList.add('fullscreen-fallback');
      }
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
            try {
              window.scrollTo(0, 1);
              document.documentElement.style.position = 'fixed';
              document.documentElement.style.width = '100%';
              document.documentElement.style.height = '100%';
              document.documentElement.style.overflow = 'hidden';
              
              requestFullscreen(document.documentElement);
              document.body.classList.add('ios-fullscreen');
              vibrate(15);
            } catch (error) {
              console.error('Error requesting fullscreen on touch:', error);
              document.body.classList.add('fullscreen-fallback');
            }
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
