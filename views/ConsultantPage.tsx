
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Category, DemoSite, Consultant, Acquisition } from '../types';
import { getSmartSearchResults } from '../services/geminiService';

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
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [filteredSiteIds, setFilteredSiteIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isProjectGalleryOpen, setIsProjectGalleryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedSite, setSelectedSite] = useState<DemoSite | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', cpf: '' });

  const [visibleButtonsId, setVisibleButtonsId] = useState<string | null>(null);

  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!consultant) {
      navigate('/');
    }
  }, [consultant, navigate]);

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

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false; 
    let sum = 0; let rest;
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

  const handleWhatsAppVerify = () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("⚠️ Digite um número de WhatsApp válido.");
      return;
    }
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const handleAcquisitionSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.cpf) {
      alert("⚠️ Preencha todos os campos obrigatórios.");
      return;
    }
    if (!validateCPF(formData.cpf)) {
      alert("❌ CPF INVÁLIDO: Verifique os números digitados.");
      return;
    }

    setIsSaving(true);

    // Captura geolocalização antes de enviar
    let location: {latitude: number, longitude: number} | undefined = undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 });
      });
      location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) {
      console.warn("Geolocalização não obtida:", e);
    }

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
      alert("✅ CPF VALIDADO! Sua solicitação de projeto foi registrada com sucesso.");
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', cpf: '' });
    } catch (error) {
      console.error(error);
      alert("❌ Erro ao processar solicitação.");
    } finally {
      setIsSaving(false);
    }
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    if (galleryRef.current) {
      const { scrollLeft, clientWidth } = galleryRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      galleryRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      setVisibleButtonsId(null);
    }
  };

  if (!consultant) return null;
  const displaySites = catFilteredSites.filter(s => filteredSiteIds.includes(s.id));

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20 font-['Inter']">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .ray-btn { position: relative; overflow: hidden; }
        .ray-btn::after {
          content: ''; position: absolute; top: -100%; left: -100%; width: 50%; height: 300%;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.4), transparent);
          transform: rotate(45deg); animation: ray-pass 3s infinite;
        }
        @keyframes ray-pass { 0% { top: -100%; left: -100%; } 100% { top: 100%; left: 100%; } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .gallery-scrollbar::-webkit-scrollbar { display: none; }
        .image-full-view { max-height: 85vh; width: auto; max-width: 100%; object-fit: contain; transition: transform 0.4s ease; }
        .image-full-view:active { transform: scale(1.4); cursor: zoom-in; }
      `}</style>

      {/* Hero Header */}
      <div className="bg-[#001021] pt-20 pb-40 px-6 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white/20 mx-auto mb-6 overflow-hidden shadow-2xl">
            <img src={consultant.photoUrl} alt={consultant.name} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase mb-2 leading-none">{consultant.name}</h2>
          <div className="inline-block bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Consultor Especialista</div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6 md:p-12">
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            <input
              type="text"
              placeholder="O que você procura hoje?"
              className="flex-1 px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:border-blue-600 outline-none font-bold text-slate-800 text-lg shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={() => setIsCategoryModalOpen(true)} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl">Categorias</button>
          </div>

          <div className="flex justify-center mb-12">
            <button onClick={() => setIsGalleryOpen(true)} className="flex flex-col items-center gap-1 group bg-slate-50 hover:bg-blue-50 px-8 py-4 rounded-2xl transition-all border border-slate-100">
              <svg className="w-8 h-8 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Abrir Galeria Imersiva</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displaySites.map(site => (
              <div key={site.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500">
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  {site.mediaType === 'video' ? <video src={site.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop /> : <img src={site.mediaUrl} alt={site.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{site.title}</h3>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setSelectedSite(site); setIsModalOpen(true); }} className="ray-btn w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg">Adquirir Projeto</button>
                    <a href={site.link} target="_blank" rel="noopener" className="w-full text-center py-3 text-slate-400 font-black uppercase text-[9px] hover:text-blue-600">Visualizar Demo</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Galeria Imersiva */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[250] bg-black animate-[fadeIn_0.3s] flex flex-col overflow-hidden">
          {/* Header com Z-Index alto para não ser bloqueado pelas setas */}
          <div className="flex justify-between items-center p-8 bg-black/60 backdrop-blur-md absolute top-0 w-full z-[100]">
            <div>
              <h4 className="text-white font-black text-2xl uppercase tracking-tighter leading-none">Exploração Imersiva</h4>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Clique na imagem para ver as ações</p>
            </div>
            <button onClick={() => setIsGalleryOpen(false)} className="bg-white/10 hover:bg-red-600 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Setas de Navegação (Posicionadas para não bloquear o topo) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-6 z-[80]">
            <button onClick={() => scrollGallery('left')} className="bg-white/5 hover:bg-white/20 text-white p-5 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-2xl">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7"/></svg>
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-6 z-[80]">
            <button onClick={() => scrollGallery('right')} className="bg-white/5 hover:bg-white/20 text-white p-5 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-2xl">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          <div ref={galleryRef} className="flex-1 overflow-x-auto flex snap-x snap-mandatory gallery-scrollbar items-center bg-[#050505] scroll-smooth" onScroll={() => visibleButtonsId && setVisibleButtonsId(null)}>
            {catFilteredSites.map(site => (
              <div key={site.id} className="min-w-full h-full flex items-center justify-center snap-center relative px-4 md:px-20 py-24">
                <div className="max-w-6xl w-full h-full relative flex items-center justify-center cursor-pointer" onClick={() => setVisibleButtonsId(visibleButtonsId === site.id ? null : site.id)}>
                  {site.mediaType === 'video' ? <video src={site.mediaUrl} className="max-h-full max-w-full rounded-[2rem] md:rounded-[4rem] object-contain shadow-2xl" autoPlay muted loop /> : <img src={site.mediaUrl} className="max-h-full max-w-full rounded-[2rem] md:rounded-[4rem] object-contain shadow-2xl" alt={site.title} />}
                  
                  <div className={`absolute inset-0 flex flex-col items-center justify-end pb-12 transition-all duration-700 bg-gradient-to-t from-black/95 via-black/10 to-transparent rounded-[2rem] md:rounded-[4rem] p-6 ${visibleButtonsId === site.id ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'}`}>
                    <h3 className="text-white text-4xl font-black uppercase mb-10 tracking-tighter text-center leading-none">{site.title}</h3>
                    <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedSite(site); setIsProjectGalleryOpen(true); }} className="flex-1 bg-white/5 backdrop-blur-2xl text-white border border-white/10 py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 shadow-2xl">Ver mais imagens</button>
                      <a href={site.link} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex-1 bg-slate-100 text-slate-900 py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3">Visualizar Demo</a>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedSite(site); setIsGalleryOpen(false); setIsModalOpen(true); }} className="flex-1 bg-blue-600 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-900/50">Adquirir Projeto</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Galeria */}
      {isProjectGalleryOpen && selectedSite && (
        <div className="fixed inset-0 z-[400] bg-black/98 backdrop-blur-3xl flex flex-col animate-[fadeIn_0.3s] overflow-hidden">
          <div className="p-8 flex justify-between items-center text-white bg-black/50 z-10 border-b border-white/5">
            <div>
              <h5 className="text-2xl font-black uppercase tracking-tighter leading-none">Galeria Completa</h5>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{selectedSite.title}</p>
            </div>
            <button onClick={() => setIsProjectGalleryOpen(false)} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600 transition-all shadow-2xl">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 md:px-20 pb-24 custom-scrollbar bg-[#080808]">
            <div className="max-w-6xl mx-auto space-y-16 py-12">
              <div className="flex flex-col items-center animate-[scaleUp_0.3s]">
                <img src={selectedSite.mediaUrl} className="image-full-view rounded-3xl shadow-2xl border border-white/5" alt="Principal" />
              </div>
              {(selectedSite.galleryUrls || []).map((url, idx) => (
                <div key={idx} className="flex flex-col items-center animate-[scaleUp_0.5s]">
                  <img src={url} className="image-full-view rounded-3xl shadow-2xl border border-white/5" alt={`Detalhe ${idx + 1}`} />
                </div>
              ))}
              {(!selectedSite.galleryUrls || selectedSite.galleryUrls.length === 0) && (
                <div className="py-20 text-center text-white/10 font-black uppercase text-xs">Nenhuma foto adicional encontrada</div>
              )}
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-[9px] font-black uppercase tracking-[0.5em] pointer-events-none bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">Clique e segure para zoom</div>
        </div>
      )}

      {/* Modais */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-[fadeIn_0.3s]">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 flex flex-col max-h-[80vh] animate-[scaleUp_0.3s]">
            <h4 className="text-2xl font-black text-center uppercase tracking-tighter mb-6">Filtrar Segmentos</h4>
            <input type="text" placeholder="Pesquisar..." className="w-full px-8 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none font-bold mb-6" value={categorySearch} onChange={e => setCategorySearch(e.target.value)} />
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              <button onClick={() => { setSelectedCatId(null); setIsCategoryModalOpen(false); }} className={`w-full p-5 rounded-2xl font-black uppercase text-xs tracking-widest text-left ${!selectedCatId ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>Todos os Projetos</button>
              {filteredCategories.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCatId(cat.id); setIsCategoryModalOpen(false); }} className={`w-full p-5 rounded-2xl font-black uppercase text-xs tracking-widest text-left ${selectedCatId === cat.id ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>{cat.name}</button>
              ))}
            </div>
            <button onClick={() => setIsCategoryModalOpen(false)} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">Fechar</button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-[fadeIn_0.3s]">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-12 animate-[scaleUp_0.3s]">
            <div className="text-center mb-10">
              <h4 className="text-2xl font-black text-slate-900 uppercase mb-2">Aquisição de Projeto</h4>
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{selectedSite?.title}</p>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Nome Completo" className="w-full px-6 py-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-600 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="flex gap-2">
                <input type="tel" placeholder="WhatsApp" className="flex-1 px-6 py-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-600 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <button onClick={handleWhatsAppVerify} className="bg-[#25D366] text-white px-5 rounded-xl flex items-center justify-center shadow-lg"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.14l-.905 3.307 3.385-.888c.828.45 1.485.657 2.263.658 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm3.28 8.135c-.145.408-.847.741-1.164.787-.317.045-.698.075-1.163-.074-.242-.077-.557-.19-1.203-.467-1.745-.749-2.874-2.533-2.961-2.647-.087-.115-.714-.95-.714-1.813 0-.863.453-1.288.614-1.46.161-.173.351-.215.468-.215.117 0 .234.001.336.006.106.005.249-.04.391.299.144.344.491 1.196.534 1.284.043.089.072.191.014.306-.058.115-.087.19-.174.288-.087.1-.184.223-.263.3-.087.086-.177.18-.076.353.101.173.448.74 0.96 1.196.659.585 1.215.767 1.388.854.173.086.274.072.375-.043.101-.115.432-.504.548-.677.116-.172.23-.144.389-.086.158.058 1.008.475 1.181.562.173.086.288.13.331.201.043.072.043.414-.102.822z"/></svg></button>
              </div>
              <input type="text" placeholder="CPF Obrigatório" className="w-full px-6 py-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-600 outline-none" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '').substring(0, 11)})} />
              <button onClick={handleAcquisitionSubmit} disabled={isSaving} className="ray-btn w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50 mt-4">{isSaving ? "Enviando..." : "Validar e Confirmar"}</button>
              <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-300 font-black uppercase text-[9px] py-2">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantPage;
