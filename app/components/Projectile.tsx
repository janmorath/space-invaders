"use client";

interface ProjectileProps {
  x: number;
  y: number;
  width: number;
  height: number;
  isPlayer: boolean;
}

export default function Projectile({ x, y, width, height, isPlayer }: ProjectileProps) {
  return (
    <div 
      className={`absolute ${isPlayer ? 'bg-green-400' : 'bg-red-500'}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
} 