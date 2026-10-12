import React, { useState } from 'react';
import { 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Instagram,
  Mail,
  MessageCircle
} from 'lucide-react';

interface ActivationModalProps {
  isOpen: boolean;
  onActivate: (code: string) => boolean;
  onEnterDemo: () => void;
  onClose?: () => void;
  canClose?: boolean;
}

const FULL_VERSION_CODE = 'TGLBH';

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onActivate,
  onEnterDemo,
  onClose,
  canClose = false,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMessage('Silakan ketik kode aktivasi terlebih dahulu.');
      return;
    }

    if (cleanCode === FULL_VERSION_CODE) {
      setIsSuccess(true);
      setErrorMessage('');
      setTimeout(() => {
        onActivate(cleanCode);
      }, 500);
    } else {
      setErrorMessage('Kode aktivasi salah! Tidak dapat masuk ke landing page/menu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-400/60 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-6 text-center text-white relative">
          {canClose && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors text-lg font-bold"
              title="Tutup"
            >
              ✕
            </button>
          )}
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
            🐝
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-wide">
            Game AR Tangkap Lebah
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm font-semibold mt-1">
            Aktivasi Akses Aplikasi
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="text-center text-slate-300 text-xs sm:text-sm leading-relaxed">
            Selamat datang! Masukkan <b>Kode Aktivasi</b> untuk membuka seluruh fitur versi penuh atau gunakan <b>Mode Demo (Gratis)</b>.
          </div>

          {/* Form Input Kode */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5" /> Masukkan Kode Aktivasi
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik kode aktivasi..."
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setErrorMessage('');
                  }}
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-lg font-mono font-black text-amber-300 tracking-widest text-center uppercase focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-950/90 border border-rose-500 text-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Kode aktivasi benar! Membuka Full Versi...</span>
              </div>
            )}

            {/* Tombol Aktivasi */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-base shadow-[0_5px_0_#b45309] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 font-heading"
            >
              <ShieldCheck className="w-5 h-5" />
              Aktifkan Full Versi
            </button>
          </form>

          {/* Mode Demo Button */}
          <div className="pt-2 border-t border-slate-800 text-center space-y-3">
            <button
              type="button"
              onClick={onEnterDemo}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Coba Mode Demo Gratis (1 Pemain Saja)
            </button>
          </div>

          {/* Perbandingan Fitur Ringkas */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-[11px] text-slate-400 space-y-2">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Perbedaan Akses:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                  ⭐ Full Versi
                </div>
                <ul className="space-y-0.5 text-slate-300">
                  <li>• Bebas main tanpa batas</li>
                  <li>• Mode 1 Pemain & 2 Pemain (Battle)</li>
                  <li>• Bebas Kamera (Mouse/Sentuh)</li>
                  <li>• Pengaturan Soal & Impor Excel</li>
                </ul>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="font-bold text-sky-300 mb-1 flex items-center gap-1">
                  🎮 Mode Demo
                </div>
                <ul className="space-y-0.5 text-slate-400">
                  <li>• Bebas main mode 1 Pemain</li>
                  <li>• Menu lainnya disembunyikan</li>
                  <li>• Masukkan kode untuk Full Versi</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Media Sosial & Informasi Kontak Pengembang */}
          <div className="bg-slate-950/80 border border-amber-400/40 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-amber-400" /> Kontak & Kode Aktivasi:
              </div>
              <span className="text-[10px] text-slate-400">Hubungi Pengembang</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Instagram */}
              <a
                href="https://instagram.com/aliabidin988"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-slate-850 border border-pink-500/30 hover:border-pink-500/70 p-2.5 rounded-xl flex items-center gap-2 text-pink-300 hover:text-pink-200 transition-all group"
                title="Instagram: @aliabidin988"
              >
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                  <Instagram className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[9px] text-slate-400 uppercase font-semibold leading-tight">Instagram</div>
                  <div className="font-bold text-xs truncate">@aliabidin988</div>
                </div>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@aliabidin98"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-slate-850 border border-cyan-500/30 hover:border-cyan-500/70 p-2.5 rounded-xl flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-all group"
                title="TikTok: @aliabidin98"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47V10.87a8.27 8.27 0 0 0 5.77 2.27V9.7a4.84 4.84 0 0 1-.001-3.01h.001z"/>
                  </svg>
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[9px] text-slate-400 uppercase font-semibold leading-tight">TikTok</div>
                  <div className="font-bold text-xs truncate">@aliabidin98</div>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:ali.abidin8@gmail.com"
                className="bg-slate-900 hover:bg-slate-850 border border-amber-500/30 hover:border-amber-500/70 p-2.5 rounded-xl flex items-center gap-2 text-amber-300 hover:text-amber-200 transition-all group"
                title="Email: ali.abidin8@gmail.com"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[9px] text-slate-400 uppercase font-semibold leading-tight">Email</div>
                  <div className="font-bold text-[11px] truncate">ali.abidin8@gmail.com</div>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-3.5 text-center flex flex-col items-center gap-1">
          <div className="text-xs text-amber-400 font-bold">
            Dibuat oleh : M. Nur Ali Abidin, S.Pd.
          </div>
          <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5">
            <span>Instagram: <span className="text-slate-300 font-semibold">@aliabidin988</span></span>
            <span>•</span>
            <span>TikTok: <span className="text-slate-300 font-semibold">@aliabidin98</span></span>
            <span>•</span>
            <span>Email: <span className="text-slate-300 font-semibold">ali.abidin8@gmail.com</span></span>
          </div>
        </div>

      </div>
    </div>
  );
};
