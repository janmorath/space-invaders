/**
 * Device detection utility functions for the Space Invaders game
 * Provides methods to detect mobile devices, handle orientation changes,
 * and manage device-specific functionality
 */

// Define an interface for Window with opera property
interface WindowWithOpera extends Window {
  opera?: unknown;
  MSStream?: unknown; // For IE detection
}

// Type definitions
interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    mobile: boolean;
    // Other properties might exist but we only need mobile for now
  };
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

// Define screen orientation interface
interface ScreenOrientationType {
  angle: number;
  type: string;
  lock?: (orientation: OrientationLockType) => Promise<void>;
  unlock?: () => void;
}

/**
 * Detects if the current device is a mobile device
 * @returns boolean - true if the device is mobile, false otherwise
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check with userAgent (most reliable)
  const userAgent = navigator.userAgent || navigator.vendor || '';
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
  
  const userAgent = navigator.userAgent || navigator.vendor || '';
  
  // Check for iOS devices including iPad (which may report as desktop in newer iOS)
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as WindowWithOpera).MSStream) {
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
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ||
    (document as Document & { mozFullScreenElement?: Element | null }).mozFullScreenElement ||
    (document as Document & { msFullscreenElement?: Element | null }).msFullscreenElement ||
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
    // For mobile browsers, it's often best to use the screen orientation API first
    if (typeof screen !== 'undefined' && screen.orientation) {
      try {
        // Cast to our interface that includes the lock method
        const orientation = screen.orientation as ScreenOrientationType;
        if (orientation.lock) {
          await orientation.lock('landscape');
          console.log('Screen orientation locked to landscape');
        }
      } catch (orientationError) {
        console.warn('Could not lock screen orientation:', orientationError);
      }
    }
    
    // Use standard fullscreen API
    if (element.requestFullscreen) {
      console.log('Using standard requestFullscreen API');
      await element.requestFullscreen();
    } else if ((element as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
      console.log('Using webkit requestFullscreen API');
      await (element as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
    } else if ((element as HTMLElement & { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
      console.log('Using MS requestFullscreen API');
      await (element as HTMLElement & { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
    } else if ((element as HTMLElement & { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) {
      console.log('Using Moz requestFullscreen API');
      await (element as HTMLElement & { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen();
    }
    
    // Add iOS fullscreen fallback
    if (isIOS()) {
      document.body.classList.add('ios-fullscreen');
      // iOS specific - scroll to top and prevent scrolling
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.width = '100%';
      document.documentElement.style.height = '100%';
      
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
      vibrate(15);
    }
  } catch (error) {
    console.error('Fullscreen request failed:', error);
    // Add fallback class for devices that don't support fullscreen
    document.body.classList.add('fullscreen-fallback');
    
    // Try to at least hide the browser UI by scrolling to fullscreen
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 100);
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
    } else if ((document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
      await (document as Document & { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
    } else if ((document as Document & { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
      await (document as Document & { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
    } else if ((document as Document & { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) {
      await (document as Document & { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen();
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
 * @param pattern Vibration pattern in milliseconds (single number or pattern array)
 */
export function vibrate(pattern: number | number[] = 50): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
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