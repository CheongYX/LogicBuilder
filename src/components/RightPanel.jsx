import React, { useContext } from 'react';
import { Code2, Play } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { generatePseudocode } from '../utils/compiler';

export default function RightPanel() {
  const { nodes, edges } = useContext(AppContext);

  return (
    <div className="w-[340px] bg-[#1e1e1e] border-l border-[#333] shadow-2xl z-30 flex flex-col shrink-0 no-pan text-slate-300">
      <div className="p-4 bg-[#252526] border-b border-[#333] flex justify-between items-center">
        <h2 className="text-sm font-mono font-bold flex items-center gap-2 text-indigo-400"><Code2 className="w-4 h-4"/> 伪代码实时编译</h2>
        <Play className="w-4 h-4 text-emerald-500" />
      </div>
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar-dark font-mono text-[13px] leading-relaxed whitespace-pre">
        {generatePseudocode(nodes, edges)}
      </div>
    </div>
  );
}