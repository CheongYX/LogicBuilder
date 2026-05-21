import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { SHAPES } from '../constants';

export default function Modals() {
  const {
    contextMenu, setContextMenu, edgeContextMenu, setEdgeContextMenu,
    edgeLabelEdit, setEdgeLabelEdit, mergeModal, setMergeModal,
    takeSnapshot, setNodes, setEdges, edges, edgesLatest, nodesLatest
  } = useContext(AppContext);

  return (
    <>
      {contextMenu && (
        <div className="fixed bg-white/95 backdrop-blur-sm border border-slate-200 shadow-2xl rounded-xl p-2 z-50 animate-in fade-in zoom-in duration-100 flex flex-col gap-1 w-48" style={{ left: contextMenu.x, top: contextMenu.y }}>
          {Object.values(SHAPES).map(shape => (
            <button key={shape.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 rounded-lg text-left transition-colors group"
              onClick={() => { 
                takeSnapshot(); 
                setNodes(prev => prev.map(n => n.id === contextMenu.nodeId ? { ...n, shape: shape.id } : n)); 
                
                if (shape.id === 'DECISION') {
                   const hasOutEdges = edgesLatest.current.some(e => e.sourceId === contextMenu.nodeId);
                   if (!hasOutEdges) {
                       const node = nodesLatest.current.find(n => n.id === contextMenu.nodeId);
                       const yesId = 'node_yes_' + Date.now();
                       const noId = 'node_no_' + Date.now();
                       const newNodes = [
                           { id: yesId, text: '去执行...', position: { x: node.position.x - 90, y: node.position.y + 120 }, shape: 'PROCESS', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                           { id: noId, text: '放弃...', position: { x: node.position.x + 130, y: node.position.y + 120 }, shape: 'PROCESS', color: 'bg-rose-50 border-rose-200 text-rose-800' }
                       ];
                       const newEdges = [
                           { id: 'edge_yes_' + Date.now(), sourceId: node.id, targetId: yesId, sourcePort: 'bottom', targetPort: 'top', label: 'Yes', isDashed: false },
                           { id: 'edge_no_' + Date.now(), sourceId: node.id, targetId: noId, sourcePort: 'right', targetPort: 'top', label: 'No', isDashed: false }
                       ];
                       setNodes(prev => [...prev, ...newNodes]);
                       setEdges(prev => [...prev, ...newEdges]);
                   }
                }
                setContextMenu(null); 
              }}>
              <div className="bg-white p-1.5 rounded-md shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"><shape.icon className="w-4 h-4 text-indigo-500" /></div>
              <div className="flex flex-col"><span className="text-sm font-semibold text-slate-700">{shape.name}</span><span className="text-[10px] text-slate-400 font-normal leading-none">{shape.desc}</span></div>
            </button>
          ))}
        </div>
      )}

      {edgeContextMenu && (
        <div className="fixed bg-white/90 backdrop-blur border border-slate-200 shadow-2xl rounded-xl p-2 z-50 animate-in fade-in zoom-in duration-100 flex flex-col gap-1 w-40" style={{ left: edgeContextMenu.x, top: edgeContextMenu.y }}>
          <button className="px-3 py-2 hover:bg-slate-100 rounded-lg text-left text-sm font-medium text-slate-700" onClick={() => { 
             setEdgeLabelEdit({ id: edgeContextMenu.edgeId, label: edges.find(e=>e.id===edgeContextMenu.edgeId)?.label || "", x: edgeContextMenu.x, y: edgeContextMenu.y });
             setEdgeContextMenu(null); 
          }}>✍️ 编辑文字</button>
          <button className="px-3 py-2 hover:bg-slate-100 rounded-lg text-left text-sm font-medium text-slate-700" onClick={() => { takeSnapshot(); setEdges(prev => prev.map(e => e.id === edgeContextMenu.edgeId ? { ...e, isDashed: !e.isDashed } : e)); setEdgeContextMenu(null); }}>🔄 切换虚实线</button>
          <button className="px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg text-left text-sm font-medium" onClick={() => { takeSnapshot(); setEdges(prev => prev.filter(e => e.id !== edgeContextMenu.edgeId)); setEdgeContextMenu(null); }}>🗑️ 删除连线</button>
        </div>
      )}

      {edgeLabelEdit && (
        <div className="fixed bg-white shadow-2xl border border-slate-200 rounded-xl p-3 z-50 flex gap-2 items-center animate-in zoom-in-95" style={{ left: edgeLabelEdit.x, top: edgeLabelEdit.y }}>
          <input
            autoFocus
            className="px-3 py-1.5 border-2 border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 w-40 text-slate-700 font-medium"
            value={edgeLabelEdit.label}
            placeholder="输入线条文字..."
            onChange={e => setEdgeLabelEdit(prev => ({...prev, label: e.target.value}))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                 takeSnapshot();
                 setEdges(prev => prev.map(edge => edge.id === edgeLabelEdit.id ? { ...edge, label: edgeLabelEdit.label } : edge));
                 setEdgeLabelEdit(null);
              }
              if (e.key === 'Escape') setEdgeLabelEdit(null);
            }}
          />
          <button className="bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-600 shadow-sm"
            onClick={() => { takeSnapshot(); setEdges(prev => prev.map(edge => edge.id === edgeLabelEdit.id ? { ...edge, label: edgeLabelEdit.label } : edge)); setEdgeLabelEdit(null); }}>
            确定
          </button>
        </div>
      )}

      {mergeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">🔗 碰碰乐合并</h3>
             <p className="text-slate-600 mb-6 text-sm leading-relaxed">
               处理节点 <strong>[{mergeModal.source.text}]</strong> 与 <strong>[{mergeModal.target.text}]</strong> 的关系：
             </p>
             <div className="flex flex-col gap-3">
               <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
                 onClick={() => { takeSnapshot(); setEdges(prev => [...prev, { id: 'edge_' + Date.now(), sourceId: mergeModal.source.id, targetId: mergeModal.target.id, sourcePort: 'bottom', targetPort: 'top', label: '', isDashed: false }]); setMergeModal(null); }}>建立连接线</button>
               <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                 onClick={() => { takeSnapshot(); const newEdges = edgesLatest.current.map(e => { if(e.sourceId === mergeModal.source.id) return {...e, sourceId: mergeModal.target.id}; if(e.targetId === mergeModal.source.id) return {...e, targetId: mergeModal.target.id}; return e; }); setNodes(prev => prev.filter(n => n.id !== mergeModal.source.id)); setEdges(newEdges.filter((e, i, a) => a.findIndex(v => v.id === e.id) === i)); setMergeModal(null); }}>吸收 (转移线条，保留目标文字)</button>
               <button className="w-full py-2 text-slate-400 hover:text-slate-600 font-medium mt-2" onClick={() => setMergeModal(null)}>取消 (放回原位)</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}