import React from 'react';
import { X, Hand, Target, Swords, MousePointer, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐝</span>
            <div>
              <h3 className="text-2xl font-black text-white font-heading">
                Cara Bermain Game AR Tangkap Lebah
              </h3>
              <p className="text-amber-100 text-xs font-semibold">
                Panduan seru bermain dengan kamera AI atau mouse kursor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">1. Izinkan Akses Kamera</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Saat membuka game, klik tombol <b>Izinkan (Allow)</b> pada browser agar kecerdasan buatan MediaPipe dapat mendeteksi posisi ujung jari tanganmu secara langsung di layar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">2. Perhatikan Soal & Lebah Jawaban</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Lihat pertanyaan pada kotak di bagian atas layar. Lebah-lebah lucu akan beterbangan membawa papan jawaban. Cari lebah yang membawa kunci jawaban yang benar!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Hand className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">3. Arahkan Tangan Selama 1 Detik</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Arahkan ujung jarimu ke lebah yang ingin kamu tangkap. Lingkaran madu emas akan terisi mengitari lebah. Tahan selama 1 detik hingga penuh untuk menangkapnya!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">4. Mode 2 Pemain (Battle Duel)</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Layar akan dibagi menjadi sisi Kiri (Pemain 1) dan Kanan (Pemain 2). Siapa yang paling cepat menangkap lebah yang benar akan merebut poin!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <MousePointer className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">5. Cadangan Mouse / Touchscreen</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Jika laptop tidak memiliki kamera atau sedang tidak ingin mengaktifkan kamera, kamu bisa mengganti kontrol ke mode <b>Mouse / Sentuh</b> kapan saja!
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 font-heading"
          >
            <CheckCircle2 className="w-5 h-5" />
            Siap Bermain Sekarang!
          </button>
        </div>

      </div>
    </div>
  );
};
