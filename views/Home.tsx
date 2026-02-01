
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-500 to-cyan-500 p-6 text-white">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black tracking-tighter mb-2">TUPÃ</h1>
          <p className="text-blue-100 text-xl font-medium">Gestão e Demonstração de Sites</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => navigate('/manager')}
            className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 text-left hover:bg-white/20 transition-all duration-300 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
              <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Gestor</h2>
            <p className="text-blue-50 text-lg">Crie e gerencie seus sites de demonstração e categorias de forma intuitiva.</p>
            <div className="mt-8 inline-flex items-center text-white font-semibold">
              Acessar Painel 
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </div>
          </button>

          <button
            onClick={() => navigate('/showcase')}
            className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 text-left hover:bg-white/20 transition-all duration-300 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
              <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Demonstração</h2>
            <p className="text-blue-50 text-lg">Explore os sites disponíveis com busca inteligente e filtros por categoria.</p>
            <div className="mt-8 inline-flex items-center text-white font-semibold">
              Ver Portfólio
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
