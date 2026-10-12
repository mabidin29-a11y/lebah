import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface DemoLockoutScreenProps {
  onUnlock: (code: string) => boolean;
}

const FULL_VERSION_CODE = 'TGLBH';

export const DemoLockoutScreen: React.FC<DemoLockoutScreenProps> = ({ onUnlock }) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMsg('Silakan masukkan kode aktivasi.');
      return;
    }

    if (cleanCode === FULL_VERSION_CODE) {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        onUnlock(cleanCode);
      }, 500);
    } else {
      setErrorMsg('Kode aktivasi salah! Layar tetap terkunci.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center p-4 sm:p-8 animate-fadeIn select-none">
      <div className="max-w-md w-full bg-slate-950 border-2 border-red-500/70 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(239,68,68,0.25)] flex flex-col items-center text-center">
        
        {/* Lock Icon */}
        <div className="w-20 h-20 rounded-3xl bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400 mb-4 shadow-inner animate-pulse">
          <Lock className="w-10 h-10" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-red-400 font-heading tracking-wide mb-2">
          Waktu Demo Telah Habis
        </h2>

        {/* Description */}
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-semibold">
          Batas penggunaan <b>10 menit</b> telah selesai dan layar telah dikunci. Masukkan <b>Kode Aktivasi</b> untuk membuka Versi Penuh tanpa batas waktu dan menikmati seluruh fitur.
        </p>

        {/* Activation Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5" /> Masukkan Kode Aktivasi
            </label>
            <input
              type="text"
              placeholder="Ketik kode aktivasi..."
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              className="w-full bg-slate-900 border-2 border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-lg font-mono font-black text-amber-300 tracking-widest text-center uppercase focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="bg-red-950/90 border border-red-500 text-red-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Kode benar! Membuka layar dan Versi Penuh...</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-base shadow-[0_5px_0_#b45309] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 font-heading"
          >
            <ShieldCheck className="w-5 h-5" />
            Aktifkan Versi Penuh
          </button>
        </form>

        {/* Feature Unlocks Notice */}
        <div className="mt-6 pt-5 border-t border-slate-800 w-full text-[11px] text-slate-400 text-left space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Fitur Versi Penuh Terbuka:
          </div>
          <div className="text-slate-300">• Bebas main selamanya tanpa batas waktu 10 menit</div>
          <div className="text-slate-300">• Mode 2 Pemain (Battle Duel Kiri & Kanan)</div>
          <div className="text-slate-300">• Pengaturan Soal Lengkap & Impor/Ekspor Excel</div>
        </div>

        {/* Footer Creator Attribution */}
        <div className="mt-6 pt-4 border-t border-slate-900 w-full text-center">
          <div className="text-xs text-amber-400/90 font-bold">
            Dibuat oleh : M. Nur Ali Abidin, S.Pd.
          </div>
        </div>

      </div>
    </div>
  );
};
