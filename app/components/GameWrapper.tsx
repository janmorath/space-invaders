"use client";

import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for the Game component
// because it uses browser APIs like requestAnimationFrame
const Game = dynamic(() => import('./Game'), {
  ssr: false,
});

export default function GameWrapper() {
  return <Game />;
} 