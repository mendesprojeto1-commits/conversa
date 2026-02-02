
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Category, DemoSite, Consultant, Acquisition } from '../types';
import { getSmartSearchResults } from '../services/geminiService';

// Função de validação de CPF (Algoritmo padrão brasileiro)
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

// Componente de Galeria de Elite
const GalleryViewer: React.FC<{ 
  site: DemoSite, 
  onClose: () => void, 
  onSolicit: () => void 
}> = ({ site, onClose, onSolicit }) => {
  const images = useMemo(() => [site.mediaUrl, ...(site.galleryUrls || [])], [site]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const toggleZoom = () => setZoom(prev => prev === 1 ? 2.5 : 1);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center animate-[fadeIn_0.3s]">
      <div className="absolute top-8 right-8 flex gap-4 z-50">
        <button onClick={onClose} className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="relative w-full h-[70vh] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
        <button onClick={handlePrev} className="absolute left-6 z-40 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all backdrop-blur-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>

        <div className="relative w-full h-full flex items-center justify-center" onClick={toggleZoom}>
          <img 
            src={images[currentIndex]} 
            className="max-w-[90%] max-h-[90%] object-contain transition-transform duration-500 ease-out shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            style={{ transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)` }}
            alt={`Vista ${currentIndex + 1}`}
          />
        </div>

        <button onClick={handleNext} className="absolute right-6 z-40 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all backdrop-blur-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <div className="mt-12 flex flex-col items-center gap-8 w-full max-w-xl px-6">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide max-w-full">
          {images.map((img, idx) => (
            <button 
              key={idx} 
              onClick={() => { setCurrentIndex(idx); setZoom(1); }}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-[#bf953f] scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
              <img src={img} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <button 
          onClick={onSolicit}
          className="bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#bf953f] text-[#001226] font-black py-5 px-16 rounded-2xl uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-transform"
        >
          Solicitar Projeto
        </button>
      </div>
    </div>
  );
};

// Verified Badge
const VerifiedBadge = () => (
  <div className="relative inline-flex items-center justify-center ml-4 animate-[pulse-gold_2s_infinite]">
    <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-lg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 4.5L18 5L18.5 8.5L21 11L19.5 14L20 17.5L17 19L15 22L12 21L9 22L7 19L4 17.5L4.5 14L3 11L5.5 8.5L6 5L9.5 4.5L12 2Z" fill="#0095F6" />
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const SiteMediaCarousel: React.FC<{ site: DemoSite }> = ({ site }) => {
  const images = useMemo(() => [site.mediaUrl, ...(site.galleryUrls || [])], [site]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((url, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          {site.mediaType === 'video' && idx === 0 ? (
            <video 
              src={url} 
              className="w-full h-full object-cover scale-105" 
              style={{ objectPosition: site.objectPosition || 'center center' }}
              autoPlay muted loop 
            />
          ) : (
            <img 
              src={url} 
              className="w-full h-full object-cover scale-105" 
              style={{ objectPosition: site.objectPosition || 'center center' }}
              alt={site.title} 
            />
          )}
        </div>
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-0.5 transition-all duration-500 ${idx === currentIndex ? 'w-6 bg-[#bf953f]' : 'w-2 bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ConsultantPageProps {
  categories: Category[];
  sites: DemoSite[];
  consultants: Consultant[];
  onAddAcquisition: (acquisition: Omit<Acquisition, 'id' | 'timestamp' | 'status'>) => Promise<void>;
}

const ConsultantPage: React.FC<ConsultantPageProps> = ({ categories, sites, consultants, onAddAcquisition }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const consultant = consultants.find(c => c.id === id);

  const [searchQuery, setSearchQuery] = useState('');
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const fullPlaceholder = "Digite seu interesse";
  
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [filteredSiteIds, setFilteredSiteIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedSite, setSelectedSite] = useState<DemoSite | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', cpf: '' });

  // Detecção de gênero (ajuste gramatical brasileiro comum para nomes terminados em 'a')
  const isFemale = useMemo(() => {
    if (!consultant) return false;
    const firstName = consultant.name.trim().split(' ')[0].toLowerCase();
    return firstName.endsWith('a') || firstName.endsWith('ia') || firstName.endsWith('na');
  }, [consultant]);

  useEffect(() => {
    if (!consultant) navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [consultant, navigate]);

  // Animação de digitação para o placeholder
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedPlaceholder(fullPlaceholder.slice(0, i));
      i++;
      if (i > fullPlaceholder.length) {
        setTimeout(() => { i = 0; }, 2000);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const catFilteredSites = useMemo(() => {
    if (!selectedCatId) return sites;
    return sites.filter(s => s.categoryId === selectedCatId);
  }, [selectedCatId, sites]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [categories, categorySearch]);

  useEffect(() => {
    const fetchResults = async () => {
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
    };
    const timer = setTimeout(fetchResults, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, catFilteredSites]);

  const handleAcquisitionSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.cpf) {
      alert("⚠️ Preencha todos os campos.");
      return;
    }

    if (!validateCPF(formData.cpf)) {
      alert("⚠️ CPF Inválido. Por favor, verifique os dados.");
      return;
    }

    setIsSaving(true);
    let location: {latitude: number, longitude: number} | undefined = undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 });
      });
      location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) { console.warn(e); }

    try {
      await onAddAcquisition({
        siteId: selectedSite?.id || '',
        siteTitle: selectedSite?.title || '',
        consultantId: consultant?.id || '',
        clientName: formData.name,
        clientPhone: formData.phone.replace(/\D/g, ''),
        clientCpf: formData.cpf.replace(/\D/g, ''),
        location: location
      });
      alert("✨ Proposta de Elite enviada com sucesso.");
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', cpf: '' });
    } catch (error) { console.error(error); } finally { setIsSaving(false); }
  };

  if (!consultant) return null;
  const displaySites = catFilteredSites.filter(s => filteredSiteIds.includes(s.id));

  return (
    <div className="min-h-screen bg-[#001226] pb-20 font-['Inter']">
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(191,149,63,0.5)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(191,149,63,0.8)); }
        }
        @keyframes border-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes lightning-pass {
          0% { background-position: 200% center; }
          30% { background-position: -100% center; }
          100% { background-position: -100% center; }
        }
        .avatar-aura {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent, #bf953f, #fcf6ba, #bf953f, transparent);
          animation: border-rotate 5s linear infinite;
          opacity: 0.6;
        }
        .luxury-card {
          background: #001a33;
          border: 1px solid #bf953f;
          box-shadow: 0 0 30px rgba(191, 149, 63, 0.2);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .luxury-card::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(transparent, transparent, #bf953f, transparent);
          animation: border-rotate 10s linear infinite;
          opacity: 0.35;
          z-index: 0;
          pointer-events: none;
        }
        .luxury-card-inner {
          position: relative;
          z-index: 1;
          background: #001a33;
          height: 100%;
        }
        .btn-gold {
          background: linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
          background-size: 200% 200%;
          color: #1a1a1a;
          font-weight: 900;
          letter-spacing: 0.15em;
          transition: all 0.4s ease;
        }
        .btn-gold:hover {
          background-position: 100% 100%;
          box-shadow: 0 0 25px rgba(191, 149, 63, 0.5);
        }
        .search-white {
          background: #FFFFFF !important;
          color: #001226 !important;
          border: 2px solid #bf953f !important;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700 !important;
          font-style: italic;
        }
        .search-white::placeholder {
          color: rgba(0, 18, 38, 0.4) !important;
        }
        .elegant-typing::after {
          content: '|';
          animation: blink 0.8s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .ray-text-effect {
          background: linear-gradient(110deg, #bf953f 30%, #ffffff 50%, #bf953f 70%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: lightning-pass 3s infinite cubic-bezier(0.2, 0.8, 0.2, 1);
        }
      `}</style>

      {/* Hero Header */}
      <div className="bg-royal-gold pt-24 pb-48 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #bf953f 1px, transparent 0)', backgroundSize: '60px 60px' }}></div>
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          
          <div className="relative mb-12">
            <div className="avatar-aura"></div>
            <div className="w-44 h-44 md:w-60 md:h-60 rounded-full relative z-10 border-4 border-[#bf953f] shadow-[0_0_50px_rgba(191,149,63,0.3)] overflow-hidden bg-[#001a33]">
              <img src={consultant.photoUrl} alt={consultant.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex items-center justify-center mb-10">
            <div className="name-box rounded-lg">
              <h2 className="font-cinzel text-5xl md:text-8xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight flex items-center">
                {consultant.name}
                <VerifiedBadge />
              </h2>
            </div>
          </div>

          <div className="inline-block px-16 py-4 border-t border-b border-[#bf953f]/40 bg-black/20 backdrop-blur-sm">
            <span className="font-cinzel ray-text-effect text-2xl md:text-3xl font-black tracking-[0.5em] uppercase">
              {isFemale ? 'Consultora' : 'Consultor'} Especialista
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
        <div className="bg-[#001a33]/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 md:p-16 border border-[#bf953f]/20">
          
          {/* Search with Elegant Typing Animation */}
          <div className="flex flex-col md:flex-row gap-6 mb-20">
            <div className="flex-1 relative">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 font-cormorant italic text-xl pointer-events-none text-slate-400">
                {!searchQuery && <span className="elegant-typing">{typedPlaceholder}</span>}
              </div>
              <input
                type="text"
                className="w-full search-white px-8 py-5 text-2xl rounded-xl outline-none shadow-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
            </div>
            <button 
              onClick={() => setIsCategoryModalOpen(true)} 
              className="bg-transparent border-2 border-[#bf953f] font-cinzel px-14 py-5 text-sm font-black tracking-[0.3em] uppercase text-white hover:bg-[#bf953f] hover:text-[#001a33] transition-all rounded-xl"
            >
              Coleções
            </button>
          </div>

          {/* Demos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {displaySites.map(site => (
              <div 
                key={site.id} 
                className="luxury-card rounded-2xl group flex flex-col h-full"
              >
                <div className="luxury-card-inner rounded-2xl flex flex-col h-full overflow-hidden">
                  <div className="aspect-[16/10] relative overflow-hidden bg-black/40">
                    <SiteMediaCarousel site={site} />
                    <div className="absolute top-4 left-4 z-20">
                      <span className="bg-[#001a33]/80 backdrop-blur-md px-4 py-2 text-[10px] font-cinzel font-black text-[#fcf6ba] tracking-widest border border-[#bf953f]/30 uppercase rounded-sm">
                        {categories.find(c => c.id === site.categoryId)?.name}
                      </span>
                    </div>
                  </div>
                  <div className="p-10 flex flex-col flex-1">
                    <h3 className="font-cinzel text-2xl font-black text-white mb-6 tracking-tight group-hover:text-[#fcf6ba] transition-colors">
                      {site.title}
                    </h3>
                    <p className="font-cormorant text-xl text-[#fcf6ba]/60 mb-10 line-clamp-3 leading-relaxed italic">
                      {site.description}
                    </p>
                    <div className="mt-auto space-y-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedSite(site); setIsModalOpen(true); }} 
                        className="btn-gold w-full py-5 text-[12px] uppercase rounded-xl"
                      >
                        Solicitar Projeto
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedSite(site); setIsGalleryOpen(true); }} 
                        className="btn-gold w-full py-5 text-[12px] uppercase rounded-xl brightness-90 hover:brightness-110"
                      >
                        Galeria de Imagens
                      </button>
                      <a 
                        href={site.link} 
                        target="_blank" 
                        rel="noopener" 
                        onClick={(e) => e.stopPropagation()}
                        className="block text-center font-cinzel text-[#bf953f] text-xs font-black tracking-widest hover:text-white transition-colors pt-2 uppercase"
                      >
                        Visualizar Demo Live
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal Galeria Avançada */}
      {isGalleryOpen && selectedSite && (
        <GalleryViewer 
          site={selectedSite} 
          onClose={() => setIsGalleryOpen(false)} 
          onSolicit={() => { setIsGalleryOpen(false); setIsModalOpen(true); }}
        />
      )}

      {/* Modal Solicitar Projeto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 animate-[fadeIn_0.3s]">
          <div className="absolute inset-0 bg-[#000b1a]/95 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#001a33] w-full max-w-2xl relative z-10 p-12 md:p-16 border border-[#bf953f]/30 shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-3xl">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-8 right-8 text-[#bf953f] hover:text-[#fcf6ba] transition-all"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="text-center mb-12">
              <h4 className="font-cinzel text-4xl font-black gold-text-gradient uppercase mb-4 tracking-tighter">Protocolo de Reserva</h4>
              <p className="font-cormorant italic text-2xl text-[#fcf6ba]/60">{selectedSite?.title}</p>
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="font-cinzel text-xs font-black text-[#bf953f] tracking-widest uppercase ml-1">Nome Completo</label>
                <input type="text" className="w-full luxury-input rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="font-cinzel text-xs font-black text-[#bf953f] tracking-widest uppercase ml-1">WhatsApp Privado</label>
                  <div className="relative flex items-center">
                    <input type="tel" className="w-full luxury-input rounded-xl pr-14" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <button 
                      onClick={() => { if(formData.phone) window.open(`https://wa.me/55${formData.phone.replace(/\D/g,'')}`, '_blank'); }}
                      className="absolute right-3 p-2 bg-[#25D366] text-white rounded-lg hover:scale-110 transition-transform shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.14l-.905 3.307 3.385-.888c.828.45 1.485.657 2.263.658 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm3.28 8.135c-.145.408-.847.741-1.164.787-.317.045-.698.075-1.163-.074-.242-.077-.557-.19-1.203-.467-1.745-.749-2.874-2.533-2.961-2.647-.087-.115-.714-.95-.714-1.813 0-.863.453-1.288.614-1.46.161-.173.351-.215.468-.215.117 0 .234.001.336.006.106.005.249-.04.391.299.144.344.491 1.196.534 1.284.043.089.072.191.014.306-.058.115-.087.19-.174.288-.087.1-.184.223-.263.3-.087.086-.177.18-.076.353.101.173.448.74 0.96 1.196.659.585 1.215.767 1.388.854.173.086.274.072.375-.043.101-.115.432-.504.548-.677.116-.172.23-.144.389-.086.158.058 1.008.475 1.181.562.173.086.288.13.331.201.043.072.043.414-.102.822z"/></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-cinzel text-xs font-black text-[#bf953f] tracking-widest uppercase ml-1">CPF Identificador</label>
                  <input type="text" className="w-full luxury-input rounded-xl" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '').substring(0, 11)})} />
                </div>
              </div>
              <button 
                onClick={handleAcquisitionSubmit} 
                disabled={isSaving} 
                className="btn-gold w-full py-6 mt-10 text-sm rounded-2xl"
              >
                {isSaving ? "Formalizando..." : "Confirmar Solicitação de Elite"}
              </button>
              <button onClick={() => setIsModalOpen(false)} className="w-full text-center font-cinzel text-[#bf953f]/40 mt-8 hover:text-[#fcf6ba] transition-colors uppercase text-xs tracking-[0.3em]">Cancelar Reserva</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Coleções */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-[fadeIn_0.3s]">
          <div className="absolute inset-0 bg-[#000b1a]/95 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="bg-[#001a33] w-full max-w-3xl relative z-10 p-12 border border-[#bf953f]/30 shadow-2xl rounded-3xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-10">
              <h4 className="font-cinzel text-3xl font-black uppercase tracking-[0.2em] gold-text-gradient">Acervos</h4>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-[#bf953f] hover:text-[#fcf6ba] hover:scale-110 transition-all">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Filtrar categorias..." 
              className="w-full mb-10 luxury-input text-xl rounded-xl"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-4 scrollbar-hide flex-1">
              <button 
                onClick={() => { setSelectedCatId(null); setIsCategoryModalOpen(false); }} 
                className={`p-8 text-left font-cinzel text-sm tracking-[0.3em] uppercase transition-all border rounded-xl font-bold ${!selectedCatId ? 'bg-[#bf953f] text-[#001226] border-[#bf953f]' : 'bg-transparent text-white border-[#bf953f]/20 hover:border-[#bf953f]'}`}
              >
                Todos os Segmentos
              </button>
              {filteredCategories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => { setSelectedCatId(cat.id); setIsCategoryModalOpen(false); }} 
                  className={`p-8 text-left font-cinzel text-sm tracking-[0.3em] uppercase transition-all border rounded-xl font-bold ${selectedCatId === cat.id ? 'bg-[#bf953f] text-[#001226] border-[#bf953f]' : 'bg-transparent text-white border-[#bf953f]/20 hover:border-[#bf953f]'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <footer className="mt-32 text-center">
        <div className="w-24 h-px bg-[#bf953f] mx-auto mb-10 opacity-30"></div>
        <p className="font-cinzel text-xs text-[#bf953f]/50 uppercase tracking-[1em]">TUPÃ EXCELLENCE • ROYAL INSTANCE</p>
      </footer>
    </div>
  );
};

export default ConsultantPage;
