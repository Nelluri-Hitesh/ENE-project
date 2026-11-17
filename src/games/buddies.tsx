"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { audio } from "@/core/audio";

/* ------------------------------------------------------------------ */
/* HYDERABAD TO GOA 3D CAR ROAD TRIP GAME                             */
/* 4 Characters in a Convertible, Scenic Landscapes, Indian Highway   */
/* ------------------------------------------------------------------ */

interface RoadTripProps {
  onBack?: () => void;
}

const TOTAL_DISTANCE_KM = 650; // Hyderabad to Goa

export default function Buddies({ onBack }: RoadTripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Game State
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [outOfFuel, setOutOfFuel] = useState(false);

  // HUD values
  const [speedKmh, setSpeedKmh] = useState(0);
  const [distanceLeftKm, setDistanceLeftKm] = useState(TOTAL_DISTANCE_KM);
  const [fuelPct, setFuelPct] = useState(100);
  const [currentZoneName, setCurrentZoneName] = useState("Hyderabad Outer Ring Road");
  const [dialogue, setDialogue] = useState<string | null>(
    "Karthik: Tank is full, bags are packed. Goa, here we come!"
  );

  // Control state refs (for 60fps loop)
  const inputRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    brake: false,
  });

  const hornAudioRef = useRef<AudioContext | null>(null);

  // Play horn sound via Web Audio API synth
  const playHorn = useCallback(() => {
    try {
      const ctx = hornAudioRef.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      hornAudioRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(440, ctx.currentTime); // High Indian truck horn tone
      osc2.frequency.setValueAtTime(554.37, ctx.currentTime); // Major third

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);

      setDialogue("Kaushik: Horn kottu mama! Full highway clear undi!");
    } catch {
      // Audio fallback
    }
  }, []);

  // Quick refuel handler
  const handleRefuel = useCallback(() => {
    setFuelPct(100);
    setOutOfFuel(false);
    setDialogue("Upen: Petrol pump boy gave us full tank! Let's roll!");
    audio.good();
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "ArrowUp" || e.code === "KeyW") inputRef.current.up = true;
      if (e.code === "ArrowDown" || e.code === "KeyS") inputRef.current.down = true;
      if (e.code === "ArrowLeft" || e.code === "KeyA") inputRef.current.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") inputRef.current.right = true;
      if (e.code === "Space") inputRef.current.brake = true;
      if (e.code === "KeyH") playHorn();
      if (e.code === "KeyP" || e.code === "Escape") setPaused((p) => !p);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") inputRef.current.up = false;
      if (e.code === "ArrowDown" || e.code === "KeyS") inputRef.current.down = false;
      if (e.code === "ArrowLeft" || e.code === "KeyA") inputRef.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") inputRef.current.right = false;
      if (e.code === "Space") inputRef.current.brake = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [playHorn]);

  // Main Three.js simulation effect
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 60, 220);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 400);
    camera.position.set(0, 3.8, -8);
    camera.lookAt(0, 1.5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Lighting (Warm Indian Sun)
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // 3. The 3D Road Trip Car with 4 Characters
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    // Car Body (Classic Retro Red Roadster Convertible)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25, metalness: 0.6 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.9 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.55, roughness: 0.1 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });

    // Chassis / Base
    const chassisGeo = new THREE.BoxGeometry(2.3, 0.65, 4.8);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.6;
    chassis.castShadow = true;
    carGroup.add(chassis);

    // Hood & Trunk accents
    const hoodGeo = new THREE.BoxGeometry(2.1, 0.35, 1.8);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.95, 1.2);
    carGroup.add(hood);

    const trunkGeo = new THREE.BoxGeometry(2.1, 0.35, 1.2);
    const trunk = new THREE.Mesh(trunkGeo, bodyMat);
    trunk.position.set(0, 0.95, -1.6);
    carGroup.add(trunk);

    // Cockpit Cutout Interior
    const cockpitGeo = new THREE.BoxGeometry(1.9, 0.3, 1.8);
    const cockpit = new THREE.Mesh(cockpitGeo, interiorMat);
    cockpit.position.set(0, 0.75, -0.2);
    carGroup.add(cockpit);

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(1.95, 0.7, 0.08);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.35, 0.55);
    windshield.rotation.x = -0.35;
    carGroup.add(windshield);

    // Bumpers & Grille
    const frontBumperGeo = new THREE.BoxGeometry(2.4, 0.18, 0.2);
    const frontBumper = new THREE.Mesh(frontBumperGeo, chromeMat);
    frontBumper.position.set(0, 0.45, 2.45);
    carGroup.add(frontBumper);

    const rearBumper = frontBumper.clone();
    rearBumper.position.set(0, 0.45, -2.45);
    carGroup.add(rearBumper);

    // Headlights & Taillights
    const headLightGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
    headLightGeo.rotateX(Math.PI / 2);
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

    const leftHeadlight = new THREE.Mesh(headLightGeo, headLightMat);
    leftHeadlight.position.set(-0.8, 0.75, 2.42);
    const rightHeadlight = new THREE.Mesh(headLightGeo, headLightMat);
    rightHeadlight.position.set(0.8, 0.75, 2.42);
    carGroup.add(leftHeadlight, rightHeadlight);

    const tailLightGeo = new THREE.BoxGeometry(0.35, 0.14, 0.05);
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const leftTail = new THREE.Mesh(tailLightGeo, tailLightMat);
    leftTail.position.set(-0.8, 0.75, -2.42);
    const rightTail = new THREE.Mesh(tailLightGeo, tailLightMat);
    rightTail.position.set(0.8, 0.75, -2.42);
    carGroup.add(leftTail, rightTail);

    // Wheels
    const wheels: THREE.Mesh[] = [];
    const frontWheelPivots: THREE.Group[] = [];
    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 18);
    tireGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.34, 12);
    rimGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      { x: -1.2, y: 0.42, z: 1.45, isFront: true },
      { x: 1.2, y: 0.42, z: 1.45, isFront: true },
      { x: -1.2, y: 0.42, z: -1.45, isFront: false },
      { x: 1.2, y: 0.42, z: -1.45, isFront: false },
    ];

    wheelPositions.forEach((pos) => {
      const tire = new THREE.Mesh(tireGeo, blackMat);
      const rim = new THREE.Mesh(rimGeo, chromeMat);
      tire.add(rim);
      tire.castShadow = true;

      if (pos.isFront) {
        const pivot = new THREE.Group();
        pivot.position.set(pos.x, pos.y, pos.z);
        pivot.add(tire);
        carGroup.add(pivot);
        frontWheelPivots.push(pivot);
      } else {
        tire.position.set(pos.x, pos.y, pos.z);
        carGroup.add(tire);
      }
      wheels.push(tire);
    });

    // ----------------- FOUR CHARACTERS SEATED INSIDE -----------------
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }); // Indian skin tone
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const shadesMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    const createCharacter = (shirtColor: number, pose: "driver" | "front_passenger" | "back_left" | "back_right") => {
      const charGroup = new THREE.Group();

      // Torso / Shirt
      const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
      const torsoGeo = new THREE.BoxGeometry(0.55, 0.6, 0.35);
      const torso = new THREE.Mesh(torsoGeo, shirtMat);
      torso.position.y = 0.3;
      charGroup.add(torso);

      // Head
      const headGeo = new THREE.SphereGeometry(0.22, 14, 14);
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.y = 0.75;
      charGroup.add(head);

      // Hair
      const hairGeo = new THREE.SphereGeometry(0.23, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.y = 0.78;
      charGroup.add(hair);

      // Cool Sunglasses
      const shadesGeo = new THREE.BoxGeometry(0.3, 0.08, 0.1);
      const shades = new THREE.Mesh(shadesGeo, shadesMat);
      shades.position.set(0, 0.76, 0.2);
      charGroup.add(shades);

      // Arms & Poses
      if (pose === "driver") {
        // Hands on steering wheel
        const armGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
        const leftArm = new THREE.Mesh(armGeo, shirtMat);
        leftArm.position.set(-0.28, 0.32, 0.18);
        leftArm.rotation.x = -Math.PI / 3;
        const rightArm = new THREE.Mesh(armGeo, shirtMat);
        rightArm.position.set(0.28, 0.32, 0.18);
        rightArm.rotation.x = -Math.PI / 3;
        charGroup.add(leftArm, rightArm);

        // Steering Wheel
        const wheelGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
        const wheel = new THREE.Mesh(wheelGeo, blackMat);
        wheel.position.set(0, 0.45, 0.35);
        wheel.rotation.x = -Math.PI / 4;
        charGroup.add(wheel);
      } else if (pose === "front_passenger") {
        // Holding phone/camera
        const armGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
        const arm = new THREE.Mesh(armGeo, shirtMat);
        arm.position.set(-0.26, 0.35, 0.18);
        arm.rotation.x = -Math.PI / 2.5;
        charGroup.add(arm);
      } else {
        // Backseat relaxed / waving
        const armGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
        const arm = new THREE.Mesh(armGeo, shirtMat);
        arm.position.set(pose === "back_left" ? -0.28 : 0.28, 0.45, 0.05);
        arm.rotation.z = pose === "back_left" ? 0.3 : -0.3;
        charGroup.add(arm);
      }

      return charGroup;
    };

    // 1. Driver (Karthik - Blue Shirt) - Front Right (Indian RHD)
    const driver = createCharacter(0x2563eb, "driver");
    driver.position.set(0.48, 0.7, 0.1);
    carGroup.add(driver);

    // 2. Front Passenger (Vivek - White/Yellow Shirt) - Front Left
    const passFront = createCharacter(0xfbbf24, "front_passenger");
    passFront.position.set(-0.48, 0.7, 0.1);
    carGroup.add(passFront);

    // 3. Back Passenger Left (Kaushik - Green Shirt)
    const passBackL = createCharacter(0x10b981, "back_left");
    passBackL.position.set(-0.48, 0.75, -0.85);
    carGroup.add(passBackL);

    // 4. Back Passenger Right (Upen - Purple Shirt)
    const passBackR = createCharacter(0x8b5cf6, "back_right");
    passBackR.position.set(0.48, 0.75, -0.85);
    carGroup.add(passBackR);

    // 4. Infinite Highway & Scenery Management
    const ROAD_WIDTH = 13;
    const SEGMENT_LENGTH = 70;
    const NUM_SEGMENTS = 10;
    const ROAD_TILES: THREE.Group[] = [];

    // Road Materials
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9 }); // Red soil / shoulder
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const edgeStripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4 });

    // Scenery Materials
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 });
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x1e3a2f, roughness: 0.95 });
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.9 });
    const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.2 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const palmFoliageMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });

    // Building Materials for Hyderabad / Dhabas / Goa Shacks
    const cityBuildingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const dhabaWallMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.8 });
    const shackMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 });

    // Helper: Create Tree
    const createTree = (type: "neem" | "palm") => {
      const g = new THREE.Group();
      if (type === "palm") {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 7, 7), trunkMat);
        trunk.position.y = 3.5;
        trunk.rotation.z = (Math.random() - 0.5) * 0.15;
        g.add(trunk);
        for (let i = 0; i < 6; i++) {
          const frond = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.5, 5), palmFoliageMat);
          frond.position.set(0, 6.8, 0);
          frond.rotation.z = 0.9;
          frond.rotation.y = (i * Math.PI) / 3;
          g.add(frond);
        }
      } else {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 3.5, 6), trunkMat);
        trunk.position.y = 1.75;
        g.add(trunk);
        const top = new THREE.Mesh(new THREE.DodecahedronGeometry(2.3, 1), foliageMat);
        top.position.y = 4.5;
        g.add(top);
      }
      return g;
    };

    // Helper: Create Highway Milestone
    const createMilestone = (kmText: string) => {
      const g = new THREE.Group();
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 12), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
      stone.position.y = 0.45;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.3, 0.65), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      base.position.y = 0.15;
      g.add(stone, base);
      return g;
    };

    // Helper: Create Dhaba / Petrol Pump roadside building
    const createRoadsideSpot = (type: "dhaba" | "petrol" | "goa_shack") => {
      const g = new THREE.Group();
      if (type === "petrol") {
        // Petrol station canopy + pumps
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, 7), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
        canopy.position.set(0, 4.8, 0);
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4.8), chromeMat);
        p1.position.set(-3.5, 2.4, 0);
        const p2 = p1.clone();
        p2.position.set(3.5, 2.4, 0);
        const pump = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        pump.position.set(0, 1.1, 0);
        g.add(canopy, p1, p2, pump);
      } else if (type === "dhaba") {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(11, 4.5, 6), dhabaWallMat);
        wall.position.set(0, 2.25, 0);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(8, 2.5, 4), new THREE.MeshStandardMaterial({ color: 0x7c2d12 }));
        roof.position.set(0, 5.5, 0);
        roof.rotation.y = Math.PI / 4;
        g.add(wall, roof);
      } else {
        // Goa Beach Shack with straw roof
        const shack = new THREE.Mesh(new THREE.BoxGeometry(9, 3.8, 5.5), shackMat);
        shack.position.set(0, 1.9, 0);
        const thatch = new THREE.Mesh(new THREE.ConeGeometry(7, 2, 4), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 }));
        thatch.position.set(0, 4.5, 0);
        thatch.rotation.y = Math.PI / 4;
        g.add(shack, thatch);
      }
      return g;
    };

    // Build segments
    const populateSegment = (seg: THREE.Group, segIndex: number) => {
      // Clear old scenery
      while (seg.children.length > 0) seg.remove(seg.children[0]);

      // Base Road Plane
      const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.receiveShadow = true;
      seg.add(roadMesh);

      // Shoulders
      const leftShoulder = new THREE.Mesh(new THREE.PlaneGeometry(3, SEGMENT_LENGTH).rotateX(-Math.PI / 2), shoulderMat);
      leftShoulder.position.set(-(ROAD_WIDTH / 2 + 1.5), -0.01, 0);
      const rightShoulder = leftShoulder.clone();
      rightShoulder.position.x = ROAD_WIDTH / 2 + 1.5;
      seg.add(leftShoulder, rightShoulder);

      // Guardrails
      const railGeo = new THREE.BoxGeometry(0.2, 0.7, SEGMENT_LENGTH);
      const leftRail = new THREE.Mesh(railGeo, barrierMat);
      leftRail.position.set(-(ROAD_WIDTH / 2 + 2.9), 0.35, 0);
      const rightRail = leftRail.clone();
      rightRail.position.x = ROAD_WIDTH / 2 + 2.9;
      seg.add(leftRail, rightRail);

      // Dashed lane stripes
      for (let z = -SEGMENT_LENGTH / 2 + 3; z < SEGMENT_LENGTH / 2; z += 6) {
        const stripe1 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 2.8).rotateX(-Math.PI / 2), stripeMat);
        stripe1.position.set(-2.2, 0.01, z);
        const stripe2 = stripe1.clone();
        stripe2.position.x = 2.2;
        seg.add(stripe1, stripe2);
      }

      // Terrain Sides
      const currentKm = distanceLeftKm;
      const isGoa = currentKm < 150;
      const isGhats = currentKm >= 150 && currentKm < 350;
      const isCountryside = currentKm >= 350 && currentKm < 520;
      const isHyderabad = currentKm >= 520;

      // Ground plane
      const groundMat = isGoa ? sandMat : grassMat;
      const leftGround = new THREE.Mesh(new THREE.PlaneGeometry(80, SEGMENT_LENGTH).rotateX(-Math.PI / 2), groundMat);
      leftGround.position.set(-(ROAD_WIDTH / 2 + 43), -0.05, 0);
      const rightGround = leftGround.clone();
      rightGround.position.x = ROAD_WIDTH / 2 + 43;
      seg.add(leftGround, rightGround);

      // Environment props according to route
      if (isGoa) {
        // Goa: Palm trees + Beach Shacks + Ocean on right!
        for (let i = -SEGMENT_LENGTH / 2 + 8; i < SEGMENT_LENGTH / 2; i += 16) {
          const palm = createTree("palm");
          palm.position.set(-(ROAD_WIDTH / 2 + 6 + Math.random() * 5), 0, i);
          seg.add(palm);
        }
        // Ocean on the right
        const ocean = new THREE.Mesh(new THREE.PlaneGeometry(120, SEGMENT_LENGTH).rotateX(-Math.PI / 2), oceanMat);
        ocean.position.set(ROAD_WIDTH / 2 + 75, -0.4, 0);
        seg.add(ocean);

        // Beach Shack
        if (segIndex % 3 === 0) {
          const shack = createRoadsideSpot("goa_shack");
          shack.position.set(-(ROAD_WIDTH / 2 + 14), 0, 0);
          seg.add(shack);
        }
      } else if (isGhats) {
        // Western Ghats: Mountains + dense forest
        for (let i = -SEGMENT_LENGTH / 2 + 6; i < SEGMENT_LENGTH / 2; i += 12) {
          const tree = createTree("neem");
          tree.position.set(-(ROAD_WIDTH / 2 + 6 + Math.random() * 6), 0, i);
          const treeR = createTree("neem");
          treeR.position.set(ROAD_WIDTH / 2 + 6 + Math.random() * 6, 0, i);
          seg.add(tree, treeR);
        }
        // Mountains on horizon
        const m1 = new THREE.Mesh(new THREE.ConeGeometry(28, 45, 6), mountainMat);
        m1.position.set(-65, 10, (Math.random() - 0.5) * 30);
        const m2 = new THREE.Mesh(new THREE.ConeGeometry(32, 55, 6), mountainMat);
        m2.position.set(70, 12, (Math.random() - 0.5) * 30);
        seg.add(m1, m2);
      } else if (isCountryside) {
        // Countryside: Farms + Dhabas + Petrol Stations
        for (let i = -SEGMENT_LENGTH / 2 + 10; i < SEGMENT_LENGTH / 2; i += 22) {
          const tree = createTree("neem");
          tree.position.set(-(ROAD_WIDTH / 2 + 6), 0, i);
          seg.add(tree);
        }
        if (segIndex % 4 === 1) {
          const dhaba = createRoadsideSpot("dhaba");
          dhaba.position.set(-(ROAD_WIDTH / 2 + 15), 0, 0);
          seg.add(dhaba);
        } else if (segIndex % 4 === 3) {
          const petrol = createRoadsideSpot("petrol");
          petrol.position.set(ROAD_WIDTH / 2 + 14, 0, 0);
          seg.add(petrol);
        }
      } else {
        // Hyderabad City & ORR: High rise blocks & Flyover pillars
        for (let i = -SEGMENT_LENGTH / 2 + 12; i < SEGMENT_LENGTH / 2; i += 20) {
          const b1 = new THREE.Mesh(new THREE.BoxGeometry(10, 24 + Math.random() * 15, 12), cityBuildingMat);
          b1.position.set(-(ROAD_WIDTH / 2 + 20), 12, i);
          const b2 = b1.clone();
          b2.position.x = ROAD_WIDTH / 2 + 20;
          seg.add(b1, b2);
        }
      }

      // Milestones
      const stone = createMilestone(`Goa`);
      stone.position.set(ROAD_WIDTH / 2 + 1.8, 0, 0);
      seg.add(stone);
    };

    // Create segments along Z
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const seg = new THREE.Group();
      seg.position.z = i * SEGMENT_LENGTH;
      populateSegment(seg, i);
      scene.add(seg);
      ROAD_TILES.push(seg);
    }

    // 5. Traffic Vehicles (Tata Truck, Auto, Sedan)
    interface TrafficCar {
      mesh: THREE.Group;
      speed: number;
      lane: number;
    }
    const trafficCars: TrafficCar[] = [];

    const createTataTruck = () => {
      const g = new THREE.Group();
      // Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.2), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      cab.position.set(0, 1.7, 1.6);
      // Cargo Bed
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 4.4), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
      bed.position.set(0, 1.8, -1.6);
      g.add(cab, bed);
      return g;
    };

    const createAuto = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 2.4), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
      body.position.set(0, 1.1, 0);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.4, 2.45), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
      roof.position.set(0, 2.0, 0);
      g.add(body, roof);
      return g;
    };

    const lanes = [-3.8, 0, 3.8];
    for (let i = 0; i < 4; i++) {
      const tMesh = i % 2 === 0 ? createTataTruck() : createAuto();
      const lane = lanes[i % lanes.length];
      tMesh.position.set(lane, 0, 35 + i * 45);
      scene.add(tMesh);
      trafficCars.push({ mesh: tMesh, speed: 18 + Math.random() * 12, lane });
    }

    // 6. Fuel Can Pickup on Road
    const fuelPickup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.9, 10),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.2 })
    );
    fuelPickup.position.set(0, 0.6, 60);
    scene.add(fuelPickup);

    // 7. Physics / Movement State
    let carX = 0;
    let carSpeed = 0; // m/s
    const maxSpeed = 36; // ~130 km/h
    let currentDistance = TOTAL_DISTANCE_KM;
    let currentFuel = 100;

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
    let dialogueTimer = 0;

    const funDialogues = [
      "Vivek: Look at those Western Ghats! Goa weather is waiting!",
      "Kaushik: Somebody pass the chips! Road trips make me hungry!",
      "Upen: Don't forget to take the coastal road exit!",
      "Karthik: Best road trip ever! ENE vibes full on!",
      "Kaushik: Bhai, speed check chesuko! We have plenty of time!",
      "Vivek: Entering the green hills... Roll the windows down!",
    ];

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!paused && !arrived && started) {
        // Accelerate / Brake input
        if (inputRef.current.up && currentFuel > 0) {
          carSpeed = Math.min(maxSpeed, carSpeed + 16 * dt);
          currentFuel = Math.max(0, currentFuel - 0.7 * dt);
        } else if (inputRef.current.down) {
          carSpeed = Math.max(-8, carSpeed - 22 * dt);
        } else if (inputRef.current.brake) {
          carSpeed = Math.max(0, carSpeed - 40 * dt);
        } else {
          // Friction / Coasting
          carSpeed = Math.max(0, carSpeed - 5 * dt);
        }

        // Out of fuel check
        if (currentFuel <= 0 && carSpeed <= 0.1) {
          setOutOfFuel(true);
        }

        // Steering input
        let steerAngle = 0;
        if (inputRef.current.left) {
          steerAngle = 0.35;
          carX = Math.max(-ROAD_WIDTH / 2 + 1.8, carX - (carSpeed > 0 ? 11 : 4) * dt);
        } else if (inputRef.current.right) {
          steerAngle = -0.35;
          carX = Math.min(ROAD_WIDTH / 2 - 1.8, carX + (carSpeed > 0 ? 11 : 4) * dt);
        }

        // Smooth Car Position & Tilt
        carGroup.position.x = THREE.MathUtils.lerp(carGroup.position.x, carX, 0.14);
        carGroup.rotation.y = THREE.MathUtils.lerp(carGroup.rotation.y, (steerAngle * carSpeed) / maxSpeed, 0.1);
        carGroup.rotation.z = THREE.MathUtils.lerp(carGroup.rotation.z, (steerAngle * carSpeed) / (maxSpeed * 2), 0.1);

        // Front wheels turn
        frontWheelPivots.forEach((p) => {
          p.rotation.y = THREE.MathUtils.lerp(p.rotation.y, steerAngle, 0.2);
        });

        // Wheel spin
        wheels.forEach((w) => {
          w.rotation.x += (carSpeed * dt) / 0.42;
        });

        // Suspension bounce
        carGroup.position.y = Math.sin(now * 0.015) * 0.02 * (carSpeed / maxSpeed);

        // Road segment movement towards -Z (illusion of car moving forward)
        const moveDist = carSpeed * dt;
        ROAD_TILES.forEach((seg, idx) => {
          seg.position.z -= moveDist;
          if (seg.position.z < -SEGMENT_LENGTH) {
            seg.position.z += NUM_SEGMENTS * SEGMENT_LENGTH;
            populateSegment(seg, idx);
          }
        });

        // Traffic movement
        trafficCars.forEach((t) => {
          t.mesh.position.z += (t.speed - carSpeed) * dt;
          if (t.mesh.position.z < -25) {
            t.mesh.position.z = 180 + Math.random() * 50;
            t.mesh.position.x = lanes[Math.floor(Math.random() * lanes.length)];
          } else if (t.mesh.position.z > 220) {
            t.mesh.position.z = -15;
          }

          // Gentle collision check with player car
          const dx = Math.abs(carGroup.position.x - t.mesh.position.x);
          const dz = Math.abs(t.mesh.position.z);
          if (dx < 1.8 && dz < 3.2) {
            carSpeed = Math.max(8, carSpeed * 0.7);
            playHorn();
          }
        });

        // Fuel Pickup Spin & Collision
        fuelPickup.position.z -= moveDist;
        fuelPickup.rotation.y += 2.5 * dt;
        if (Math.abs(carGroup.position.x - fuelPickup.position.x) < 2.2 && Math.abs(fuelPickup.position.z) < 2.5) {
          currentFuel = Math.min(100, currentFuel + 35);
          fuelPickup.position.z = 150 + Math.random() * 100;
          fuelPickup.position.x = (Math.random() - 0.5) * 6;
          audio.good();
          setDialogue("Refueled! Extra petrol secured for the highway!");
        } else if (fuelPickup.position.z < -20) {
          fuelPickup.position.z = 150 + Math.random() * 80;
          fuelPickup.position.x = (Math.random() - 0.5) * 6;
        }

        // Camera follow smoothly behind car
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, carGroup.position.x * 0.75, 0.08);

        // Progress distance calculation (traveling from 650 km down to 0)
        currentDistance = Math.max(0, currentDistance - (carSpeed * dt * 0.22));
        const speedDisplay = Math.round((carSpeed / maxSpeed) * 125);
        setSpeedKmh(speedDisplay);
        setDistanceLeftKm(Math.round(currentDistance));
        setFuelPct(Math.round(currentFuel));

        // Zone Transitions
        if (currentDistance > 520) {
          setCurrentZoneName("Hyderabad Outer Ring Road");
          scene.background = new THREE.Color(0x7dd3fc);
          if (scene.fog) scene.fog.color = new THREE.Color(0x7dd3fc);
        } else if (currentDistance > 350) {
          setCurrentZoneName("Deccan Countryside & Sunflower Fields");
          scene.background = new THREE.Color(0x38bdf8);
          if (scene.fog) scene.fog.color = new THREE.Color(0x38bdf8);
        } else if (currentDistance > 150) {
          setCurrentZoneName("Western Ghats Mountain Pass");
          scene.background = new THREE.Color(0x2dd4bf);
          if (scene.fog) scene.fog.color = new THREE.Color(0x2dd4bf);
        } else {
          setCurrentZoneName("Goa Coastal Highway & Beach");
          scene.background = new THREE.Color(0xfb923c);
          if (scene.fog) scene.fog.color = new THREE.Color(0xfb923c);
        }

        // Periodic dialogue
        dialogueTimer += dt;
        if (dialogueTimer > 12) {
          dialogueTimer = 0;
          setDialogue(funDialogues[Math.floor(Math.random() * funDialogues.length)]);
        }

        // Reached Goa check
        if (currentDistance <= 0 && !arrived) {
          setArrived(true);
          audio.good();
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
  }, [paused, arrived, started, playHorn]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0B0B0D] select-none text-white font-sans">
      {/* 3D Canvas Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* TOP HUD BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        {/* Back Button */}
        <Link
          href="/#games"
          onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-1.5 text-xs font-semibold backdrop-blur-md transition hover:border-[#E9FF57] hover:text-[#E9FF57]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Gameverse
        </Link>

        {/* Journey Progress Bar */}
        <div className="flex flex-col items-center max-w-xs sm:max-w-md w-full mx-4">
          <div className="flex items-center justify-between w-full text-[11px] font-bold tracking-wider uppercase mb-1">
            <span className="text-gray-300">Hyderabad</span>
            <span className="text-[#E9FF57] font-black">{currentZoneName}</span>
            <span className="text-amber-400">Goa</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden border border-white/20">
            <div
              className="bg-gradient-to-r from-blue-500 via-[#E9FF57] to-amber-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, ((TOTAL_DISTANCE_KM - distanceLeftKm) / TOTAL_DISTANCE_KM) * 100))}%` }}
            />
          </div>
        </div>

        {/* Pause & Horn */}
        <div className="flex items-center gap-2">
          <button
            onClick={playHorn}
            title="Press H or Tap for Horn"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/20 text-amber-300 font-bold backdrop-blur-md transition active:scale-90"
          >
            📯
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white font-bold backdrop-blur-md transition hover:border-white"
          >
            {paused ? "▶" : "⏸"}
          </button>
        </div>
      </div>

      {/* DIALOGUE BUBBLE */}
      {dialogue && !arrived && (
        <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md">
          <div className="rounded-2xl border border-white/15 bg-black/75 px-4 py-2 text-center backdrop-blur-md shadow-2xl animate-fade">
            <p className="text-xs sm:text-sm font-medium text-white">{dialogue}</p>
          </div>
        </div>
      )}

      {/* BOTTOM GAUGES: SPEEDOMETER & FUEL */}
      <div className="absolute bottom-4 left-4 z-20 flex items-end gap-3 pointer-events-none">
        {/* Speedometer */}
        <div className="rounded-2xl border border-white/15 bg-black/70 p-3.5 backdrop-blur-md shadow-2xl text-center min-w-[100px]">
          <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Speed</div>
          <div className="font-mono text-3xl font-black text-[#E9FF57]">{speedKmh}</div>
          <div className="text-[10px] text-gray-300 font-semibold">KM / H</div>
        </div>

        {/* Distance Remaining */}
        <div className="rounded-2xl border border-white/15 bg-black/70 p-3.5 backdrop-blur-md shadow-2xl text-center min-w-[110px]">
          <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">To Goa</div>
          <div className="font-mono text-2xl font-black text-amber-400">{distanceLeftKm}</div>
          <div className="text-[10px] text-gray-300 font-semibold">KM LEFT</div>
        </div>

        {/* Fuel Bar */}
        <div className="rounded-2xl border border-white/15 bg-black/70 p-3 backdrop-blur-md shadow-2xl flex flex-col justify-between w-24">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400 mb-1">
            <span>Fuel</span>
            <span className={fuelPct < 25 ? "text-red-400 font-black animate-pulse" : "text-emerald-400"}>
              {fuelPct}%
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                fuelPct > 50 ? "bg-emerald-400" : fuelPct > 20 ? "bg-amber-400" : "bg-red-500 animate-pulse"
              }`}
              style={{ width: `${fuelPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* MOBILE ON-SCREEN TOUCH CONTROLS */}
      <div className="sm:hidden absolute bottom-4 right-4 z-20 flex gap-2">
        <div className="flex flex-col gap-2">
          <button
            onTouchStart={() => (inputRef.current.left = true)}
            onTouchEnd={() => (inputRef.current.left = false)}
            className="w-14 h-14 rounded-2xl bg-white/20 active:bg-[#E9FF57]/40 border border-white/30 text-xl font-bold flex items-center justify-center backdrop-blur-md"
          >
            ◀
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onTouchStart={() => (inputRef.current.right = true)}
            onTouchEnd={() => (inputRef.current.right = false)}
            className="w-14 h-14 rounded-2xl bg-white/20 active:bg-[#E9FF57]/40 border border-white/30 text-xl font-bold flex items-center justify-center backdrop-blur-md"
          >
            ▶
          </button>
        </div>
        <div className="flex flex-col gap-2 ml-2">
          <button
            onTouchStart={() => (inputRef.current.up = true)}
            onTouchEnd={() => (inputRef.current.up = false)}
            className="w-14 h-14 rounded-2xl bg-emerald-500/30 active:bg-emerald-400/60 border border-emerald-400/50 text-xs font-black flex items-center justify-center backdrop-blur-md uppercase"
          >
            GAS
          </button>
          <button
            onTouchStart={() => (inputRef.current.down = true)}
            onTouchEnd={() => (inputRef.current.down = false)}
            className="w-14 h-14 rounded-2xl bg-red-500/30 active:bg-red-400/60 border border-red-400/50 text-xs font-black flex items-center justify-center backdrop-blur-md uppercase"
          >
            BRAKE
          </button>
        </div>
      </div>

      {/* START SCREEN OVERLAY */}
      {!started && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="max-w-lg w-full rounded-3xl border border-white/20 bg-[#141418] p-8 text-center shadow-2xl animate-fade-up">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9FF57]">
              Road Trip Simulator
            </span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Hyderabad to Goa
            </h1>
            <p className="mt-3 text-sm text-gray-300 leading-relaxed">
              Four best friends in a classic red convertible. Drive 650 km past Hyderabad Outer Ring Road,
              Deccan sunflower fields, roadside dhabas, and the majestic Western Ghats straight into Goa beach!
            </p>

            <div className="my-6 grid grid-cols-2 gap-3 text-left bg-black/40 p-4 rounded-2xl border border-white/10 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Steering</span>
                <span className="text-white font-semibold">Left / Right Arrows (or A / D)</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Drive / Reverse</span>
                <span className="text-white font-semibold">Up / Down Arrows (or W / S)</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Handbrake</span>
                <span className="text-white font-semibold">Spacebar</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Highway Horn</span>
                <span className="text-white font-semibold">H Key or Horn Button</span>
              </div>
            </div>

            <button
              onClick={() => {
                setStarted(true);
                audio.click();
              }}
              className="w-full py-4 rounded-full bg-[#E9FF57] hover:bg-[#d8ee44] text-[#0B0B0D] font-extrabold text-sm uppercase tracking-wider transition-transform active:scale-[0.98] shadow-lg shadow-[#E9FF57]/20"
            >
              Start Road Trip 🚗💨
            </button>
          </div>
        </div>
      )}

      {/* OUT OF FUEL PROMPT */}
      {outOfFuel && !arrived && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="max-w-md w-full rounded-3xl border border-amber-400/40 bg-[#18181E] p-8 text-center shadow-2xl">
            <div className="text-4xl mb-3">⛽</div>
            <h2 className="text-2xl font-black text-white">Tank Empty!</h2>
            <p className="mt-2 text-sm text-gray-300">
              The car rolled to a gentle stop on the highway shoulder. Luckily, a roadside petrol pump is right nearby!
            </p>
            <button
              onClick={handleRefuel}
              className="mt-6 w-full py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-[#0B0B0D] font-black uppercase text-xs tracking-wider transition active:scale-95"
            >
              Top Up Fuel (Full Tank) ⛽
            </button>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {paused && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-md p-6">
          <div className="max-w-xs w-full rounded-3xl border border-white/20 bg-[#15151A] p-6 text-center">
            <h2 className="text-xl font-bold text-white">Trip Paused</h2>
            <p className="text-xs text-gray-400 mt-1">Car parked at roadside dhaba</p>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => setPaused(false)}
                className="w-full py-3 rounded-full bg-[#E9FF57] text-[#0B0B0D] font-bold text-xs uppercase"
              >
                Resume Driving
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

      {/* CONGRATULATIONS SCREEN (REACHED GOA) */}
      {arrived && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-lg p-6">
          <div className="max-w-md w-full rounded-3xl border border-amber-400/50 bg-[#16161C] p-8 text-center shadow-2xl animate-fade-up">
            <div className="inline-flex p-3 rounded-2xl bg-amber-400/20 text-amber-300 mb-3 text-3xl">
              🏖️ 🌴
            </div>
            <h2 className="font-display text-3xl font-extrabold text-white">
              WE REACHED GOA!
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              "Friendship ki limit ledhu... Goa ki brake ledhu!" You drove all 650 km from Hyderabad to the sunny beaches of Goa!
            </p>

            <div className="my-6 grid grid-cols-3 gap-2 bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Distance</span>
                <span className="text-base font-bold text-[#E9FF57]">650 KM</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Top Speed</span>
                <span className="text-base font-bold text-amber-400">125 KM/H</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Friendship</span>
                <span className="text-base font-bold text-emerald-400">100%</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setDistanceLeftKm(TOTAL_DISTANCE_KM);
                  setFuelPct(100);
                  setArrived(false);
                  setStarted(true);
                  audio.click();
                }}
                className="w-full py-3.5 rounded-full bg-[#E9FF57] text-[#0B0B0D] font-extrabold text-xs uppercase tracking-wider hover:bg-[#d8ee44] transition"
              >
                Drive Again 🚗
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
