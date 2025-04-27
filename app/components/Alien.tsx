"use client";

interface AlienProps {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 1 | 2 | 3;
}

export default function Alien({ x, y, width, height, type = 1 }: AlienProps) {
  // Different colors and shapes based on alien type
  const getColorClass = () => {
    switch (type) {
      case 1: return 'bg-purple-500'; // Bottom rows
      case 2: return 'bg-blue-500';   // Middle rows
      case 3: return 'bg-red-500';    // Top rows
      default: return 'bg-purple-500';
    }
  };
  
  const getClipPath = () => {
    switch (type) {
      case 1: // Bottom rows - classic alien shape
        return 'polygon(0% 40%, 20% 0%, 40% 40%, 60% 40%, 80% 0%, 100% 40%, 100% 100%, 0% 100%)';
      case 2: // Middle rows - more rounded shape
        return 'polygon(0% 20%, 25% 0%, 75% 0%, 100% 20%, 100% 100%, 0% 100%)';
      case 3: // Top rows - more complex shape
        return 'polygon(50% 0%, 80% 20%, 100% 40%, 100% 100%, 0% 100%, 0% 40%, 20% 20%)';
      default:
        return 'polygon(0% 40%, 20% 0%, 40% 40%, 60% 40%, 80% 0%, 100% 40%, 100% 100%, 0% 100%)';
    }
  };
  
  return (
    <div 
      className={`absolute ${getColorClass()}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        clipPath: getClipPath()
      }}
    />
  );
} 