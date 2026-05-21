import React, { useContext } from 'react';
import { AlignCenter, Edit3, Trash2 } from 'lucide-react';
import { AppContext } from '../context/AppContext.jsx';
import { SHAPES, TAILWIND_TO_HEX } from '../constants.js';
import { calculatePath } from '../utils/geometry.js';

export default function Canvas() {
  const {
    nodes, setNodes, edges, setEdges,
    draggingNode, setDraggingNode, dragOffset, setDragOffset,
    drawingEdge, setDrawingEdge, mousePos,
    selectedNodes, setSelectedNodes, selectionBox,
    isSpaceDown, isPanning,
    canvasRef, wrapperRef, nodesLatest,
    takeSnapshot, deleteSelected, handleTextSelection,
    handleBackgroundMouseDown, handleMouseMove, handleMouseUp,
    editingNode, setEditingNode, setContextMenu, setEdgeContextMenu
  } = useContext(AppContext);

  return (
    <div 
      ref={wrapperRef}
      className={`flex-1 relative overflow-auto bg-[#f8fafc] custom-scrollbar ${isSpaceDown ? 'cursor-grab active:cursor-grabbing' : ''} ${isPanning ? 'cursor-grabbing' : ''} ${draggingNode ? 'select-none' : ''}`}
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onMouseDown={handleBackgroundMouseDown}
    >
      <div className="absolute top-0 left-0" style={{ width: '50000px', height: '50000px', backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} ref={canvasRef}>
        
        {selectionBox && (
            <div className="absolute border-[1.5px] border-indigo-500 bg-indigo-500/10 z-50 pointer-events-none"
                 style={{ left: Math.min(selectionBox.startX, selectionBox.currentX), top: Math.min(selectionBox.startY, selectionBox.currentY),
                          width: Math.abs(selectionBox.currentX - selectionBox.startX), height: Math.abs(selectionBox.currentY - selectionBox.startY) }} />
        )}

        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#64748b" /></marker>
            <marker id="arrowhead-dashed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" /></marker>
          </defs>
          {edges.map(edge => {
            const pathData = calculatePath(edge, nodesLatest.current, mousePos);
            const edgeId = `edge-path-${edge.id}`;
            const isTemp = !edge.targetId; 
            
            return (
              <g key={edge.id} className={`group ${isTemp ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'}`}>
                <path d={pathData} fill="none" stroke="transparent" strokeWidth="20" onContextMenu={(e) => { e.preventDefault(); setEdgeContextMenu({ edgeId: edge.id, x: e.clientX, y: e.clientY }); }} />
                <path id={edgeId} d={pathData} fill="none" stroke={edge.isDashed ? "#94a3b8" : "#64748b"} strokeWidth="2.5" strokeDasharray={edge.isDashed ? "6,4" : "none"} markerEnd={`url(#${edge.isDashed ? 'arrowhead-dashed' : 'arrowhead'})`} className="transition-all group-hover:stroke-indigo-500 group-hover:stroke-[3.5px]" />
                {edge.label && (
                  <text dy="-5" className="pointer-events-none"><textPath href={`#${edgeId}`} startOffset="50%" textAnchor="middle" fill="#4b5563" fontSize="13" fontWeight="bold">{edge.label}</textPath></text>
                )}
              </g>
            );
          })}
        </svg>

        {nodes.map(node => {
          const shapeDef = SHAPES[node.shape] || SHAPES.PROCESS;
          const isEditing = editingNode === node.id;
          const isSelected = selectedNodes.includes(node.id);
          const isAnnotation = node.shape === 'ANNOTATION';
          const isDecision = node.shape === 'DECISION';
          
          const colorKeyMatch = node.color.match(/bg-([a-z]+)-50/);
          const colorKey = colorKeyMatch ? colorKeyMatch[1] : 'blue';
          const diamondColors = TAILWIND_TO_HEX[colorKey] || TAILWIND_TO_HEX['blue'];
          
          const textClass = node.color.split(' ').find(c => c.startsWith('text-')) || 'text-slate-800';

          return (
            <div 
              key={node.id} id={node.id}
              className={`absolute group canvas-node transition-shadow flex items-center justify-center 
                          ${!isDecision && !isAnnotation ? 'shadow-md hover:shadow-xl' : ''}
                          ${isSelected ? 'ring-4 ring-indigo-400 ring-offset-2 scale-[1.02]' : ''}
                          ${isDecision ? textClass : ''}`}
              style={{ left: node.position.x, top: node.position.y, zIndex: (draggingNode === node.id || isSelected) ? 50 : 10, minWidth: '120px', minHeight: '60px' }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ nodeId: node.id, x: e.clientX, y: e.clientY }); }}
              onMouseUp={(e) => {
                if (drawingEdge || draggingNode) return; 
                // 💡 核心修复：这里删除了 e.stopPropagation(); 
                // 这样当你松开鼠标分词后，松手信号就能顺利传递给画布，让画布把所有的框选、拖动状态彻底清空！
                handleTextSelection(node); 
              }} 
            >
              {isDecision ? (
                 <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md group-hover:drop-shadow-xl" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polygon points="50,2 98,50 50,98 2,50" fill={diamondColors.fill} stroke={diamondColors.stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                 </svg>
              ) : isAnnotation ? (
                 <div className="absolute inset-0 border-2 border-dashed border-slate-500 bg-transparent rounded-lg pointer-events-none" />
              ) : (
                 <div className={`absolute inset-0 ${shapeDef.css} ${node.color} border-2 pointer-events-none`} />
              )}

              <div 
                className={`absolute -left-7 top-1/2 -translate-y-1/2 w-6 h-8 bg-slate-200 border border-slate-300 rounded cursor-grab active:cursor-grabbing flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 ${isSpaceDown ? 'pointer-events-none' : ''}`}
                onMouseDown={(e) => {
                  e.stopPropagation(); e.preventDefault(); takeSnapshot();
                  if (!selectedNodes.includes(node.id)) setSelectedNodes([node.id]);
                  setDraggingNode(node.id); setDragOffset({ x: e.clientX, y: e.clientY });
                }}
              ><AlignCenter className="w-4 h-4 text-slate-500 rotate-90" /></div>

              <div className="relative z-10 w-full h-full flex items-center justify-center p-4 px-6">
                {isEditing ? (
                  <div
                    className={`outline-none min-w-[50px] max-w-[300px] break-words whitespace-pre-wrap px-1 text-center border-b-2 border-indigo-400 ${isAnnotation ? 'text-slate-700' : ''}`}
                    contentEditable suppressContentEditableWarning autoFocus
                    onBlur={(e) => {
                      const newText = e.target.innerText.trim();
                      const currentNode = nodesLatest.current.find(n => n.id === node.id);
                      if (currentNode && currentNode.text !== newText) {
                        takeSnapshot(); setNodes(prev => prev.map(n => n.id === node.id ? { ...n, text: newText || "..." } : n));
                      }
                      setEditingNode(null);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur(); } e.stopPropagation(); }}
                  >{node.text}</div>
                ) : (
                  <span 
                    className={`max-w-[300px] break-words whitespace-pre-wrap select-text cursor-text text-center leading-snug tracking-wide text-sm font-semibold ${isAnnotation ? 'text-slate-700' : ''}`}
                    onMouseDown={e => e.stopPropagation()} 
                  >
                    {node.text}
                  </span>
                )}
              </div>

              {!isEditing && (
                <div className="absolute -top-4 -right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <button onClick={(e) => { e.stopPropagation(); setEditingNode(node.id); }} className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md"><Edit3 className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedNodes([node.id]); setTimeout(deleteSelected, 10); }} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"><Trash2 className="w-3 h-3" /></button>
                </div>
              )}

              {['top', 'right', 'bottom', 'left'].map(port => {
                const posClasses = { top: '-top-3 left-1/2 -translate-x-1/2', right: '-right-3 top-1/2 -translate-y-1/2', bottom: '-bottom-3 left-1/2 -translate-x-1/2', left: '-left-3 top-1/2 -translate-y-1/2' };
                return (
                  <div 
                    key={port} data-nodeid={node.id} data-port={port}
                    className={`connection-port absolute ${posClasses[port]} w-6 h-6 bg-transparent flex items-center justify-center cursor-crosshair group/port z-50`}
                    onMouseDown={(e) => {
                      e.stopPropagation(); e.preventDefault();
                      const newEdge = { id: 'edge_' + Date.now(), sourceId: node.id, sourcePort: port, targetId: null, label: '', isDashed: false };
                      setEdges(prev => [...prev, newEdge]); setDrawingEdge(newEdge);
                    }}
                  ><div className="w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 group-hover/port:scale-150 transition-all shadow-sm" /></div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}