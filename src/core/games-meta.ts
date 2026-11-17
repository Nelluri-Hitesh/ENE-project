/* Pure data module — no React. Safe to import from server and client components. */
export type GameId = "directors" | "buddies" | "runner" | "pelli" | "final";

export interface GameMeta {
  id: GameId;
  no: number;
  title: string;
  tag: string;
  duration: string;
  difficulty: 1 | 2 | 3;
  accent: string;
  img: string;
  imgPos?: string;
  max: number;
  premise: string;
  controlHint: string;
  controls: string[];
  story: string[];
  howto: string[];
}

export const GAMES: GameMeta[] = [
  {
    id: "directors",
    no: 1,
    title: "Director's Disaster",
    tag: "Call the right camera angles and rescue eight chaotic film scenes before the budget runs dry.",
    duration: "10 MIN",
    difficulty: 2,
    accent: "#E9FF57",
    img: "/images/dashboard-bg.webp",
    imgPos: "center 25%",
    max: 800,
    premise: "Eight scenes, zero budget, and a crew improvising at every cut.",
    controlHint: "Select camera shots · Space or tap to resolve set disasters",
    controls: ["Click or tap to select camera shots", "Space or tap during set emergencies", "Esc or P to pause"],
    story: [
      "Eight scenes stand between your debut film and complete catastrophe.",
      "Read your assistant director's cue, frame the shot, and handle every on-set crisis.",
    ],
    howto: [
      "Choose the camera shot that matches each scene.",
      "React quickly when a production disaster interrupts the take.",
    ],
  },
  {
    id: "buddies",
    no: 2,
    title: "Beer Buddies: Hyderabad to Goa",
    tag: "Hop into the convertible with the 4 buddies on a relaxing 3D road trip from Hyderabad to Goa beach!",
    duration: "10 MIN",
    difficulty: 2,
    accent: "#E9FF57",
    img: "/images/hero.webp",
    imgPos: "center 30%",
    max: 1000,
    premise: "Four buddies, one red convertible, and a scenic 3D drive from Hyderabad to Goa.",
    controlHint: "Arrows / WASD to drive · Space to brake · H for Horn · Touch pedals on mobile",
    controls: ["Up / W – Accelerate", "Down / S – Brake / Reverse", "Left / Right or A / D – Steer", "Spacebar – Stop", "H – Horn"],
    story: [
      "Pack the bags! The four friends are hitting the highway for the legendary Hyderabad to Goa road trip.",
      "Drive past Hyderabad Outer Ring Road, Deccan countryside, and Western Ghats to reach Goa beach!",
    ],
    howto: [
      "Drive along the road towards Goa and maintain steady speed.",
      "Watch your fuel bar and drive by roadside petrol pumps to refill.",
      "Enjoy the relaxing journey until you pull into Goa beach!",
    ],
  },
  {
    id: "runner",
    no: 3,
    title: "FIND THE DIAMOND RING",
    tag: "Scale towering city skyscrapers across 10 rooftop levels, solve puzzles, and discover the hidden precious diamond ring!",
    duration: "10 MIN",
    difficulty: 2,
    accent: "#38BDF8",
    img: "/images/hero.webp",
    imgPos: "center 28%",
    max: 12000,
    premise: "The precious diamond ring is hidden on the highest skyscraper. Climb, jump, and unlock the final treasure!",
    controlHint: "WASD / Arrows to move · Space to jump · Shift to sprint · E to interact · Mobile touch controls",
    controls: [
      "WASD / Arrows – Move in 3D space",
      "Spacebar – Jump across rooftops",
      "Shift – Sprint / Run fast",
      "E / Enter – Interact (open chests, collect keys)",
      "Mobile – Virtual joystick & action buttons",
    ],
    story: [
      "A priceless diamond ring is locked inside a mysterious treasure box on top of the city's highest skyscraper.",
      "Climb 10 challenging rooftop levels, navigate moving platforms, leap perilous gaps, and discover the ring!",
    ],
    howto: [
      "Jump between rooftops and climb higher toward the Apex Skyscraper.",
      "Collect sparkling diamonds and coins while avoiding dangerous falls.",
      "Find the Golden Key, activate elevators, and open the treasure chest on Rooftop 10!",
    ],
  },
  {
    id: "pelli",
    no: 4,
    title: "Pelli Choopulu of Madness",
    tag: "Navigate twenty-two unpredictable family-meeting questions with sharp timing and intact dignity.",
    duration: "10 MIN",
    difficulty: 3,
    accent: "#A855F7",
    img: "/images/gang.jpg",
    imgPos: "center 30%",
    max: 1400,
    premise: "Twenty-two relatives' questions, one living room, and a fragile peace meter.",
    controlHint: "Choose your reply before the timer expires · Streaks unlock secret lines",
    controls: ["Tap or press 1–4 to pick a reply", "Build a 3-answer streak for secret replies", "Keep family peace above zero"],
    story: [
      "Uncles ask about salary, aunties audit your future, and everyone is listening.",
      "Balance sharp Telgish wit with just enough diplomacy to stay in the room.",
    ],
    howto: [
      "Pick a response before silence speaks for you.",
      "Bold comedy scores high; reckless answers drain family peace.",
    ],
  },
  {
    id: "final",
    no: 5,
    title: "The Final Blockbuster",
    tag: "Recover lost gear, solve studio puzzles, race rooftops, and survive the producer's final countdown.",
    duration: "10 MIN",
    difficulty: 3,
    accent: "#E9FF57",
    img: "/images/dashboard-bg.webp",
    imgPos: "center 28%",
    max: 1500,
    premise: "Five final acts combining every skill to finish the dream film on deadline.",
    controlHint: "Search, recall lights, cross rooftops, settle arguments, and face the producer",
    controls: ["Tap to find gear and answer dialogue", "Keys 1–4 or tap to repeat studio lights", "Space / Up to jump, Down to duck"],
    story: [
      "Premiere night is hours away and the producer is rewriting the film live.",
      "Clear all five production stages and finish with the budget still standing.",
    ],
    howto: [
      "Complete each studio challenge before time runs out.",
      "Discover secrets in the first four games to unlock the hidden ending.",
    ],
  },
];

export const GAME_MAP: Record<GameId, GameMeta> = Object.fromEntries(
  GAMES.map((g) => [g.id, g])
) as Record<GameId, GameMeta>;
