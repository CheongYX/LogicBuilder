import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import { getColorForText } from '../utils/colors.js';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [textInput, setTextInput] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [history, setHistory] = useState([{ nodes: [], edges: [] }]);
  const [historyStep, setHistoryStep] = useState(0);

  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [drawingEdge, setDrawingEdge] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panLastPos, setPanLastPos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState(null);
  const [edgeLabelEdit, setEdgeLabelEdit] = useState(null);
  const [mergeModal, setMergeModal] = useState(null);
  const [editingNode, setEditingNode] = useState(null);

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const nodesLatest = useRef(nodes);
  const edgesLatest = useRef(edges);

  useEffect(() => { nodesLatest.current = nodes; edgesLatest.current = edges; }, [nodes, edges]);

  useEffect(() => {
    if (wrapperRef.current) {
       wrapperRef.current.scrollLeft = 25000 - wrapperRef.current.clientWidth / 2;
       wrapperRef.current.scrollTop = 25000 - wrapperRef.current.clientHeight / 2;
    }
  }, []);

  const takeSnapshot = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push({ nodes: [...nodesLatest.current], edges: [...edgesLatest.current] });
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryStep(prev => Math.min(prev + 1, 50));
  }, [historyStep]);

  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      setHistoryStep(prev => prev - 1);
      setNodes(history[historyStep - 1].nodes);
      setEdges(history[historyStep - 1].edges);
      setSelectedNodes([]);
    }
  }, [historyStep, history]);

  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1) {
      setHistoryStep(prev => prev + 1);
      setNodes(history[historyStep + 1].nodes);
      setEdges(history[historyStep + 1].edges);
      setSelectedNodes([]);
    }
  }, [historyStep, history]);

  const deleteNode = useCallback((nodeIdToDelete) => {
    takeSnapshot();
    
    const inEdges = edgesLatest.current.filter(e => e.targetId === nodeIdToDelete);
    const outEdges = edgesLatest.current.filter(e => e.sourceId === nodeIdToDelete);
    let newEdges = edgesLatest.current.filter(e => e.sourceId !== nodeIdToDelete && e.targetId !== nodeIdToDelete);
    
    inEdges.forEach(inE => {
      outEdges.forEach(outE => {
        newEdges.push({
          id: 'edge_' + Date.now() + Math.random(),
          sourceId: inE.sourceId, targetId: outE.targetId,
          sourcePort: inE.sourcePort, targetPort: outE.targetPort,
          label: '', isDashed: false
        });
      });
    });

    const nodeToDelete = nodesLatest.current.find(n => n.id === nodeIdToDelete);
    let newNodes = nodesLatest.current.filter(n => n.id !== nodeIdToDelete);

    if (outEdges.length > 0 && nodeToDelete) {
      const queue = outEdges.map(e => e.targetId);
      const visited = new Set(queue);
      while(queue.length > 0) {
         const currentId = queue.shift();
         const nIdx = newNodes.findIndex(n => n.id === currentId);
         if (nIdx !== -1) {
            newNodes[nIdx] = { ...newNodes[nIdx], position: { ...newNodes[nIdx].position, y: newNodes[nIdx].position.y - 80 }};
            if (inEdges.length === 1) {
                const parent = newNodes.find(n => n.id === inEdges[0].sourceId);
                if (parent) {
                    const parentEl = document.getElementById(parent.id);
                    const myEl = document.getElementById(currentId);
                    const pW = parentEl ? parentEl.offsetWidth : 120;
                    const mW = myEl ? myEl.offsetWidth : 120;
                    newNodes[nIdx].position.x = parent.position.x + (pW/2) - (mW/2);
                }
            }
            edgesLatest.current.filter(e => e.sourceId === currentId).forEach(e => {
                if(!visited.has(e.targetId)) { visited.add(e.targetId); queue.push(e.targetId); }
            });
         }
      }
    }
    setEdges(newEdges);
    setNodes(newNodes);
  }, [takeSnapshot]);

  const deleteSelected = useCallback(() => {
    if (selectedNodes.length === 0) return;
    if (selectedNodes.length === 1) {
       deleteNode(selectedNodes[0]);
    } else {
       takeSnapshot();
       setEdges(prev => prev.filter(e => !selectedNodes.includes(e.sourceId) && !selectedNodes.includes(e.targetId)));
       setNodes(prev => prev.filter(n => !selectedNodes.includes(n.id)));
    }
    setSelectedNodes([]);
  }, [selectedNodes, deleteNode, takeSnapshot]);

  const handleAlignAll = useCallback(() => {
    takeSnapshot();
    const newNodes = nodesLatest.current.map(n => ({ ...n, position: { ...n.position } }));
    const newEdges = edgesLatest.current.map(e => ({ ...e }));
    
    const backEdgeIds = new Set();
    const visiting = new Set();
    const visitedNodes = new Set();

    const dfs = (nodeId) => {
      visiting.add(nodeId);
      newEdges.filter(e => e.sourceId === nodeId).forEach(e => {
        if (visiting.has(e.targetId)) backEdgeIds.add(e.id);
        else if (!visitedNodes.has(e.targetId)) dfs(e.targetId);
      });
      visiting.delete(nodeId);
      visitedNodes.add(nodeId);
    };

    newNodes.forEach(n => { if (!visitedNodes.has(n.id)) dfs(n.id); });

    let roots = newNodes.filter(n => !newEdges.some(e => e.targetId === n.id && !backEdgeIds.has(e.id)));
    if (roots.length === 0 && newNodes.length > 0) roots = [newNodes[0]];

    const getWidth = (nodeId) => { const el = document.getElementById(nodeId); return el ? el.offsetWidth : 120; };
    const getXCenter = (nodeId) => { const el = document.getElementById(nodeId); return el ? (newNodes.find(n=>n.id===nodeId).position.x + el.offsetWidth/2) : 0; };
    const subtreeWidths = {};

    const computeSubtree = (nodeId) => {
      if (subtreeWidths[nodeId] !== undefined) return subtreeWidths[nodeId];
      const children = newEdges.filter(e => e.sourceId === nodeId && !backEdgeIds.has(e.id)).map(e => e.targetId);
      if (children.length === 0) {
          subtreeWidths[nodeId] = getWidth(nodeId); return subtreeWidths[nodeId];
      }
      let totalW = 0;
      children.forEach((cid, idx) => {
          totalW += computeSubtree(cid);
          if (idx < children.length - 1) totalW += 60;
      });
      subtreeWidths[nodeId] = Math.max(getWidth(nodeId), totalW);
      return subtreeWidths[nodeId];
    };

    roots.forEach(r => computeSubtree(r.id));

    let currentRootX = 0;
    const startY = wrapperRef.current ? wrapperRef.current.scrollTop + 100 : 25000;
    const positioned = new Set();

    const positionNode = (nodeId, startX, y) => {
      if (positioned.has(nodeId)) return;
      positioned.add(nodeId);
      
      const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
      const myW = getWidth(nodeId);
      const groupW = subtreeWidths[nodeId];
      
      newNodes[nodeIndex].position = { x: startX + (groupW / 2) - (myW / 2), y: y };

      let children = newEdges.filter(e => e.sourceId === nodeId && !backEdgeIds.has(e.id)).map(e => e.targetId);
      children.sort((a, b) => getXCenter(a) - getXCenter(b));

      let childX = startX;
      children.forEach(cid => {
          positionNode(cid, childX, y + 140);
          childX += subtreeWidths[cid] + 60;
      });
    };

    roots.forEach(r => {
        positionNode(r.id, currentRootX, startY);
        currentRootX += subtreeWidths[r.id] + 100;
    });

    const totalWidth = currentRootX - 100;
    const shiftX = (wrapperRef.current ? (wrapperRef.current.scrollLeft + wrapperRef.current.clientWidth / 2) : 25000) - (totalWidth / 2);
    newNodes.forEach(n => { n.position.x += shiftX; });

    newEdges.forEach(edge => {
      if (backEdgeIds.has(edge.id)) {
        const sourceNode = newNodes.find(n => n.id === edge.sourceId);
        if (sourceNode) {
             const isLeftSide = sourceNode.position.x < (shiftX + totalWidth/2);
             edge.sourcePort = isLeftSide ? 'left' : 'right';
             edge.targetPort = isLeftSide ? 'left' : 'right';
        }
      } else {
        edge.sourcePort = 'bottom';
        edge.targetPort = 'top';
      }
    });

    setNodes(newNodes); setEdges(newEdges);
  }, [takeSnapshot]);

  const actionsRef = useRef({});
  useEffect(() => {
    actionsRef.current = { handleUndo, handleRedo, deleteSelected, handleAlignAll, setIsSpaceDown, setIsPanning };
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      
      if (e.code === 'Space') { e.preventDefault(); actionsRef.current.setIsSpaceDown(true); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); actionsRef.current.deleteSelected(); }
      
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'z' && !e.shiftKey) { e.preventDefault(); actionsRef.current.handleUndo(); }
        if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); actionsRef.current.handleRedo(); }
        if (key === 'a') { e.preventDefault(); actionsRef.current.handleAlignAll(); }
      }
    };
    
    const handleKeyUp = (e) => { 
      if (e.code === 'Space') { 
        actionsRef.current.setIsSpaceDown(false); 
        actionsRef.current.setIsPanning(false); 
      } 
    };
    
    window.addEventListener('keydown', handleKeyDown); 
    window.addEventListener('keyup', handleKeyUp);
    
    return () => { 
      window.removeEventListener('keydown', handleKeyDown); 
      window.removeEventListener('keyup', handleKeyUp); 
    };
  }, []);

  const generateInitialNode = () => {
    if (!textInput.trim()) return;
    takeSnapshot();
    const scrollX = wrapperRef.current ? wrapperRef.current.scrollLeft : 25000;
    const scrollY = wrapperRef.current ? wrapperRef.current.scrollTop : 25000;
    const windowWidth = wrapperRef.current ? wrapperRef.current.clientWidth : 800;
    const windowHeight = wrapperRef.current ? wrapperRef.current.clientHeight : 600;
    
    const textWidth = Math.min(300, Math.max(120, textInput.length * 16));
    
    const newNode = {
      id: 'node_' + Date.now(), text: textInput,
      position: { x: scrollX + windowWidth / 2 - (textWidth / 2), y: scrollY + windowHeight / 3 },
      shape: 'PROCESS', color: 'bg-white border-slate-300 text-slate-800'
    };
    setNodes(prev => [...prev, newNode]);
    setTextInput('');
  };

  const handleTextSelection = useCallback((sourceNode) => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (!text || editingNode === sourceNode.id) return;

    const fullText = sourceNode.text;
    const startIndex = fullText.indexOf(text);
    if (startIndex === -1) return;

    takeSnapshot();
    
    const prefix = fullText.substring(0, startIndex).trim();
    const suffix = fullText.substring(startIndex + text.length).trim();

    const parts = [];
    if (prefix) parts.push({ text: prefix, isSelected: false });
    parts.push({ text: text, isSelected: true });
    if (suffix) parts.push({ text: suffix, isSelected: false });

    const newNodes = [];
    const internalEdges = [];
    
    let currentX = sourceNode.position.x;
    const yPos = sourceNode.position.y;

    parts.forEach((part, index) => {
      const id = part.isSelected ? sourceNode.id : 'node_' + Date.now() + '_' + index;
      const widthGuess = Math.max(80, part.text.length * 16);
      
      newNodes.push({
        id,
        text: part.text, 
        position: { x: currentX, y: yPos },
        shape: sourceNode.shape,
        color: part.isSelected ? getColorForText(part.text) : 'bg-white border-slate-300 text-slate-800'
      });
      currentX += widthGuess + 40; 

      if (index > 0) {
        internalEdges.push({
          id: 'edge_' + Date.now() + '_' + index,
          sourceId: newNodes[index - 1].id,
          targetId: id,
          sourcePort: 'right', targetPort: 'left',
          label: '', isDashed: false
        });
      }
    });

    const finalEdges = [];
    edgesLatest.current.forEach(edge => {
      if (edge.sourceId === sourceNode.id) {
        finalEdges.push({ ...edge, sourceId: newNodes[newNodes.length - 1].id });
      } else if (edge.targetId === sourceNode.id) {
        finalEdges.push({ ...edge, targetId: newNodes[0].id });
      } else {
        finalEdges.push(edge);
      }
    });

    setNodes(prev => [...prev.filter(n => n.id !== sourceNode.id), ...newNodes]);
    setEdges([...finalEdges, ...internalEdges]);
    selection.removeAllRanges();
  }, [editingNode, takeSnapshot]);

  const handleBackgroundMouseDown = (e) => {
    if (e.target.closest('.no-pan') || e.target.closest('.connection-port') || e.target.closest('.canvas-node')) return;
    
    if (e.button === 1 || (e.button === 0 && isSpaceDown)) {
      e.preventDefault(); setIsPanning(true); setPanLastPos({ x: e.clientX, y: e.clientY }); return;
    }
    if (e.button === 0) {
       const rect = canvasRef.current.getBoundingClientRect();
       const x = e.clientX - rect.left; const y = e.clientY - rect.top;
       setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
       if (!e.shiftKey) setSelectedNodes([]);
       setContextMenu(null); setEdgeContextMenu(null); setEdgeLabelEdit(null);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      wrapperRef.current.scrollLeft -= (e.clientX - panLastPos.x);
      wrapperRef.current.scrollTop -= (e.clientY - panLastPos.y);
      setPanLastPos({ x: e.clientX, y: e.clientY });
      return;
    }

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasBounds.left; const y = e.clientY - canvasBounds.top;
    setMousePos({ x, y });

    if (selectionBox) {
       setSelectionBox(prev => ({ ...prev, currentX: x, currentY: y }));
       const boxL = Math.min(selectionBox.startX, x); const boxR = Math.max(selectionBox.startX, x);
       const boxT = Math.min(selectionBox.startY, y); const boxB = Math.max(selectionBox.startY, y);
       
       const newlySelected = [];
       nodesLatest.current.forEach(n => {
           const el = document.getElementById(n.id);
           const w = el ? el.offsetWidth : 120; const h = el ? el.offsetHeight : 60;
           if (!(n.position.x > boxR || n.position.x + w < boxL || n.position.y > boxB || n.position.y + h < boxT)) newlySelected.push(n.id);
       });
       setSelectedNodes(newlySelected); return;
    }

    if (draggingNode) {
      const dx = e.clientX - dragOffset.x; const dy = e.clientY - dragOffset.y;
      setNodes(prev => prev.map(n => selectedNodes.includes(n.id) ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } } : n));
      setDragOffset({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e) => {
    setIsPanning(false);
    if (selectionBox) setSelectionBox(null);

    if (draggingNode && selectedNodes.length === 1) {
      const dragged = nodesLatest.current.find(n => n.id === draggingNode);
      const el1 = document.getElementById(dragged.id);
      const r1 = { x: dragged.position.x, y: dragged.position.y, w: el1?.offsetWidth||120, h: el1?.offsetHeight||60 };
      
      const target = nodesLatest.current.find(n => {
        if (n.id === draggingNode) return false;
        const el2 = document.getElementById(n.id);
        const r2 = { x: n.position.x, y: n.position.y, w: el2?.offsetWidth||120, h: el2?.offsetHeight||60 };
        return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
      });

      if (target) { setMergeModal({ source: dragged, target }); handleUndo(); }
    }

    if (drawingEdge) {
      const targetEl = document.elementFromPoint(e.clientX, e.clientY);
      const portEl = targetEl?.closest('.connection-port');
      const nodeEl = targetEl?.closest('.canvas-node');

      if (portEl) {
        takeSnapshot();
        const targetId = portEl.getAttribute('data-nodeid');
        const targetPort = portEl.getAttribute('data-port');
        setEdges(prev => prev.map(edge => edge.id === drawingEdge.id ? { ...edge, targetId, targetPort } : edge));
      } else if (nodeEl) {
        takeSnapshot();
        const targetId = nodeEl.id;
        setEdges(prev => prev.map(edge => edge.id === drawingEdge.id ? { ...edge, targetId, targetPort: 'top' } : edge));
      } else {
        setEdges(prev => prev.filter(edge => edge.id !== drawingEdge.id));
      }
      setDrawingEdge(null);
    }
    setDraggingNode(null);
  };

  return (
    <AppContext.Provider value={{
        textInput, setTextInput, nodes, setNodes, edges, setEdges,
        history, setHistory, historyStep, setHistoryStep,
        draggingNode, setDraggingNode, dragOffset, setDragOffset,
        drawingEdge, setDrawingEdge, mousePos, setMousePos,
        selectedNodes, setSelectedNodes, selectionBox, setSelectionBox,
        isSpaceDown, setIsSpaceDown, isPanning, setIsPanning,
        panLastPos, setPanLastPos, contextMenu, setContextMenu,
        edgeContextMenu, setEdgeContextMenu, edgeLabelEdit, setEdgeLabelEdit,
        mergeModal, setMergeModal, editingNode, setEditingNode,
        canvasRef, wrapperRef, nodesLatest, edgesLatest,
        takeSnapshot, handleUndo, handleRedo, deleteNode, deleteSelected,
        handleAlignAll, generateInitialNode, handleTextSelection,
        handleBackgroundMouseDown, handleMouseMove, handleMouseUp
    }}>
        {children}
    </AppContext.Provider>
  );
};