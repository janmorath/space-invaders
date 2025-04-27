"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { isMobile, getDeviceOrientation, requestFullscreen, isIOS, vibrate, exitFullscreen, isFullscreen } from './utils/device';
import OrientationWarning from './components/OrientationWarning';
import HomeScreenPrompt from './components/HomeScreenPrompt';

// Use dynamic import with SSR disabled for the Game component
// because it uses browser APIs like requestAnimationFrame
const Game = dynamic(() => import('./components/Game'), {
  ssr: false,
});

// Custom interface for Navigator to include standalone property
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isFromHomeScreen, setIsFromHomeScreen] = useState(false);
  const gameWrapperRef = useRef<HTMLDivElement>(null);

  // Check if we're on the client-side and detect mobile
  useEffect(() => {
    setIsClient(true);
    const mobile = isMobile();
    const iOS = isIOS();
    const currentOrientation = getDeviceOrientation();
    
    // Check if launched from homescreen or with fullscreen parameter
    const urlParams = new URLSearchParams(window.location.search);
    const fullscreenRequested = urlParams.get('fullscreen') === 'true';
    const isStandalone = (window.navigator as NavigatorWithStandalone).standalone || 
                        window.matchMedia('(display-mode: standalone)').matches ||
                        window.matchMedia('(display-mode: fullscreen)').matches;
    
    setIsFromHomeScreen(isStandalone || fullscreenRequested);
    
    setIsMobileDevice(mobile);
    setIsIOSDevice(iOS);
    setOrientation(currentOrientation);
    
    console.log('Home - Initial state:', { 
      mobile, 
      iOS, 
      orientation: currentOrientation,
      isFullscreen: isFullscreen(),
      isStandalone,
      fullscreenRequested,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    });

    // If launched from homescreen, immediately try to go fullscreen
    if (isStandalone || fullscreenRequested) {
      setTimeout(() => {
        requestFullscreen(document.documentElement);
        document.body.classList.add('ios-fullscreen');
        
        // More aggressive scrolling
        for (let i = 0; i < 20; i++) {
          setTimeout(() => {
            window.scrollTo(0, 1);
          }, i * 50);
        }
      }, 100);
    }

    // Special handling for iOS Safari
    if (iOS) {
      // Try to hide the URL bar using the minimal-ui approach
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 50);
      
      // Use a special technique for iOS Safari to hide chrome
      if (currentOrientation === 'landscape') {
        document.documentElement.style.position = 'fixed';
        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100%';
        document.documentElement.style.overflow = 'hidden';
        
        // Force iOS to use hardware acceleration
        document.body.style.transform = 'translate3d(0,0,0)';
        document.body.style.height = '100%';
        document.body.style.width = '100%';
        
        // Make the document slightly taller than the viewport
        // This is a trick that can help hide the URL bar
        const scrollHelper = document.createElement('div');
        scrollHelper.style.position = 'absolute';
        scrollHelper.style.height = '200%';
        scrollHelper.style.width = '100%';
        scrollHelper.style.pointerEvents = 'none';
        scrollHelper.style.top = '0';
        scrollHelper.style.left = '0';
        scrollHelper.style.zIndex = '-1000';
        scrollHelper.style.opacity = '0';
        document.body.appendChild(scrollHelper);
        
        // Try multiple times to hide the URL bar
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            window.scrollTo(0, 1);
          }, 100 + (i * 50));
        }
        
        // Clean up the helper after use
        setTimeout(() => {
          if (document.body.contains(scrollHelper)) {
            document.body.removeChild(scrollHelper);
          }
        }, 2000);
      }
    }

    const handleOrientationChange = async () => {
      const newOrientation = getDeviceOrientation();
      setOrientation(newOrientation);
      
      console.log('Home - Orientation changed:', { 
        newOrientation, 
        width: window.innerWidth, 
        height: window.innerHeight,
        isFullscreen: isFullscreen()
      });
      
      if (mobile) {
        // Apply fullscreen in landscape mode
        if (newOrientation === 'landscape') {
          console.log('Home - Landscape detected, requesting fullscreen');
          
          // Only request fullscreen if not already in fullscreen
          if (!isFullscreen()) {
            // Force fullscreen on landscape orientation
            try {
              await requestFullscreen(document.documentElement);
              // Add body class to ensure proper styling
              document.body.classList.add('ios-fullscreen');
              vibrate(20);
            } catch (error) {
              console.error('Error requesting fullscreen:', error);
              // Fallback if fullscreen fails
              document.body.classList.add('fullscreen-fallback');
            }
          }
        } 
        // Exit fullscreen in portrait mode
        else if (newOrientation === 'portrait') {
          console.log('Home - Portrait detected, exiting fullscreen');
          try {
            await exitFullscreen();
            document.body.classList.remove('ios-fullscreen', 'fullscreen-fallback');
          } catch (error) {
            console.error('Error exiting fullscreen:', error);
          }
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
    
    // And another check a bit later to ensure proper detection
    setTimeout(() => {
      handleOrientationChange();
    }, 1500);

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
    if (isMobileDevice && orientation === 'landscape' && !isFullscreen()) {
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
            // Allow button events to propagate naturally
            return;
          }
          
          console.log('Touch detected on game wrapper');
          
          // Try to enter fullscreen on touch in landscape mode
          if (isMobileDevice && orientation === 'landscape' && !isFullscreen()) {
            console.log('Attempting fullscreen from touch in game wrapper');
            try {
              // Try to hide browser UI by scrolling
              window.scrollTo(0, 1);
              
              // Force iOS fullscreen
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
        className={`w-full max-w-[800px] ${isMobileDevice ? 'overflow-hidden touch-manipulation' : ''} ${isIOSDevice ? 'ios-game-container' : ''} ${orientation === 'landscape' ? 'fullscreen-container' : ''}`}
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

      {/* Show homescreen prompt for mobile devices */}
      {isMobileDevice && !isFromHomeScreen && <HomeScreenPrompt />}
    </main>
  );
}
