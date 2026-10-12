/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Swords, 
  Settings, 
  HelpCircle, 
  MousePointer, 
  Camera, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Trophy,
  Award,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Question, GameMode, InputMode, HandCursor, FloatingFeedback, GameSettings } from './types';
import { DEFAULT_5_QUESTIONS, getDefault5Questions, generateRandomMathQuestion } from './utils/presets';
import { BeeCharacter } from './utils/beeRenderer';
import { soundFx } from './utils/audio';
import { QuestionManagerModal } from './components/QuestionManagerModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ScoreBoard } from './components/ScoreBoard';
import { ActivationModal } from './components/ActivationModal';

const FULL_VERSION_CODE = 'TGLBH';
const ACTIVATED_STORAGE_KEY = 'game_ar_lebah_activated_v5';
const QUESTIONS_STORAGE_KEY = 'game_ar_lebah_questions_v4';
const SETTINGS_STORAGE_KEY = 'game_ar_lebah_settings_v4';
const HOVER_TIME_REQUIRED = 1.0;

export default function App() {
  // Questions State with localStorage persistence
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(QUESTIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return getDefault5Questions();
  });

  // Bee Size, Speed, & Score Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          beeSize: parsed.beeSize ?? 1.0,
          beeSpeed: parsed.beeSpeed ?? 1.0,
          scoreCorrect: parsed.scoreCorrect ?? 10,
          scoreWrong: parsed.scoreWrong ?? 5,
          winningScore: parsed.winningScore ?? 50,
        };
      }
    } catch {
      // Fallback
    }
    return {
      beeSize: 1.0,
      beeSpeed: 1.0,
      scoreCorrect: 10,
      scoreWrong: 5,
      winningScore: 50,
    };
  });

  // Game flow states
  const [gameState, setGameState] = useState<'menu' | 'loading' | 'playing' | 'victory'>('menu');
  const [winnerPlayer, setWinnerPlayer] = useState<1 | 2 | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [loadingText, setLoadingText] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [menuToast, setMenuToast] = useState<string | null>(null);

  // Scores & active question
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(DEFAULT_5_QUESTIONS[0]);
  const [isMuted, setIsMuted] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  // License & Activation States
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ACTIVATED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [licenseMode, setLicenseMode] = useState<'full' | 'demo'>(() => {
    try {
      if (localStorage.getItem(ACTIVATED_STORAGE_KEY) === 'true') {
        return 'full';
      }
    } catch {}
    return 'demo';
  });

  // Determines whether user passed initial activation popup
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ACTIVATED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ACTIVATED_STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  // Activation & Demo handlers
  const handleActivateCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === FULL_VERSION_CODE) {
      setIsActivated(true);
      setLicenseMode('full');
      setHasEnteredApp(true);
      setIsActivationModalOpen(false);
      try {
        localStorage.setItem(ACTIVATED_STORAGE_KEY, 'true');
      } catch {}
      setMenuToast('🎉 Versi Penuh Berhasil Diaktifkan! Semua menu & fitur terbuka.');
      setTimeout(() => setMenuToast(null), 5000);
      return true;
    }
    return false;
  };

  const handleEnterDemo = () => {
    setLicenseMode('demo');
    setHasEnteredApp(true);
    setIsActivationModalOpen(false);
  };

  // Refs for Canvas, MediaPipe, and Real-Time State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const handsEngineRef = useRef<unknown>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mutable refs for high performance 60fps loop and callback closures
  const gameModeRef = useRef<GameMode>('solo');
  const settingsRef = useRef<GameSettings>(settings);
  const beesRef = useRef<BeeCharacter[]>([]);
  const handCursorsRef = useRef<HandCursor[]>([]);
  const touchPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const feedbacksRef = useRef<FloatingFeedback[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const isQuestionTransitionRef = useRef<boolean>(false);

  // Keep refs synchronized with state
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    settingsRef.current = settings;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
    // Update live bees if game is currently running
    beesRef.current.forEach(bee => {
      bee.sizeMultiplier = settings.beeSize;
      bee.speedMultiplier = settings.beeSpeed;
    });
  }, [settings]);

  // Save questions to localStorage
  const handleSaveQuestions = (updated: Question[]) => {
    setQuestions(updated);
    try {
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  // Cleanup Camera and Streams
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Exit Game back to Main Menu
  const handleExitGame = () => {
    stopCamera();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setGameState('menu');
  };

  // Generate next question & spawn bees using multiple choice options
  const spawnNewQuestion = useCallback((modeOverride?: GameMode) => {
    isQuestionTransitionRef.current = false;
    const activeMode = modeOverride || gameModeRef.current;

    let nextQ: Question;
    if (questions.length > 0) {
      nextQ = questions[Math.floor(Math.random() * questions.length)];
    } else {
      nextQ = generateRandomMathQuestion();
    }

    if (!nextQ || !nextQ.question || !nextQ.answer) {
      nextQ = generateRandomMathQuestion();
    }

    setCurrentQuestion(nextQ);

    const width = Math.max(window.innerWidth, canvasRef.current?.width || 0);
    const height = Math.max(window.innerHeight, canvasRef.current?.height || 0);

    if (canvasRef.current) {
      if (canvasRef.current.width !== width) canvasRef.current.width = width;
      if (canvasRef.current.height !== height) canvasRef.current.height = height;
    }

    // Determine the 4 multiple choice options
    let answers: string[] = [];
    if (nextQ.options && nextQ.options.length >= 4) {
      answers = [...nextQ.options];
    } else if (nextQ.options && nextQ.options.length > 0) {
      answers = [...nextQ.options];
    } else {
      answers = [String(nextQ.answer)];
    }

    // Ensure correct answer is included
    if (!answers.includes(String(nextQ.answer))) {
      answers[0] = String(nextQ.answer);
    }

    // Fill remaining dummy choices if less than 4
    const isNum = !isNaN(Number(nextQ.answer)) && String(nextQ.answer).trim() !== '';
    const numAns = isNum ? Number(nextQ.answer) : 0;

    while (answers.length < 4) {
      if (isNum) {
        let offset = Math.floor(Math.random() * 10) - 5;
        if (offset === 0) offset = answers.length + 1;
        const dummy = String(numAns + offset);
        if (!answers.includes(dummy)) answers.push(dummy);
      } else {
        const dummy = 'Pilihan ' + (answers.length + 1);
        if (!answers.includes(dummy)) answers.push(dummy);
      }
    }

    // Spawn Bee Characters with user's size and speed settings
    const currentSettings = settingsRef.current;
    const newBees: BeeCharacter[] = [];

    if (activeMode === 'solo') {
      const shuffled = [...answers].sort(() => Math.random() - 0.5);
      shuffled.forEach((ans, i) => {
        const x = (width * 0.15) + (width * 0.7) * (i / (shuffled.length - 1 || 1));
        const y = height * 0.55 + (Math.random() * 80 - 40);
        newBees.push(new BeeCharacter({
          x,
          y,
          answer: ans,
          isCorrect: ans === String(nextQ.answer),
          minX: 0,
          maxX: width,
          sizeMultiplier: currentSettings.beeSize,
          speedMultiplier: currentSettings.beeSpeed,
        }, width, height));
      });
    } else {
      // 2 Players Battle: Left side (P1) and Right side (P2)
      const shuffledP1 = [...answers].sort(() => Math.random() - 0.5);
      const shuffledP2 = [...answers].sort(() => Math.random() - 0.5);

      // Player 1 Bees (Left Zone: 0 to width/2)
      shuffledP1.forEach((ans, i) => {
        const x1 = (width * 0.08) + (width * 0.34) * (i / 3);
        const y1 = height * 0.55 + (Math.random() * 80 - 40);
        newBees.push(new BeeCharacter({
          x: x1,
          y: y1,
          answer: ans,
          isCorrect: ans === String(nextQ.answer),
          minX: 0,
          maxX: width / 2,
          sizeMultiplier: currentSettings.beeSize,
          speedMultiplier: currentSettings.beeSpeed,
        }, width, height));
      });

      // Player 2 Bees (Right Zone: width/2 to width)
      shuffledP2.forEach((ans, i) => {
        const x2 = (width * 0.56) + (width * 0.36) * (i / 3);
        const y2 = height * 0.55 + (Math.random() * 80 - 40);
        newBees.push(new BeeCharacter({
          x: x2,
          y: y2,
          answer: ans,
          isCorrect: ans === String(nextQ.answer),
          minX: width / 2,
          maxX: width,
          sizeMultiplier: currentSettings.beeSize,
          speedMultiplier: currentSettings.beeSpeed,
        }, width, height));
      });
    }

    beesRef.current = newBees;
  }, [questions]);

  // Handle successful hit with configured score points & victory check
  const handleCorrectCatch = useCallback((player: 1 | 2, x: number, y: number) => {
    if (isQuestionTransitionRef.current) return;
    isQuestionTransitionRef.current = true;

    const points = settingsRef.current.scoreCorrect;
    const winTarget = settingsRef.current.winningScore;

    let nextP1 = scoreP1;
    let nextP2 = scoreP2;

    if (player === 1) {
      nextP1 = scoreP1 + points;
      setScoreP1(nextP1);
    } else {
      nextP2 = scoreP2 + points;
      setScoreP2(nextP2);
    }

    // Play lively animated correct chime
    soundFx.playCorrect();

    // Trigger celebration confetti on the winner's side
    confetti({
      particleCount: 55,
      spread: 80,
      origin: { x: x / window.innerWidth, y: y / window.innerHeight },
      colors: player === 1 ? ['#38BDF8', '#FBBF24', '#34D399'] : ['#F43F5E', '#FBBF24', '#A855F7']
    });

    const isBattle = gameModeRef.current === 'battle';
    const winMsg = isBattle 
      ? (player === 1 ? `P1 BENAR! +${points} 🌟` : `P2 BENAR! +${points} 🌟`)
      : `BENAR! +${points} 🌟`;

    // Add floating animated feedback
    feedbacksRef.current.push({
      id: 'fb_' + Date.now(),
      text: winMsg,
      x,
      y,
      color: player === 1 ? '#38BDF8' : '#F43F5E',
      life: 1.2,
      maxLife: 1.2,
      scale: 1,
      vy: -60,
    });

    // Check Victory Target
    if (winTarget > 0 && (nextP1 >= winTarget || nextP2 >= winTarget)) {
      setTimeout(() => {
        soundFx.playVictory();
        setWinnerPlayer(nextP1 >= winTarget ? 1 : 2);
        setGameState('victory');
      }, 700);
      return;
    }

    // Mark bees as dead & spawn next question
    beesRef.current.forEach(b => {
      b.isDead = true;
    });

    setTimeout(() => {
      spawnNewQuestion();
    }, 850);
  }, [scoreP1, scoreP2, spawnNewQuestion]);

  // Handle wrong hit with configured penalty & cartoon buzzer sound
  const handleWrongCatch = useCallback((bee: BeeCharacter, player: 1 | 2, x: number, y: number) => {
    const penalty = settingsRef.current.scoreWrong;

    if (player === 1) {
      setScoreP1(prev => Math.max(0, prev - penalty));
    } else {
      setScoreP2(prev => Math.max(0, prev - penalty));
    }

    // Animated cartoon wah-wah wobble sound
    soundFx.playWrong();

    bee.isDizzy = true;
    bee.dizzyTimer = 1.8;
    bee.hoverProgress = 0;

    feedbacksRef.current.push({
      id: 'fb_' + Date.now(),
      text: player === 2 ? `P2 SALAH! -${penalty} 💥` : `SALAH! -${penalty} 💥`,
      x,
      y,
      color: '#F87171',
      life: 1.0,
      maxLife: 1.0,
      scale: 1,
      vy: -50,
    });
  }, []);

  // Helper to wait for MediaPipe Hands script from CDN
  const waitForMediaPipe = async (timeoutMs = 4000): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Hands) return true;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).Hands) return true;
      await new Promise(r => setTimeout(r, 150));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as any).Hands;
  };

  // Initialize Camera & MediaPipe Hands
  const initCameraAndMediaPipe = async () => {
    setLoadingText('Meminta izin kamera webcam...');
    setCameraError(null);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });

    mediaStreamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Kamera tidak merespons.')), 7000);
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              clearTimeout(timeout);
              resolve();
            }).catch(reject);
          };
        }
      });
    }

    setLoadingText('Menyiapkan AI sensor pelacak tangan...');

    const hasMediaPipe = await waitForMediaPipe(4000);
    if (!hasMediaPipe) {
      throw new Error('Pustaka MediaPipe Hands belum termuat di browser.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const HandsClass = (window as any).Hands;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hands = new HandsClass({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 4,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hands.onResults((results: any) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const newCursors: HandCursor[] = [];

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results.multiHandLandmarks.forEach((landmarks: any) => {
          const tip = landmarks[8];
          if (!tip) return;

          // Mirror horizontally: (1 - tip.x) * width
          const hx = (1 - tip.x) * width;
          const hy = tip.y * height;

          let player: 1 | 2 = 1;
          if (gameModeRef.current === 'battle') {
            player = hx >= width / 2 ? 2 : 1;
          }

          newCursors.push({ x: hx, y: hy, player });
        });
      }

      handCursorsRef.current = newCursors;
    });

    await hands.initialize();
    handsEngineRef.current = hands;

    // Continuous video loop with congestion guard
    let isProcessing = false;
    const processVideoLoop = async () => {
      if (!videoRef.current || !mediaStreamRef.current) return;
      if (!isProcessing && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        isProcessing = true;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (handsEngineRef.current as any)?.send({ image: videoRef.current });
        } catch {
          // Skip frame
        } finally {
          isProcessing = false;
        }
      }
      if (mediaStreamRef.current) {
        requestAnimationFrame(processVideoLoop);
      }
    };
    processVideoLoop();
  };

  // Start Game
  const startGame = async (mode: GameMode, preferredInput: InputMode) => {
    setGameMode(mode);
    gameModeRef.current = mode;
    setInputMode(preferredInput);
    setScoreP1(0);
    setScoreP2(0);
    setWinnerPlayer(null);
    setGameState('loading');

    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }

    if (preferredInput === 'camera') {
      try {
        await initCameraAndMediaPipe();
        setGameState('playing');
        spawnNewQuestion(mode);
      } catch (err) {
        const error = err as Error;
        console.warn('Kamera tidak aktif, beralih ke Mode Mouse/Sentuh:', error.message);
        setCameraError('Kamera tidak terdeteksi atau izin belum diberikan. Dialihkan otomatis ke Mode Mouse/Sentuh!');
        stopCamera();
        setInputMode('mouse');
        setGameState('playing');
        spawnNewQuestion(mode);
      }
    } else {
      stopCamera();
      setGameState('playing');
      spawnNewQuestion(mode);
    }
  };

  // Toggle Input Mode between Camera & Mouse
  const handleToggleInputMode = async () => {
    if (inputMode === 'camera') {
      stopCamera();
      setInputMode('mouse');
    } else {
      try {
        setInputMode('camera');
        await initCameraAndMediaPipe();
      } catch {
        setInputMode('mouse');
      }
    }
  };

  // Pointer interactions on canvas (Supports both mouse and multi-touch for 2P Battle)
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const clickX = e.clientX;
    const clickY = e.clientY;
    mousePosRef.current = { x: clickX, y: clickY };
    touchPointersRef.current.set(e.pointerId, { x: clickX, y: clickY });

    let player: 1 | 2 = 1;
    if (gameModeRef.current === 'battle' && clickX >= window.innerWidth / 2) {
      player = 2;
    }

    // Direct click/tap on bee
    for (const bee of beesRef.current) {
      if (bee.isDead) continue;
      if (gameModeRef.current === 'battle') {
        if (player === 1 && bee.x > window.innerWidth / 2) continue;
        if (player === 2 && bee.x < window.innerWidth / 2) continue;
      }

      const dist = Math.hypot(clickX - bee.x, clickY - bee.y);
      if (dist <= bee.radius * 1.6) {
        if (bee.isCorrect) {
          handleCorrectCatch(player, bee.x, bee.y);
        } else {
          handleWrongCatch(bee, player, bee.x, bee.y);
        }
        break;
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    touchPointersRef.current.delete(e.pointerId);
  };

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main 60fps Game Render & Physics Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const width = canvas.width || window.innerWidth;
      const height = canvas.height || window.innerHeight;

      // 1. RENDER BACKGROUND
      if (inputMode === 'camera' && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-width, 0);
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        ctx.restore();

        // Dark gradient overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.fillRect(0, 0, width, height);
      } else {
        // Vibrant Cartoon Meadow Background for Mouse/Touch mode
        ctx.save();
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#38BDF8');
        skyGrad.addColorStop(0.55, '#BAE6FD');
        skyGrad.addColorStop(1, '#86EFAC');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Sun Glow
        const sunGrad = ctx.createRadialGradient(width * 0.85, height * 0.15, 10, width * 0.85, height * 0.15, 140);
        sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
        sunGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.4)');
        sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(width * 0.85, height * 0.15, 140, 0, Math.PI * 2);
        ctx.fill();

        // Rolling Grass Hills
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.75);
        ctx.quadraticCurveTo(width * 0.35, height * 0.68, width * 0.7, height * 0.76);
        ctx.quadraticCurveTo(width * 0.88, height * 0.8, width, height * 0.74);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.84);
        ctx.quadraticCurveTo(width * 0.4, height * 0.88, width, height * 0.82);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 2. DRAW 2-PLAYER SPLIT DIVIDER
      if (gameModeRef.current === 'battle') {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([16, 14]);
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();

        ctx.font = '900 14px "Fredoka", sans-serif';
        ctx.fillStyle = '#38BDF8';
        ctx.textAlign = 'right';
        ctx.fillText('◄ AREA PEMAIN 1', width / 2 - 20, 120);

        ctx.fillStyle = '#F43F5E';
        ctx.textAlign = 'left';
        ctx.fillText('AREA PEMAIN 2 ►', width / 2 + 20, 120);

        ctx.restore();
      }

      // 3. COMPILE ACTIVE CURSORS (CAMERA OR MULTI-TOUCH)
      let activeCursors: HandCursor[] = [];
      if (inputMode === 'camera') {
        activeCursors = handCursorsRef.current;
      } else {
        if (touchPointersRef.current.size > 0) {
          touchPointersRef.current.forEach((pos) => {
            const player: 1 | 2 = (gameModeRef.current === 'battle' && pos.x >= width / 2) ? 2 : 1;
            activeCursors.push({ x: pos.x, y: pos.y, player });
          });
        } else if (mousePosRef.current) {
          const player: 1 | 2 = (gameModeRef.current === 'battle' && mousePosRef.current.x >= width / 2) ? 2 : 1;
          activeCursors.push({ x: mousePosRef.current.x, y: mousePosRef.current.y, player });
        }
      }

      // 4. DRAW CURSOR RETICLES
      activeCursors.forEach(cursor => {
        ctx.save();
        const cursorColor = cursor.player === 1 ? '#38BDF8' : '#F43F5E';

        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 26, 0, Math.PI * 2);
        ctx.fillStyle = cursor.player === 1 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(244, 63, 94, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = cursorColor;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = cursorColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cursor.x - 20, cursor.y);
        ctx.lineTo(cursor.x - 10, cursor.y);
        ctx.moveTo(cursor.x + 10, cursor.y);
        ctx.lineTo(cursor.x + 20, cursor.y);
        ctx.moveTo(cursor.x, cursor.y - 20);
        ctx.lineTo(cursor.x, cursor.y - 10);
        ctx.moveTo(cursor.x, cursor.y + 10);
        ctx.lineTo(cursor.x, cursor.y + 20);
        ctx.stroke();

        ctx.restore();
      });

      // 5. UPDATE & DRAW BEES
      const bees = beesRef.current;
      for (const bee of bees) {
        bee.update(dt, height);

        let isHoveredByAny = false;

        if (!bee.isDead) {
          activeCursors.forEach(cursor => {
            if (gameModeRef.current === 'battle') {
              if (cursor.player === 1 && bee.x > width / 2) return;
              if (cursor.player === 2 && bee.x < width / 2) return;
            }

            const dx = cursor.x - bee.x;
            const dy = cursor.y - bee.y;
            const distance = Math.hypot(dx, dy);

            if (distance < bee.radius * 1.5) {
              isHoveredByAny = true;
              bee.isHovered = true;

              if (!bee.isDizzy) {
                bee.hoverProgress += dt / HOVER_TIME_REQUIRED;

                if (Math.random() < 0.12) {
                  soundFx.playHover();
                }

                if (bee.hoverProgress >= 1) {
                  if (bee.isCorrect) {
                    handleCorrectCatch(cursor.player, bee.x, bee.y);
                  } else {
                    handleWrongCatch(bee, cursor.player, bee.x, bee.y);
                  }
                }
              }
            }
          });
        }

        if (!isHoveredByAny) {
          bee.isHovered = false;
          bee.hoverProgress = Math.max(0, bee.hoverProgress - dt * 2.5);
        }

        bee.draw(ctx);
      }

      // 6. FLOATING ANIMATED FEEDBACK PARTICLES ("BENAR!", "SALAH!")
      const feedbacks = feedbacksRef.current;
      for (let i = feedbacks.length - 1; i >= 0; i--) {
        const fb = feedbacks[i];
        fb.life -= dt;
        fb.y += fb.vy * dt;

        if (fb.life <= 0) {
          feedbacks.splice(i, 1);
          continue;
        }

        const alpha = Math.min(1, fb.life * 2);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '900 46px "Fredoka", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'round';
        ctx.strokeText(fb.text, fb.x, fb.y);

        ctx.fillStyle = fb.color;
        ctx.fillText(fb.text, fb.x, fb.y);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameState, inputMode, handleCorrectCatch, handleWrongCatch]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-nunito select-none">
      
      {/* Video placed offscreen without display:none so frames decode smoothly */}
      <video
        ref={videoRef}
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 640,
          height: 480,
          opacity: 0,
          pointerEvents: 'none',
        }}
        autoPlay
        playsInline
        muted
      />

      {/* Main Game Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        className="absolute inset-0 w-full h-full block z-10 cursor-crosshair touch-none"
      />

      {/* HUD Scoreboard (Active in Playing State) */}
      {gameState === 'playing' && (
        <ScoreBoard
          scoreP1={scoreP1}
          scoreP2={scoreP2}
          gameMode={gameMode}
          inputMode={inputMode}
          isMuted={isMuted}
          questionText={currentQuestion.question}
          licenseMode={licenseMode}
          onToggleMute={handleToggleMute}
          onToggleInputMode={handleToggleInputMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHowTo={() => setIsHowToOpen(true)}
          onExitGame={handleExitGame}
          onOpenActivation={() => setIsActivationModalOpen(true)}
        />
      )}

      {/* Victory Celebration Modal */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center">
            <span className="text-7xl mb-3 animate-bounce">🏆</span>
            
            <h2 className="text-3xl sm:text-4xl font-black text-amber-400 font-heading mb-1">
              {gameMode === 'battle'
                ? `PEMAIN ${winnerPlayer} MENANG!`
                : 'TARGET SKOR TERCAPAI!'}
            </h2>
            
            <p className="text-slate-300 text-sm font-bold mb-6">
              {gameMode === 'battle'
                ? `Pemain ${winnerPlayer} berhasil mencapai target ${settings.winningScore} poin pertama!`
                : `Hebat sekali! Anda berhasil mencapai target skor ${settings.winningScore} poin!`}
            </p>

            <div className="bg-slate-800/80 rounded-2xl p-4 w-full flex justify-around mb-6 border border-slate-700">
              <div>
                <div className="text-xs text-sky-400 font-bold uppercase">Skor P1</div>
                <div className="text-3xl font-black text-white font-heading">{scoreP1}</div>
              </div>
              {gameMode === 'battle' && (
                <div>
                  <div className="text-xs text-rose-400 font-bold uppercase">Skor P2</div>
                  <div className="text-3xl font-black text-white font-heading">{scoreP2}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => startGame(gameMode, inputMode)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-base flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
              >
                <RotateCcw className="w-5 h-5" /> Main Lagi
              </button>
              <button
                onClick={() => setGameState('menu')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-5 rounded-xl text-sm"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {gameState === 'loading' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl animate-bounce mb-6">🐝</div>
          <h3 className="text-3xl font-black text-white font-heading mb-2">
            Menyiapkan Game AR Menangkap Lebah...
          </h3>
          <p className="text-amber-400 font-bold text-lg max-w-md animate-pulse">
            {loadingText || 'Memuat lebah dan kamera...'}
          </p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => {
                stopCamera();
                setInputMode('mouse');
                setGameState('playing');
                spawnNewQuestion();
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md"
            >
              Lewati ke Mode Mouse / Sentuh
            </button>
            <button
              onClick={() => {
                stopCamera();
                setGameState('menu');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* MAIN MENU SCREEN */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-40 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-amber-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
          
          {/* Logo & Animated Mascot */}
          <div className="flex flex-col items-center mb-7 text-center">
            <div className="relative mb-3 animate-float-slow">
              <span className="text-7xl sm:text-8xl drop-shadow-[0_10px_20px_rgba(245,158,11,0.5)]">
                🐝
              </span>
              <span className="absolute -top-2 -right-3 text-3xl animate-spin" style={{ animationDuration: '6s' }}>
                ✨
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 font-heading tracking-wide drop-shadow-lg">
              Game AR Tangkap Lebah
            </h1>
            <p className="text-slate-300 font-bold text-sm sm:text-base max-w-lg mt-2">
              Tangkap lebah jawaban dengan kamera AI gerak tangan atau kursor mouse!
            </p>

            {/* Quick status badge */}
            <div className="mt-3 flex flex-wrap justify-center items-center gap-2">
              <span className="bg-amber-500/10 border border-amber-400/30 px-3.5 py-1 rounded-full text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {questions.length} Soal Pilihan Ganda
              </span>
              <span className="bg-emerald-500/10 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
                Poin: +{settings.scoreCorrect} / -{settings.scoreWrong}
              </span>
              <span className="bg-sky-500/10 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-bold text-sky-300">
                Ukuran: {Math.round(settings.beeSize * 100)}%
              </span>
            </div>
          </div>

          {/* Reset Toast Notification on Menu */}
          {menuToast && (
            <div className="mb-4 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{menuToast}</span>
            </div>
          )}

          {/* License Status Banner */}
          {licenseMode === 'demo' ? (
            <div className="mb-4 bg-amber-500/15 border-2 border-amber-400/60 rounded-2xl p-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-2xl w-full shadow-lg">
              <div className="flex items-center gap-2.5 text-left">
                <span className="text-2xl">🎮</span>
                <div>
                  <div className="text-amber-300 font-black text-sm flex items-center gap-2">
                    <span>Mode Demo (Hanya 1 Pemain)</span>
                  </div>
                  <div className="text-slate-400 text-xs">
                    Menu lain disembunyikan. Masukkan kode untuk membuka Full Versi.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsActivationModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow active:scale-95 transition-all shrink-0 font-heading"
              >
                <KeyRound className="w-4 h-4" /> Masukkan Kode Aktivasi
              </button>
            </div>
          ) : (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-400/40 rounded-2xl px-5 py-2 flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-bold shadow">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Versi Penuh Aktif • Seluruh Fitur & Menu Terbuka</span>
            </div>
          )}

          {/* Camera notification if any */}
          {cameraError && (
            <div className="mb-6 max-w-xl w-full bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-4 flex items-start gap-3 shadow-xl">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-left flex-1">
                <div className="text-sm font-bold text-amber-200 mb-1">Info Kontrol:</div>
                <div className="text-xs text-amber-300 mb-2 leading-relaxed">{cameraError}</div>
                <button
                  onClick={() => startGame('solo', 'mouse')}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  Main Sekarang dengan Mode Mouse / Sentuh
                </button>
              </div>
            </div>
          )}

          {/* Menu Buttons Grid */}
          {licenseMode === 'demo' ? (
            /* DEMO MODE: ONLY 1 PLAYER MENU IS DISPLAYED, OTHERS HIDDEN */
            <div className="flex flex-col gap-4 max-w-lg w-full">
              {/* 1. Solo Player */}
              <button
                onClick={() => startGame('solo', 'camera')}
                className="group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-4 px-6 rounded-2xl text-xl shadow-[0_6px_0_#1d4ed8] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-between font-heading"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <div>
                    <div className="text-xl">1 Pemain (Solo)</div>
                    <div className="text-xs font-semibold text-blue-100 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> Kamera Gerak Tangan / Kursor
                    </div>
                  </div>
                </div>
                <Play className="w-6 h-6 fill-white" />
              </button>

              {/* Locked Features Banner in Demo */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-slate-400 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Menu Lain Disembunyikan (Mode Demo)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Menu <b>2 Pemain (Battle)</b>, <b>Mode Mouse</b>, dan <b>Pengaturan Soal</b> disembunyikan dalam mode demo. Masukkan kode aktivasi resmi untuk membuka seluruh menu.
                </p>
                <button
                  onClick={() => setIsActivationModalOpen(true)}
                  className="mt-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-400/40 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Masukkan Kode Aktivasi
                </button>
              </div>
            </div>
          ) : (
            /* FULL VERSION: ALL 4 MENUS DISPLAYED */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
              
              {/* 1. Solo Player */}
              <button
                onClick={() => startGame('solo', 'camera')}
                className="group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-4 px-6 rounded-2xl text-xl shadow-[0_6px_0_#1d4ed8] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-between font-heading"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <div>
                    <div className="text-xl">1 Pemain (Solo)</div>
                    <div className="text-xs font-semibold text-blue-100 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> Kamera Gerak Tangan
                    </div>
                  </div>
                </div>
                <Play className="w-6 h-6 fill-white" />
              </button>

              {/* 2. Battle Mode (2 Players) */}
              <button
                onClick={() => startGame('battle', 'camera')}
                className="group bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black py-4 px-6 rounded-2xl text-xl shadow-[0_6px_0_#b91c1c] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-between font-heading"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ⚔️
                  </div>
                  <div>
                    <div className="text-xl">2 Pemain (Battle)</div>
                    <div className="text-xs font-semibold text-rose-100 flex items-center gap-1">
                      <Swords className="w-3.5 h-3.5" /> Duel 2 Pemain (P1 & P2 Aktif)
                    </div>
                  </div>
                </div>
                <Play className="w-6 h-6 fill-white" />
              </button>

              {/* 3. Mouse / Touch Mode */}
              <button
                onClick={() => startGame('solo', 'mouse')}
                className="group bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black py-4 px-6 rounded-2xl text-xl shadow-[0_6px_0_#7e22ce] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-between font-heading"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🖱️
                  </div>
                  <div>
                    <div className="text-xl">Mode Mouse / Sentuh</div>
                    <div className="text-xs font-semibold text-purple-100 flex items-center gap-1">
                      <MousePointer className="w-3.5 h-3.5" /> Tanpa Kamera (Laptop / Layar Sentuh)
                    </div>
                  </div>
                </div>
                <Play className="w-6 h-6 fill-white" />
              </button>

              {/* 4. Question & Game Settings */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="group bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-4 px-6 rounded-2xl text-xl shadow-[0_6px_0_#047857] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-between font-heading"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ⚙️
                  </div>
                  <div>
                    <div className="text-xl">Pengaturan Game & Soal</div>
                    <div className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" /> Soal, Pilihan Ganda & Aturan Skor
                    </div>
                  </div>
                </div>
                <Settings className="w-6 h-6" />
              </button>

            </div>
          )}

          {/* Secondary Options */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6">
            <button
              onClick={() => setIsHowToOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Cara Bermain
            </button>

            <button
              onClick={handleToggleMute}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 border border-slate-700 transition-colors"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  Suara: Mati
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  Suara: Nyala
                </>
              )}
            </button>

            {licenseMode === 'full' ? (
              <button
                onClick={() => {
                  const freshQuestions = getDefault5Questions();
                  handleSaveQuestions(freshQuestions);
                  setCurrentQuestion(freshQuestions[0]);
                  setMenuToast('✅ 5 Soal bawaan berhasil dipulihkan!');
                  setTimeout(() => setMenuToast(null), 3000);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
                title="Kembalikan ke 5 Soal Bawaan"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Reset 5 Soal
              </button>
            ) : (
              <button
                onClick={() => setIsActivationModalOpen(true)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-amber-400/40 active:scale-95 transition-all"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Aktivasi Full Versi
              </button>
            )}
          </div>

          {/* Footer branding with creator attribution */}
          <div className="mt-8 text-center flex flex-col items-center">
            <div className="text-xs sm:text-sm font-bold text-amber-300 bg-slate-900/95 px-5 py-2 rounded-2xl border border-amber-400/40 shadow-xl inline-block tracking-wide">
              Dibuat oleh : M. Nur Ali Abidin, S.Pd.
            </div>
            <div className="mt-2 text-xs text-slate-400 font-medium flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5">
              <span>Instagram: <span className="text-slate-300 font-semibold">@aliabidin988</span></span>
              <span>•</span>
              <span>TikTok: <span className="text-slate-300 font-semibold">@aliabidin98</span></span>
              <span>•</span>
              <span>Email: <span className="text-slate-300 font-semibold">ali.abidin8@gmail.com</span></span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-semibold">
              Game AR Tangkap Lebah • MediaPipe AI Hand Tracking • Pilihan Ganda 4 Lebah
            </div>
          </div>

        </div>
      )}

      {/* QUESTION & GAME SETTINGS MODAL */}
      <QuestionManagerModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        questions={questions}
        onSaveQuestions={handleSaveQuestions}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* HOW TO PLAY MODAL */}
      <HowToPlayModal
        isOpen={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />

      {/* ACTIVATION POPUP (MODAL AWAL KODE AKTIVASI) */}
      <ActivationModal
        isOpen={isActivationModalOpen}
        onActivate={handleActivateCode}
        onEnterDemo={handleEnterDemo}
        canClose={hasEnteredApp}
        onClose={() => setIsActivationModalOpen(false)}
      />

    </div>
  );
}
