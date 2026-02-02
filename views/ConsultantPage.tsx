
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
    <div className="fixed inset-0 z-[1500] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center animate-[fadeIn_0.3s]">
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
          className="max-w-[90%] max-h-[90%] object-contain transition-transform duration-500 shadow-2xl cursor-pointer"
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
  
  const consultant = consultants.find((c: Consultant) => c.id === id);
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
  const [isLocating, setIsLocating] = useState(false);

  // Garante que a página abra no topo
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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

  const catFilteredSites = useMemo(() => selectedCatId ? sites.filter((s: DemoSite) => s.categoryId === selectedCatId) : sites, [selectedCatId, sites]);

  const filteredModalCategories = useMemo(() => {
    if (!categoryModalSearch.trim()) return categories;
    return categories.filter((c: Category) => c.name.toLowerCase().includes(categoryModalSearch.toLowerCase()));
  }, [categories, categoryModalSearch]);

  useEffect(() => {
    const fetch = async () => {
      if (!searchQuery.trim()) { setFilteredSiteIds(catFilteredSites.map((s: DemoSite) => s.id)); return; }
      const ids = await getSmartSearchResults(searchQuery, catFilteredSites);
      setFilteredSiteIds(ids);
    };
    const t = setTimeout(fetch, 500);
    return () => clearTimeout(t);
  }, [searchQuery, catFilteredSites]);

  const getCurrentLocation = (): Promise<{latitude: number, longitude: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleFormalize = async () => {
    if(!formData.name || !formData.phone || !validateCPF(formData.cpf)) { 
      alert("Por favor, preencha todos os dados corretamente (Nome, WhatsApp e CPF válido)."); 
      return; 
    }

    setIsLocating(true);
    try {
      const location = await getCurrentLocation();
      
      if (!selectedSite || !consultant) return;

      await onAddAcquisition({ 
        siteId: selectedSite.id, 
        siteTitle: selectedSite.title, 
        consultantId: consultant.id, 
        clientName: formData.name, 
        clientPhone: formData.phone, 
        clientCpf: formData.cpf,
        location: location
      });

      alert("✨ Solicitação enviada com sucesso! Em breve entraremos em contato."); 
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', cpf: '' });
    } catch (err: any) {
      console.error(err);
      let msg = "A autorização de localização é obrigatória para prosseguir por segurança.";
      if (err.code === 1) msg = "Permissão de localização negada. Habilite-a para solicitar o projeto.";
      alert(msg);
    } finally {
      setIsLocating(false);
    }
  };

  const openWhatsAppTest = () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("Por favor, digite um número de WhatsApp válido primeiro.");
      return;
    }
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  if (!consultant) return null;
  const displaySites = catFilteredSites.filter((s: DemoSite) => filteredSiteIds.includes(s.id));

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

      {/* Floating WhatsApp Consultant Button */}
      {consultant.whatsapp && (
        <a 
          href={`https://wa.me/55${consultant.whatsapp.replace(/\D/g,'')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-10 left-10 z-[1400] bg-[#25D366] text-white p-5 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform animate-bounce hover:animate-none"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        </a>
      )}

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
          <h1 className="font-cinzel text-5xl md:text-8xl font-black mb-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight text-white uppercase">
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
            </div>
            <button onClick={() => { setCategoryModalSearch(''); setIsCategoryModalOpen(true); }} className="px-14 py-7 bg-transparent border-2 border-[#bf953f] text-[#fcf6ba] font-cinzel font-black uppercase tracking-widest rounded-2xl hover:bg-[#bf953f] hover:text-[#001226] transition-all transform hover:scale-105 active:scale-95 shadow-xl">
              Coleções
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {displaySites.map(site => (
              <div key={site.id} className="luxury-card rounded-3xl overflow-hidden group flex flex-col">
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img src={site.mediaUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" style={{ objectPosition: site.objectPosition || '50% 50%' }} />
                </div>
                <div className="p-10 flex-1 flex flex-col">
                  <h3 className="font-cinzel text-2xl font-bold mb-5 group-hover:text-[#fcf6ba] transition-colors">{site.title}</h3>
                  <p className="font-cormorant text-slate-400 text-lg mb-10 flex-1 italic line-clamp-3 leading-relaxed">{site.description}</p>
                  <div className="space-y-4">
                    <button onClick={() => { setSelectedSite(site); setIsModalOpen(true); }} className="w-full py-5 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#bf953f] text-[#001226] font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:brightness-110 transition-all">Solicitar Projeto</button>
                    <button onClick={() => { setSelectedSite(site); setIsGalleryOpen(true); }} className="w-full py-5 border border-[#bf953f]/40 text-[#fcf6ba] font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-[#bf953f]/10 transition-all">Galeria Detalhada</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Renderização da Galeria Detalhada */}
      {isGalleryOpen && selectedSite && (
        <GalleryViewer 
          site={selectedSite} 
          onClose={() => setIsGalleryOpen(false)} 
          onSolicit={() => { setIsGalleryOpen(false); setIsModalOpen(true); }} 
        />
      )}

      {/* Modal Solicitar Projeto */}
      {isModalOpen && selectedSite && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 animate-[fadeIn_0.3s]">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => !isLocating && setIsModalOpen(false)}></div>
          <div className="bg-[#001a33] w-full max-w-xl relative z-10 p-12 border border-[#bf953f]/30 rounded-[3rem] shadow-[0_0_100px_rgba(191,149,63,0.3)]">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-[#bf953f] transition-all hover:scale-110 active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <h2 className="font-cinzel text-4xl font-black ray-text text-center mb-10 uppercase tracking-tighter">Protocolo de Reserva</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#bf953f] uppercase tracking-widest ml-1">Seu Nome Completo</label>
                <input type="text" placeholder="Ex: João Silva" className="luxury-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#bf953f] uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                <div className="relative">
                  <input type="tel" placeholder="(00) 00000-0000" className="luxury-input pr-20" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  <button 
                    onClick={openWhatsAppTest}
                    title="Verificar no WhatsApp"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#25D366] text-white p-3 rounded-xl hover:scale-110 transition-all shadow-lg active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#bf953f] uppercase tracking-widest ml-1">CPF Identificador</label>
                <input type="text" placeholder="000.000.000-00" className="luxury-input" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
                <p className="text-[9px] font-bold text-amber-200 uppercase tracking-widest text-center w-full">Localização obrigatória para validação de segurança.</p>
              </div>
              
              <button 
                onClick={handleFormalize}
                disabled={isLocating}
                className="w-full py-6 mt-6 bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-[#001226] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4"
              >
                {isLocating ? (
                  <>
                    <div className="w-5 h-5 border-4 border-[#001226] border-t-transparent rounded-full animate-spin"></div>
                    Autenticando...
                  </>
                ) : (
                  "Formalizar Solicitação"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Coleções com Busca Interna e Botão de Fechar */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 animate-[fadeIn_0.3s]">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="bg-[#001a33] w-full max-w-2xl relative z-10 p-12 border border-[#bf953f]/30 rounded-[2.5rem] shadow-2xl max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-[#bf953f] transition-all hover:scale-110 active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <h2 className="font-cinzel text-3xl font-black text-[#bf953f] mb-8 uppercase tracking-widest text-center">Acervos de Elite</h2>
            
            <div className="mb-8 relative">
              <input 
                type="text" 
                placeholder="Filtrar categorias..."
                className="w-full bg-white/5 border border-[#bf953f]/20 px-6 py-4 rounded-xl outline-none focus:border-[#bf953f] text-[#fcf6ba] font-medium"
                value={categoryModalSearch}
                onChange={e => setCategoryModalSearch(e.target.value)}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-30 text-[#bf953f]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 scrollbar-hide flex-1">
              <button 
                onClick={() => { setSelectedCatId(null); setIsCategoryModalOpen(false); }} 
                className={`p-8 border rounded-2xl font-cinzel font-black uppercase tracking-widest transition-all ${!selectedCatId ? 'bg-[#bf953f] text-[#001226] border-[#bf953f]' : 'border-[#bf953f]/20 text-[#bf953f] hover:bg-white/5'}`}
              >
                Todos os Projetos
              </button>
              
              {filteredModalCategories.map((c: Category) => (
                <button 
                  key={c.id} 
                  onClick={() => { setSelectedCatId(c.id); setIsCategoryModalOpen(false); }} 
                  className={`p-8 border rounded-2xl font-cinzel font-black uppercase tracking-widest transition-all ${selectedCatId === c.id ? 'bg-[#bf953f] text-[#001226] border-[#bf953f]' : 'border-[#bf953f]/20 text-[#bf953f] hover:bg-white/5'}`}
                >
                  {c.name}
                </button>
              ))}

              {filteredModalCategories.length === 0 && (
                <div className="text-center py-10 opacity-40 font-cinzel text-sm uppercase tracking-widest">Nenhum acervo encontrado</div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-40 pb-20 text-center">
        <p className="font-cinzel text-xs text-[#bf953f]/40 uppercase tracking-[1em]">TUPÃ EXCELLENCE</p>
      </footer>
    </div>
  );
};

export default ConsultantPage;
