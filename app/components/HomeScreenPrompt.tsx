"use client";

import { useState, useEffect } from 'react';
import { isIOS } from '../utils/device';

export default function HomeScreenPrompt() {
  const [show, setShow] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  
  useEffect(() => {
    // Check if app is already in standalone mode
    const isStandalone = 
      'standalone' in window.navigator && (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches;
    
    // Only show prompt if not already in standalone mode
    setShow(!isStandalone);
    setIsIOSDevice(isIOS());
  }, []);
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80 p-4 z-50 border-t-2 border-green-500">
      <div className="flex flex-col items-center text-green-500 text-sm mb-2">
        <p className="mb-1 font-bold">For the best fullscreen experience:</p>
        {isIOSDevice ? (
          <>
            <p>1. Tap the share button <span className="text-lg">⤴</span></p>
            <p>2. Select "Add to Home Screen" <span className="text-lg">+</span></p>
          </>
        ) : (
          <>
            <p>1. Open browser menu <span className="text-lg">⋮</span></p>
            <p>2. Select "Add to Home screen" <span className="text-lg">+</span></p>
          </>
        )}
      </div>
      
      <div className="flex justify-between">
        <a 
          href="/homescreen.html" 
          className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold"
        >
          Fullscreen Mode
        </a>
        
        <button 
          onClick={() => setShow(false)} 
          className="bg-transparent border border-green-500 text-green-500 px-4 py-2 rounded text-sm"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
} 