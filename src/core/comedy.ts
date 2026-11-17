/* ------------------------------------------------------------------ */
/* Comedy Engine — original Telgish (Telugu + English) joke database.  */
/* Cooldown logic prevents the same joke from repeating until the      */
/* whole bank has cycled.                                              */
/* ------------------------------------------------------------------ */

const B: Record<string, string[]> = {
  /* -------- GAME 1 : DIRECTOR'S DISASTER -------- */
  d_setup: [
    "Scene 1: The hero practices his entry in a mirror. The mirror files a complaint.",
    "The AD shouts 'ACTION' before the director even knows the scene exists.",
    "Crew member spotted eating lunch on the camera. Now he's a supporting actor.",
    "Producer walks in: 'Make it like Hollywood. Budget like a tiffin.'",
    "The hero's dog is acting better than the second lead. Keep that energy.",
    "Someone asked 'where is the script?' It is in the script's office. It's on leave.",
    "Lighting team is lighting the wrong set. They are lighting 'vibes' instead.",
    "The villain arrived early and is doing the hero's dialogues in the corridor.",
    "Camera roll ran out. We are shooting with hope now.",
    "The director's chair is empty. The director is lost in a prop warehouse.",
    "Rain machine turned on by mistake. Good news: the rain scene is FREE now.",
    "Assistant director lost the script. Found it under the hero's shoe. Embarrassing for the script.",
  ],
  d_disaster: [
    "DISASTER: The hero arrived AFTER the shooting ended. Classic hero timing.",
    "DISASTER: Cameraman accidentally recorded himself making noodles.",
    "DISASTER: Producer suddenly cut the budget. He said 'upgrade to next month'.",
    "DISASTER: Actor forgot the dialogue. He is now improvising his job interview.",
    "DISASTER: Assistant director lost the script. Again. It has a habit of this.",
    "DISASTER: Rain started during an important scene. The scene is about rain. Lucky.",
    "DISASTER: The hero's mustache fell off. Drama level: 1000.",
    "DISASTER: Background dancer started doing his own choreography. His own!",
  ],
  d_win: [
    "CUT! Perfect take. The birds outside applauded. Birds!",
    "The take is so good, the producer stopped counting money for 3 seconds.",
    "Scene saved. The director's hair survived. Unheard of.",
    "That was the take. Print it. Frame it. Worship it.",
    "The villain is scared. Of the hero. Finally, respect.",
    "Crew is clapping. Not because they had to. Because they wanted to.",
  ],
  d_lose: [
    "That scene needs 47 corrections. We only have 47 minutes.",
    "The audience will not cry. But the producer's wallet already is.",
    "We shot a scene no one can identify. Even the dog looked confused.",
    "Action cheppaka mundhe cut cheppav entaru? Now the cut has no action.",
    "The film is not a flop. It is an 'experimental document'.",
  ],
  /* -------- GAME 2 : BEER BUDDIES -------- */
  b_chat: [
    "Group lo andharu active, work time lo invisible!",
    "Friendship undhi, coordination ledhu.",
    "Bro, nuvvu help cheyyaku. Adhe help!",
    "Raju: 'I'll handle it.' The sofa: 'He handled me with a handshake.'",
    "Chintu is not lazy. He is in 'power-saving mode'.",
    "Swayam overthought the mission so hard, the mission got scared and quit.",
    "Goutham didn't cause the problem. He just... discovered it publicly.",
    "The plan is perfect. The plan is also imaginary.",
    "Four friends. Four plans. Zero matches.",
    "Teamwork means one guy carries the sofa and three carry the excuses.",
  ],
  b_mission: [
    "SOFA OPERATION: The sofa is wider than the door and the confidence.",
    "PHONE HUNT: The phone was found. It was in the charger. Like always. Like tragedy.",
    "PARTY RUSH: Surprise party. The surprise is on the host, not the guest.",
    "DEADLINE DELIVERY: The packet has a deadline. The scooter has a fear.",
    "PIZZA TOWER: 10 slices high. One wrong yell and it's a pizza crime scene.",
    "The sofa is moving. The friends are not. Physics wins again.",
    "Someone shouted 'LEFT!' while pointing RIGHT. Trust is dead.",
    "The mission is simple. The friends are not.",
  ],
  b_win: [
    "Mission complete! The friendship survived. Barely. Like a mobile battery at 1%.",
    "They did it. Four friends, one victory, 43 messages of 'NUVVU CHUUDEYANAAU'.",
    "Sofa delivered. Spine intact. Friendship: 2% and holding.",
    "Mission passed! Goutham says he had a plan. Nobody believes him. Nobody asks again.",
    "The team worked! For exactly 4 minutes. A world record for this group.",
  ],
  b_lose: [
    "Mission failed. The group chat is now 90% blame and 10% memes.",
    "The sofa won. The sofa always wins.",
    "They lost the mission but gained 4 new excuses.",
    "Friendship is safe. The mission is not. Priorities, guys.",
    "Failed again. But hey — the group photo is perfect. Nothing else.",
  ],
  /* -------- GAME 3 : MEME ESCAPE -------- */
  r_toast: [
    "Salary vachindhi... EMI waiting!",
    "Life lo already problems unnayi!",
    "Bro, responsibilities are chasing you!",
    "Parigetta ra... future vasthundhi!",
    "The auto driver is judging your running style.",
    "That invitation was for your cousin. Run like it was for YOU.",
    "Your ex's wedding is in the next lane. KEEP MOVING.",
    "The deadline just sprinted past you. It said 'see you in office'.",
    "A relative is 3 lanes away. Do NOT acknowledge.",
    "Your phone rang. It was your mum. You can't answer. You're a fugitive now.",
    "The alarm clock is faster than you. It knows what it did.",
    "Monday morning energy detected: 0%. Speed must cover it.",
  ],
  r_fail: [
    "You tripped over NOTHING. The nothing is undefeated.",
    "Dramatic slow-mo... of your face. The camera loved it. You did not.",
    "The friend asking for money caught up. Pay and run. RUN.",
    "Slipped on a banana peel that was NOT there. Meme physics.",
    "Your leg said 'stop'. Your legs should not vote.",
    "The paperwork stuck to you. Officially a government file now.",
    "You got caught by your responsibilities. All of them. Together.",
    "Face-plant. The ground has never received so much respect.",
  ],
  r_win: [
    "You outran your ENTIRE life. For 10 minutes. A personal best, honestly.",
    "Finish line! Your EMI is still behind you. It always is.",
    "You escaped! Your responsibilities filed a complaint. We ignore it.",
    "Certified Meme Runner. The auto drivers gave you a slow clap.",
    "You ran from everything. Even your own excuses. Wow.",
  ],
  /* -------- GAME 4 : PELLI CHOOPOOLU -------- */
  p_laugh: [
    "The whole family is laughing. The uncle's coffee glass is shaking.",
    "Aunty dropped her pickle. Aunty has NEVER dropped her pickle.",
    "Thatha's glasses fogged up with pure entertainment.",
    "The cousin in the corner is recording this. Future blackmail material.",
    "Uncle laughed so hard he forgot the question. BONUS POINTS.",
    "The TV volume is down. The family's attention is fully on you.",
    "Grandma is doing a quiet clap. Highest honor in this house.",
    "The slipper stayed on the shelf. Historic.",
  ],
  p_grumble: [
    "Uncle's eyebrow is doing a movie trailer of its own.",
    "Aunty exchanged a look. In family language, that's a threat.",
    "The silence is 3 seconds long. In this house, that's a war.",
    "Thatha slowly put down his coffee. He's about to give a speech.",
    "The cousin whispered 'bro, that was bad'. Loudly.",
    "Somewhere, a slipper is being oiled.",
    "The family WhatsApp is typing a message. You don't want to read it.",
    "Uncle is comparing you to his colleague's nephew. Again.",
  ],
  p_win: [
    "You walked out of that meeting with your dignity, your passport, and your sanity. Legendary.",
    "Family meeting: SURVIVED. Certificate will be framed. By you. Alone.",
    "The relatives are confused. In this house, confusion means victory.",
    "You beat 20 questions, 3 uncles, and 1 grandmother. Olympic level.",
    "You left before the 'so when is the wedding' round 2. Smart. Too smart.",
  ],
  p_lose: [
    "The slipper found you. It always finds you.",
    "You survived 20 questions. Your dignity did not.",
    "The family meeting will be retold at 7 family functions this year.",
    "Uncle took your answer to his office. It's now a case study.",
    "You walked out. The whole family walked you out. Gently. With snacks.",
  ],
  /* -------- GAME 5 : FINAL BLOCKBUSTER -------- */
  f_boss: [
    "THE PRODUCER: 'Budget ledhu. Deadline undhi.'",
    "THE PRODUCER: 'Change the hero. Change the city. Change the budget. What is changing? Your face, director.'",
    "THE PRODUCER: 'In my time, we shot in one take. With one camera. And one nerve.'",
    "THE PRODUCER: 'Blockbuster avvakapothe friendship cancel.'",
    "THE PRODUCER: 'Review 1 star? Memory 5 star. Budget 0 rupees.'",
    "THE PRODUCER: 'Cinema complete ayyindi? Inka problems unnayi.'",
    "THE PRODUCER: 'Make it emotional. And fast. And cheap. And in 3D. With 2D money.'",
    "THE PRODUCER: 'This is not a demand. This is a lifestyle.'",
  ],
  f_win: [
    "The movie is DONE! The producer is quiet. That's scarier than anything.",
    "Premiere night! The group is in the front row. Goutham in the back row. Always.",
    "The credits rolled. So did the tears. So did the producer's wallet.",
    "One film, four friends, one very tired producer. A classic.",
    "The audience stood up. Then sat down. Then stood up again. Box office unlocked.",
  ],
  f_lose: [
    "The movie is unfinished. The friendship is unharmed. The budget is both gone.",
    "We shot a film that only exists in 4 different people's memories. And they don't match.",
    "The deadline won. The deadline always wins. It has a team of lawyers.",
    "The film flopped so hard it hit the basement. And stayed.",
    "Ending: the group is now doing a web series on their phone. It's worse. Somehow.",
  ],
  f_chat: [
    "Raju: 'I'll fix it in 10 minutes.' It has been 3 hours.",
    "Chintu is 'working' by watching the camera. He is the camera's best friend now.",
    "Swayam made a 40-page plan for a 2-line dialogue. The dialogue is still 2 lines.",
    "Goutham 'accidentally' deleted the footage. It was a folder named 'important'.",
    "The crew is on break. The break is on break. The break's break is on break.",
    "Someone asked for lunch at minute 97 of a 120-minute day. Legend.",
  ],
  /* -------- GENERIC -------- */
  g_win: [
    "Victory tastes like free WiFi in a train. Unexpected. Amazing.",
    "You won. The group chat has received 200 messages. 199 are 'CHUUDEYANAAU'.",
    "New personal best! Old personal best is in therapy.",
    "They will tell this story for years. You are now folklore.",
    "Win secured. Confidence loaded. Dignity: back in stock.",
    "Certified legend. Please handle with snacks.",
  ],
  g_lose: [
    "Defeat! But your memes are stronger than your results.",
    "You lost. The scoreboard is embarrassed, not you. You're a warrior (of memes).",
    "This is not a loss. This is a 'story'. It will be told 47 times.",
    "Failed! The ground is offering you a handshake. Accept it.",
    "Loss recorded. Comedy: +100. Ego: pending refund.",
    "You didn't fail. You discovered a new way to fail. Innovation!",
  ],
  g_eggs: [
    "SECRET FOUND. The developers are hiding. You found them. You're a menace.",
    "Hidden easter egg unlocked! It was right there the whole time. Like your salary.",
    "You discovered a secret! The secret discovered you back. Scary.",
    "Egg located. The egg is grateful. The egg is also a legend.",
    "Secret unlocked! Somewhere, a coder is crying.",
    "You found the hidden thing. Your curiosity is now a weapon.",
  ],
};

const used = new Map<string, Set<number>>();

export function joke(bank: string, force?: string): string {
  const list = B[bank] ?? B.g_win;
  if (force && list.includes(force)) return force;
  let u = used.get(bank);
  if (!u || u.size >= list.length) {
    u = new Set();
    used.set(bank, u);
  }
  for (let i = 0; i < list.length * 2; i++) {
    const idx = Math.floor(Math.random() * list.length);
    if (!u.has(idx)) {
      u.add(idx);
      return list[idx];
    }
  }
  return list[0];
}

export function totalJokes() {
  return Object.values(B).reduce((a, b) => a + b.length, 0);
}

/* ------------------------------------------------------------------ */
/* Rating titles                                                       */
/* ------------------------------------------------------------------ */
export interface Rating {
  band: "S" | "A" | "B" | "C";
  title: string;
  pct: number;
}
const TITLES: Record<string, [string, string, string, string]> = {
  directors: ["BLOCKBUSTER AUTEUR", "FIRST-TAKE DIRECTOR", "INTERVAL SURVIVOR", "OFFICIAL DISASTER DIRECTOR"],
  buddies: ["UNBREAKABLE SQUAD", "CHAOS COORDINATOR", "FRIENDSHIP SURVIVED: 2%", "GROUP CHAT MUTED"],
  runner: ["PROFESSIONAL MEME RUNNER", "DEADLINE ESCAPE ARTIST", "EMI DODGER", "CAUGHT BY MONDAY"],
  pelli: ["RELATIVE INTERVIEW SURVIVOR", "COFFEE DIPLOMAT", "LIVING ROOM DEFENDER", "SLIPPER TARGET"],
  final: ["LEGENDARY BLOCKBUSTER", "CULT CLASSIC CREW", "BUDGET MIRACLE", "PRODUCER'S NIGHTMARE"],
};

const TELGISH_VERDICTS: Record<string, { win: string[]; lose: string[] }> = {
  directors: {
    win: [
      "Budget zero, expectations Hollywood — kani scene matram next level vachindhi!",
      "Director gaaru, cut cheppagane producer kuda clap kottadu. Miracle ra idhi!",
    ],
    lose: [
      "Action cheppaka mundhe cut cheppav entra! Cinema start ayyinda leka lunch break aa?",
      "Budget zero, script gayab — kani confidence matram Oscar level lo undhi!",
    ],
  },
  buddies: {
    win: [
      "Friendship undhi, coordination konchem vachindhi — group chat safe ra babu!",
      "Group lo andharu active, eesari work time lo kuda kanipincharu. Historic moment!",
    ],
    lose: [
      "Bro, nuvvu help cheyyaku — adhe peddha help! Friendship survived on 1% battery.",
      "Group lo andharu active, work time lo matram andharu invisible!",
    ],
  },
  runner: {
    win: [
      "Parigettu ra, future vasthundhi ante nijamgane future ni overtake chesav!",
      "Salary vachindhi, EMI waiting — kani nuvvu matram rocket speed lo escape ayyav!",
    ],
    lose: [
      "Salary vachindhi... EMI waiting! Responsibilities ninnu full speed lo catch chesayi bro.",
      "Life lo already problems unnayi ante malli auto mundhu jump chesav entra!",
    ],
  },
  pelli: {
    win: [
      "Salary entha ante coffee adigi topic marchesav chudu — adhi ra real talent!",
      "Uncle questions anni sixer kotti living room nundi hero la bayataki vachav!",
    ],
    lose: [
      "Future plan enti ante future ni adagali annav — uncle ippatiki shock lo unnadu!",
      "Job nannu accept chesaka cheptha annav chudu, akkada discussion close ayipoindhi!",
    ],
  },
  final: {
    win: [
      "Review 5 stars, memories infinite — ENE ayipoindhi ra, cinema hit ayipoindhi!",
      "Budget ledhu, deadline undhi, ayina blockbuster kottav chudu — legend ra nuvvu!",
    ],
    lose: [
      "Review 1 star, memories 5 stars! Cinema complete avvaledhu kani kathalu migilayi.",
      "Budget ledhu, deadline poindhi — producer gaaru phone switch off chesaru!",
    ],
  },
};

export function telgishVerdict(game: string, won: boolean): string {
  const entry = TELGISH_VERDICTS[game] ?? TELGISH_VERDICTS.directors;
  const pool = won ? entry.win : entry.lose;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function ratingFor(game: string, score: number, max: number): Rating {
  const pct = Math.min(100, Math.round((score / Math.max(1, max)) * 100));
  const t = TITLES[game] ?? TITLES.directors;
  if (pct >= 90) return { band: "S", title: t[0], pct };
  if (pct >= 70) return { band: "A", title: t[1], pct };
  if (pct >= 45) return { band: "B", title: t[2], pct };
  return { band: "C", title: t[3], pct };
}
