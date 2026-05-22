import { Type, Square, Circle, Diamond, MessageSquare } from 'lucide-react';

export const SHAPES = {
  TERMINATOR: { id: 'TERMINATOR', name: '起止框', css: 'rounded-[50%]', icon: Circle, desc: 'Start/End' },
  PROCESS: { id: 'PROCESS', name: '处理框', css: 'rounded-none', icon: Square, desc: 'Action' },
  DECISION: { id: 'DECISION', name: '判断框', css: '', icon: Diamond, desc: 'Yes/No' },
  ANNOTATION: { id: 'ANNOTATION', name: '注释框', css: '', icon: MessageSquare, desc: 'Note' }
};

export const MACARON_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800', 'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-violet-50 border-violet-200 text-violet-800', 'bg-rose-50 border-rose-200 text-rose-800',
  'bg-amber-50 border-amber-200 text-amber-800', 'bg-cyan-50 border-cyan-200 text-cyan-800',
  'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800', 'bg-teal-50 border-teal-200 text-teal-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800', 'bg-orange-50 border-orange-200 text-orange-800',
];

export const TAILWIND_TO_HEX = {
  'blue': { fill: '#eff6ff', stroke: '#bfdbfe' },
  'emerald': { fill: '#ecfdf5', stroke: '#a7f3d0' },
  'violet': { fill: '#f5f3ff', stroke: '#ddd6fe' },
  'rose': { fill: '#fff1f2', stroke: '#fecdd3' },
  'amber': { fill: '#fffbeb', stroke: '#fde68a' },
  'cyan': { fill: '#ecfeff', stroke: '#a5f3fc' },
  'fuchsia': { fill: '#fdf4ff', stroke: '#f5d0fe' },
  'teal': { fill: '#f0fdfa', stroke: '#99f6e4' },
  'indigo': { fill: '#e0e7ff', stroke: '#c7d2fe' },
  'orange': { fill: '#fff7ed', stroke: '#fed7aa' },
};