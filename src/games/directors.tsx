"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { audio } from "@/core/audio";

/* ------------------------------------------------------------------ */
/* 3D ENDLESS RUNNER — SUBWAY SURFERS STYLE RAILWAY RUN               */
/* Three.js 3-Lane Tracks, Moving Trains, Stations, Tunnels, Barriers */
/* ------------------------------------------------------------------ */

const LANES = [-3.2, 0, 3.2] as const;
type LaneIndex = 0 | 1 | 2;

interface PowerUpState {
  magnet: number; // remaining seconds
  superJump: number;
  multiplier: number;
  shield: number;
  speedBoost: number;
}

export default function Directors() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Game UI State
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // HUD
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [powerUps, setPowerUps] = useState<PowerUpState>({
    magnet: 0,
    superJump: 0,
    multiplier: 0,
    shield: 0,
    speedBoost: 0,
  });

  // Floating Toast notification
  const [floatingToast, setFloatingToast] = useState<string | null>(null);

  // Controls Ref for 60fps Loop
  const actionQueueRef = useRef<{
    laneChange: -1 | 1 | 0;
    jump: boolean;
    slide: boolean;
  }>({
    laneChange: 0,
    jump: false,
    slide: false,
  });

  // Touch swipe state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ene_runner_highscore");
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setFloatingToast(msg);
    setTimeout(() => setFloatingToast((curr) => (curr === msg ? null : curr)), 1800);
  }, []);

  // Web Audio Synth Sound FX
  const playSfx = useCallback((type: "coin" | "jump" | "slide" | "powerup" | "crash" | "speed") => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "coin") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "jump") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);
        osc.start();
        osc.stop(ctx.currentTime + 0.24);
      } else if (type === "slide") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(340, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      } else if (type === "powerup") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "speed") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === "crash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
    } catch {}
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!started && (e.code === "Space" || e.code === "Enter")) {
        setStarted(true);
        audio.click();
        return;
      }
      if (e.code === "ArrowLeft" || e.code === "KeyA") actionQueueRef.current.laneChange = -1;
      if (e.code === "ArrowRight" || e.code === "KeyD") actionQueueRef.current.laneChange = 1;
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") actionQueueRef.current.jump = true;
      if (e.code === "ArrowDown" || e.code === "KeyS") actionQueueRef.current.slide = true;
      if (e.code === "KeyP" || e.code === "Escape") setPaused((p) => !p);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [started]);

  // Touch Swipe controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 25) return; // Tap threshold

    if (absDx > absDy) {
      if (dx > 0) actionQueueRef.current.laneChange = 1;
      else actionQueueRef.current.laneChange = -1;
    } else {
      if (dy < 0) actionQueueRef.current.jump = true;
      else actionQueueRef.current.slide = true;
    }
  };

  // Restart handler
  const restartGame = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setCoins(0);
    setStarted(true);
    setPaused(false);
    audio.click();
  }, []);

  // Main Three.js Endless Runner Engine
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8); // Sky blue
    scene.fog = new THREE.Fog(0x38bdf8, 55, 190);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 300);
    camera.position.set(0, 4.6, -6.8);
    camera.lookAt(0, 1.8, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.45);
    dirLight.position.set(35, 55, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 3. 3D Character (The Film Director on the Run)
    const charGroup = new THREE.Group();
    charGroup.position.set(0, 0, 0);
    scene.add(charGroup);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.75, roughness: 0.2 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.88, 0.42), jacketMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    charGroup.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), skinMat);
    head.position.y = 1.95;
    head.castShadow = true;
    charGroup.add(head);

    // Director Backwards Cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 16), hairMat);
    cap.position.set(0, 2.12, -0.05);
    cap.rotation.x = -0.3;
    charGroup.add(cap);

    // Megaphone
    const megaphone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    megaphone.rotation.z = Math.PI / 2;
    megaphone.position.set(0.55, 1.25, 0.2);
    charGroup.add(megaphone);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    const leftArm = new THREE.Mesh(armGeo, jacketMat);
    leftArm.position.set(-0.48, 1.25, 0);
    const rightArm = new THREE.Mesh(armGeo, jacketMat);
    rightArm.position.set(0.48, 1.25, 0);
    charGroup.add(leftArm, rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.8, 0.24);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.2, 0.45, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.2, 0.45, 0);
    charGroup.add(leftLeg, rightLeg);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.26, 0.16, 0.4);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.4, 0.08);
    leftLeg.add(leftShoe);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.4, 0.08);
    rightLeg.add(rightShoe);

    // Shield Bubble Mesh
    const shieldBubble = new THREE.Mesh(
      new THREE.SphereGeometry(1.65, 16, 16),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, roughness: 0.1 })
    );
    shieldBubble.position.y = 1.2;
    shieldBubble.visible = false;
    charGroup.add(shieldBubble);

    // Speed Trail Particles Mesh
    const speedFire = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2.2, 8),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.7 })
    );
    speedFire.rotation.x = Math.PI / 2;
    speedFire.position.set(0, 0.8, -1.4);
    speedFire.visible = false;
    charGroup.add(speedFire);

    // 4. Procedural Railway Track System (Tracks, Stations, Tunnels, Bridges)
    const TRACK_SEGMENT_LENGTH = 40;
    const NUM_SEGMENTS = 8;
    const TRACK_SEGMENTS: THREE.Group[] = [];

    // Materials
    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.95 });
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x522e1b, roughness: 0.8 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.5 });
    const stationMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6 });

    // Train Materials
    const trainBodyMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.3 });
    const trainStripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
    const trainWindowMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const barrierWoodMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.8 });
    const dangerStripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });

    interface ActiveObstacle {
      mesh: THREE.Group;
      lane: number;
      z: number;
      type: "train_static" | "train_moving" | "hurdle_low" | "barrier_high" | "crates";
      movingSpeed?: number;
      width: number;
      height: number;
      length: number;
      jumpable: boolean;
      slideable: boolean;
    }

    interface ActiveCoin {
      mesh: THREE.Mesh;
      lane: number;
      z: number;
      y: number;
      collected: boolean;
    }

    interface ActivePowerUpItem {
      mesh: THREE.Group;
      lane: number;
      z: number;
      type: "magnet" | "superJump" | "multiplier" | "shield" | "speedBoost";
      collected: boolean;
    }

    let obstacles: ActiveObstacle[] = [];
    let trackCoins: ActiveCoin[] = [];
    let powerUpItems: ActivePowerUpItem[] = [];

    // Helper: Build Train Mesh
    const createTrainMesh = (isMoving: boolean) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 14), trainBodyMat);
      body.position.y = 1.8;
      body.castShadow = true;
      g.add(body);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.45, 14.02), trainStripeMat);
      stripe.position.y = 1.4;
      g.add(stripe);

      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 14, 16, 1, false, 0, Math.PI), trainBodyMat);
      roof.rotation.z = Math.PI / 2;
      roof.rotation.y = Math.PI / 2;
      roof.position.y = 3.4;
      g.add(roof);

      for (let z = -5; z <= 5; z += 2.2) {
        const winL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 1.2), trainWindowMat);
        winL.position.set(-1.21, 2.2, z);
        const winR = winL.clone();
        winR.position.x = 1.21;
        g.add(winL, winR);
      }

      const headLight = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      headLight.rotation.x = Math.PI / 2;
      headLight.position.set(0, 1.2, isMoving ? -7.05 : 7.05);
      g.add(headLight);

      return g;
    };

    // Helper: Build Low Hurdle (Jump)
    const createLowHurdle = () => {
      const g = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 0.2), dangerStripeMat);
      bar.position.y = 0.85;
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.15), barrierWoodMat);
      leg1.position.set(-1.1, 0.42, 0);
      const leg2 = leg1.clone();
      leg2.position.x = 1.1;
      g.add(bar, leg1, leg2);
      return g;
    };

    // Helper: Build High Clearance Bar (Slide)
    const createHighBarrier = () => {
      const g = new THREE.Group();
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.6, 0.3), dangerStripeMat);
      topBar.position.y = 1.95;
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.3), barrierWoodMat);
      legL.position.set(-1.25, 1.15, 0);
      const legR = legL.clone();
      legR.position.x = 1.25;
      g.add(topBar, legL, legR);
      return g;
    };

    // Helper: Build Wooden Crates
    const createCrates = () => {
      const g = new THREE.Group();
      const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), barrierWoodMat);
      crate1.position.set(-0.5, 0.55, 0);
      const crate2 = crate1.clone();
      crate2.position.set(0.5, 0.55, 0);
      const crate3 = crate1.clone();
      crate3.position.set(0, 1.65, 0);
      g.add(crate1, crate2, crate3);
      return g;
    };

    // Helper: Build Railway Signal Post
    const createSignalPost = () => {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.5), gantryMat);
      pole.position.y = 2.25;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.25), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      box.position.y = 4.0;
      const greenLight = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      greenLight.position.set(0, 4.2, 0.14);
      const redLight = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redLight.position.set(0, 3.8, 0.14);
      g.add(pole, box, greenLight, redLight);
      return g;
    };

    // Coin geometry
    const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    coinGeo.rotateZ(Math.PI / 2);

    // Power-up Mesh Builder
    const createPowerUpMesh = (type: string) => {
      const g = new THREE.Group();
      const color =
        type === "magnet"
          ? 0x0284c7
          : type === "superJump"
          ? 0x22c55e
          : type === "shield"
          ? 0x06b6d4
          : type === "speedBoost"
          ? 0xf97316
          : 0xa855f7;

      const icon = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.48),
        new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.7 })
      );
      icon.position.y = 1.2;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 8, 16), new THREE.MeshBasicMaterial({ color }));
      ring.position.y = 1.2;
      g.add(icon, ring);
      return g;
    };

    // Populate a Track Segment (with Railway Stations, Tunnels, Bridges)
    const populateSegment = (seg: THREE.Group, segZ: number, isInitial: boolean, segIndex: number) => {
      while (seg.children.length > 0) seg.remove(seg.children[0]);

      // Ground Ballast Plane
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, TRACK_SEGMENT_LENGTH).rotateX(-Math.PI / 2), ballastMat);
      ground.position.set(0, 0, 0);
      ground.receiveShadow = true;
      seg.add(ground);

      const isStation = segIndex % 6 === 2;
      const isTunnel = segIndex % 6 === 4;
      const isBridge = segIndex % 6 === 0;

      if (isStation) {
        // Station Platform with Canopy Roof & Signs
        const platform = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, TRACK_SEGMENT_LENGTH), stationMat);
        platform.position.set(-8.5, 0.6, 0);
        const yellowLine = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, TRACK_SEGMENT_LENGTH), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        yellowLine.position.set(-6.4, 1.21, 0);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.3, TRACK_SEGMENT_LENGTH), new THREE.MeshStandardMaterial({ color: 0x334155 }));
        roof.position.set(-8.5, 4.5, 0);
        seg.add(platform, yellowLine, roof);

        // Right side wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, TRACK_SEGMENT_LENGTH), wallMat);
        rightWall.position.set(8.5, 2.5, 0);
        seg.add(rightWall);
      } else if (isTunnel) {
        // Dark Tunnel Arch with Neon Lamps
        const tunnelArch = new THREE.Mesh(
          new THREE.CylinderGeometry(8.2, 8.2, TRACK_SEGMENT_LENGTH, 16, 1, true, Math.PI / 2, Math.PI),
          tunnelMat
        );
        tunnelArch.rotation.z = Math.PI / 2;
        tunnelArch.position.set(0, 3.8, 0);
        seg.add(tunnelArch);

        // Neon strip lamp along ceiling
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, TRACK_SEGMENT_LENGTH), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        lamp.position.set(0, 7.8, 0);
        seg.add(lamp);
      } else if (isBridge) {
        // Steel Bridge Girders
        const girderL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, TRACK_SEGMENT_LENGTH), bridgeMat);
        girderL.position.set(-8, 2.25, 0);
        const girderR = girderL.clone();
        girderR.position.x = 8;
        const topTruss = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.4, 0.4), bridgeMat);
        topTruss.position.set(0, 4.5, 0);
        seg.add(girderL, girderR, topTruss);
      } else {
        // Standard Boundary Walls
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, TRACK_SEGMENT_LENGTH), wallMat);
        leftWall.position.set(-8.5, 2.5, 0);
        const rightWall = leftWall.clone();
        rightWall.position.x = 8.5;
        seg.add(leftWall, rightWall);

        // Overhead Gantry
        const gantryBeam = new THREE.Mesh(new THREE.BoxGeometry(17, 0.4, 0.4), gantryMat);
        gantryBeam.position.set(0, 5.2, 0);
        const gantryPoleL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5.2), gantryMat);
        gantryPoleL.position.set(-8, 2.6, 0);
        const gantryPoleR = gantryPoleL.clone();
        gantryPoleR.position.x = 8;
        seg.add(gantryBeam, gantryPoleL, gantryPoleR);

        // Signal Post on side
        const signal = createSignalPost();
        signal.position.set(6.8, 0, 0);
        seg.add(signal);
      }

      // 3 Tracks (Rails + Sleepers)
      LANES.forEach((laneX) => {
        for (let z = -TRACK_SEGMENT_LENGTH / 2 + 1; z < TRACK_SEGMENT_LENGTH / 2; z += 1.8) {
          const tie = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.35), sleeperMat);
          tie.position.set(laneX, 0.06, z);
          seg.add(tie);
        }
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, TRACK_SEGMENT_LENGTH), railMat);
        railL.position.set(laneX - 0.75, 0.15, 0);
        const railR = railL.clone();
        railR.position.x = laneX + 0.75;
        seg.add(railL, railR);
      });

      if (isInitial && segZ < 55) return;

      // Spawn Obstacles on this segment
      const chosenLaneIdx = Math.floor(Math.random() * 3) as LaneIndex;
      const laneX = LANES[chosenLaneIdx];
      const r = Math.random();

      if (r < 0.35) {
        // Train (Static or Moving)
        const isMoving = Math.random() > 0.45;
        const train = createTrainMesh(isMoving);
        train.position.set(laneX, 0, segZ);
        scene.add(train);
        obstacles.push({
          mesh: train,
          lane: chosenLaneIdx,
          z: segZ,
          type: isMoving ? "train_moving" : "train_static",
          movingSpeed: isMoving ? 14 : 0,
          width: 2.2,
          height: 3.2,
          length: 14,
          jumpable: false,
          slideable: false,
        });

        // Coins on Train Roof
        for (let cz = segZ - 4; cz <= segZ + 4; cz += 2) {
          const coin = new THREE.Mesh(coinGeo, goldMat);
          coin.position.set(laneX, 3.8, cz);
          scene.add(coin);
          trackCoins.push({ mesh: coin, lane: chosenLaneIdx, z: cz, y: 3.8, collected: false });
        }
      } else if (r < 0.65) {
        // Low Hurdle (Jump)
        const hurdle = createLowHurdle();
        hurdle.position.set(laneX, 0, segZ);
        scene.add(hurdle);
        obstacles.push({
          mesh: hurdle,
          lane: chosenLaneIdx,
          z: segZ,
          type: "hurdle_low",
          width: 2.4,
          height: 0.9,
          length: 0.8,
          jumpable: true,
          slideable: false,
        });

        // Arc of coins over the hurdle
        [-2, 0, 2].forEach((offsetZ, i) => {
          const coinY = i === 1 ? 2.3 : 1.2;
          const coin = new THREE.Mesh(coinGeo, goldMat);
          coin.position.set(laneX, coinY, segZ + offsetZ);
          scene.add(coin);
          trackCoins.push({ mesh: coin, lane: chosenLaneIdx, z: segZ + offsetZ, y: coinY, collected: false });
        });
      } else if (r < 0.85) {
        // High Clearance Barrier (Slide)
        const barrier = createHighBarrier();
        barrier.position.set(laneX, 0, segZ);
        scene.add(barrier);
        obstacles.push({
          mesh: barrier,
          lane: chosenLaneIdx,
          z: segZ,
          type: "barrier_high",
          width: 2.5,
          height: 1.8,
          length: 0.8,
          jumpable: false,
          slideable: true,
        });

        for (let cz = segZ - 2; cz <= segZ + 2; cz += 2) {
          const coin = new THREE.Mesh(coinGeo, goldMat);
          coin.position.set(laneX, 0.45, cz);
          scene.add(coin);
          trackCoins.push({ mesh: coin, lane: chosenLaneIdx, z: cz, y: 0.45, collected: false });
        }
      } else {
        // Wooden Crates
        const crates = createCrates();
        crates.position.set(laneX, 0, segZ);
        scene.add(crates);
        obstacles.push({
          mesh: crates,
          lane: chosenLaneIdx,
          z: segZ,
          type: "crates",
          width: 2.2,
          height: 2.0,
          length: 1.5,
          jumpable: false,
          slideable: false,
        });
      }

      // Spawn Power-up (15% chance)
      if (Math.random() < 0.15) {
        const pLaneIdx = ((chosenLaneIdx + 1) % 3) as LaneIndex;
        const pTypes: ("magnet" | "superJump" | "multiplier" | "shield" | "speedBoost")[] = [
          "magnet",
          "superJump",
          "multiplier",
          "shield",
          "speedBoost",
        ];
        const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
        const pMesh = createPowerUpMesh(pType);
        pMesh.position.set(LANES[pLaneIdx], 0, segZ + 12);
        scene.add(pMesh);
        powerUpItems.push({ mesh: pMesh, lane: pLaneIdx, z: segZ + 12, type: pType, collected: false });
      }

      // Coin lines on other lane
      const coinLaneIdx = ((chosenLaneIdx + 2) % 3) as LaneIndex;
      for (let cz = segZ - 6; cz <= segZ + 6; cz += 3) {
        const coin = new THREE.Mesh(coinGeo, goldMat);
        coin.position.set(LANES[coinLaneIdx], 0.8, cz);
        scene.add(coin);
        trackCoins.push({ mesh: coin, lane: coinLaneIdx, z: cz, y: 0.8, collected: false });
      }
    };

    // Initial Segments
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const seg = new THREE.Group();
      const zPos = i * TRACK_SEGMENT_LENGTH;
      seg.position.z = zPos;
      populateSegment(seg, zPos, true, i);
      scene.add(seg);
      TRACK_SEGMENTS.push(seg);
    }

    // 5. Player Physics State
    let currentLane: LaneIndex = 1; // Center lane
    let targetX: number = LANES[1];
    let playerY = 0;
    let vy = 0;
    const gravity = -38;
    let isJumping = false;
    let isSliding = false;
    let slideTimer = 0;
    const SLIDE_DURATION = 0.65;

    // Running Speed Progression
    let baseSpeed = 23; // m/s
    const maxSpeed = 48;
    let runDistance = 0;
    let localScore = 0;
    let localCoins = 0;

    const activeBuffs = {
      magnet: 0,
      superJump: 0,
      multiplier: 0,
      shield: 0,
      speedBoost: 0,
    };

    // Resize Handler
    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // 6. Animation Loop
    let animId: number;
    let lastTime = performance.now();
    let runCycle = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      if (started && !paused && !gameOver) {
        // Speed up gradually (or apply speed boost)
        baseSpeed = Math.min(maxSpeed, baseSpeed + 0.45 * dt);
        const currentSpeed = activeBuffs.speedBoost > 0 ? baseSpeed + 16 : baseSpeed;

        // Score update
        const scoreMultiplier = activeBuffs.multiplier > 0 ? 2 : 1;
        localScore += currentSpeed * dt * 2.8 * scoreMultiplier;
        runDistance += currentSpeed * dt;
        setScore(Math.round(localScore));

        // Process Input Queue
        if (actionQueueRef.current.laneChange !== 0) {
          const next = currentLane + actionQueueRef.current.laneChange;
          if (next >= 0 && next <= 2) {
            currentLane = next as LaneIndex;
            targetX = LANES[currentLane];
            playSfx("slide");
          }
          actionQueueRef.current.laneChange = 0;
        }

        // Jump Trigger
        if (actionQueueRef.current.jump && !isJumping) {
          isJumping = true;
          isSliding = false;
          vy = activeBuffs.superJump > 0 ? 20.5 : 15.0;
          actionQueueRef.current.jump = false;
          playSfx("jump");
        }

        // Slide Trigger
        if (actionQueueRef.current.slide) {
          if (isJumping) vy = -28; // Quick slam to ground
          isSliding = true;
          slideTimer = SLIDE_DURATION;
          actionQueueRef.current.slide = false;
          playSfx("slide");
        }

        // Physics: Y Jump & Gravity
        if (isJumping) {
          playerY += vy * dt;
          vy += gravity * dt;
          if (playerY <= 0) {
            playerY = 0;
            vy = 0;
            isJumping = false;
          }
        }

        // Slide timer
        if (isSliding) {
          slideTimer -= dt;
          if (slideTimer <= 0) isSliding = false;
        }

        // Character Positioning & Smooth Lane Transition
        charGroup.position.x = THREE.MathUtils.lerp(charGroup.position.x, targetX, 16 * dt);
        charGroup.position.y = playerY;

        // Running / Jump / Slide Pose Animations
        runCycle += currentSpeed * dt * 1.4;
        if (isSliding) {
          torso.rotation.x = Math.PI / 2.6;
          torso.position.y = 0.55;
          head.position.set(0, 0.7, 0.5);
          leftLeg.position.set(-0.2, 0.25, -0.4);
          rightLeg.position.set(0.2, 0.25, -0.4);
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
          leftArm.rotation.x = -Math.PI / 2;
          rightArm.rotation.x = -Math.PI / 2;
        } else if (isJumping) {
          torso.rotation.x = -0.15;
          torso.position.y = 1.25;
          head.position.set(0, 1.95, 0);
          leftLeg.rotation.x = -0.6;
          rightLeg.rotation.x = -0.6;
          leftArm.rotation.x = -1.2;
          rightArm.rotation.x = -1.2;
        } else {
          torso.rotation.x = 0.08;
          torso.position.y = 1.25 + Math.sin(runCycle * 2) * 0.06;
          head.position.set(0, 1.95, 0);
          leftLeg.position.set(-0.2, 0.45, 0);
          rightLeg.position.set(0.2, 0.45, 0);
          leftLeg.rotation.x = Math.sin(runCycle) * 0.95;
          rightLeg.rotation.x = -Math.sin(runCycle) * 0.95;
          leftArm.rotation.x = -Math.sin(runCycle) * 0.85;
          rightArm.rotation.x = Math.sin(runCycle) * 0.85;
        }

        // Power-up Timer updates
        ["magnet", "superJump", "multiplier", "shield", "speedBoost"].forEach((key) => {
          const k = key as keyof PowerUpState;
          if (activeBuffs[k] > 0) {
            activeBuffs[k] = Math.max(0, activeBuffs[k] - dt);
          }
        });
        setPowerUps({ ...activeBuffs });
        shieldBubble.visible = activeBuffs.shield > 0;
        speedFire.visible = activeBuffs.speedBoost > 0;

        // Move Track Segments backwards towards -Z
        const moveZ = currentSpeed * dt;
        TRACK_SEGMENTS.forEach((seg, idx) => {
          seg.position.z -= moveZ;
          if (seg.position.z < -TRACK_SEGMENT_LENGTH) {
            seg.position.z += NUM_SEGMENTS * TRACK_SEGMENT_LENGTH;
            populateSegment(seg, seg.position.z, false, idx);
          }
        });

        // Update Obstacles position & Collision
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const obs = obstacles[i];
          obs.z -= (currentSpeed + (obs.movingSpeed || 0)) * dt;
          obs.mesh.position.z = obs.z;

          if (obs.z < -20) {
            scene.remove(obs.mesh);
            obstacles.splice(i, 1);
            continue;
          }

          // Collision Check
          const laneMatches = Math.abs(charGroup.position.x - LANES[obs.lane]) < 1.1;
          const zDepthMatches = Math.abs(obs.z) < obs.length / 2 + 0.6;

          if (laneMatches && zDepthMatches) {
            let safe = false;

            // Speed boost smashes everything in path!
            if (activeBuffs.speedBoost > 0) {
              safe = true;
              scene.remove(obs.mesh);
              obstacles.splice(i, 1);
              playSfx("powerup");
              continue;
            }

            if (obs.jumpable && playerY > obs.height * 0.75) {
              safe = true;
            } else if (obs.slideable && isSliding) {
              safe = true;
            }

            if (!safe) {
              if (activeBuffs.shield > 0) {
                activeBuffs.shield = 0;
                scene.remove(obs.mesh);
                obstacles.splice(i, 1);
                playSfx("powerup");
              } else {
                setGameOver(true);
                playSfx("crash");
                audio.bad();
                try {
                  const currHigh = parseInt(localStorage.getItem("ene_runner_highscore") || "0", 10);
                  if (Math.round(localScore) > currHigh) {
                    localStorage.setItem("ene_runner_highscore", String(Math.round(localScore)));
                    setHighScore(Math.round(localScore));
                  }
                } catch {}
              }
            }
          }
        }

        // Update Coins & Magnet Pull
        for (let i = trackCoins.length - 1; i >= 0; i--) {
          const c = trackCoins[i];
          c.z -= currentSpeed * dt;
          c.mesh.position.z = c.z;
          c.mesh.rotation.y += 4.5 * dt;

          if (c.z < -10 || c.collected) {
            scene.remove(c.mesh);
            trackCoins.splice(i, 1);
            continue;
          }

          // Magnet suction
          if (activeBuffs.magnet > 0) {
            const dist = Math.hypot(charGroup.position.x - c.mesh.position.x, c.z);
            if (dist < 15) {
              c.mesh.position.x = THREE.MathUtils.lerp(c.mesh.position.x, charGroup.position.x, 16 * dt);
              c.mesh.position.y = THREE.MathUtils.lerp(c.mesh.position.y, charGroup.position.y + 1, 16 * dt);
            }
          }

          const dx = Math.abs(charGroup.position.x - c.mesh.position.x);
          const dz = Math.abs(c.z);
          const dy = Math.abs(charGroup.position.y + 0.9 - c.mesh.position.y);

          if (dx < 1.15 && dz < 1.35 && dy < 1.45) {
            c.collected = true;
            localCoins += 1;
            setCoins(localCoins);
            playSfx("coin");
          }
        }

        // Update Power-ups
        for (let i = powerUpItems.length - 1; i >= 0; i--) {
          const p = powerUpItems[i];
          p.z -= currentSpeed * dt;
          p.mesh.position.z = p.z;
          p.mesh.rotation.y += 3.5 * dt;

          if (p.z < -10 || p.collected) {
            scene.remove(p.mesh);
            powerUpItems.splice(i, 1);
            continue;
          }

          const dx = Math.abs(charGroup.position.x - LANES[p.lane]);
          const dz = Math.abs(p.z);
          if (dx < 1.25 && dz < 1.55) {
            p.collected = true;
            activeBuffs[p.type] = p.type === "speedBoost" ? 8 : 10;
            if (p.type === "speedBoost") {
              playSfx("speed");
              showToast("⚡ SPEED BOOST ACTIVE! SMASHING OBSTACLES!");
            } else if (p.type === "magnet") {
              playSfx("powerup");
              showToast("🧲 COIN MAGNET ACTIVE!");
            } else if (p.type === "superJump") {
              playSfx("powerup");
              showToast("👟 SUPER JUMP ACTIVE!");
            } else if (p.type === "multiplier") {
              playSfx("powerup");
              showToast("⭐ 2X SCORE MULTIPLIER!");
            } else {
              playSfx("powerup");
              showToast("🛡️ SHIELD EQUIPPED!");
            }
          }
        }
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
  }, [started, paused, gameOver, playSfx, showToast]);

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-[#0B0B0D] select-none text-white font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* TOP HUD BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        {/* Back Link */}
        <Link
          href="/#games"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-1.5 text-xs font-semibold backdrop-blur-md transition hover:border-[#E9FF57] hover:text-[#E9FF57]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Gameverse
        </Link>

        {/* Score & Multiplier */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-black/60 px-3 sm:px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Score</span>
            <span className="font-mono text-sm sm:text-base font-black text-white">{score}</span>
            {powerUps.multiplier > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300 font-black text-[10px] animate-pulse">
                2X
              </span>
            )}
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1.5 bg-black/60 px-3 sm:px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
            <span className="text-amber-400 text-sm">🪙</span>
            <span className="font-mono text-sm sm:text-base font-black text-[#E9FF57]">{coins}</span>
          </div>

          {/* High Score Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 text-xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Best</span>
            <span className="font-mono text-xs font-bold text-emerald-400">{highScore}</span>
          </div>
        </div>

        {/* Pause Button */}
        <button
          onClick={() => setPaused((p) => !p)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white font-bold backdrop-blur-md transition hover:border-white"
        >
          {paused ? "▶" : "⏸"}
        </button>
      </div>

      {/* FLOATING POWER-UP TOAST */}
      {floatingToast && (
        <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-30">
          <div className="rounded-full bg-black/80 border border-[#E9FF57]/40 px-5 py-1.5 text-xs font-black text-[#E9FF57] backdrop-blur-md shadow-2xl animate-fade">
            {floatingToast}
          </div>
        </div>
      )}

      {/* ACTIVE POWER-UPS PILL BAR */}
      <div className="absolute top-16 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        {powerUps.speedBoost > 0 && (
          <div className="flex items-center gap-2 bg-orange-600/90 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow backdrop-blur-md animate-pulse">
            <span>⚡ Speed Boost</span>
            <span className="font-mono text-xs">{Math.ceil(powerUps.speedBoost)}s</span>
          </div>
        )}
        {powerUps.magnet > 0 && (
          <div className="flex items-center gap-2 bg-blue-600/85 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow backdrop-blur-md">
            <span>🧲 Magnet</span>
            <span className="font-mono text-xs">{Math.ceil(powerUps.magnet)}s</span>
          </div>
        )}
        {powerUps.superJump > 0 && (
          <div className="flex items-center gap-2 bg-emerald-600/85 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow backdrop-blur-md">
            <span>👟 Super Jump</span>
            <span className="font-mono text-xs">{Math.ceil(powerUps.superJump)}s</span>
          </div>
        )}
        {powerUps.multiplier > 0 && (
          <div className="flex items-center gap-2 bg-purple-600/85 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow backdrop-blur-md">
            <span>⭐ 2X Multiplier</span>
            <span className="font-mono text-xs">{Math.ceil(powerUps.multiplier)}s</span>
          </div>
        )}
        {powerUps.shield > 0 && (
          <div className="flex items-center gap-2 bg-cyan-600/85 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow backdrop-blur-md">
            <span>🛡️ Shield Active</span>
          </div>
        )}
      </div>

      {/* MOBILE ON-SCREEN TOUCH BUTTONS */}
      <div className="sm:hidden absolute bottom-6 left-0 right-0 z-20 flex justify-between px-6 pointer-events-auto">
        <div className="flex gap-2">
          <button
            onTouchStart={() => (actionQueueRef.current.laneChange = -1)}
            className="w-14 h-14 rounded-2xl bg-white/20 active:bg-[#E9FF57]/40 border border-white/30 text-xl font-bold flex items-center justify-center backdrop-blur-md"
          >
            ◀
          </button>
          <button
            onTouchStart={() => (actionQueueRef.current.laneChange = 1)}
            className="w-14 h-14 rounded-2xl bg-white/20 active:bg-[#E9FF57]/40 border border-white/30 text-xl font-bold flex items-center justify-center backdrop-blur-md"
          >
            ▶
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onTouchStart={() => (actionQueueRef.current.jump = true)}
            className="w-14 h-14 rounded-2xl bg-emerald-500/30 active:bg-emerald-400/60 border border-emerald-400/50 text-xs font-black flex items-center justify-center backdrop-blur-md uppercase"
          >
            JUMP
          </button>
          <button
            onTouchStart={() => (actionQueueRef.current.slide = true)}
            className="w-14 h-14 rounded-2xl bg-amber-500/30 active:bg-amber-400/60 border border-amber-400/50 text-xs font-black flex items-center justify-center backdrop-blur-md uppercase"
          >
            SLIDE
          </button>
        </div>
      </div>

      {/* START SCREEN OVERLAY */}
      {!started && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="max-w-lg w-full rounded-3xl border border-white/20 bg-[#141418] p-8 text-center shadow-2xl animate-fade-up">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9FF57]">
              Subway Surfers Style 3D Endless Runner
            </span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Director's Disaster: Subway Run
            </h1>
            <p className="mt-3 text-sm text-gray-300 leading-relaxed">
              Sprint continuously across three railway tracks! Dodge oncoming trains, leap over hurdles,
              slide under clearance bars, and collect film coins and power-ups.
            </p>

            <div className="my-6 grid grid-cols-2 gap-3 text-left bg-black/40 p-4 rounded-2xl border border-white/10 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Change Lanes</span>
                <span className="text-white font-semibold">Left / Right Arrows (or A / D)</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Jump</span>
                <span className="text-white font-semibold">Up Arrow, W or Spacebar</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Slide</span>
                <span className="text-white font-semibold">Down Arrow or S</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Mobile Controls</span>
                <span className="text-white font-semibold">Swipe Left / Right / Up / Down</span>
              </div>
            </div>

            <button
              onClick={() => {
                setStarted(true);
                audio.click();
              }}
              className="w-full py-4 rounded-full bg-[#E9FF57] hover:bg-[#d8ee44] text-[#0B0B0D] font-extrabold text-sm uppercase tracking-wider transition-transform active:scale-[0.98] shadow-lg shadow-[#E9FF57]/20"
            >
              Start Running (Press Space or Tap) 🏃💨
            </button>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {paused && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-md p-6">
          <div className="max-w-xs w-full rounded-3xl border border-white/20 bg-[#15151A] p-6 text-center">
            <h2 className="text-xl font-bold text-white">Run Paused</h2>
            <p className="text-xs text-gray-400 mt-1">Taking a breath on the tracks</p>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => setPaused(false)}
                className="w-full py-3 rounded-full bg-[#E9FF57] text-[#0B0B0D] font-bold text-xs uppercase"
              >
                Resume Run
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

      {/* GAME OVER SCREEN */}
      {gameOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-lg p-6">
          <div className="max-w-md w-full rounded-3xl border border-red-500/40 bg-[#16161C] p-8 text-center shadow-2xl animate-fade-up">
            <div className="inline-flex p-3 rounded-2xl bg-red-500/20 text-red-400 mb-3 text-3xl">
              💥
            </div>
            <h2 className="font-display text-3xl font-extrabold text-white">
              DIRECTOR CRASHED!
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              "Cut, cut, cut! Scene re-take required!"
            </p>

            <div className="my-6 grid grid-cols-3 gap-2 bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Score</span>
                <span className="text-lg font-black text-[#E9FF57]">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Coins</span>
                <span className="text-lg font-black text-amber-400">{coins}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">High Score</span>
                <span className="text-lg font-black text-emerald-400">{highScore}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={restartGame}
                className="w-full py-3.5 rounded-full bg-[#E9FF57] text-[#0B0B0D] font-extrabold text-xs uppercase tracking-wider hover:bg-[#d8ee44] transition"
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
