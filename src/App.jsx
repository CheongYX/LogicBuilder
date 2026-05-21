import React from 'react';
import { AppProvider } from './context/AppContext';
import LeftPanel from './components/LeftPanel';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import Modals from './components/Modals';

export default function App() {
  return (
    <AppProvider>
      <div className="flex w-full h-screen bg-slate-50 font-sans overflow-hidden select-none">
        <LeftPanel />
        <Canvas />
        <RightPanel />
        <Modals />
        
        {/* 全局自定义滚动条样式保留 */}
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .custom-scrollbar-dark::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
        `}} />
      </div>
    </AppProvider>
  );
}