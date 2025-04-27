# Space Invaders

A classic arcade game recreated with Next.js and Tailwind CSS.

## Features

- Classic Space Invaders gameplay
- Player movement and shooting
- Alien formations with movement patterns
- Multiple alien types with different point values
- Multiple waves with increasing difficulty
- Destructible shields for protection
- Collision detection
- Score tracking with high score saving
- Game over and victory screens
- Responsive design
- Sound effects using Web Audio API

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- Local Storage API for saving high scores
- Web Audio API for sound effects

## How to Play

1. Clone this repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser
5. **Important**: Click the "Enable Sounds" button on the start screen for sound effects

## Game Mechanics

- Control your spaceship at the bottom of the screen
- Shoot the alien invaders before they reach you
- Different aliens have different point values:
  - Red aliens (top row): 30 points × wave number
  - Blue aliens (middle rows): 20 points × wave number
  - Purple aliens (bottom rows): 10 points × wave number
- Complete all 5 waves to win the game
- Each wave introduces:
  - More aliens
  - Faster movement
  - Higher point values
  - Slightly weaker shields
- Use the shields to protect yourself from enemy fire
- Shields will deteriorate as they take damage
- Aliens move faster as you eliminate more of them
- Your high score is saved between sessions
- Game ends when you destroy all aliens across all waves or when you're hit

## Controls

- ←/→ or A/D keys: Move the player spaceship
- Space bar: Shoot
- Enter: Start the game
- M: Toggle sound effects

## Sound Notes

This game uses the Web Audio API to generate sound effects directly in the browser. Due to browser security policies, you must first interact with the page (by clicking the "Enable Sounds" button) before sounds can be played.

## Development

This project was created using the Next.js App Router with Tailwind CSS.

## Deployment

You can deploy this game to Vercel with a few simple steps:

1. Push your code to a GitHub repository
2. Visit [Vercel](https://vercel.com/new) and import your repository
3. Deploy with default settings
4. Your game will be available online!

## License

MIT
