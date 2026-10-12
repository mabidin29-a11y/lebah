export interface Question {
  id: string;
  question: string;
  answer: string;
  options?: string[]; // Multiple choice options [optA, optB, optC, optD]
}

export interface GameSettings {
  beeSize: number;       // 0.7 to 1.6 (default 1.0)
  beeSpeed: number;      // 0.5 to 2.0 (default 1.0)
  scoreCorrect: number;  // Points for correct answer (default 10)
  scoreWrong: number;    // Penalty for wrong answer (default 5)
  winningScore: number;  // Winning score target (default 50, 0 = unlimited)
}

export type GameMode = 'solo' | 'battle';
export type InputMode = 'camera' | 'mouse';

export interface HandCursor {
  x: number;
  y: number;
  player: 1 | 2;
  isHovering?: boolean;
}

export interface BeeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface FloatingFeedback {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
  vy: number;
  icon?: string;
}
