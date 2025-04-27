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
 * Gets the current device orientation
 * @returns 'portrait' | 'landscape' - The current orientation
 */
export const getDeviceOrientation = (): 'portrait' | 'landscape' => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
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
  }
};

/**
 * Exit fullscreen mode
 * @returns Promise that resolves when fullscreen is exited
 */
export const exitFullscreen = async (): Promise<void> => {
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
  
  return {
    enabled: isDeviceMobile,
    sensitivity: isDeviceMobile ? 1.5 : 1.0,
    deadzone: 0.05,
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