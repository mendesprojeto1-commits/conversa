
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000814] p-6 text-white font-['Inter'] relative overflow-hidden">
      {/* Background Decorativo Animado */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-5xl w-full relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block mb-4 px-4 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
            Enterprise Intelligence
          </div>
          <h1 className="text-8xl md:text-9xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white via-white to-blue-500/50 bg-clip-text text-transparent">
            TUPÃ
          </h1>
          <p className="text-blue-200/40 text-xs font-medium uppercase tracking-[0.5em]">Sistema de Gestão & Demonstração Visual</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => navigate('/manager')}
            className="group relative bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[3.5rem] p-12 text-center hover:bg-white/[0.08] hover:border-blue-500/50 transition-all duration-700 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[3.5rem]"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
              </div>
              <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">Gestor</h2>
              <p className="text-blue-200/60 text-sm font-medium leading-relaxed px-4">Painel administrativo para controle de consultores, sites e leads de vendas.</p>
              <div className="mt-10 inline-flex items-center text-blue-500 font-black text-[10px] uppercase tracking-widest border-b border-blue-500/0 group-hover:border-blue-500/100 transition-all pb-1">
                Acessar Dashboard
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/showcase')}
            className="group relative bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[3.5rem] p-12 text-center hover:bg-white/[0.08] hover:border-cyan-400/50 transition-all duration-700 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[3.5rem]"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-cyan-600/20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">Sites</h2>
              <p className="text-cyan-200/60 text-sm font-medium leading-relaxed px-4">Exploração visual do catálogo completo de demonstrações de alta performance.</p>
              <div className="mt-10 inline-flex items-center text-cyan-400 font-black text-[10px] uppercase tracking-widest border-b border-cyan-400/0 group-hover:border-cyan-400/100 transition-all pb-1">
                Abrir Catálogo
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-20 text-center">
          <p className="text-white/10 text-[10px] font-bold uppercase tracking-[0.5em]">Tupã Enterprise © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
