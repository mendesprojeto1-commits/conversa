
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Category, DemoSite, Consultant, Acquisition } from '../types';
import { getSmartSearchResults } from '../services/geminiService';

const validateCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cleanCPF.substring(10, 11))) return false;
  return true;
};

const GalleryViewer: React.FC<{ 
  site: DemoSite, 
  onClose: () => void, 
  onSolicit: () => void 
}> = ({ site, onClose, onSolicit }) => {
  const images = useMemo(() => [site.mediaUrl, ...(site.galleryUrls || [])], [site]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  const handleNext = () => { setCurrentIndex((prev) => (prev + 1) % images.length); setZoom(1); };
  const handlePrev = () => { setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); setZoom(1); };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center animate-[fadeIn_0.3s]">
      <div className="absolute top-8 right-8 z-50">
        <button onClick={onClose} className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="relative w-full h-[65vh] flex items-center justify-center overflow-hidden">
        <button onClick={handlePrev} className="absolute left-6 z-40 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" stroke="currentColor"/></svg>
        </button>
        <img 
          src={images[currentIndex]} 
          className="max-w-[90%] max-h-[90%] object-contain transition-transform duration-500 shadow-2xl"
          style={{ transform: `scale(${zoom})` }}
          onClick={() => setZoom(zoom === 1 ? 2 : 1)}
        />
        <button onClick={handleNext} className="absolute right-6 z-40 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" stroke="currentColor"/></svg>
        </button>
      </div>

      <div className="mt-12 flex flex-col items-center gap-8 w-full max-w-xl px-6">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {images.map((img, idx) => (
            <button key={idx} onClick={() => { setCurrentIndex(idx); setZoom(1); }} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${idx === currentIndex ? 'border-[#bf953f]' : 'border-transparent opacity-50'}`}>
              <img src={img} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <button onClick={onSolicit} className="bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#bf953f] text-[#001226] font-black py-5 px-16 rounded-2xl uppercase tracking-[0.2em] hover:scale-105 transition-transform">
          Solicitar Desenvolvimento
        </button>
      </div>
    </div>
  );
};

const VerifiedBadge = () => (
  <div className="absolute bottom-2 right-2 translate-x-1/2 translate-y-1/2 z-30 animate-[pulse-gold_2s_infinite]">
    <svg className="w-12 h-12 md:w-16 md:h-16 drop-shadow-[0_0_20px_rgba(0,149,246,0.7)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 4.5L18 5L18.5 8.5L21 11L19.5 14L20 17.5L17 19L15 22L12 21L9 22L7 19L4 17.5L4.5 14L3 11L5.5 8.5L6 5L9.5 4.5L12 2Z" fill="#0095F6" />
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const ConsultantPage: React.FC<any> = ({ categories, sites, consultants, onAddAcquisition }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const infoRef = useRef<HTMLDivElement>(null);
  
  const consultant = consultants.find(c => c.id === id);
  const [searchQuery, setSearchQuery] = useState('');
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [selectedSite, setSelectedSite] = useState<DemoSite | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalSearch, setCategoryModalSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [filteredSiteIds, setFilteredSiteIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: '', phone: '', cpf: '' });

  const isFemale = useMemo(() => {
    if (!consultant) return false;
    const n = consultant.name.toLowerCase();
    return n.endsWith('a') || n.includes('iana') || n.includes('ina');
  }, [consultant]);

  useEffect(() => {
    let i = 0;
    const txt = "Busque o site perfeito...";
    const interval = setInterval(() => {
      setTypedPlaceholder(txt.slice(0, i));
      i = (i + 1) % (txt.length + 5);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (consultant) {
      setTimeout(() => {
        infoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 800);
    }
  }, [consultant]);

  const catFilteredSites = useMemo(() => selectedCatId ? sites.filter(s => s.categoryId === selectedCatId) : sites, [selectedCatId, sites]);

  const filteredModalCategories = useMemo(() => {
    if (!categoryModalSearch.trim()) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(categoryModalSearch.toLowerCase()));
  }, [categories, categoryModalSearch]);

  useEffect(() => {
    const fetch = async () => {
      if (!searchQuery.trim()) { setFilteredSiteIds(catFilteredSites.map(s => s.id)); return; }
      const ids = await getSmartSearchResults(searchQuery, catFilteredSites);
      setFilteredSiteIds(ids);
    };
    const t = setTimeout(fetch, 500);
    return () => clearTimeout(t);
  }, [searchQuery, catFilteredSites]);

  if (!consultant) return null;
  const displaySites = catFilteredSites.filter(s => filteredSiteIds.includes(s.id));

  return (
    <div className="min-h-screen bg-[#001226] font-['Inter'] text-white selection:bg-[#bf953f]/30">
      <style>{`
        @keyframes border-rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse-gold { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes lightning { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .aura { position: absolute; inset: -8px; border-radius: 50%; background: conic-gradient(from 0deg, transparent, #bf953f, #fcf6ba, transparent); animation: border-rotate 4s linear infinite; }
        .ray-text {
          background: linear-gradient(90deg, #bf953f, #fff, #bf953f, #fff, #bf953f);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: lightning 4s linear infinite;
        }
        .luxury-card { border: 1px solid #bf953f; background: #001a33; box-shadow: 0 0 20px rgba(191,149,63,0.1); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .luxury-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(191,149,63,0.2); border-color: #fcf6ba; }
        .luxury-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(191,149,63,0.3); padding: 1.25rem; border-radius: 0.75rem; width: 100%; outline: none; transition: all 0.3s; }
        .luxury-input:focus { border-color: #bf953f; background: rgba(255,255,255,0.1); }
      `}</style>

      <header className="pt-24 pb-44 px-6 flex flex-col items-center bg-royal-blue relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#bf953f] rounded-full blur-[150px]"></div>
        </div>

        <div className="relative group mb-16 scale-110 transition-transform duration-700 hover:scale-125">
          <div className="aura"></div>
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full relative z-10 border-4 border-[#bf953f] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-slate-900">
            <img 
              src={consultant.photoUrl} 
              className="w-full h-full object-cover" 
              style={{ objectPosition: consultant.photoPosition || '50% 50%' }}
            />
          </div>
          <VerifiedBadge />
        </div>

        <div ref={infoRef} className="text-center z-20 space-y-8 animate-[fadeIn_1s]">
          <h1 className="font-cinzel text-5xl md:text-8xl font-black mb-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight">
            {consultant.name}
          </h1>
          <div className="inline-block px-12 py-4 border-y border-[#bf953f]/40 bg-black/40 backdrop-blur-md rounded-lg">
            <span className="font-cinzel ray-text text-xl md:text-3xl font-bold tracking-[0.4em] uppercase">
              {isFemale ? 'Consultora' : 'Consultor'} Especialista
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-24 relative z-30">
        <div className="bg-[#001a33]/95 backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-14 border border-[#bf953f]/20 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col md:flex-row gap-6 mb-20">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder={typedPlaceholder}
                className="w-full bg-white text-[#001226] font-cormorant italic font-bold text-2xl px-10 py-7 rounded-2xl border-2 border-[#bf953f] outline-none shadow-2xl focus:shadow-[#bf953f]/20 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <svg className="w-8 h-8 text-[#bf953f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
            </div>
            <button onClick={() => setIsCategoryModalOpen(true)} className="px-14 py-7 bg-transparent border-2 border-[#bf953f] text-[#fcf6ba] font-cinzel font-black uppercase tracking-widest rounded-2xl hover:bg-[#bf953f] hover:text-[#001226] transition-all transform hover:scale-105 active:scale-95 shadow-xl">
              Coleções
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {displaySites.map(site => (
              <div key={site.id} className="luxury-card rounded-3xl overflow-hidden group flex flex-col">
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img 
                    src={site.mediaUrl} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    style={{ objectPosition: site.objectPosition || '50% 50%' }}
                  />
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg text-[10px] font-cinzel font-bold text-[#bf953f] border border-[#bf953f]/30">
                    {categories.find(c => c.id === site.categoryId)?.name}
                  </div>
                </div>
                <div className="p-10 flex-1 flex flex-col">
                  <h3 className="font-cinzel text-2xl font-bold mb-5 group-hover:text-[#fcf6ba] transition-colors">{site.title}</h3>
                  <p className="font-cormorant text-slate-400 text-lg mb-10 flex-1 italic line-clamp-3 leading-relaxed">{site.description}</p>
                  <div className="space-y-4">
                    <button onClick={() => { setSelectedSite(site); setIsModalOpen(true); }} className="w-full py-5 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#bf953f] text-[#001226] font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:brightness-110 hover:shadow-lg hover:shadow-[#bf953f]/30 transition-all">Solicitar Projeto</button>
                    <button onClick={() => { setSelectedSite(site); setIsGalleryOpen(true); }} className="w-full py-5 border border-[#bf953f]/40 text-[#fcf6ba] font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-[#bf953f]/10 transition-all">Galeria Detalhada</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {isGalleryOpen && selectedSite && <GalleryViewer site={selectedSite} onClose={() => setIsGalleryOpen(false)} onSolicit={() => { setIsGalleryOpen(false); setIsModalOpen(true); }} />}

      {/* Modal Solicitar Projeto */}
      {isModalOpen && selectedSite && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 animate-[fadeIn_0.3s]">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#001a33] w-full max-w-xl relative z-10 p-12 border border-[#bf953f]/30 rounded-[3rem] shadow-[0_0_100px_rgba(191,149,63,0.3)]">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-8 right-8 text-[#bf953f] hover:text-[#fcf6ba] hover:scale-110 transition-all z-20"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            
            <h2 className="font-cinzel text-4xl font-black ray-text text-center mb-10 uppercase tracking-tighter">Protocolo de Reserva</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#bf953f] uppercase tracking-widest ml-1">Seu Nome Completo</label>
                <input type="text" placeholder="Ex: João Silva" className="luxury-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#bf953f] uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                <div className="flex gap-3">
                  <input type="tel" placeholder="(00) 00000-0000" className="flex-1 luxury-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  <button 
                    onClick={() => { if(formData.phone) window.open(`https://wa.me/55${formData.phone.replace(/\D/g,'')}`, '_blank'); }}
                    title="Verificar se o número é válido"
                    className="p-5 bg-[#25D366] text-white rounded-xl hover:scale-110 transition-all shadow-lg flex items-center justify-center"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.14l-.905 3.307 3.385-.888c.828.45 1.485.657 2.263.658 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm3.28 8.135c-.145.408-.847.741-1.164.787-.317.045-.698.075-1.163-.074-.242-.077-.557-.19-1.203-.467-1.745-.749-2.874-2.533-2.961-2.647-.087-.115-.714-.95-.714-1.813 0-.863.453-1.288.614-1.46.161-.173.351-.215.468-.215.117 0 .234.001.336.006.106.005.249-.04.391.299.144.344.491 1.196.534 1.284.043.089.072.191.014.306-.058.115-.087.19-.174.288-.087.1-.184.223-.263.3-.087.086-.177.18-.076.353.101.173.448.74 0.96 1.196.659.585 1.215.767 1.388.854.173.086.274.072.375-.043.101-.115.432-.504.548-.677.116-.172.23-.144.389-.086.158.058 1.008.475 1.181.562.173.086.288.13.331.201.043.072.043.414-.102.822z"/></svg>
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#bf953f] uppercase tracking-widest ml-1">CPF Identificador</label>
                <input type="text" placeholder="000.000.000-00" className="luxury-input" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
              </div>
              
              <button onClick={async () => {
                if(!formData.name || !formData.phone || !validateCPF(formData.cpf)) { alert("Por favor, preencha todos os dados corretamente."); return; }
                await onAddAcquisition({ siteId: selectedSite.id, siteTitle: selectedSite.title, consultantId: consultant.id, clientName: formData.name, clientPhone: formData.phone, clientCpf: formData.cpf });
                alert("✨ Solicitação enviada com sucesso! Em breve entraremos em contato."); setIsModalOpen(false);
              }} className="w-full py-6 mt-6 bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-[#001226] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all">Formalizar Solicitação</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Coleções com Busca e Botão de Fechar */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="bg-[#001a33] w-full max-w-2xl relative z-10 p-12 border border-[#bf953f]/30 rounded-[2.5rem] shadow-2xl max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setIsCategoryModalOpen(false)} 
              className="absolute top-8 right-8 text-[#bf953f] hover:text-[#fcf6ba] hover:scale-110 transition-all z-20"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            
            <h2 className="font-cinzel text-3xl font-black text-[#bf953f] mb-10 uppercase tracking-widest text-center border-b border-[#bf953f]/20 pb-6">Acervos Disponíveis</h2>
            
            {/* Busca dentro do modal de Coleções */}
            <div className="mb-10 relative">
              <input 
                type="text" 
                placeholder="Filtrar categorias..."
                className="w-full bg-white/5 border border-[#bf953f]/30 px-6 py-4 rounded-xl outline-none focus:border-[#bf953f] text-white"
                value={categoryModalSearch}
                onChange={e => setCategoryModalSearch(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 scrollbar-hide flex-1">
              <button 
                onClick={() => { setSelectedCatId(null); setIsCategoryModalOpen(false); }} 
                className={`p-8 border rounded-2xl font-cinzel font-black uppercase text-sm tracking-widest transition-all ${!selectedCatId ? 'bg-[#bf953f] text-[#001226]' : 'border-[#bf953f]/20 text-white hover:border-[#bf953f]'}`}
              >
                Todos os Segmentos
              </button>
              {filteredModalCategories.map(c => (
                <button key={c.id} onClick={() => { setSelectedCatId(c.id); setIsCategoryModalOpen(false); }} className={`p-8 border rounded-2xl font-cinzel font-black uppercase text-sm tracking-widest transition-all ${selectedCatId === c.id ? 'bg-[#bf953f] text-[#001226]' : 'border-[#bf953f]/20 text-white hover:border-[#bf953f]'}`}>{c.name}</button>
              ))}
              {filteredModalCategories.length === 0 && (
                <div className="text-center py-10 opacity-30 italic">Nenhuma categoria encontrada...</div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-40 pb-20 text-center">
        <div className="w-24 h-px bg-[#bf953f]/30 mx-auto mb-10"></div>
        <p className="font-cinzel text-xs text-[#bf953f]/40 uppercase tracking-[1em]">TUPÃ EXCELLENCE • ROYAL INSTANCE</p>
      </footer>
    </div>
  );
};

export default ConsultantPage;
