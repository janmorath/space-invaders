// Type declarations for component modules
declare module './components/Player' {
  interface PlayerProps {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  const Player: React.FC<PlayerProps>;
  export default Player;
}

declare module './components/Alien' {
  interface AlienProps {
    x: number;
    y: number;
    width: number;
    height: number;
    type?: 1 | 2 | 3;
  }
  const Alien: React.FC<AlienProps>;
  export default Alien;
}

declare module './components/Projectile' {
  interface ProjectileProps {
    x: number;
    y: number;
    width: number;
    height: number;
    isPlayer: boolean;
  }
  const Projectile: React.FC<ProjectileProps>;
  export default Projectile;
}

declare module './components/GameOver' {
  interface GameOverProps {
    score: number;
    onRestart: () => void;
    victory: boolean;
    highScore?: number;
    wave?: number;
  }
  const GameOver: React.FC<GameOverProps>;
  export default GameOver;
}

declare module './components/Shield' {
  interface ShieldProps {
    x: number;
    y: number;
    width: number;
    height: number;
    health: number;
    maxHealth: number;
  }
  const Shield: React.FC<ShieldProps>;
  export default Shield;
} 