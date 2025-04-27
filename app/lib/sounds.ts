"use client";

// TypeScript declarations for WebKit AudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// Simple sound generator using the Web Audio API
// This is more reliable than loading external sound files

// Laser sound (player shooting)
export function playLaserSound(volume = 0.3) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
    
    return true;
  } catch (error) {
    console.error('Error playing laser sound:', error);
    return false;
  }
}

// Explosion sound (when hitting an alien)
export function playExplosionSound(volume = 0.3) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(110, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(55, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
    
    return true;
  } catch (error) {
    console.error('Error playing explosion sound:', error);
    return false;
  }
}

// Game over sound
export function playGameOverSound(volume = 0.3) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(55, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    
    return true;
  } catch (error) {
    console.error('Error playing game over sound:', error);
    return false;
  }
}

// Create a single audio context for the entire app
let audioCtx: AudioContext | null = null;

export function initAudioContext() {
  try {
    if (typeof window !== 'undefined' && !audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
      return true;
    }
    return !!audioCtx;
  } catch (error) {
    console.error('Error initializing audio context:', error);
    return false;
  }
}

export function getAudioContext() {
  return audioCtx;
} 