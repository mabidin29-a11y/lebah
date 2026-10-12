import { Question } from '../types';

export function getDefault5Questions(): Question[] {
  return [
    { 
      id: 'q1', 
      question: '7 + 5', 
      answer: '12', 
      options: ['10', '11', '12', '14'] 
    },
    { 
      id: 'q2', 
      question: '15 - 8', 
      answer: '7', 
      options: ['5', '6', '7', '9'] 
    },
    { 
      id: 'q3', 
      question: '6 × 4', 
      answer: '24', 
      options: ['18', '20', '24', '28'] 
    },
    { 
      id: 'q4', 
      question: '36 ÷ 6', 
      answer: '6', 
      options: ['4', '5', '6', '8'] 
    },
    { 
      id: 'q5', 
      question: '9 + 8', 
      answer: '17', 
      options: ['15', '16', '17', '19'] 
    },
  ];
}

export const DEFAULT_5_QUESTIONS: Question[] = getDefault5Questions();

export function generateRandomMathQuestion(): Question {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, ans: number;

  if (op === '+') {
    a = Math.floor(Math.random() * 20) + 2;
    b = Math.floor(Math.random() * 20) + 2;
    ans = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 25) + 8;
    b = Math.floor(Math.random() * a) + 1;
    ans = a - b;
  } else {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    ans = a * b;
  }

  // Generate 4 plausible choices
  const opts = [String(ans)];
  while (opts.length < 4) {
    let offset = Math.floor(Math.random() * 10) - 5;
    if (offset === 0) offset = opts.length + 1;
    const dummy = String(ans + offset);
    if (!opts.includes(dummy)) opts.push(dummy);
  }

  return {
    id: 'math_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    question: `${a} ${op} ${b}`,
    answer: String(ans),
    options: opts.sort(() => Math.random() - 0.5),
  };
}
