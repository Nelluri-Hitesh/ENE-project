"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { audio } from "@/core/audio";

/* ------------------------------------------------------------------ */
/* FIND THE DIAMOND RING — 3D ROOFTOP ADVENTURE PLATFORMER            */
/* 10 Rooftop Levels, Moving Platforms, Puzzles, Diamond Ring Finale   */
/* ------------------------------------------------------------------ */

interface LevelCheckpoint {
  id: number;
  name: string;
  pos: [number, number, number];
}

const CHECKPOINTS: LevelCheckpoint[] = [
  { id: 1, name: "Rooftop 1: Base Skyscraper", pos: [0, 1.2, 0] },
  { id: 2, name: "Rooftop 2: Water Tank Alley", pos: [0, 5.2, 28] },
  { id: 3, name: "Rooftop 3: Air Vent Maze", pos: [22, 9.2, 48] },
  { id: 4, name: "Rooftop 4: Crane Sky Platforms", pos: [36, 13.2, 75] },
  { id: 5, name: "Rooftop 5: Neon Antenna Mast", pos: [18, 17.2, 102] },
  { id: 6, name: "Rooftop 6: Glass Skywalk Bridge", pos: [-6, 21.2, 128] },
  { id: 7, name: "Rooftop 7: Motorized Sky Elevator", pos: [-26, 25.2, 155] },
  { id: 8, name: "Rooftop 8: Security Gate Vault", pos: [-20, 31.2, 188] },
  { id: 9, name: "Rooftop 9: Helipad Summit", pos: [0, 37.2, 222] },
  { id: 10, name: "Rooftop 10: The Apex & Treasure Chest", pos: [0, 45.2, 260] },
];

export default function Runner() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Game UI States
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [victory, setVictory] = useState(false);

  // HUD
  const [currentLevel, setCurrentLevel] = useState(1);
  const [diamonds, setDiamonds] = useState(0);
  const [coins, setCoins] = useState(0);
  const [hasKey, setHasKey] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [cluePopup, setCluePopup] = useState<string | null>(null);

  // Controls Ref for 60fps Loop
  const inputRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    interact: false,
  });

  // Mobile virtual joystick drag
  const joystickRef = useRef<{ active: boolean; dx: number; dy: number }>({
    active: false,
    dx: 0,
    dy: 0,
  });

  // Web Audio Synth Sound FX
  const playSfx = useCallback((type: "diamond" | "coin" | "jump" | "unlock" | "fanfare" | "firework") => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "diamond") {
        // Magical chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
        osc.frequency.exponentialRampToValueAtTime(2093.0, ctx.currentTime + 0.25); // C7
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "coin") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "jump") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === "unlock") {
        osc.type = "square";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === "fanfare") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.3);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } else if (type === "firework") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
    } catch {}
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "KeyW" || e.code === "ArrowUp") inputRef.current.forward = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") inputRef.current.backward = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") inputRef.current.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") inputRef.current.right = true;
      if (e.code === "Space") inputRef.current.jump = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") inputRef.current.sprint = true;
      if (e.code === "KeyE" || e.code === "Enter") inputRef.current.interact = true;
      if (e.code === "KeyP" || e.code === "Escape") setPaused((p) => !p);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") inputRef.current.forward = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") inputRef.current.backward = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") inputRef.current.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") inputRef.current.right = false;
      if (e.code === "Space") inputRef.current.jump = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") inputRef.current.sprint = false;
      if (e.code === "KeyE" || e.code === "Enter") inputRef.current.interact = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Main 3D Adventure Platformer Engine (Three.js)
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Twilight / Sunset Sky
    scene.fog = new THREE.FogExp2(0x1e1b4b, 0.007);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 800);
    camera.position.set(0, 10, -12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. City Lighting
    const hemiLight = new THREE.HemisphereLight(0xfef08a, 0x1e1b4b, 0.9);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xf97316, 1.6); // Warm sunset sun
    sunLight.position.set(120, 180, 80);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Stars & Skyline Backdrop
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 600;
      starPositions[i + 1] = 50 + Math.random() * 250;
      starPositions[i + 2] = (Math.random() - 0.5) * 600;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 });
    const stars = new THREE.Points(starsGeo, starMat);
    scene.add(stars);

    // Distant City Skyline Towers
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    for (let i = 0; i < 45; i++) {
      const h = 50 + Math.random() * 90;
      const w = 12 + Math.random() * 16;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), towerMat);
      const angle = (i / 45) * Math.PI * 2;
      const dist = 140 + Math.random() * 80;
      tower.position.set(Math.cos(angle) * dist, h / 2 - 20, Math.sin(angle) * dist + 120);
      scene.add(tower);

      // Glowing office windows band
      const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 1.2, w * 0.9), windowMat);
      win.position.set(tower.position.x, h * 0.7, tower.position.z);
      scene.add(win);
    }

    // 3. 3D Character (The Rooftop Climber)
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 1.2, 0);
    scene.add(playerGroup);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }); // Blue Climber Jacket
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.4), jacketMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    playerGroup.add(torso);

    // Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.28), backpackMat);
    pack.position.set(0, 1.0, -0.3);
    playerGroup.add(pack);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 14), skinMat);
    head.position.y = 1.65;
    playerGroup.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    hair.position.y = 1.68;
    playerGroup.add(hair);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.58, 0.18);
    const leftArm = new THREE.Mesh(armGeo, jacketMat);
    leftArm.position.set(-0.46, 1.0, 0);
    const rightArm = new THREE.Mesh(armGeo, jacketMat);
    rightArm.position.set(0.46, 1.0, 0);
    playerGroup.add(leftArm, rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.22);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.18, 0.35, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.18, 0.35, 0);
    playerGroup.add(leftLeg, rightLeg);

    // 4. Rooftops, Platforms & Puzzles System
    interface PlatformAABB {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
      topY: number;
      isJumpPad?: boolean;
    }
    const platforms: PlatformAABB[] = [];

    // Helper: Add Rooftop Building
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const wallBldgMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const goldPlatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    const createRooftop = (
      x: number,
      y: number,
      z: number,
      w: number,
      d: number,
      isApex = false
    ) => {
      // Skyscraper Tower Below Rooftop
      const bldgH = y + 30;
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, bldgH, d), isApex ? goldPlatMat : wallBldgMat);
      bldg.position.set(x, y - bldgH / 2, z);
      bldg.receiveShadow = true;
      scene.add(bldg);

      // Top Surface Slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.8, d + 0.6), roofMat);
      slab.position.set(x, y - 0.4, z);
      slab.receiveShadow = true;
      scene.add(slab);

      // Register collision box
      platforms.push({
        minX: x - w / 2 - 0.3,
        maxX: x + w / 2 + 0.3,
        minZ: z - d / 2 - 0.3,
        maxZ: z + d / 2 + 0.3,
        topY: y,
      });

      // Rooftop Perimeter Guardrail
      const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 });
      const railN = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, 0.15), railMat);
      railN.position.set(x, y + 0.4, z + d / 2);
      const railS = railN.clone();
      railS.position.z = z - d / 2;
      scene.add(railN, railS);
    };

    // 10 Progressive Rooftop Stages
    createRooftop(0, 0, 0, 16, 16); // Level 1: Base
    createRooftop(0, 4, 28, 14, 14); // Level 2: Water Tank Alley
    createRooftop(22, 8, 48, 14, 14); // Level 3: Vent Maze
    createRooftop(36, 12, 75, 14, 14); // Level 4: Crane Platforms
    createRooftop(18, 16, 102, 14, 14); // Level 5: Antenna Mast
    createRooftop(-6, 20, 128, 12, 12); // Level 6: Glass Bridge
    createRooftop(-26, 24, 155, 14, 14); // Level 7: Elevator Base
    createRooftop(-20, 30, 188, 16, 16); // Level 8: Security Gate
    createRooftop(0, 36, 222, 18, 18); // Level 9: Helipad Summit
    createRooftop(0, 44, 260, 16, 16, true); // Level 10: Apex Skyscraper & Treasure Chest!

    // Moving Crane Platforms (between Level 3 & 4 and Level 4 & 5)
    const movingPlats: { mesh: THREE.Mesh; minX: number; maxX: number; speed: number; dir: number }[] = [];
    const platMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.5 });

    const addMovingPlatform = (startX: number, y: number, z: number, minX: number, maxX: number) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 4.5), platMat);
      p.position.set(startX, y, z);
      scene.add(p);
      movingPlats.push({ mesh: p, minX, maxX, speed: 4.5, dir: 1 });
      platforms.push({
        minX: p.position.x - 2.25,
        maxX: p.position.x + 2.25,
        minZ: z - 2.25,
        maxZ: z + 2.25,
        topY: y + 0.3,
      });
      return p;
    };

    addMovingPlatform(10, 6, 38, 6, 14);
    addMovingPlatform(28, 10, 62, 24, 32);

    // Motorized Sky Elevator (Rooftop 7)
    const elevatorMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, 5), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7 }));
    elevatorMesh.position.set(-26, 24, 155);
    scene.add(elevatorMesh);
    let elevatorY = 24;
    let elevatorDir = 1;

    // Helipad Yellow "H" on Level 9
    const hBarMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 7), hBarMat);
    h1.position.set(-2, 36.05, 222);
    const h2 = h1.clone();
    h2.position.x = 2;
    const hMid = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.05, 1.2), hBarMat);
    hMid.position.set(0, 36.05, 222);
    scene.add(h1, h2, hMid);

    // Rooftop 8 Security Gate
    const gateGroup = new THREE.Group();
    const gatePostL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    gatePostL.position.set(-22, 32, 192);
    const gatePostR = gatePostL.clone();
    gatePostR.position.x = -18;
    const gateBeam = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    gateBeam.position.set(-20, 33.5, 192);
    const gateLaser = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 3),
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    gateLaser.position.set(-20, 31.5, 192);
    gateGroup.add(gatePostL, gatePostR, gateBeam, gateLaser);
    scene.add(gateGroup);

    // 5. Collectibles: Sparkling Diamonds, Coins, Golden Key, Clue Scroll
    interface CollectibleItem {
      mesh: THREE.Group | THREE.Mesh;
      type: "diamond" | "coin" | "key" | "clue";
      collected: boolean;
      pos: [number, number, number];
    }
    const collectibles: CollectibleItem[] = [];

    // Helper: Sparkling Diamond Mesh
    const createDiamondMesh = () => {
      const g = new THREE.Group();
      const gemGeo = new THREE.OctahedronGeometry(0.55, 0);
      const gemMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.85,
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 8, 20), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
      halo.rotation.x = Math.PI / 2;
      g.add(gem, halo);
      return g;
    };

    // Helper: Gold Coin Mesh
    const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    coinGeo.rotateZ(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    // Helper: Golden Key Mesh
    const createKeyMesh = () => {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 8, 16), coinMat);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9), coinMat);
      shaft.position.y = -0.45;
      const bit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.08), coinMat);
      bit.position.set(0.12, -0.75, 0);
      g.add(ring, shaft, bit);
      return g;
    };

    // Helper: Clue Scroll Mesh
    const createScrollMesh = () => {
      const g = new THREE.Group();
      const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
      g.add(scroll);
      return g;
    };

    // Place Diamonds along progressive rooftops
    const diamondPositions: [number, number, number][] = [
      [0, 5.5, 28],
      [22, 9.5, 48],
      [36, 13.5, 75],
      [18, 17.5, 102],
      [-6, 21.5, 128],
      [-26, 25.5, 155],
      [0, 37.5, 222],
    ];

    diamondPositions.forEach((pos) => {
      const d = createDiamondMesh();
      d.position.set(...pos);
      scene.add(d);
      collectibles.push({ mesh: d, type: "diamond", collected: false, pos });
    });

    // Place Golden Key on isolated rooftop perch near level 8
    const keyMesh = createKeyMesh();
    keyMesh.position.set(-10, 31.8, 175);
    scene.add(keyMesh);
    collectibles.push({ mesh: keyMesh, type: "key", collected: false, pos: [-10, 31.8, 175] });

    // Place Clue Scroll on Rooftop 1
    const clueMesh = createScrollMesh();
    clueMesh.position.set(0, 1.2, 5);
    scene.add(clueMesh);
    collectibles.push({ mesh: clueMesh, type: "clue", collected: false, pos: [0, 1.2, 5] });

    // Place Coins along paths
    const coinPoints: [number, number, number][] = [
      [0, 1.2, 2],
      [0, 1.2, 4],
      [0, 4.8, 20],
      [0, 4.8, 24],
      [22, 8.8, 44],
      [-6, 20.8, 122],
      [-20, 30.8, 184],
    ];
    coinPoints.forEach((pos) => {
      const c = new THREE.Mesh(coinGeo, coinMat);
      c.position.set(...pos);
      scene.add(c);
      collectibles.push({ mesh: c, type: "coin", collected: false, pos });
    });

    // 6. THE GRAND FINALE: THE TREASURE CHEST & THE DIAMOND RING
    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 44, 260); // Rooftop 10 Summit

    // Marble Pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.8, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    pedestal.position.y = 0.6;
    chestGroup.add(pedestal);

    // Treasure Chest Body
    const chestBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 1.4), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 }));
    chestBody.position.y = 1.75;
    const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.2, 1.45), goldPlatMat);
    goldTrim.position.y = 2.1;
    chestGroup.add(chestBody, goldTrim);

    // Treasure Chest Lid (rotates open)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 2.3, -0.7);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 2.02, 16, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    lid.rotation.z = Math.PI / 2;
    lid.position.set(0, 0, 0.7);
    lidGroup.add(lid);
    chestGroup.add(lidGroup);

    // THE PRECIOUS DIAMOND RING (hidden inside, ascends on victory!)
    const ringGroup = new THREE.Group();
    ringGroup.position.set(0, 1.8, 0); // Inside chest initially

    // Gold Band
    const ringBand = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.09, 12, 24), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 }));
    ringBand.rotation.x = Math.PI / 2;

    // Giant Sparkling Diamond Gem
    const gemGeo = new THREE.OctahedronGeometry(0.48, 0);
    const ringGem = new THREE.Mesh(
      gemGeo,
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, emissive: 0x0284c7, roughness: 0.05, metalness: 0.95, transparent: true, opacity: 0.9 })
    );
    ringGem.position.set(0, 0.75, 0);

    // Glowing Particle Sparkle Ring
    const sparkleHalo = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: 0xe0f2fe }));
    sparkleHalo.rotation.x = Math.PI / 2;

    ringGroup.add(ringBand, ringGem, sparkleHalo);
    chestGroup.add(ringGroup);

    scene.add(chestGroup);

    // Fireworks Particles System
    const fireworkParticles: { mesh: THREE.Points; vels: THREE.Vector3[]; age: number }[] = [];
    const spawnFirework = (x: number, y: number, z: number, color: number) => {
      const pCount = 80;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      const vels: THREE.Vector3[] = [];

      for (let i = 0; i < pCount; i++) {
        pPos[i * 3] = x;
        pPos[i * 3 + 1] = y;
        pPos[i * 3 + 2] = z;
        vels.push(
          new THREE.Vector3(
            (Math.random() - 0.5) * 18,
            (Math.random() - 0.5) * 18 + 8,
            (Math.random() - 0.5) * 18
          )
        );
      }

      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color, size: 2.2, transparent: true, opacity: 1 });
      const pts = new THREE.Points(pGeo, pMat);
      scene.add(pts);
      fireworkParticles.push({ mesh: pts, vels, age: 0 });
      playSfx("firework");
    };

    // 7. Player Physics & Loop State
    const playerVel = new THREE.Vector3();
    let onGround = true;
    const gravity = -32;
    let playerRot = 0;
    let runCycle = 0;
    let chestOpened = false;
    let victoryTimer = 0;
    let lastCheckpointIndex = 0;

    // Resize Handler
    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // 8. Animation Loop
    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      // Rotate Collectibles
      collectibles.forEach((c) => {
        if (!c.collected) {
          c.mesh.rotation.y += 2.5 * dt;
        }
      });

      // Update Moving Platforms
      movingPlats.forEach((mp) => {
        mp.mesh.position.x += mp.speed * mp.dir * dt;
        if (mp.mesh.position.x > mp.maxX) mp.dir = -1;
        if (mp.mesh.position.x < mp.minX) mp.dir = 1;
      });

      // Update Elevator
      elevatorY += elevatorDir * 5.5 * dt;
      if (elevatorY > 30) elevatorDir = -1;
      if (elevatorY < 24) elevatorDir = 1;
      elevatorMesh.position.y = elevatorY;

      if (started && !paused) {
        // Player Input Direction
        let moveX = 0;
        let moveZ = 0;

        if (inputRef.current.forward) moveZ += 1;
        if (inputRef.current.backward) moveZ -= 1;
        if (inputRef.current.left) moveX -= 1;
        if (inputRef.current.right) moveX += 1;

        // Add touch joystick influence
        if (joystickRef.current.active) {
          moveX += joystickRef.current.dx;
          moveZ += -joystickRef.current.dy;
        }

        const moveLen = Math.hypot(moveX, moveZ);
        const speed = inputRef.current.sprint ? 14 : 9;

        if (moveLen > 0.05) {
          moveX = (moveX / moveLen) * speed;
          moveZ = (moveZ / moveLen) * speed;
          playerRot = Math.atan2(moveX, moveZ);
          playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, playerRot, 14 * dt);

          runCycle += speed * dt * 1.5;
          leftLeg.rotation.x = Math.sin(runCycle) * 0.85;
          rightLeg.rotation.x = -Math.sin(runCycle) * 0.85;
          leftArm.rotation.x = -Math.sin(runCycle) * 0.8;
          rightArm.rotation.x = Math.sin(runCycle) * 0.8;
        } else {
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
          leftArm.rotation.x = 0;
          rightArm.rotation.x = 0;
        }

        // Jump
        if (inputRef.current.jump && onGround) {
          playerVel.y = 15.5;
          onGround = false;
          inputRef.current.jump = false;
          playSfx("jump");
        }

        // Apply Gravity
        playerVel.y += gravity * dt;

        // Update Position
        playerGroup.position.x += moveX * dt;
        playerGroup.position.z += moveZ * dt;
        playerGroup.position.y += playerVel.y * dt;

        // Rooftop Platforms Collision Check
        onGround = false;
        const px = playerGroup.position.x;
        const py = playerGroup.position.y;
        const pz = playerGroup.position.z;

        // Check static platforms
        for (const p of platforms) {
          if (px >= p.minX && px <= p.maxX && pz >= p.minZ && pz <= p.maxZ) {
            if (py <= p.topY + 0.1 && py >= p.topY - 1.4 && playerVel.y <= 0) {
              playerGroup.position.y = p.topY;
              playerVel.y = 0;
              onGround = true;
              break;
            }
          }
        }

        // Check elevator platform
        if (Math.abs(px - (-26)) < 2.5 && Math.abs(pz - 155) < 2.5) {
          if (py <= elevatorY + 0.4 && py >= elevatorY - 1.2 && playerVel.y <= 0) {
            playerGroup.position.y = elevatorY + 0.3;
            playerVel.y = 0;
            onGround = true;
          }
        }

        // Checkpoint Update
        CHECKPOINTS.forEach((cp, idx) => {
          const distToCp = Math.hypot(px - cp.pos[0], pz - cp.pos[2]);
          if (distToCp < 9 && py >= cp.pos[1] - 2) {
            if (idx > lastCheckpointIndex) {
              lastCheckpointIndex = idx;
              setCurrentLevel(idx + 1);
            }
          }
        });

        // Fall Off Rooftop Respawn
        if (playerGroup.position.y < -12) {
          const respawnCp = CHECKPOINTS[lastCheckpointIndex];
          playerGroup.position.set(respawnCp.pos[0], respawnCp.pos[1] + 1.5, respawnCp.pos[2]);
          playerVel.set(0, 0, 0);
          audio.bad();
        }

        // Collectibles Interaction Check
        collectibles.forEach((c) => {
          if (!c.collected) {
            const dist = playerGroup.position.distanceTo(c.mesh.position);
            if (dist < 1.6) {
              if (c.type === "diamond") {
                c.collected = true;
                scene.remove(c.mesh);
                setDiamonds((d) => d + 1);
                playSfx("diamond");
              } else if (c.type === "coin") {
                c.collected = true;
                scene.remove(c.mesh);
                setCoins((cn) => cn + 1);
                playSfx("coin");
              } else if (c.type === "key") {
                c.collected = true;
                scene.remove(c.mesh);
                setHasKey(true);
                playSfx("unlock");
              } else if (c.type === "clue") {
                setCluePopup("📜 Clue: The Golden Key on Rooftop 8 unlocks the laser gate. The Diamond Ring is on the Apex!");
              }
            }
          }
        });

        // Security Gate Check (Rooftop 8)
        if (!gateUnlocked) {
          const distToGate = Math.hypot(px - (-20), pz - 192);
          if (distToGate < 4.5 && py >= 30) {
            if (hasKey) {
              setInteractPrompt("Press E to Unlock Security Gate with Golden Key 🔑");
              if (inputRef.current.interact) {
                setGateUnlocked(true);
                scene.remove(gateLaser);
                setInteractPrompt(null);
                playSfx("unlock");
              }
            } else {
              setInteractPrompt("⚠️ Gate is Locked! Find the Golden Key on the radio tower!");
              // Block movement past gate
              if (pz > 191) playerGroup.position.z = 191;
            }
          } else if (interactPrompt && interactPrompt.includes("Gate")) {
            setInteractPrompt(null);
          }
        }

        // Apex Treasure Chest Check (Rooftop 10)
        const distToChest = Math.hypot(px - 0, pz - 260);
        if (distToChest < 3.8 && py >= 44 && !chestOpened) {
          setInteractPrompt("Press E or Tap to Open the Mysterious Treasure Chest! 💎");
          if (inputRef.current.interact) {
            chestOpened = true;
            setInteractPrompt(null);
            playSfx("fanfare");
            setVictory(true);

            // Spawn fireworks
            spawnFirework(0, 55, 260, 0x38bdf8);
            setTimeout(() => spawnFirework(-15, 60, 245, 0xfacc15), 300);
            setTimeout(() => spawnFirework(15, 62, 275, 0xef4444), 600);
            setTimeout(() => spawnFirework(0, 68, 260, 0xa855f7), 900);
          }
        } else if (interactPrompt && interactPrompt.includes("Treasure")) {
          setInteractPrompt(null);
        }

        // Victory Animation (Chest Opening & Diamond Ring Ascending)
        if (chestOpened) {
          victoryTimer += dt;
          // Open Lid
          lidGroup.rotation.x = THREE.MathUtils.lerp(lidGroup.rotation.x, -Math.PI / 1.7, 5 * dt);
          // Ascend Diamond Ring
          ringGroup.position.y = THREE.MathUtils.lerp(ringGroup.position.y, 4.2, 3 * dt);
          ringGroup.rotation.y += 2.5 * dt;
        }

        // Update Fireworks
        for (let i = fireworkParticles.length - 1; i >= 0; i--) {
          const fw = fireworkParticles[i];
          fw.age += dt;
          const posArr = fw.mesh.geometry.attributes.position.array as Float32Array;
          for (let j = 0; j < fw.vels.length; j++) {
            posArr[j * 3] += fw.vels[j].x * dt;
            posArr[j * 3 + 1] += fw.vels[j].y * dt;
            posArr[j * 3 + 2] += fw.vels[j].z * dt;
            fw.vels[j].y -= 9.8 * dt; // gravity
          }
          fw.mesh.geometry.attributes.position.needsUpdate = true;
          (fw.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - fw.age / 1.6);
          if (fw.age > 1.6) {
            scene.remove(fw.mesh);
            fireworkParticles.splice(i, 1);
          }
        }

        // Camera Follow (Cinematic Third-Person Orbit)
        const targetCamX = playerGroup.position.x - Math.sin(playerGroup.rotation.y) * 8.5;
        const targetCamZ = playerGroup.position.z - Math.cos(playerGroup.rotation.y) * 8.5;
        const targetCamY = playerGroup.position.y + 5.2;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 6 * dt);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 6 * dt);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 6 * dt);
        camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.8, playerGroup.position.z);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [started, paused, hasKey, gateUnlocked, playSfx]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0F172A] select-none text-white font-sans">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* TOP HUD BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        {/* Back Button */}
        <Link
          href="/#games"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-1.5 text-xs font-semibold backdrop-blur-md transition hover:border-[#38BDF8] hover:text-[#38BDF8]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Gameverse
        </Link>

        {/* Level Progression Indicator */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#38BDF8]">
            Rooftop Climbing Mission
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-white">
              Level {currentLevel}/10: {CHECKPOINTS[currentLevel - 1]?.name.split(":")[1] || "Skyscraper"}
            </span>
          </div>
        </div>

        {/* Collectibles HUD & Pause */}
        <div className="flex items-center gap-3">
          {/* Diamonds */}
          <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full border border-cyan-400/30 backdrop-blur-md">
            <span className="text-cyan-400 text-sm">💎</span>
            <span className="font-mono text-xs sm:text-sm font-black text-cyan-300">{diamonds}</span>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-md">
            <span className="text-amber-400 text-sm">🪙</span>
            <span className="font-mono text-xs sm:text-sm font-black text-amber-300">{coins}</span>
          </div>

          {/* Key status */}
          {hasKey && (
            <div className="flex items-center gap-1 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/50 text-[10px] font-bold text-amber-300 animate-pulse">
              <span>🔑 Key</span>
            </div>
          )}

          <button
            onClick={() => setPaused((p) => !p)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white font-bold backdrop-blur-md transition hover:border-white"
          >
            {paused ? "▶" : "⏸"}
          </button>
        </div>
      </div>

      {/* INTERACT PROMPT TOAST */}
      {interactPrompt && !victory && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md">
          <div className="rounded-2xl border border-cyan-400/50 bg-black/85 px-5 py-3 text-center shadow-2xl backdrop-blur-md animate-bounce">
            <p className="text-xs sm:text-sm font-bold text-cyan-200">{interactPrompt}</p>
          </div>
        </div>
      )}

      {/* CLUE POPUP MODAL */}
      {cluePopup && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md p-6">
          <div className="max-w-sm w-full rounded-3xl border border-amber-400/40 bg-[#16161E] p-6 text-center shadow-2xl animate-fade-up">
            <span className="text-3xl mb-2 block">📜</span>
            <h3 className="text-base font-bold text-amber-300">Rooftop Clue Discovered!</h3>
            <p className="mt-2 text-xs text-gray-300 leading-relaxed">{cluePopup}</p>
            <button
              onClick={() => setCluePopup(null)}
              className="mt-5 w-full py-2.5 rounded-full bg-amber-400 text-[#0F172A] font-black text-xs uppercase"
            >
              Continue Climbing
            </button>
          </div>
        </div>
      )}

      {/* MOBILE ON-SCREEN CONTROLS */}
      <div className="sm:hidden absolute bottom-6 left-6 z-20">
        {/* D-Pad Virtual Joypad */}
        <div className="grid grid-cols-3 gap-1 w-32 h-32">
          <div></div>
          <button
            onTouchStart={() => (inputRef.current.forward = true)}
            onTouchEnd={() => (inputRef.current.forward = false)}
            className="rounded-xl bg-white/20 border border-white/30 text-lg flex items-center justify-center active:bg-cyan-400/40"
          >
            ▲
          </button>
          <div></div>
          <button
            onTouchStart={() => (inputRef.current.left = true)}
            onTouchEnd={() => (inputRef.current.left = false)}
            className="rounded-xl bg-white/20 border border-white/30 text-lg flex items-center justify-center active:bg-cyan-400/40"
          >
            ◀
          </button>
          <div className="rounded-xl bg-white/10 flex items-center justify-center text-[10px] text-gray-400">
            MOVE
          </div>
          <button
            onTouchStart={() => (inputRef.current.right = true)}
            onTouchEnd={() => (inputRef.current.right = false)}
            className="rounded-xl bg-white/20 border border-white/30 text-lg flex items-center justify-center active:bg-cyan-400/40"
          >
            ▶
          </button>
          <div></div>
          <button
            onTouchStart={() => (inputRef.current.backward = true)}
            onTouchEnd={() => (inputRef.current.backward = false)}
            className="rounded-xl bg-white/20 border border-white/30 text-lg flex items-center justify-center active:bg-cyan-400/40"
          >
            ▼
          </button>
          <div></div>
        </div>
      </div>

      <div className="sm:hidden absolute bottom-6 right-6 z-20 flex gap-2">
        <button
          onTouchStart={() => (inputRef.current.sprint = true)}
          onTouchEnd={() => (inputRef.current.sprint = false)}
          className="w-14 h-14 rounded-2xl bg-amber-500/30 active:bg-amber-400/60 border border-amber-400/40 text-xs font-black flex items-center justify-center backdrop-blur-md uppercase"
        >
          RUN
        </button>
        <button
          onTouchStart={() => (inputRef.current.jump = true)}
          onTouchEnd={() => (inputRef.current.jump = false)}
          className="w-16 h-16 rounded-2xl bg-cyan-500/40 active:bg-cyan-400/70 border border-cyan-300 text-xs font-black flex items-center justify-center backdrop-blur-md uppercase"
        >
          JUMP
        </button>
        <button
          onTouchStart={() => (inputRef.current.interact = true)}
          onTouchEnd={() => (inputRef.current.interact = false)}
          className="w-14 h-14 rounded-2xl bg-emerald-500/30 active:bg-emerald-400/60 border border-emerald-400/40 text-xs font-black flex items-center justify-center backdrop-blur-md uppercase"
        >
          ACTION
        </button>
      </div>

      {/* START SCREEN OVERLAY */}
      {!started && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="max-w-lg w-full rounded-3xl border border-cyan-400/30 bg-[#14141E] p-8 text-center shadow-2xl animate-fade-up">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#38BDF8]">
              3D Adventure Platformer
            </span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-white">
              FIND THE DIAMOND RING
            </h1>
            <p className="mt-3 text-sm text-gray-300 leading-relaxed">
              A priceless diamond ring is locked inside a mysterious treasure box on top of the city's
              highest skyscraper! Climb 10 increasingly challenging rooftops, cross moving platforms, solve puzzles, and uncover the ring!
            </p>

            <div className="my-6 grid grid-cols-2 gap-3 text-left bg-black/40 p-4 rounded-2xl border border-white/10 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Movement</span>
                <span className="text-white font-semibold">WASD or Arrow Keys</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Jump</span>
                <span className="text-white font-semibold">Spacebar</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Sprint / Run</span>
                <span className="text-white font-semibold">Shift Key</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Interact / Open</span>
                <span className="text-white font-semibold">E Key or Enter</span>
              </div>
            </div>

            <button
              onClick={() => {
                setStarted(true);
                audio.click();
              }}
              className="w-full py-4 rounded-full bg-[#38BDF8] hover:bg-[#0284C7] text-white font-black text-sm uppercase tracking-wider transition-transform active:scale-[0.98] shadow-lg shadow-cyan-500/25"
            >
              Start Adventure 💎🏃
            </button>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {paused && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-md p-6">
          <div className="max-w-xs w-full rounded-3xl border border-white/20 bg-[#15151A] p-6 text-center">
            <h2 className="text-xl font-bold text-white">Adventure Paused</h2>
            <p className="text-xs text-gray-400 mt-1">Catching breath on the rooftops</p>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => setPaused(false)}
                className="w-full py-3 rounded-full bg-[#38BDF8] text-white font-bold text-xs uppercase"
              >
                Resume
              </button>
              <Link
                href="/#games"
                className="block w-full py-3 rounded-full border border-white/20 text-white font-bold text-xs uppercase hover:bg-white/10"
              >
                Exit to Hub
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* GRAND FINALE: CONGRATULATIONS YOU FOUND THE DIAMOND RING! */}
      {victory && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-xl p-6">
          <div className="max-w-md w-full rounded-3xl border border-cyan-400/50 bg-[#111827] p-8 text-center shadow-2xl animate-fade-up">
            <div className="inline-flex p-4 rounded-3xl bg-cyan-400/20 text-cyan-300 mb-4 text-4xl animate-bounce">
              💍 ✨
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight">
              CONGRATULATIONS!
            </h2>
            <p className="text-sm font-extrabold text-[#38BDF8] mt-1 tracking-wider uppercase">
              YOU FOUND THE DIAMOND RING!
            </p>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
              You climbed all 10 towering rooftops, solved every puzzle, and unlocked the golden treasure chest on the Apex Skyscraper!
            </p>

            <div className="my-6 grid grid-cols-3 gap-2 bg-black/50 p-4 rounded-2xl border border-cyan-400/20 text-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Rooftops</span>
                <span className="text-base font-black text-cyan-400">10 / 10</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Diamonds</span>
                <span className="text-base font-black text-cyan-300">{diamonds}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Coins</span>
                <span className="text-base font-black text-amber-400">{coins}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setVictory(false);
                  setStarted(true);
                  setCurrentLevel(1);
                  setDiamonds(0);
                  setCoins(0);
                  setHasKey(false);
                  setGateUnlocked(false);
                  audio.click();
                }}
                className="w-full py-3.5 rounded-full bg-[#38BDF8] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-[#0284C7] transition"
              >
                Play Again 🔄
              </button>
              <Link
                href="/#games"
                className="block w-full py-3 rounded-full border border-white/20 text-white font-bold text-xs uppercase hover:bg-white/10 transition"
              >
                Back to Gameverse Hub
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
