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

// Type definitions
interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    mobile: boolean;
    // Other properties might exist but we only need mobile for now
  };
}

/**
 * Detects if the current device is a mobile device
 * @returns boolean - true if the device is mobile, false otherwise
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check with userAgent (most reliable)
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
  
  if (mobileRegex.test(userAgent)) {
    return true;
  }
  
  // Check with userAgentData API (newer browsers)
  const nav = navigator as NavigatorWithUserAgentData;
  if (nav.userAgentData && nav.userAgentData.mobile) {
    return true;
  }
  
  // Feature detection fallback
  if ('maxTouchPoints' in navigator) {
    return navigator.maxTouchPoints > 0;
  }
  
  // Screen size check as last resort
  const mobileScreenWidth = 768;
  if (window.innerWidth <= mobileScreenWidth) {
    return true;
  }
  
  return false;
}

/**
 * Detects if the current device is running iOS
 * @returns boolean - true if the device is using iOS, false otherwise
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Check for iOS devices including iPad (which may report as desktop in newer iOS)
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return true;
  }
  
  // iPad detection for iOS 13+ which reports as Mac
  if (/Mac OS/.test(userAgent) && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0) {
    return true;
  }
  
  return false;
}

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
export function getDeviceOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';
  
  // Use screen orientation API if available
  if (window.screen && window.screen.orientation) {
    const angle = window.screen.orientation.angle;
    return (angle === 0 || angle === 180) ? 'portrait' : 'landscape';
  }
  
  // Fallback to window dimensions
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

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
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    document.body.classList.contains('ios-fullscreen') ||
    document.body.classList.contains('fullscreen-fallback')
  );
}

/**
 * Request fullscreen mode for an element
 * @param element The HTML element to make fullscreen
 * @returns Promise that resolves when fullscreen is activated
 */
export async function requestFullscreen(element: HTMLElement = document.documentElement): Promise<void> {
  // Don't attempt fullscreen if already in fullscreen mode
  if (isFullscreen()) {
    return;
  }
  
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
    }
    
    // Add iOS fullscreen fallback
    if (isIOS()) {
      document.body.classList.add('ios-fullscreen');
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
      vibrate(15);
    }
  } catch (error) {
    console.error('Fullscreen request failed:', error);
    // Add fallback class for devices that don't support fullscreen
    document.body.classList.add('fullscreen-fallback');
  }
}

/**
 * Exit fullscreen mode
 * @returns Promise that resolves when fullscreen is exited
 */
export async function exitFullscreen(): Promise<void> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    }
    
    // Remove iOS fallback classes
    document.body.classList.remove('ios-fullscreen', 'fullscreen-fallback');
  } catch (error) {
    console.error('Exit fullscreen failed:', error);
    // Still remove the classes in case of error
    document.body.classList.remove('ios-fullscreen', 'fullscreen-fallback');
  }
}

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
export function vibrate(duration: number = 50): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

/**
 * Check if the device supports the Notification API
 */
export function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!supportsNotifications()) {
    return 'denied';
  }
  
  return await Notification.requestPermission();
}

/**
 * Send a notification to the user
 */
export function sendNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!supportsNotifications() || Notification.permission !== 'granted') {
    return null;
  }
  
  return new Notification(title, options);
} 