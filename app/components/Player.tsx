"use client";

interface PlayerProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Player({ x, y, width, height }: PlayerProps) {
  return (
    <div 
      className="absolute bg-green-500"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        clipPath: 'polygon(0% 100%, 100% 100%, 100% 40%, 50% 0%, 0% 40%)'
      }}
    />
  );
} 