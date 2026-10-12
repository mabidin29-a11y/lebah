import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Home, 
  Settings, 
  Camera, 
  MousePointer, 
  Trophy, 
  Flame,
  HelpCircle,
  Clock,
  KeyRound
} from 'lucide-react';
import { GameMode, InputMode } from '../types';

interface ScoreBoardProps {
  scoreP1: number;
  scoreP2: number;
  gameMode: GameMode;
  inputMode: InputMode;
  isMuted: boolean;
  questionText: string;
  categoryText?: string;
  licenseMode?: 'full' | 'demo';
  onToggleMute: () => void;
  onToggleInputMode: () => void;
  onOpenSettings: () => void;
  onOpenHowTo: () => void;
  onExitGame: () => void;
  onOpenActivation?: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  scoreP1,
  scoreP2,
  gameMode,
  inputMode,
  isMuted,
  questionText,
  categoryText,
  licenseMode = 'full',
  onToggleMute,
  onToggleInputMode,
  onOpenSettings,
  onOpenHowTo,
  onExitGame,
  onOpenActivation,
}) => {
  return (
    <div className="absolute top-0 left-0 w-full p-3 sm:p-5 pointer-events-none z-30 flex flex-col justify-between h-full">
      
      {/* Top Header Row */}
      <div className="flex items-start justify-between w-full gap-2 relative">
        
        {/* Left Side: Score P1 & Menu Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Exit Home Button */}
          <button
            onClick={onExitGame}
            className="w-11 h-11 bg-slate-900/90 hover:bg-slate-800 text-white rounded-2xl border-2 border-slate-700 flex items-center justify-center shadow-lg transition-transform active:scale-95"
            title="Kembali ke Menu Utama"
          >
            <Home className="w-5 h-5 text-amber-400" />
          </button>

          {/* Score P1 Card */}
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl px-4 py-2 shadow-2xl flex items-center gap-3 border-2 border-sky-400">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black text-sky-400 uppercase tracking-wider">
                {gameMode === 'battle' ? 'Pemain 1' : 'Skor Anda'}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-heading leading-tight">
                {scoreP1}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Current Question Card */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-auto max-w-[90vw] sm:max-w-xl w-full flex flex-col items-center">
          {licenseMode === 'demo' && onOpenActivation && (
            <button
              onClick={onOpenActivation}
              className="mb-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 px-3 py-0.5 rounded-full text-[11px] font-bold shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
              title="Klik untuk membuka Full Versi"
            >
              <span>Mode Demo</span>
              <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-black ml-1 flex items-center gap-0.5">
                <KeyRound className="w-2.5 h-2.5" /> Aktivasi
              </span>
            </button>
          )}

          <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl px-5 py-3 sm:px-8 sm:py-3.5 shadow-2xl border-b-4 border-amber-400 text-center border border-slate-700/80 transform hover:scale-[1.02] transition-transform w-full sm:w-auto">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                {categoryText || 'SOAL MATEMATIKA'}
              </span>
            </div>
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-heading tracking-wide drop-shadow-md">
              {questionText || 'Memuat Soal...'}
            </div>
          </div>
        </div>

        {/* Right Side: Score P2 (in battle mode) & Utilities */}
        <div className="flex items-center gap-2 pointer-events-auto ml-auto">
          {gameMode === 'battle' && (
            <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl px-4 py-2 shadow-2xl flex items-center gap-3 border-2 border-rose-400 mr-2">
              <div>
                <div className="text-[10px] font-black text-rose-400 uppercase tracking-wider text-right">
                  Pemain 2
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-heading leading-tight text-right">
                  {scoreP2}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* Input Mode Toggle (Camera <-> Mouse) - Only in Full Version or if solo */}
          <button
            onClick={onToggleInputMode}
            className={`h-11 px-3 rounded-2xl border-2 flex items-center gap-1.5 shadow-lg text-xs font-bold transition-transform active:scale-95 ${
              inputMode === 'camera'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                : 'bg-purple-950/80 text-purple-300 border-purple-500/60'
            }`}
            title="Ubah Mode Kontrol (Kamera / Mouse)"
          >
            {inputMode === 'camera' ? (
              <>
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">Kamera AI</span>
              </>
            ) : (
              <>
                <MousePointer className="w-4 h-4 text-purple-400" />
                <span className="hidden md:inline">Mouse / Sentuh</span>
              </>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="w-11 h-11 bg-slate-900/90 hover:bg-slate-800 text-white rounded-2xl border-2 border-slate-700 flex items-center justify-center shadow-lg transition-transform active:scale-95"
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>

          {/* Settings / Bank Soal Button (HIDDEN in demo mode as requested) */}
          {licenseMode === 'full' && (
            <button
              onClick={onOpenSettings}
              className="w-11 h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-bold flex items-center justify-center shadow-lg transition-transform active:scale-95"
              title="Pengaturan & Bank Soal"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* How to Play Button */}
          <button
            onClick={onOpenHowTo}
            className="w-11 h-11 bg-slate-900/90 hover:bg-slate-800 text-slate-300 rounded-2xl border-2 border-slate-700 flex items-center justify-center shadow-lg transition-transform active:scale-95 hidden sm:flex"
            title="Cara Bermain"
          >
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </button>
        </div>

      </div>

      {/* Bottom Hint Banner */}
      <div className="self-center pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-full px-5 py-2 text-white text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2 mb-2 animate-bounce">
        <span className="text-base">🐝</span>
        <span>
          {inputMode === 'camera'
            ? 'Arahkan tanganmu ke lebah dengan jawaban yang benar!'
            : 'Arahkan kursor mouse / sentuh lebah dengan jawaban yang benar!'}
        </span>
      </div>

    </div>
  );
};
