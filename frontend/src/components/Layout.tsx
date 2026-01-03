
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Layers, Activity, Cpu, Settings, LogOut, ChevronRight, HardDrive, Database
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItemClass = (path: string) => {
    const isActive = router.pathname.startsWith(path);
    return `w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden group ${
      isActive 
      ? `bg-slate-800/80 text-white border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]` 
      : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col pt-[30px] md:pt-0 z-50">
        {/* Header */}
        <div className="relative h-24 flex items-center px-6 border-b border-slate-800/50 group select-none">
          <div className="flex items-center cursor-pointer w-full" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="relative mr-4 transition-transform duration-500 group-hover:scale-105">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                {/* Placeholder Logo */}
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Database className="text-white w-6 h-6" />
                </div>
            </div>
            <div className="flex-1">
              <h1 className="leading-none text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400">
                  LoRAForge
              </h1>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-200">
                  STUDIO
              </span>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-90 text-indigo-400' : ''}`} />
          </div>

           {/* Settings Dropdown */}
           {isMenuOpen && (
            <div className="absolute top-20 left-4 right-4 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="p-2 space-y-1">
                   <button className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                       <Settings className="w-4 h-4 mr-3 text-amber-400" />
                       Configuration
                   </button>
                   <div className="h-px bg-slate-800 my-1 mx-2"></div>
                   <button className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                       <LogOut className="w-4 h-4 mr-3" />
                       Logout
                   </button>
                </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
            <Link href="/datasets" className={navItemClass('/datasets')}>
                {router.pathname.startsWith('/datasets') && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_#10b981]"></div>}
                <Layers className={`w-5 h-5 mr-3 transition-colors ${router.pathname.startsWith('/datasets') ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-slate-500 group-hover:text-emerald-300'}`} />
                <span className="tracking-wide">Datasets</span>
            </Link>

            <Link href="/insights" className={navItemClass('/insights')}>
                {router.pathname.startsWith('/insights') && <div className="absolute left-0 top-0 bottom-0 w-1 bg-fuchsia-500 rounded-r-full shadow-[0_0_10px_#d946ef]"></div>}
                <Activity className={`w-5 h-5 mr-3 transition-colors ${router.pathname.startsWith('/insights') ? 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]' : 'text-slate-500 group-hover:text-fuchsia-300'}`} />
                <span className="tracking-wide">Insights</span>
            </Link>

            <Link href="/tools" className={navItemClass('/tools')}>
                {router.pathname.startsWith('/tools') && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-r-full shadow-[0_0_10px_#06b6d4]"></div>}
                <Cpu className={`w-5 h-5 mr-3 transition-colors ${router.pathname.startsWith('/tools') ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'text-slate-500 group-hover:text-cyan-300'}`} />
                <span className="tracking-wide">Utilities</span>
            </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50 bg-black/20">
             <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center text-[10px] text-slate-600 gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]"></div>
                   <span>Backend Connected</span>
                </div>
                <span className="text-[10px] text-slate-700 font-mono">v2.0.0</span>
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0b0e14] pt-[30px] md:pt-0 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col h-full overflow-hidden">
            {children}
        </div>
      </main>
    </div>
  );
};
