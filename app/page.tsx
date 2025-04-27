"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { isMobile } from './utils/device';
import OrientationWarning from './components/OrientationWarning';

// Use dynamic import with SSR disabled for the Game component
// because it uses browser APIs like requestAnimationFrame
const Game = dynamic(() => import('./components/Game'), {
  ssr: false,
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Check if we're on the client-side and detect mobile
  useEffect(() => {
    setIsClient(true);
    setIsMobileDevice(isMobile());
  }, []);

  if (!isClient) {
    // Server-side rendering or initial load
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-green-500">
        <p>Loading Space Invaders...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black p-2 md:p-4">
      {/* Mobile orientation warning */}
      <OrientationWarning />
      
      <h1 className="text-2xl md:text-3xl font-bold text-green-500 mb-4">SPACE INVADERS</h1>
      
      {/* Responsive container for the game */}
      <div className={`w-full max-w-[800px] ${isMobileDevice ? 'overflow-hidden touch-none' : ''}`}>
        <div className={`relative ${isMobileDevice ? 'transform-origin-top' : ''}`} 
             style={isMobileDevice ? {
               transform: window.innerWidth < 800 ? `scale(${window.innerWidth / 800})` : 'none',
               height: window.innerWidth < 800 ? `${600 * (window.innerWidth / 800)}px` : '600px',
               marginBottom: window.innerWidth < 800 ? '-200px' : '0'
             } : {}}>
          <Game />
        </div>
      </div>
      
      {isMobileDevice && (
        <div className="mt-6 text-xs text-green-500 text-center">
          <p>For the best experience, rotate your device to landscape mode.</p>
          <p className="mt-1">Tap to shoot, swipe to move!</p>
        </div>
      )}
      
      <footer className="mt-8 text-xs text-green-500 text-center">
        <p>Classic Space Invaders - A Next.js Game</p>
      </footer>
    </main>
  );
}
