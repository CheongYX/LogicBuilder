import React, { useContext } from 'react';
import { Type, Diamond, Undo2, Redo2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export default function LeftPanel() {
  const { 
    textInput, setTextInput, generateInitialNode, 
    handleUndo, handleRedo, historyStep, history 
  } = useContext(AppContext);

  return (
    <div className="w-80 bg-white border-r border-slate-200 shadow-xl z-30 flex flex-col shrink-0 no-pan relative">
      <div className="p-6 bg-indigo-600 text-white shadow-md flex justify-between items-center relative z-10">
        <h1 className="text-lg font-bold flex items-center gap-2"><Diamond className="w-5 h-5"/> Logic Builder Sandbox</h1>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-2">
           <label className="text-sm font-semibold text-slate-600 flex items-center gap-2"><Type className="w-4 h-4"/> 场景描述区：</label>
           <textarea 
             className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none resize-none text-slate-700 bg-slate-50"
             rows="5" placeholder="如果电量小于30%，机器人停止当前任务，寻找最近的充电站..."
             value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.stopPropagation()}
           />
           <button onClick={generateInitialNode} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95">丢入画布</button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-3 shadow-inner">
           <p className="font-bold text-slate-700 mb-1"> 操作指南：</p>
           <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold">1.</span> 划选文字：分离出逻辑词块。</li>
           <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold">2.</span> 框选节点：拖拉批量移动。</li>
           <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold">3.</span> 空格+拖拉：无限平移地图。</li>
           <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold">4.</span> 蓝点拖拉：自由连线。</li>
           <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold">5.</span> Ctrl+A：智能排版与居中。</li>
        </div>
        
        <div className="flex gap-2 mt-auto">
          <button onClick={handleUndo} disabled={historyStep === 0} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-medium flex justify-center items-center gap-1 transition-colors"><Undo2 className="w-4 h-4"/> 撤销</button>
          <button onClick={handleRedo} disabled={historyStep === history.length - 1} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-medium flex justify-center items-center gap-1 transition-colors"><Redo2 className="w-4 h-4"/> 重做</button>
        </div>
      </div>
    </div>
  );
}