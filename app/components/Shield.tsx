"use client";

interface ShieldProps {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
}

export default function Shield({ x, y, width, height, health, maxHealth }: ShieldProps) {
  // Calculate opacity based on health percentage
  const healthPercentage = health / maxHealth;
  const opacity = Math.max(0.3, healthPercentage);
  
  return (
    <div 
      className="absolute bg-green-700"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: opacity,
        clipPath: 'polygon(0% 30%, 100% 30%, 100% 100%, 0% 100%)'
      }}
    />
  );
} 