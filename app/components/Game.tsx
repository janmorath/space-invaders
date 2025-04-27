"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Player from './Player';
import Alien from './Alien';
import Projectile from './Projectile';
import GameOver from './GameOver';
import Shield from './Shield';
import { playLaserSound, playExplosionSound, playGameOverSound, initAudioContext } from '../lib/sounds';
import { isMobile, getTouchControlsConfig, vibrate } from '../utils/device';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 40;
const ALIEN_WIDTH = 40;
const ALIEN_HEIGHT = 30;
const ALIEN_ROWS = 5;
const ALIEN_COLUMNS = 10;
const ALIEN_HORIZONTAL_SPACING = 60;
const ALIEN_VERTICAL_SPACING = 50;
const ALIEN_VERTICAL_START = 50;
const PROJECTILE_WIDTH = 4;
const PROJECTILE_HEIGHT = 15;
const PROJECTILE_SPEED = 8;
const ALIEN_PROJECTILE_SPEED = 5;
const PLAYER_SPEED = 8;
const ALIEN_SPEED = 1;
const SHIELD_WIDTH = 100;
const SHIELD_HEIGHT = 50;
const SHIELD_COUNT = 4;
const SHIELD_MAX_HEALTH = 100;
const LOCAL_STORAGE_HIGH_SCORE_KEY = 'spaceInvaders_highScore';
const WAVE_SPEED_INCREMENT = 0.2; // Speed increase per wave

interface GameProps {
  fullscreen?: boolean;
}

export default function Game({ fullscreen = false }: GameProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [playerPosition, setPlayerPosition] = useState({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 20 });
  const [aliens, setAliens] = useState<{ id: number; x: number; y: number; alive: boolean; type: 1 | 2 | 3; points: number }[]>([]);
  const [projectiles, setProjectiles] = useState<{ id: number; x: number; y: number; isPlayer: boolean }[]>([]);
  const [shields, setShields] = useState<{ id: number; x: number; y: number; health: number }[]>([]);
  const [keys, setKeys] = useState({ left: false, right: false, space: false });
  const [alienDirection, setAlienDirection] = useState(1);
  const [alienSpeed, setAlienSpeed] = useState(ALIEN_SPEED);
  const [waveCompleteMessage, setWaveCompleteMessage] = useState(false);
  const lastTimeRef = useRef(0);
  const shotCooldownRef = useRef(0);
  const alienShotCooldownRef = useRef(0);
  const gameIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const waveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sound effects
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  
  // Device detection
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [touchControls, setTouchControls] = useState({ enabled: false, sensitivity: 1.0, deadzone: 0.05 });
  const touchStartXRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // Wrap functions in useCallback to avoid dependency changes on every render
  
  // Sound playback function
  const playSound = useCallback((soundType: 'laser' | 'explosion' | 'gameover') => {
    if (!soundEnabled || !soundsLoaded) return;
    
    try {
      switch (soundType) {
        case 'laser':
          playLaserSound(0.3);
          break;
        case 'explosion':
          playExplosionSound(0.3);
          break;
        case 'gameover':
          playGameOverSound(0.4);
          break;
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled, soundsLoaded]);
  
  // Player shooting function
  const firePlayerProjectile = useCallback(() => {
    setProjectiles(prev => [
      ...prev,
      {
        id: projectileIdRef.current++,
        x: playerPosition.x + PLAYER_WIDTH / 2 - PROJECTILE_WIDTH / 2,
        y: playerPosition.y,
        isPlayer: true
      }
    ]);
    shotCooldownRef.current = 500; // 500ms cooldown
    playSound('laser');
    
    // Add haptic feedback for mobile devices
    if (isMobileDevice) {
      vibrate(15); // Short vibration for shooting
    }
  }, [playerPosition, isMobileDevice, playSound]);

  // Haptic feedback functions
  const playExplosionWithHaptics = useCallback(() => {
    playSound('explosion');
    if (isMobileDevice) {
      vibrate(30);
    }
  }, [isMobileDevice, playSound]);
  
  const playGameOverWithHaptics = useCallback(() => {
    playSound('gameover');
    if (isMobileDevice) {
      vibrate([50, 100, 50, 100, 50]);
    }
  }, [isMobileDevice, playSound]);
  
  // Update high score function
  const updateHighScore = useCallback(() => {
    if (score > highScore) {
      setHighScore(score);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_HIGH_SCORE_KEY, score.toString());
      }
    }
  }, [score, highScore]);
  
  // Initialize audio context
  const testSound = useCallback(async () => {
    try {
      const success = initAudioContext();
      if (success) {
        playLaserSound(0.2);
        setSoundsLoaded(true);
        console.log('Sound initialized successfully');
      } else {
        console.error('Failed to initialize audio context');
      }
    } catch (error) {
      console.error('Sound test failed:', error);
    }
  }, []);

  // Initialize a new wave of aliens
  const initializeWave = useCallback((waveNumber: number) => {
    // Clear any existing wave timeout
    if (waveTimeoutRef.current) {
      clearTimeout(waveTimeoutRef.current);
      waveTimeoutRef.current = null;
    }
    
    // Initialize aliens
    const newAliens = [];
    let id = 0;
    
    // Increase number of aliens based on wave (up to a limit)
    const rows = Math.min(ALIEN_ROWS + Math.floor(waveNumber / 3), 7);
    const columns = Math.min(ALIEN_COLUMNS + Math.floor(waveNumber / 2), 12);
    
    for (let row = 0; row < rows; row++) {
      // Determine alien type and points based on row
      let type: 1 | 2 | 3;
      let points: number;
      
      if (row < 1) {
        type = 3; // Top row
        points = 30 * waveNumber; // Points increase with wave number
      } else if (row < 3) {
        type = 2; // Middle rows
        points = 20 * waveNumber;
      } else {
        type = 1; // Bottom rows
        points = 10 * waveNumber;
      }
      
      for (let col = 0; col < columns; col++) {
        newAliens.push({
          id: id++,
          x: col * ALIEN_HORIZONTAL_SPACING + 100,
          y: row * ALIEN_VERTICAL_SPACING + ALIEN_VERTICAL_START,
          alive: true,
          type,
          points
        });
      }
    }
    setAliens(newAliens);
    
    // Initialize shields (repair shields a bit for each new wave)
    const newShields = [];
    const shieldY = GAME_HEIGHT - PLAYER_HEIGHT - 100;
    for (let i = 0; i < SHIELD_COUNT; i++) {
      newShields.push({
        id: i,
        x: (i + 1) * (GAME_WIDTH / (SHIELD_COUNT + 1)) - SHIELD_WIDTH / 2,
        y: shieldY,
        // Shield health decreases with each wave but never below 20
        health: Math.max(SHIELD_MAX_HEALTH - (waveNumber - 1) * 20, 20)
      });
    }
    setShields(newShields);
    
    // Increase alien speed with each wave
    setAlienSpeed(ALIEN_SPEED + (waveNumber - 1) * WAVE_SPEED_INCREMENT);
  }, []);
  
  const startGame = useCallback(() => {
    // Reset game state
    setWave(1);
    setProjectiles([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setPlayerPosition({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 20 });
    setAlienDirection(1);
    setAlienSpeed(ALIEN_SPEED);
    setWaveCompleteMessage(false);
    
    // Initialize the first wave
    initializeWave(1);
  }, [initializeWave]);
  
  // Load high score from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHighScore = localStorage.getItem(LOCAL_STORAGE_HIGH_SCORE_KEY);
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore, 10));
      }
      
      // Detect if using a mobile device
      const mobileDevice = isMobile();
      setIsMobileDevice(mobileDevice);
      
      // Configure touch controls
      const touchConfig = getTouchControlsConfig();
      setTouchControls(touchConfig);
    }
  }, []);

  // Effect to handle fullscreen mode changes
  useEffect(() => {
    if (fullscreen && gameContainerRef.current) {
      // Make sure controls work well in fullscreen by adjusting sensitivity
      if (isMobileDevice) {
        setTouchControls(prev => ({
          ...prev,
          sensitivity: fullscreen ? 2.0 : 1.5, // Increase sensitivity in fullscreen
          deadzone: fullscreen ? 0.02 : 0.05,  // Reduce deadzone in fullscreen
        }));
      }
    }
  }, [fullscreen, isMobileDevice]);

  // Keyboard and touch input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setKeys(prev => ({ ...prev, left: true }));
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setKeys(prev => ({ ...prev, right: true }));
      }
      if (e.key === ' ') {
        setKeys(prev => ({ ...prev, space: true }));
      }
      if (e.key === 'Enter' && !gameStarted) {
        startGame();
      }
      if (e.key === 'm') {
        setSoundEnabled(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setKeys(prev => ({ ...prev, left: false }));
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setKeys(prev => ({ ...prev, right: false }));
      }
      if (e.key === ' ') {
        setKeys(prev => ({ ...prev, space: false }));
      }
    };
    
    // Touch event handlers for mobile devices
    const handleTouchStart = (e: TouchEvent) => {
      if (!touchControls.enabled) return;
      
      // Prevent default to avoid scrolling
      e.preventDefault();
      
      // Store initial touch position
      if (e.touches.length > 0) {
        touchStartXRef.current = e.touches[0].clientX;
      }
      
      // Check if touch is in the bottom half of the screen (movement area)
      const touchY = e.touches[0]?.clientY || 0;
      const containerHeight = gameContainerRef.current?.clientHeight || 0;
      
      if (touchY > containerHeight * 0.7) {
        // Touch in movement area - do nothing yet, movement will be handled in touchmove
      } else {
        // Touch in shooting area - fire
        setKeys(prev => ({ ...prev, space: true }));
        
        // Add slight delay before releasing the space key to ensure it's registered
        setTimeout(() => {
          setKeys(prev => ({ ...prev, space: false }));
        }, 100);
        
        // Add haptic feedback for shooting
        if (isMobileDevice) {
          vibrate(15);
        }
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!touchControls.enabled || touchStartXRef.current === null) return;
      
      e.preventDefault();
      
      if (e.touches.length > 0) {
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartXRef.current;
        
        // Apply sensitivity and check deadzone
        const movement = deltaX * touchControls.sensitivity;
        
        if (Math.abs(movement) > touchControls.deadzone * 20) {
          if (movement < 0) {
            setKeys(prev => ({ ...prev, left: true, right: false }));
          } else {
            setKeys(prev => ({ ...prev, left: false, right: true }));
          }
        } else {
          // Within deadzone - stop movement
          setKeys(prev => ({ ...prev, left: false, right: false }));
        }
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchControls.enabled) return;
      
      e.preventDefault();
      
      // Reset touch tracking
      touchStartXRef.current = null;
      
      // Stop movement
      setKeys(prev => ({ ...prev, left: false, right: false }));
    };

    // Attach event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Store the ref in a variable to fix React Hook cleanup warning
    const currentContainer = gameContainerRef.current;
    
    if (touchControls.enabled && currentContainer) {
      currentContainer.addEventListener('touchstart', handleTouchStart as EventListener);
      currentContainer.addEventListener('touchmove', handleTouchMove as EventListener);
      currentContainer.addEventListener('touchend', handleTouchEnd as EventListener);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (currentContainer) {
        currentContainer.removeEventListener('touchstart', handleTouchStart as EventListener);
        currentContainer.removeEventListener('touchmove', handleTouchMove as EventListener);
        currentContainer.removeEventListener('touchend', handleTouchEnd as EventListener);
      }
    };
  }, [gameStarted, touchControls.enabled, touchControls.sensitivity, touchControls.deadzone, startGame]);

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Player movement
      if (keys.left && playerPosition.x > 0) {
        setPlayerPosition(prev => ({ ...prev, x: Math.max(0, prev.x - PLAYER_SPEED) }));
      }
      if (keys.right && playerPosition.x < GAME_WIDTH - PLAYER_WIDTH) {
        setPlayerPosition(prev => ({ ...prev, x: Math.min(GAME_WIDTH - PLAYER_WIDTH, prev.x + PLAYER_SPEED) }));
      }

      // Player shooting
      if (keys.space && shotCooldownRef.current <= 0) {
        firePlayerProjectile();
      }

      // Alien shooting
      if (alienShotCooldownRef.current <= 0 && aliens.filter(alien => alien.alive).length > 0) {
        const livingAliens = aliens.filter(alien => alien.alive);
        const randomAlien = livingAliens[Math.floor(Math.random() * livingAliens.length)];
        
        setProjectiles(prev => [
          ...prev,
          {
            id: projectileIdRef.current++,
            x: randomAlien.x + ALIEN_WIDTH / 2 - PROJECTILE_WIDTH / 2,
            y: randomAlien.y + ALIEN_HEIGHT,
            isPlayer: false
          }
        ]);
        alienShotCooldownRef.current = 1000 + Math.random() * 1000; // 1-2s cooldown
      }

      // Update cooldowns
      shotCooldownRef.current -= deltaTime;
      alienShotCooldownRef.current -= deltaTime;

      // Move aliens
      let needsDirectionChange = false;
      const updatedAliens = aliens.map(alien => {
        if (!alien.alive) return alien;
        
        const newX = alien.x + alienSpeed * alienDirection;
        
        if (newX <= 0 || newX >= GAME_WIDTH - ALIEN_WIDTH) {
          needsDirectionChange = true;
        }
        
        return { ...alien, x: newX };
      });

      if (needsDirectionChange) {
        setAlienDirection(prev => prev * -1);
        setAliens(updatedAliens.map(alien => ({
          ...alien,
          y: alien.y + 20
        })));
      } else {
        setAliens(updatedAliens);
      }

      // Check if aliens reached the bottom
      if (aliens.some(alien => alien.alive && alien.y + ALIEN_HEIGHT >= playerPosition.y)) {
        setGameOver(true);
        setGameStarted(false);
        updateHighScore();
        playExplosionWithHaptics();
        return;
      }

      // Move projectiles
      setProjectiles(prev => 
        prev
          .map(projectile => ({
            ...projectile,
            y: projectile.isPlayer
              ? projectile.y - PROJECTILE_SPEED
              : projectile.y + ALIEN_PROJECTILE_SPEED
          }))
          .filter(projectile => 
            (projectile.isPlayer && projectile.y > 0) || 
            (!projectile.isPlayer && projectile.y < GAME_HEIGHT)
          )
      );

      // Collision detection - Player projectiles vs Aliens
      setProjectiles(prev => {
        const remainingProjectiles = [...prev];
        
        for (let i = remainingProjectiles.length - 1; i >= 0; i--) {
          const projectile = remainingProjectiles[i];
          
          if (!projectile.isPlayer) continue;
          
          let collision = false;
          
          setAliens(aliens => {
            return aliens.map(alien => {
              if (!alien.alive) return alien;
              
              // Check collision
              if (
                projectile.x < alien.x + ALIEN_WIDTH &&
                projectile.x + PROJECTILE_WIDTH > alien.x &&
                projectile.y < alien.y + ALIEN_HEIGHT &&
                projectile.y + PROJECTILE_HEIGHT > alien.y
              ) {
                // Hit alien
                collision = true;
                setScore(score => {
                  const newScore = score + alien.points;
                  return newScore;
                });
                playExplosionWithHaptics();
                
                // Increase alien speed slightly as more aliens are destroyed
                const aliveCount = aliens.filter(a => a.alive).length;
                if (aliveCount % 5 === 0) {
                  setAlienSpeed(prev => Math.min(prev + 0.2, 5));
                }
                
                return { ...alien, alive: false };
              }
              
              return alien;
            });
          });
          
          if (collision) {
            remainingProjectiles.splice(i, 1);
          }
        }
        
        return remainingProjectiles;
      });

      // Collision detection - Projectiles vs Shields
      setProjectiles(prev => {
        const remainingProjectiles = [...prev];
        
        for (let i = remainingProjectiles.length - 1; i >= 0; i--) {
          const projectile = remainingProjectiles[i];
          let collision = false;
          
          setShields(shields => {
            return shields.map(shield => {
              // Skip if shield is already destroyed
              if (shield.health <= 0) return shield;
              
              // Check collision
              if (
                projectile.x < shield.x + SHIELD_WIDTH &&
                projectile.x + PROJECTILE_WIDTH > shield.x &&
                projectile.y < shield.y + SHIELD_HEIGHT &&
                projectile.y + PROJECTILE_HEIGHT > shield.y
              ) {
                // Hit shield
                collision = true;
                
                // Damage the shield
                return {
                  ...shield,
                  health: Math.max(0, shield.health - 10)
                };
              }
              
              return shield;
            });
          });
          
          if (collision) {
            remainingProjectiles.splice(i, 1);
          }
        }
        
        return remainingProjectiles;
      });

      // Collision detection - Alien projectiles vs Player
      setProjectiles(prev => {
        const remainingProjectiles = [...prev];
        
        for (let i = remainingProjectiles.length - 1; i >= 0; i--) {
          const projectile = remainingProjectiles[i];
          
          if (projectile.isPlayer) continue;
          
          // Check collision with player
          if (
            projectile.x < playerPosition.x + PLAYER_WIDTH &&
            projectile.x + PROJECTILE_WIDTH > playerPosition.x &&
            projectile.y < playerPosition.y + PLAYER_HEIGHT &&
            projectile.y + PROJECTILE_HEIGHT > playerPosition.y
          ) {
            // Player hit
            setGameOver(true);
            setGameStarted(false);
            updateHighScore();
            playGameOverWithHaptics();
            break;
          }
        }
        
        return remainingProjectiles;
      });

      // Check if all aliens are dead
      if (aliens.every(alien => !alien.alive)) {
        if (wave >= 5) {
          // Player has completed all 5 waves - they win the game
          setGameOver(true);
          setGameStarted(false);
          updateHighScore();
          return;
        } else {
          // Wave completed, prepare for next wave
          setWaveCompleteMessage(true);
          
          // Show "Wave Complete" message for 3 seconds before starting next wave
          waveTimeoutRef.current = setTimeout(() => {
            const nextWave = wave + 1;
            setWave(nextWave);
            setWaveCompleteMessage(false);
            initializeWave(nextWave);
          }, 3000);
          
          return;
        }
      }

      if (gameStarted && !gameOver) {
        gameIdRef.current = requestAnimationFrame(gameLoop);
      }
    };

    gameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(gameIdRef.current);
    };
  }, [
    gameStarted, 
    gameOver, 
    playerPosition, 
    aliens, 
    shields, 
    keys, 
    alienDirection, 
    alienSpeed, 
    score, 
    soundEnabled, 
    wave,
    firePlayerProjectile,
    playExplosionWithHaptics,
    playGameOverWithHaptics,
    updateHighScore,
    initializeWave
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (waveTimeoutRef.current) {
        clearTimeout(waveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={gameContainerRef}
      className={`relative h-[600px] w-[800px] bg-black border-2 border-green-500 overflow-hidden select-none ${fullscreen ? 'fullscreen-game' : ''}`}
      style={{
        width: `${GAME_WIDTH}px`,
        height: `${GAME_HEIGHT}px`,
        border: '4px solid #33ff33',
        backgroundColor: 'black',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-green-500">
          <h1 className="text-4xl font-bold mb-6">SPACE INVADERS</h1>
          <p className="mb-4">{isMobileDevice ? 'Tap to start' : 'Press ENTER to start'}</p>
          
          {!soundsLoaded && (
            <button 
              onClick={testSound} 
              className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Click to Enable Sounds
            </button>
          )}
          
          {soundsLoaded && (
            <p className="mb-6 text-green-300">Sounds Enabled ✓</p>
          )}
          
          <div className="text-sm">
            <p>Controls:</p>
            {isMobileDevice ? (
              <>
                <p>Tap upper screen to shoot</p>
                <p>Swipe lower screen to move</p>
              </>
            ) : (
              <>
                <p>← → or A D to move</p>
                <p>SPACE to shoot</p>
              </>
            )}
            <p>M to toggle sound {soundEnabled ? '(On)' : '(Off)'}</p>
          </div>
          {highScore > 0 && (
            <p className="mt-4 text-xl">High Score: {highScore}</p>
          )}
          
          {isMobileDevice && (
            <button 
              onClick={() => {
                startGame();
                vibrate(30);
              }}
              onTouchStart={(e) => e.preventDefault()}
              className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-bold game-control-button"
            >
              START GAME
            </button>
          )}
        </div>
      )}

      {gameStarted && (
        <>
          <div className="absolute top-2 left-2 text-green-500 text-xl">Score: {score}</div>
          <div className="absolute top-6 left-2 text-green-500 text-sm">High Score: {highScore}</div>
          <div className="absolute top-10 left-2 text-green-500 text-sm">Wave: {wave} / 5</div>
          <div className="absolute top-2 right-2 text-green-500 text-sm flex flex-col items-end">
            <div>
              Sound: {soundEnabled ? (soundsLoaded ? 'On' : 'Off (Not Initialized)') : 'Off'} {isMobileDevice ? '(Tap M)' : '(Press M)'}
            </div>
            {!soundsLoaded && soundEnabled && (
              <button 
                onClick={testSound} 
                className="mt-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Enable Sounds
              </button>
            )}
          </div>
          
          <Player x={playerPosition.x} y={playerPosition.y} width={PLAYER_WIDTH} height={PLAYER_HEIGHT} />
          
          {shields.map(shield => 
            shield.health > 0 && (
              <Shield 
                key={shield.id} 
                x={shield.x} 
                y={shield.y} 
                width={SHIELD_WIDTH} 
                height={SHIELD_HEIGHT} 
                health={shield.health}
                maxHealth={SHIELD_MAX_HEALTH}
              />
            )
          )}
          
          {aliens.map(alien => 
            alien.alive && (
              <Alien 
                key={alien.id} 
                x={alien.x} 
                y={alien.y} 
                width={ALIEN_WIDTH} 
                height={ALIEN_HEIGHT} 
                type={alien.type}
              />
            )
          )}
          
          {projectiles.map(projectile => (
            <Projectile 
              key={projectile.id} 
              x={projectile.x} 
              y={projectile.y} 
              width={PROJECTILE_WIDTH} 
              height={PROJECTILE_HEIGHT} 
              isPlayer={projectile.isPlayer} 
            />
          ))}
          
          {/* Mobile controls overlay - only shown on mobile devices */}
          {isMobileDevice && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-0 left-0 w-full h-20 bg-black bg-opacity-20 flex items-center justify-between px-4">
                <button 
                  className="w-20 h-20 rounded-full bg-green-500 bg-opacity-20 border-2 border-green-500 pointer-events-auto flex items-center justify-center text-3xl font-bold game-control-button"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setKeys(prev => ({ ...prev, space: true }));
                    vibrate(15);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setKeys(prev => ({ ...prev, space: false }));
                  }}
                  onClick={() => {
                    setKeys(prev => ({ ...prev, space: true }));
                    setTimeout(() => setKeys(prev => ({ ...prev, space: false })), 100);
                    vibrate(15);
                  }}
                >
                  🔫
                </button>
                
                <button 
                  className="w-20 h-20 rounded-full bg-green-500 bg-opacity-20 border-2 border-green-500 pointer-events-auto flex items-center justify-center text-xl font-bold game-control-button"
                  onClick={() => {
                    setSoundEnabled(prev => !prev);
                    vibrate(20);
                  }}
                >
                  {soundEnabled ? '🔊' : '🔇'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {waveCompleteMessage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-70 p-4 rounded-lg border-2 border-green-500">
            <p className="text-green-500 text-2xl font-bold">Wave {wave} Complete!</p>
            <p className="text-green-500">Preparing Wave {wave + 1}...</p>
          </div>
        </div>
      )}
      
      {gameOver && (
        <GameOver 
          score={score} 
          highScore={highScore} 
          onRestart={startGame} 
          wave={wave}
          isWin={wave >= 5 && aliens.every(alien => !alien.alive)}
          isMobile={isMobileDevice}
        />
      )}
    </div>
  );
} 