export const getPortPos = (nodeId, port, isMouse = false, overridePos = null, nodes, mousePos) => {
  if (isMouse) return { x: mousePos.x, y: mousePos.y, dir: { x: 0, y: -1 } };
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return { x: 0, y: 0, dir: { x: 0, y: 0 } };
  
  let w = 120, h = 60;
  const el = document.getElementById(node.id);
  if (el) { w = el.offsetWidth; h = el.offsetHeight; }
  
  const pos = overridePos || node.position;
  const cx = pos.x + w / 2; const cy = pos.y + h / 2;
  
  if (port === 'top') return { x: cx, y: pos.y, dir: { x: 0, y: -1 } };
  if (port === 'bottom') return { x: cx, y: pos.y + h, dir: { x: 0, y: 1 } };
  if (port === 'left') return { x: pos.x, y: cy, dir: { x: -1, y: 0 } };
  if (port === 'right') return { x: pos.x + w, y: cy, dir: { x: 1, y: 0 } };
  return { x: cx, y: cy, dir: { x: 0, y: 0 } };
};

export const calculatePath = (edge, nodes, mousePos) => {
  const isTemp = !edge.targetId;
  const start = getPortPos(edge.sourceId, edge.sourcePort, false, null, nodes, mousePos);
  const end = getPortPos(isTemp ? 'mouse' : edge.targetId, edge.targetPort || 'top', isTemp, null, nodes, mousePos);

  if (edge.sourceId === edge.targetId) {
      const c1x = start.x + start.dir.x * 120; const c1y = start.y + start.dir.y * 120;
      const c2x = end.x + end.dir.x * 120; const c2y = end.y + end.dir.y * 120;
      return `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
  }

  const curveMod = 80;
  const c1x = start.x + start.dir.x * curveMod;
  const c1y = start.y + Math.abs(start.dir.y) * curveMod;
  const c2x = end.x + end.dir.x * curveMod;
  const c2y = end.y - Math.abs(end.dir.y) * curveMod;

  return `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
};