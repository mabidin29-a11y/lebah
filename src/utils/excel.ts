import * as XLSX from 'xlsx';
import { Question } from '../types';

export interface ParseResult {
  questions: Question[];
  errors: string[];
  totalRows: number;
}

function cleanHeader(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parses uploaded Excel (.xlsx, .xls) or CSV file with multiple choice support
 */
export function parseExcelFile(data: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { questions: [], errors: ['File Excel tidak memiliki lembar kerja (sheet).'], totalRows: 0 };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const questions: Question[] = [];
  const errors: string[] = [];

  if (rawRows.length === 0) {
    const rawMatrix: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (rawMatrix.length > 0) {
      rawMatrix.forEach((row, idx) => {
        if (!Array.isArray(row) || row.length < 2) return;
        const qText = String(row[0] ?? '').trim();
        const aText = String(row[1] ?? '').trim();

        if (cleanHeader(qText).includes('soal') || cleanHeader(qText).includes('question')) return;

        if (qText && aText) {
          const customOptions: string[] = [];
          for (let c = 2; c <= 5; c++) {
            if (row[c] !== undefined && String(row[c]).trim() !== '') {
              customOptions.push(String(row[c]).trim());
            }
          }

          questions.push({
            id: 'imp_' + Date.now() + '_' + idx,
            question: qText,
            answer: aText,
            options: customOptions.length >= 2 ? customOptions : undefined,
          });
        }
      });
    }
  } else {
    rawRows.forEach((row, idx) => {
      let questionValue = '';
      let answerValue = '';
      const customOptions: string[] = [];

      const keys = Object.keys(row);
      for (const k of keys) {
        const cleaned = cleanHeader(k);
        const val = String(row[k] ?? '').trim();

        if (cleaned.includes('soal') || cleaned.includes('pertanyaan') || cleaned.includes('question') || cleaned.includes('tanya')) {
          questionValue = val;
        } else if (cleaned.includes('jawaban') || cleaned.includes('kunci') || cleaned.includes('answer') || cleaned.includes('jawab')) {
          answerValue = val;
        } else if (cleaned.includes('pilihana') || cleaned.includes('opt1') || cleaned.includes('opsia')) {
          if (val) customOptions[0] = val;
        } else if (cleaned.includes('pilihanb') || cleaned.includes('opt2') || cleaned.includes('opsib')) {
          if (val) customOptions[1] = val;
        } else if (cleaned.includes('pilihanc') || cleaned.includes('opt3') || cleaned.includes('opsic')) {
          if (val) customOptions[2] = val;
        } else if (cleaned.includes('pilihand') || cleaned.includes('opt4') || cleaned.includes('opsid')) {
          if (val) customOptions[3] = val;
        }
      }

      // Fallback: 1st and 2nd columns
      if (!questionValue && keys.length >= 2) {
        questionValue = String(row[keys[0]] ?? '').trim();
        answerValue = String(row[keys[1]] ?? '').trim();
      }

      // Fallback for remaining columns
      if (customOptions.filter(Boolean).length === 0 && keys.length >= 6) {
        for (let i = 2; i < 6; i++) {
          const val = String(row[keys[i]] ?? '').trim();
          if (val) customOptions.push(val);
        }
      }

      if (questionValue && answerValue) {
        // Ensure answer is in options if options are provided
        const finalOptions = customOptions.filter(Boolean);
        if (finalOptions.length >= 2 && !finalOptions.includes(answerValue)) {
          finalOptions[0] = answerValue;
        }

        questions.push({
          id: 'imp_' + Date.now() + '_' + idx,
          question: questionValue,
          answer: answerValue,
          options: finalOptions.length >= 2 ? finalOptions : undefined,
        });
      } else if (questionValue || answerValue) {
        errors.push(`Baris ${idx + 2}: Kolom soal atau jawaban tidak boleh kosong.`);
      }
    });
  }

  return {
    questions,
    errors,
    totalRows: rawRows.length || questions.length,
  };
}

/**
 * Parses raw clipboard text (TSV or CSV format)
 */
export function parsePastedText(text: string): Question[] {
  const lines = text.split(/\r?\n/);
  const result: Question[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let parts = trimmed.split('\t');
    if (parts.length < 2) parts = trimmed.split(';');
    if (parts.length < 2) parts = trimmed.split(',');

    if (parts.length >= 2) {
      const q = parts[0].trim();
      const a = parts[1].trim();

      const cleanQ = cleanHeader(q);
      if (cleanQ.includes('soal') || cleanQ.includes('pertanyaan')) return;

      const opts: string[] = [];
      for (let p = 2; p < parts.length && p < 6; p++) {
        if (parts[p]?.trim()) opts.push(parts[p].trim());
      }

      if (q && a) {
        result.push({
          id: 'paste_' + Date.now() + '_' + idx,
          question: q,
          answer: a,
          options: opts.length >= 2 ? opts : undefined,
        });
      }
    }
  });

  return result;
}

/**
 * Exports question list to an Excel (.xlsx) file with multiple choice columns
 */
export function exportToExcel(questions: Question[], filename = 'Soal_Game_AR_Tangkap_Lebah.xlsx') {
  const exportData = questions.map((q, index) => {
    const opts = q.options && q.options.length >= 4 
      ? q.options 
      : [q.answer, 'Pilihan B', 'Pilihan C', 'Pilihan D'];

    return {
      No: index + 1,
      'Soal / Pertanyaan': q.question,
      'Kunci Jawaban': q.answer,
      'Pilihan A': opts[0] || q.answer,
      'Pilihan B': opts[1] || '',
      'Pilihan C': opts[2] || '',
      'Pilihan D': opts[3] || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 30 }, // Soal
    { wch: 18 }, // Kunci
    { wch: 14 }, // A
    { wch: 14 }, // B
    { wch: 14 }, // C
    { wch: 14 }, // D
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Soal');
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports question list to a CSV file
 */
export function exportToCSV(questions: Question[], filename = 'Soal_Game_AR_Tangkap_Lebah.csv') {
  const exportData = questions.map((q, index) => {
    const opts = q.options && q.options.length >= 4 ? q.options : [q.answer, '', '', ''];
    return {
      No: index + 1,
      'Soal / Pertanyaan': q.question,
      'Kunci Jawaban': q.answer,
      'Pilihan A': opts[0] || q.answer,
      'Pilihan B': opts[1] || '',
      'Pilihan C': opts[2] || '',
      'Pilihan D': opts[3] || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a clean simple template with 4 multiple choices
 */
export function downloadExcelTemplate() {
  const sampleData = [
    { No: 1, 'Soal / Pertanyaan': '7 + 5', 'Kunci Jawaban': '12', 'Pilihan A': '10', 'Pilihan B': '11', 'Pilihan C': '12', 'Pilihan D': '14' },
    { No: 2, 'Soal / Pertanyaan': '15 - 8', 'Kunci Jawaban': '7', 'Pilihan A': '5', 'Pilihan B': '6', 'Pilihan C': '7', 'Pilihan D': '9' },
    { No: 3, 'Soal / Pertanyaan': '6 × 4', 'Kunci Jawaban': '24', 'Pilihan A': '18', 'Pilihan B': '20', 'Pilihan C': '24', 'Pilihan D': '28' },
    { No: 4, 'Soal / Pertanyaan': '36 ÷ 6', 'Kunci Jawaban': '6', 'Pilihan A': '4', 'Pilihan B': '5', 'Pilihan C': '6', 'Pilihan D': '8' },
    { No: 5, 'Soal / Pertanyaan': '9 + 8', 'Kunci Jawaban': '17', 'Pilihan A': '15', 'Pilihan B': '16', 'Pilihan C': '17', 'Pilihan D': '19' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Soal');
  XLSX.writeFile(workbook, 'Template_Soal_Game_AR_Tangkap_Lebah.xlsx');
}
