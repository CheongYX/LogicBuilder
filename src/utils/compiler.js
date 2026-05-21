export const generatePseudocode = (nodes, edges) => {
  if (nodes.length === 0) return "// 画布空空如也，在左侧输入文字开始吧！";
  let code = "// --- 自动生成的逻辑代码 ---\n\n";
  
  let inDegree = {};
  nodes.forEach(n => inDegree[n.id] = 0);
  edges.forEach(e => { if(inDegree[e.targetId] !== undefined) inDegree[e.targetId]++; });
  
  let roots = [];
  let unvisitedRoots = new Set(nodes.map(n => n.id));
  
  while(unvisitedRoots.size > 0) {
      let candidate = null;
      for (let nid of unvisitedRoots) {
          if (inDegree[nid] === 0) { candidate = nid; break; }
      }
      if (!candidate) {
          let minY = Infinity;
          for (let nid of unvisitedRoots) {
              const n = nodes.find(x => x.id === nid);
              if (n && n.position.y < minY) { minY = n.position.y; candidate = nid; }
          }
      }
      
      if (candidate) {
          roots.push(nodes.find(n => n.id === candidate));
          let q = [candidate];
          unvisitedRoots.delete(candidate);
          while(q.length > 0) {
              let curr = q.shift();
              edges.filter(e => e.sourceId === curr).forEach(e => {
                  if (unvisitedRoots.has(e.targetId)) { unvisitedRoots.delete(e.targetId); q.push(e.targetId); }
              });
              edges.filter(e => e.targetId === curr).forEach(e => {
                  if (unvisitedRoots.has(e.sourceId)) { unvisitedRoots.delete(e.sourceId); q.push(e.sourceId); }
              });
          }
      } else {
          break;
      }
  }
  
  roots.sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  let globalVisited = new Set();
  
  let backEdgeTargets = new Set();
  let dfsVis = new Set();
  let dfsPath = new Set();
  const findCycles = (nid) => {
      dfsVis.add(nid); dfsPath.add(nid);
      edges.filter(e => e.sourceId === nid).forEach(e => {
          if (dfsPath.has(e.targetId)) backEdgeTargets.add(e.targetId);
          else if (!dfsVis.has(e.targetId)) findCycles(e.targetId);
      });
      dfsPath.delete(nid);
  };
  roots.forEach(r => findCycles(r.id));

  const traverse = (nodeId, indentLvl) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return "";
      let indent = "  ".repeat(indentLvl);

      if (globalVisited.has(nodeId)) {
          return `${indent}continue; // 跳转回 -> [${node.text.substring(0, 10)}...]\n`;
      }
      globalVisited.add(nodeId);
      
      let str = "";
      let isLoopHeader = backEdgeTargets.has(nodeId);
      
      if (isLoopHeader) {
          str += `${indent}while (true) { // 循环起点: ${node.text}\n`;
          indentLvl++;
          indent = "  ".repeat(indentLvl);
      }

      const outEdges = edges.filter(e => e.sourceId === nodeId);
      outEdges.sort((a, b) => {
          let tA = nodes.find(n => n.id === a.targetId);
          let tB = nodes.find(n => n.id === b.targetId);
          return (tA ? tA.position.x : 0) - (tB ? tB.position.x : 0);
      });

      if (node.shape === 'ANNOTATION') {
           str += `${indent}/* 注释: ${node.text} */\n`;
           if (outEdges.length > 0) str += traverse(outEdges[0].targetId, indentLvl);
      } else if (node.shape === 'DECISION') {
           if (outEdges.length > 0) {
               for(let i = 0; i < outEdges.length; i++) {
                   let targetNode = nodes.find(n => n.id === outEdges[i].targetId);
                   let branchCondition = outEdges[i].label || (targetNode ? targetNode.text : `分支_${i+1}`);
                   let ifKeyword = i === 0 ? 'if' : 'else if';
                   
                   str += `${indent}${ifKeyword} (${node.text} => ${branchCondition}) {\n`;
                   str += traverse(outEdges[i].targetId, indentLvl + 1);
                   str += `${indent}}\n`;
               }
           } else {
               str += `${indent}if (${node.text}) { }\n`;
           }
      } else if (node.shape === 'TERMINATOR') {
           if (outEdges.length > 0) {
               str += `${indent}// 流程起点: ${node.text}\n`;
               str += traverse(outEdges[0].targetId, indentLvl);
               if (outEdges.length > 1) {
                   str += `${indent}// 并行分支\n`;
                   for(let i = 1; i < outEdges.length; i++) str += traverse(outEdges[i].targetId, indentLvl);
               }
           } else {
               str += `${indent}return "${node.text}";\n`;
           }
      } else {
           str += `${indent}执行("${node.text}");\n`;
           if (outEdges.length > 0) {
               str += traverse(outEdges[0].targetId, indentLvl);
               if (outEdges.length > 1) {
                   str += `${indent}// 并行分支\n`;
                   for(let i = 1; i < outEdges.length; i++) str += traverse(outEdges[i].targetId, indentLvl);
               }
           }
      }

      if (isLoopHeader) {
          indentLvl--;
          indent = "  ".repeat(indentLvl);
          str += `${indent}} // 循环体结束\n`;
      }
      return str;
  };

  roots.forEach((root, i) => {
      code += `function LogicFlow_${i+1}() {\n`;
      code += traverse(root.id, 1);
      code += `}\n\n`;
  });
  return code;
};