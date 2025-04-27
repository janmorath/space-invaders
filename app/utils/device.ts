/**
 * Device detection utility functions for the Space Invaders game
 * Provides methods to detect mobile devices, handle orientation changes,
 * and manage device-specific functionality
 */

// Define an interface for Window with opera property
interface WindowWithOpera extends Window {
  opera?: {
    toString: () => string;
  };
  MSStream?: any; // For IE detection
}

// Define orientation lock types
type OrientationLockType = 
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

// Create custom screen interface without extending the built-in one
interface CustomScreen {
  orientation?: {
    lock?: (orientation: OrientationLockType) => Promise<void>;
    type?: string;
    angle?: number;
  };
}

// Fullscreen API has cross-browser variations
interface FullscreenDocument {
  fullscreenElement: Element | null;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  exitFullscreen: () => Promise<void>;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface FullscreenElement {
  requestFullscreen: (options?: FullscreenOptions) => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

/**
 * Detects if the current device is a mobile device
 * @returns boolean - true if the device is mobile, false otherwise
 */
export const isMobile = (): boolean => {
  // Use multiple detection methods for better accuracy
  
  // Method 1: User agent detection
  const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || navigator.vendor || ((window as WindowWithOpera).opera?.toString() || '')
  );
  
  // Method 2: Touch capability detection
  const touchCheck = (
    'ontouchstart' in window || 
    navigator.maxTouchPoints > 0
  );
  
  // Method 3: Screen size detection
  const screenCheck = window.innerWidth <= 768;
  
  // Consider a device mobile if at least two of these checks are true
  const checkCount = [userAgentCheck, touchCheck, screenCheck].filter(Boolean).length;
  
  return checkCount >= 2;
};

/**
 * Detects if the current device is running iOS
 * @returns boolean - true if the device is using iOS, false otherwise
 */
export const isIOS = (): boolean => {
  // More reliable iOS detection
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) && 
         !(window as WindowWithOpera).MSStream && 
         // Additional check for iOS Safari
         ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);
};

/**
 * Detects if the device is an iPhone
 * @returns boolean - true if the device is an iPhone, false otherwise
 */
export const isIPhone = (): boolean => {
  return /iPhone/.test(navigator.userAgent) && !(window as WindowWithOpera).MSStream;
};

/**
 * Gets the current device orientation
 * @returns 'portrait' | 'landscape' - The current orientation
 */
export const getDeviceOrientation = (): 'portrait' | 'landscape' => {
  // Simplify orientation detection - this is more reliable
  // Check width vs height since that's the true indicator regardless of device API
  return window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
};

/**
 * Hook for handling device orientation changes
 * @param callback Function to call when orientation changes
 */
export const useOrientationChange = (callback: (orientation: 'portrait' | 'landscape') => void): void => {
  window.addEventListener('resize', () => {
    const orientation = getDeviceOrientation();
    callback(orientation);
  });
};

/**
 * Detects if the current document is in fullscreen mode
 * @returns boolean - true if in fullscreen mode
 */
export const isFullscreen = (): boolean => {
  const doc = document as unknown as FullscreenDocument;
  return !!(doc.fullscreenElement || 
            doc.webkitFullscreenElement || 
            doc.mozFullScreenElement ||
            doc.msFullscreenElement);
};

/**
 * Request fullscreen mode for an element
 * @param element The HTML element to make fullscreen
 * @returns Promise that resolves when fullscreen is activated
 */
export const requestFullscreen = async (element: HTMLElement | null): Promise<void> => {
  if (!element) return;
  
  const fullscreenElement = element as unknown as FullscreenElement;
  
  try {
    // Special case for iOS Safari which doesn't support true fullscreen API
    if (isIOS()) {
      // On iOS, we'll rely on CSS for a fullscreen-like experience
      document.body.classList.add('ios-fullscreen');
      
      // Force orientation to landscape on iOS if possible
      try {
        const customScreen = window.screen as unknown as CustomScreen;
        if (customScreen.orientation && customScreen.orientation.lock) {
          await customScreen.orientation.lock('landscape');
        }
      } catch (error) {
        console.log('Could not lock orientation: ', error);
      }
      
      // Hide browser UI by scrolling
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 300);
      
      return;
    }
    
    // Try standard fullscreen API with fallbacks
    if (fullscreenElement.requestFullscreen) {
      await fullscreenElement.requestFullscreen();
    } else if (fullscreenElement.webkitRequestFullscreen) {
      await fullscreenElement.webkitRequestFullscreen();
    } else if (fullscreenElement.mozRequestFullScreen) {
      await fullscreenElement.mozRequestFullScreen();
    } else if (fullscreenElement.msRequestFullscreen) {
      await fullscreenElement.msRequestFullscreen();
    }
  } catch (error) {
    console.error('Error attempting to enable fullscreen:', error);
    
    // Fallback: Add fullscreen class if fullscreen API fails
    document.body.classList.add('fullscreen-fallback');
    
    // Hide browser UI by scrolling
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 300);
  }
};

/**
 * Exit fullscreen mode
 * @returns Promise that resolves when fullscreen is exited
 */
export const exitFullscreen = async (): Promise<void> => {
  // Remove iOS and fallback classes first
  document.body.classList.remove('ios-fullscreen', 'fullscreen-fallback');
  
  const doc = document as unknown as FullscreenDocument;
  
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
  } catch (error) {
    console.error('Error attempting to exit fullscreen:', error);
  }
};

/**
 * Detects if the device is in low-performance mode
 * This can be used to reduce graphics quality on older mobile devices
 * @returns boolean - true if the device is likely to have lower performance
 */
export const isLowPerformanceDevice = (): boolean => {
  // Check if it's a mobile device
  if (!isMobile()) return false;
  
  // Additional checks could include:
  // - Older browsers
  // - Low memory
  // - Low CPU cores
  
  // For now, use a simple heuristic based on screen resolution
  return window.innerWidth * window.innerHeight < 500000;
};

/**
 * Gets appropriate touch controls configuration based on the device
 * @returns Object with touch controls configuration
 */
export const getTouchControlsConfig = () => {
  const isDeviceMobile = isMobile();
  const iOS = isIOS();
  
  return {
    enabled: isDeviceMobile,
    sensitivity: isDeviceMobile ? (iOS ? 2.0 : 1.5) : 1.0, // Higher sensitivity for iOS
    deadzone: iOS ? 0.03 : 0.05, // Lower deadzone for iOS
  };
};

/**
 * Checks if the device has vibration capability
 * @returns boolean - true if the device supports vibration
 */
export const hasVibrationSupport = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Triggers device vibration if supported
 * @param pattern Vibration pattern in milliseconds
 */
export const vibrate = (pattern: number | number[]): void => {
  if (hasVibrationSupport()) {
    navigator.vibrate(pattern);
  }
}; 