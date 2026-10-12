import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  RotateCcw,
  Sliders,
  BookOpen,
  Gauge,
  Maximize2,
  Trophy,
  Volume2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Question, GameSettings } from '../types';
import { 
  exportToExcel, 
  exportToCSV, 
  downloadExcelTemplate, 
  parseExcelFile, 
  parsePastedText 
} from '../utils/excel';
import { DEFAULT_5_QUESTIONS, getDefault5Questions } from '../utils/presets';
import { soundFx } from '../utils/audio';

interface QuestionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSaveQuestions: (updated: Question[]) => void;
  settings: GameSettings;
  onUpdateSettings: (updated: GameSettings) => void;
}

export const QuestionManagerModal: React.FC<QuestionManagerModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSaveQuestions,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'scores' | 'settings' | 'import'>('questions');
  
  // Add new question form
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newAnswerText, setNewAnswerText] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');

  // Edit question state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editAnswerText, setEditAnswerText] = useState('');
  const [editOptA, setEditOptA] = useState('');
  const [editOptB, setEditOptB] = useState('');
  const [editOptC, setEditOptC] = useState('');
  const [editOptD, setEditOptD] = useState('');

  // Paste text state
  const [pastedContent, setPastedContent] = useState('');

  // Toast / notification feedback
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Add Question
  const handleAddQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newQuestionText.trim() || !newAnswerText.trim()) {
      showToast('Soal dan kunci jawaban tidak boleh kosong!', 'error');
      return;
    }

    const answer = newAnswerText.trim();
    // Options: A is the correct answer, B/C/D are choices or auto-generated if blank
    const opts: string[] = [
      answer,
      newOptB.trim() || (isNaN(Number(answer)) ? 'Pilihan 2' : String(Number(answer) + 1)),
      newOptC.trim() || (isNaN(Number(answer)) ? 'Pilihan 3' : String(Number(answer) - 1)),
      newOptD.trim() || (isNaN(Number(answer)) ? 'Pilihan 4' : String(Number(answer) + 2)),
    ];

    const newQ: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      question: newQuestionText.trim(),
      answer: answer,
      options: opts,
    };

    const updated = [...questions, newQ];
    onSaveQuestions(updated);
    setNewQuestionText('');
    setNewAnswerText('');
    setNewOptB('');
    setNewOptC('');
    setNewOptD('');
    showToast(`✅ Soal "${newQ.question}" berhasil ditambahkan!`);
  };

  // Start Edit
  const handleStartEdit = (q: Question) => {
    setEditingId(q.id);
    setEditQuestionText(q.question);
    setEditAnswerText(q.answer);

    const opts = q.options && q.options.length >= 4 
      ? q.options 
      : [q.answer, 'Pilihan B', 'Pilihan C', 'Pilihan D'];

    setEditOptA(opts[0] || q.answer);
    setEditOptB(opts[1] || '');
    setEditOptC(opts[2] || '');
    setEditOptD(opts[3] || '');
  };

  // Save Edit
  const handleSaveEdit = (id: string) => {
    if (!editQuestionText.trim() || !editAnswerText.trim()) {
      showToast('Soal dan kunci jawaban tidak boleh kosong!', 'error');
      return;
    }

    const answer = editAnswerText.trim();
    const opts = [
      editOptA.trim() || answer,
      editOptB.trim() || 'Pilihan B',
      editOptC.trim() || 'Pilihan C',
      editOptD.trim() || 'Pilihan D',
    ];

    // Ensure answer is in options
    if (!opts.includes(answer)) {
      opts[0] = answer;
    }

    const updated = questions.map(q => {
      if (q.id === id) {
        return {
          ...q,
          question: editQuestionText.trim(),
          answer: answer,
          options: opts,
        };
      }
      return q;
    });

    onSaveQuestions(updated);
    setEditingId(null);
    showToast('✅ Perubahan soal berhasil disimpan!');
  };

  // Delete Question
  const handleDeleteQuestion = (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    onSaveQuestions(updated);
    showToast('🗑️ Soal berhasil dihapus.');
  };

  // Reset to 5 Default Questions
  const handleResetToDefault = () => {
    const fresh = getDefault5Questions();
    onSaveQuestions(fresh);
    showToast('🔄 Berhasil mengembalikan ke 5 soal bawaan!');
  };

  // Handle File Upload Change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const result = parseExcelFile(buffer);

        if (result.questions.length === 0) {
          showToast('Tidak ada soal yang dapat dibaca dari file Excel tersebut.', 'error');
          return;
        }

        onSaveQuestions(result.questions);
        showToast(`🎉 Sukses mengimpor ${result.questions.length} soal dari Excel!`);
        setActiveTab('questions');
      } catch (err) {
        showToast('Gagal membaca file: ' + (err as Error).message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Paste Import
  const handleProcessPasted = () => {
    if (!pastedContent.trim()) {
      showToast('Tempelkan teks soal dari Excel terlebih dahulu!', 'error');
      return;
    }

    const parsed = parsePastedText(pastedContent);
    if (parsed.length === 0) {
      showToast('Format teks tidak cocok. Pastikan ada Soal dan Jawaban.', 'error');
      return;
    }

    onSaveQuestions(parsed);
    setPastedContent('');
    showToast(`✅ Berhasil mengimpor ${parsed.length} soal!`);
    setActiveTab('questions');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐝</span>
            <div>
              <h2 className="text-2xl font-black text-white font-heading tracking-wide">
                Pengaturan Game & Bank Soal
              </h2>
              <p className="text-amber-100/90 text-xs sm:text-sm font-semibold">
                Kelola soal pilihan ganda, aturan poin skor, serta ukuran & kecepatan lebah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-transform active:scale-95"
            title="Tutup Menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-4 font-bold text-sm rounded-t-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'questions'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-x-2 border-amber-400/60 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Daftar Soal & Pilihan Ganda ({questions.length})
          </button>
          
          <button
            onClick={() => setActiveTab('scores')}
            className={`py-3 px-4 font-bold text-sm rounded-t-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'scores'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-x-2 border-emerald-400/60 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Pengaturan Skor & Audio
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 font-bold text-sm rounded-t-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-sky-400 border-t-2 border-x-2 border-sky-400/60 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Ukuran & Kecepatan Lebah
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 font-bold text-sm rounded-t-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'import'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-x-2 border-purple-400/60 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Impor / Ekspor Excel
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className={`mx-6 mt-3 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
            toastMsg.type === 'success' 
              ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-300' 
              : 'bg-rose-950/90 border border-rose-500 text-rose-300'
          }`}>
            <span>{toastMsg.text}</span>
            <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: DAFTAR SOAL & PILIHAN GANDA */}
          {activeTab === 'questions' && (
            <div className="space-y-5">
              
              {/* Add New Question Row */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-md space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Tambah Soal & 4 Pilihan Ganda
                </div>
                
                <form onSubmit={handleAddQuestion} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-8">
                      <input
                        type="text"
                        placeholder="Pertanyaan / Soal (cth: 12 × 3 atau Berapa kaki semut?)"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Kunci Jawaban Benar (cth: 36)"
                        value={newAnswerText}
                        onChange={(e) => setNewAnswerText(e.target.value)}
                        className="w-full bg-slate-900 border border-emerald-500/80 rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  {/* 3 Distractor Options (Pilihan Pengecoh B, C, D) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Pilihan Salah 1 (cth: 32)"
                      value={newOptB}
                      onChange={(e) => setNewOptB(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      placeholder="Pilihan Salah 2 (cth: 38)"
                      value={newOptC}
                      onChange={(e) => setNewOptC(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      placeholder="Pilihan Salah 3 (cth: 40)"
                      value={newOptD}
                      onChange={(e) => setNewOptD(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-6 rounded-xl text-sm flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Simpan Soal Baru
                    </button>
                  </div>
                </form>
              </div>

              {/* Table of Questions */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-3 w-12 text-center">No</th>
                      <th className="py-3 px-4">Pertanyaan</th>
                      <th className="py-3 px-4">Kunci Jawaban</th>
                      <th className="py-3 px-4">Pilihan Ganda (4 Lebah)</th>
                      <th className="py-3 px-4 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {questions.map((q, idx) => {
                      const isEditing = editingId === q.id;
                      const opts = q.options && q.options.length >= 4 
                        ? q.options 
                        : [q.answer, 'Pilihan B', 'Pilihan C', 'Pilihan D'];

                      return (
                        <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">
                            {idx + 1}
                          </td>

                          {/* Question text */}
                          <td className="py-3 px-4 font-bold text-white">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editQuestionText}
                                onChange={(e) => setEditQuestionText(e.target.value)}
                                className="w-full bg-slate-900 border border-amber-400 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              <span>{q.question}</span>
                            )}
                          </td>

                          {/* Answer text */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editAnswerText}
                                onChange={(e) => setEditAnswerText(e.target.value)}
                                className="w-full bg-slate-900 border border-emerald-400 rounded-lg px-2.5 py-1 text-sm text-emerald-300 font-bold focus:outline-none"
                              />
                            ) : (
                              <span className="inline-block bg-emerald-400/10 text-emerald-300 font-mono font-bold px-3 py-1 rounded-lg border border-emerald-400/30">
                                ⭐ {q.answer}
                              </span>
                            )}
                          </td>

                          {/* Options display / edit */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <div className="grid grid-cols-2 gap-1.5 text-xs">
                                <input
                                  type="text"
                                  placeholder="Pilihan A"
                                  value={editOptA}
                                  onChange={(e) => setEditOptA(e.target.value)}
                                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white"
                                />
                                <input
                                  type="text"
                                  placeholder="Pilihan B"
                                  value={editOptB}
                                  onChange={(e) => setEditOptB(e.target.value)}
                                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white"
                                />
                                <input
                                  type="text"
                                  placeholder="Pilihan C"
                                  value={editOptC}
                                  onChange={(e) => setEditOptC(e.target.value)}
                                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white"
                                />
                                <input
                                  type="text"
                                  placeholder="Pilihan D"
                                  value={editOptD}
                                  onChange={(e) => setEditOptD(e.target.value)}
                                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {opts.map((opt, oIdx) => (
                                  <span
                                    key={oIdx}
                                    className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                                      opt === q.answer
                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 font-bold'
                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + oIdx)}. {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleSaveEdit(q.id)}
                                  className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg active:scale-95"
                                  title="Simpan"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg active:scale-95"
                                  title="Batal"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleStartEdit(q)}
                                  className="p-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 rounded-lg border border-slate-700 hover:border-amber-400/50 transition-colors"
                                  title="Edit Soal & Pilihan"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 hover:border-rose-500/50 transition-colors"
                                  title="Hapus Soal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Reset to 5 default questions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Total saat ini: <b className="text-amber-400">{questions.length} soal aktif</b>
                </span>
                <button
                  onClick={handleResetToDefault}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Kembalikan ke 5 Soal Bawaan
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: PENGATURAN SKOR & ANIMASI SUARA */}
          {activeTab === 'scores' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Poin Jawaban Benar */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Poin Jawaban Benar</h3>
                      <p className="text-xs text-slate-400">Tambahan skor saat lebah yang benar berhasil ditangkap</p>
                    </div>
                  </div>
                  <span className="bg-emerald-400/10 text-emerald-300 font-mono font-black text-base px-3 py-1 rounded-xl border border-emerald-400/30">
                    +{settings.scoreCorrect} Poin
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 15, 20, 50].map((val) => (
                    <button
                      key={val}
                      onClick={() => onUpdateSettings({ ...settings, scoreCorrect: val })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        settings.scoreCorrect === val
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pengurangan Jawaban Salah */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <span className="text-lg">💥</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Pengurangan Jawaban Salah</h3>
                      <p className="text-xs text-slate-400">Penalti pengurangan skor saat lebah salah ditangkap</p>
                    </div>
                  </div>
                  <span className="bg-rose-400/10 text-rose-300 font-mono font-black text-base px-3 py-1 rounded-xl border border-rose-400/30">
                    -{settings.scoreWrong} Poin
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[0, 2, 5, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => onUpdateSettings({ ...settings, scoreWrong: val })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        settings.scoreWrong === val
                          ? 'bg-rose-500 text-white font-black shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {val === 0 ? 'Tanpa Penalti (0)' : `-${val}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Skor Kemenangan */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Target Skor Kemenangan</h3>
                      <p className="text-xs text-slate-400">Skor untuk memenangkan ronde di mode solo atau battle duel</p>
                    </div>
                  </div>
                  <span className="bg-amber-400/10 text-amber-300 font-mono font-black text-base px-3 py-1 rounded-xl border border-amber-400/30">
                    {settings.winningScore === 0 ? 'Tanpa Batas' : `${settings.winningScore} Poin`}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '30 Poin', val: 30 },
                    { label: '50 Poin', val: 50 },
                    { label: '100 Poin', val: 100 },
                    { label: 'Bebas (∞)', val: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => onUpdateSettings({ ...settings, winningScore: preset.val })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        settings.winningScore === preset.val
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uji Animasi Suara (Audio Sound FX Tester) */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  Uji Coba Animasi Suara Game:
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      soundFx.playCorrect();
                      showToast('🌟 Memainkan efek suara Jawaban Benar!');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow active:scale-95"
                  >
                    🔊 Suara Benar
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playWrong();
                      showToast('💥 Memainkan efek suara Jawaban Salah!');
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow active:scale-95"
                  >
                    🔊 Suara Salah
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playVictory();
                      showToast('🏆 Memainkan efek suara Kemenangan!');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow active:scale-95"
                  >
                    🏆 Fanfare Menang
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PENGATURAN LEBAH (UKURAN & KECEPATAN) */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Ukuran Lebah */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Ukuran Lebah</h3>
                      <p className="text-xs text-slate-400">Atur besar kecilnya lebah di layar</p>
                    </div>
                  </div>
                  <span className="bg-amber-400/10 text-amber-300 font-mono font-bold text-sm px-3 py-1 rounded-xl border border-amber-400/30">
                    {Math.round(settings.beeSize * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Kecil', val: 0.7 },
                    { label: 'Normal', val: 1.0 },
                    { label: 'Besar', val: 1.3 },
                    { label: 'X-Besar', val: 1.6 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => onUpdateSettings({ ...settings, beeSize: preset.val })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        settings.beeSize === preset.val
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.6"
                    step="0.1"
                    value={settings.beeSize}
                    onChange={(e) => onUpdateSettings({ ...settings, beeSize: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-semibold">
                    <span>Lebah Kecil</span>
                    <span>Normal</span>
                    <span>Sangat Besar</span>
                  </div>
                </div>
              </div>

              {/* Kecepatan Terbang */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Kecepatan Terbang Lebah</h3>
                      <p className="text-xs text-slate-400">Atur seberapa cepat lebah melayang & terbang</p>
                    </div>
                  </div>
                  <span className="bg-sky-400/10 text-sky-300 font-mono font-bold text-sm px-3 py-1 rounded-xl border border-sky-400/30">
                    {Math.round(settings.beeSpeed * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Lambat', val: 0.6 },
                    { label: 'Normal', val: 1.0 },
                    { label: 'Cepat', val: 1.5 },
                    { label: 'Kilat', val: 2.0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => onUpdateSettings({ ...settings, beeSpeed: preset.val })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        settings.beeSpeed === preset.val
                          ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.beeSpeed}
                    onChange={(e) => onUpdateSettings({ ...settings, beeSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-semibold">
                    <span>Terbang Santai</span>
                    <span>Normal</span>
                    <span>Sangat Kilat</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: IMPOR / EKSPOR EXCEL */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              
              {/* Ekspor Section */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <Download className="w-5 h-5 text-amber-400" />
                  Ekspor Soal Pilihan Ganda ke File Excel / CSV
                </h3>
                <p className="text-slate-400 text-xs mb-4">
                  Unduh seluruh daftar soal lengkap dengan 4 pilihan ganda (Pilihan A, B, C, D) ke format spreadsheet.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      exportToExcel(questions);
                      showToast('📊 Berhasil mengunduh file Excel!');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Unduh File Excel (.xlsx)
                  </button>

                  <button
                    onClick={() => {
                      exportToCSV(questions);
                      showToast('📄 Berhasil mengunduh file CSV!');
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 active:scale-95"
                  >
                    Unduh File CSV (.csv)
                  </button>

                  <button
                    onClick={() => {
                      downloadExcelTemplate();
                      showToast('📥 Berhasil mengunduh Template Excel Pilihan Ganda!');
                    }}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 active:scale-95 ml-auto"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Template Excel Pilihan Ganda
                  </button>
                </div>
              </div>

              {/* Impor File Section */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  Impor dari File Excel (.xlsx / .csv)
                </h3>
                <p className="text-slate-400 text-xs mb-3">
                  Pilih file spreadsheet dari komputer Anda. Kolom: <b>Soal</b>, <b>Kunci Jawaban</b>, <b>Pilihan A</b>, <b>Pilihan B</b>, <b>Pilihan C</b>, <b>Pilihan D</b>.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-file-upload-input"
                />

                <label
                  htmlFor="excel-file-upload-input"
                  className="border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer text-center group transition-colors"
                >
                  <FileSpreadsheet className="w-10 h-10 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-white font-bold text-sm">
                    Klik di sini untuk Memilih File Excel (.xlsx / .csv)
                  </span>
                </label>
              </div>

              {/* Salin-Tempel Section */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-base font-bold text-white mb-1">
                  Atau Salin-Tempel (Copy-Paste) dari Excel
                </h3>
                <p className="text-slate-400 text-xs mb-3">
                  Blok baris soal di Excel, tekan Ctrl+C, lalu tempel di kotak berikut (format: Soal [Tab] Kunci [Tab] OptA [Tab] OptB...):
                </p>

                <textarea
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Contoh salin:&#10;7 + 5	12	10	11	12	14&#10;15 - 8	7	5	6	7	9"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />

                <button
                  onClick={handleProcessPasted}
                  className="mt-3 bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 shadow"
                >
                  Terapkan Soal dari Teks
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <div>Total Soal: <b className="text-amber-400">{questions.length}</b> • Skor: <b className="text-emerald-400">+{settings.scoreCorrect} / -{settings.scoreWrong}</b></div>
            <div className="text-[11px] text-amber-400/80 font-bold mt-0.5">Dibuat oleh : M. Nur Ali Abidin, S.Pd.</div>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2 rounded-xl text-sm shadow-md transition-transform active:scale-95 font-heading"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
