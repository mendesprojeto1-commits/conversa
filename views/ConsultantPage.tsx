
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
  const [offset, setOffset] = useState({ x: 0, y: 0 });

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
    <svg className="w-12 h-12 md:w-16 md:h-16 drop-shadow-[0_0_15px_rgba(0,149,246,0.6)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 4.5L18 5L18.5 8.5L21 11L19.5 14L20 17.5L17 19L15 22L12 21L9 22L7 19L4 17.5L4.5 14L3 11L5.5 8.5L6 5L9.5 4.5L12 2Z" fill="#0095F6" />
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const ConsultantPage: React.FC<any> = ({ categories, sites, consultants, onAddAcquisition }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const consultant = consultants.find(c => c.id === id);
  const [searchQuery, setSearchQuery] = useState('');
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [selectedSite, setSelectedSite] = useState<DemoSite | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
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
    const txt = "Digite seu interesse";
    const interval = setInterval(() => {
      setTypedPlaceholder(txt.slice(0, i));
      i = (i + 1) % (txt.length + 5);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const catFilteredSites = useMemo(() => selectedCatId ? sites.filter(s => s.categoryId === selectedCatId) : sites, [selectedCatId, sites]);

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
    <div className="min-h-screen bg-[#001226] font-['Inter'] text-white">
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
        .luxury-card { border: 1px solid #bf953f; background: #001a33; box-shadow: 0 0 20px rgba(191,149,63,0.1); }
      `}</style>

      <header className="pt-24 pb-40 px-6 flex flex-col items-center bg-royal-blue relative overflow-hidden">
        <div className="relative group mb-12">
          <div className="aura"></div>
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full relative z-10 border-4 border-[#bf953f] overflow-hidden shadow-2xl">
            <img src={consultant.photoUrl} className="w-full h-full object-cover" />
          </div>
          <VerifiedBadge />
        </div>

        <div className="text-center z-20">
          <h1 className="font-cinzel text-5xl md:text-8xl font-black mb-6 drop-shadow-lg tracking-tight">{consultant.name}</h1>
          <div className="inline-block px-12 py-3 border-y border-[#bf953f]/40 bg-black/30 backdrop-blur-sm">
            <span className="font-cinzel ray-text text-xl md:text-3xl font-bold tracking-[0.4em] uppercase">
              {isFemale ? 'Consultora' : 'Consultor'} Especialista
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-20 relative z-30">
        <div className="bg-[#001a33]/90 backdrop-blur-3xl rounded-[3rem] p-10 border border-[#bf953f]/20 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-6 mb-16">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder={typedPlaceholder}
                className="w-full bg-white text-blue-950 font-cormorant italic font-bold text-2xl px-10 py-6 rounded-2xl border-2 border-[#bf953f] outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={() => setIsCategoryModalOpen(true)} className="px-12 py-6 bg-transparent border-2 border-[#bf953f] text-[#fcf6ba] font-cinzel font-black uppercase tracking-widest rounded-2xl hover:bg-[#bf953f] hover:text-[#001226] transition-all">Coleções</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {displaySites.map(site => (
              <div key={site.id} className="luxury-card rounded-3xl overflow-hidden group flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <img src={site.mediaUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded text-[10px] font-cinzel text-[#bf953f]">{categories.find(c => c.id === site.categoryId)?.name}</div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="font-cinzel text-xl font-bold mb-4">{site.title}</h3>
                  <p className="font-cormorant text-slate-400 mb-8 flex-1 italic">{site.description}</p>
                  <div className="space-y-3">
                    <button onClick={() => { setSelectedSite(site); setIsModalOpen(true); }} className="w-full py-4 bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-black font-black uppercase text-xs rounded-xl hover:brightness-110 transition-all">Solicitar Projeto</button>
                    <button onClick={() => { setSelectedSite(site); setIsGalleryOpen(true); }} className="w-full py-4 border border-[#bf953f] text-[#fcf6ba] font-black uppercase text-xs rounded-xl hover:bg-[#bf953f]/10">Galeria de Imagens</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {isGalleryOpen && selectedSite && <GalleryViewer site={selectedSite} onClose={() => setIsGalleryOpen(false)} onSolicit={() => { setIsGalleryOpen(false); setIsModalOpen(true); }} />}

      {isModalOpen && selectedSite && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 animate-[fadeIn_0.3s]">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#001a33] w-full max-w-xl relative z-10 p-12 border border-[#bf953f]/30 rounded-[2.5rem] shadow-2xl">
            <h2 className="font-cinzel text-3xl font-black ray-text text-center mb-8 uppercase">Solicitar Projeto</h2>
            <div className="space-y-6">
              <input type="text" placeholder="Seu Nome" className="w-full bg-white/5 border border-[#bf953f]/30 p-5 rounded-xl outline-none focus:border-[#bf953f]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="tel" placeholder="Seu WhatsApp" className="w-full bg-white/5 border border-[#bf953f]/30 p-5 rounded-xl outline-none focus:border-[#bf953f]" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input type="text" placeholder="Seu CPF" className="w-full bg-white/5 border border-[#bf953f]/30 p-5 rounded-xl outline-none focus:border-[#bf953f]" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
              <button onClick={async () => {
                if(!formData.name || !formData.phone || !validateCPF(formData.cpf)) { alert("Dados inválidos"); return; }
                await onAddAcquisition({ siteId: selectedSite.id, siteTitle: selectedSite.title, consultantId: consultant.id, clientName: formData.name, clientPhone: formData.phone, clientCpf: formData.cpf });
                alert("✨ Projeto solicitado!"); setIsModalOpen(false);
              }} className="w-full py-5 bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-black font-black uppercase rounded-xl">Confirmar Solicitação</button>
            </div>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="bg-[#001a33] w-full max-w-2xl relative z-10 p-10 border border-[#bf953f]/30 rounded-[2rem] max-h-[80vh] overflow-y-auto">
            <h2 className="font-cinzel text-2xl font-black text-[#bf953f] mb-8 uppercase tracking-widest text-center">Coleções Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => { setSelectedCatId(null); setIsCategoryModalOpen(false); }} className={`p-6 border rounded-xl font-bold uppercase text-xs transition-all ${!selectedCatId ? 'bg-[#bf953f] text-black' : 'border-[#bf953f]/20 hover:border-[#bf953f]'}`}>Todos</button>
              {categories.map(c => (
                <button key={c.id} onClick={() => { setSelectedCatId(c.id); setIsCategoryModalOpen(false); }} className={`p-6 border rounded-xl font-bold uppercase text-xs transition-all ${selectedCatId === c.id ? 'bg-[#bf953f] text-black' : 'border-[#bf953f]/20 hover:border-[#bf953f]'}`}>{c.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantPage;
