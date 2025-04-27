"use client";

interface GameOverProps {
  score: number;
  onRestart: () => void;
  victory: boolean;
  highScore?: number;
  wave?: number;
}

export default function GameOver({ score, onRestart, victory, highScore, wave = 1 }: GameOverProps) {
  const isHighScore = highScore !== undefined && score >= highScore;
  const completedAllWaves = victory && wave >= 5;
  
  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-green-500">
      <h2 className="text-4xl font-bold mb-4">
        {completedAllWaves ? 'CONGRATULATIONS!' : (victory ? 'WAVE COMPLETE!' : 'GAME OVER')}
      </h2>
      
      {completedAllWaves && (
        <p className="text-2xl mb-4">You completed all 5 waves!</p>
      )}
      
      <p className="text-2xl mb-2">Score: {score}</p>
      
      {!completedAllWaves && wave > 1 && (
        <p className="text-xl mb-2">Reached Wave: {wave}</p>
      )}
      
      {highScore !== undefined && (
        <p className="text-xl mb-4">
          {isHighScore ? 'NEW HIGH SCORE!' : `High Score: ${highScore}`}
        </p>
      )}
      
      <button 
        onClick={onRestart}
        className="px-6 py-2 bg-green-500 text-black font-bold rounded hover:bg-green-400 transition-colors"
      >
        Play Again
      </button>
    </div>
  );
} 