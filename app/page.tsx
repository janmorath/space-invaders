import GameWrapper from './components/GameWrapper';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <h1 className="mb-8 text-4xl font-bold text-white">Space Invaders</h1>
      <div className="max-w-full overflow-hidden">
        <GameWrapper />
      </div>
      <div className="mt-8 text-sm text-gray-400">
        <p>A classic arcade game recreated with Next.js and Tailwind CSS</p>
      </div>
    </div>
  );
}
