
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, DemoSite } from '../types';
import { getSmartSearchResults } from '../services/geminiService';

interface ShowcaseProps {
  categories: Category[];
  sites: DemoSite[];
}

const Showcase: React.FC<ShowcaseProps> = ({ categories, sites }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [filteredSiteIds, setFilteredSiteIds] = useState<string[]>(sites.map(s => s.id));
  const [isSearching, setIsSearching] = useState(false);

  // Filter based on category first
  const catFilteredSites = useMemo(() => {
    if (!selectedCatId) return sites;
    return sites.filter(s => s.categoryId === selectedCatId);
  }, [selectedCatId, sites]);

  // Handle Smart Search with AI
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setFilteredSiteIds(catFilteredSites.map(s => s.id));
        return;
      }
      
      setIsSearching(true);
      try {
        const ids = await getSmartSearchResults(searchQuery, catFilteredSites);
        setFilteredSiteIds(ids);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 600); // Debounce to save API calls

    return () => clearTimeout(timer);
  }, [searchQuery, catFilteredSites]);

  const displaySites = catFilteredSites.filter(s => filteredSiteIds.includes(s.id));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-blue-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-blue-50 rounded-full transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">TUPÃ</h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold -mt-1">Showcase de Projetos</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className={`w-5 h-5 ${isSearching ? 'animate-spin text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSearching ? (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                )}
              </svg>
            </div>
            <input
              type="text"
              placeholder="Pesquisa inteligente (corrige erros)..."
              className="block w-full pl-10 pr-3 py-2.5 border border-blue-100 rounded-2xl bg-blue-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-hide">
          <button
            onClick={() => setSelectedCatId(null)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition-all font-semibold ${!selectedCatId ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-y-[-2px]' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
          >
            Todos os Projetos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-6 py-2 rounded-full whitespace-nowrap transition-all font-semibold ${selectedCatId === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-y-[-2px]' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        {displaySites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displaySites.map(site => (
              <div key={site.id} className="group bg-white rounded-3xl overflow-hidden border border-blue-50 shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500">
                <div className="aspect-video relative overflow-hidden bg-gray-100">
                  {site.mediaType === 'video' ? (
                    <video 
                      src={site.mediaUrl} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      autoPlay 
                      muted 
                      loop 
                    />
                  ) : (
                    <img 
                      src={site.mediaUrl} 
                      alt={site.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  )}
                  <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px]">
                    <a
                      href={site.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-xl hover:bg-blue-50"
                    >
                      Explorar Demo
                    </a>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                      {categories.find(c => c.id === site.categoryId)?.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{site.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{site.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-blue-300">
            <div className="p-6 bg-blue-50 rounded-full mb-6">
              <svg className="w-20 h-20 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <p className="text-2xl font-bold text-gray-800">Nenhum projeto encontrado</p>
            <p className="text-gray-500 mt-2">A busca inteligente não encontrou correspondências em TUPÃ.</p>
            <button 
              onClick={() => {setSearchQuery(''); setSelectedCatId(null);}} 
              className="mt-8 text-blue-600 font-bold hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </main>
      
      <footer className="mt-20 py-10 border-t border-blue-50 text-center text-gray-400 text-sm">
        <p>&copy; 2025 TUPÃ Showcase. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Showcase;
