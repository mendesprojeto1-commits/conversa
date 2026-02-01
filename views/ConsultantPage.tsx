
import React, { useState, useMemo, useEffect } from 'react';
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
  const [filteredSiteIds, setFilteredSiteIds] = useState<string[]>(sites.map(s => s.id));
  const [isSearching, setIsSearching] = useState(false);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedSite, setSelectedSite] = useState<DemoSite | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', cpf: '' });

  useEffect(() => {
    if (!consultant) {
      navigate('/');
    }
  }, [consultant, navigate]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCatId) return "Todos os Projetos";
    return categories.find(c => c.id === selectedCatId)?.name || "Categoria";
  }, [selectedCatId, categories]);

  const catFilteredSites = useMemo(() => {
    if (!selectedCatId) return sites;
    return sites.filter(s => s.categoryId === selectedCatId);
  }, [selectedCatId, sites]);

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
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, catFilteredSites]);

  const validateCPF = (cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11 || !!cleanCpf.match(/(\d)\1{10}/)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cleanCpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cleanCpf.substring(10, 11))) return false;
    return true;
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const handleAcquisitionSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.cpf) {
      alert("⚠️ Preencha todos os campos.");
      return;
    }
    if (!validateCPF(formData.cpf)) {
      alert("❌ CPF Inválido.");
      return;
    }
    if (!validatePhone(formData.phone)) {
      alert("❌ Telefone Inválido.");
      return;
    }

    setIsSaving(true);
    const captureLead = async (location?: { latitude: number, longitude: number }) => {
      try {
        await onAddAcquisition({
          siteId: selectedSite?.id || '',
          siteTitle: selectedSite?.title || '',
          consultantId: consultant?.id || '',
          clientName: formData.name,
          clientPhone: formData.phone.replace(/\D/g, ''),
          clientCpf: formData.cpf.replace(/\D/g, ''),
          location
        });
        alert("🚀 Sucesso! Solicitação enviada.");
        setIsModalOpen(false);
        setFormData({ name: '', phone: '', cpf: '' });
      } catch (error) {
        console.error(error);
        alert("❌ Erro ao salvar.");
      } finally {
        setIsSaving(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => captureLead({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => captureLead()
      );
    } else {
      await captureLead();
    }
  };

  const formatCPF = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 10) return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }));
  };

  const testWhatsApp = () => {
    if (!formData.phone) {
      alert("⚠️ Digite um número de WhatsApp.");
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  if (!consultant) return null;
  const displaySites = catFilteredSites.filter(s => filteredSiteIds.includes(s.id));

  const isCpfValid = formData.cpf.length === 11 && validateCPF(formData.cpf);
  const isPhoneValid = validatePhone(formData.phone);

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        .ray-btn {
          position: relative;
          overflow: hidden;
        }
        .ray-btn::after {
          content: '';
          position: absolute;
          top: -100%;
          left: -100%;
          width: 80%;
          height: 300%;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent);
          transform: rotate(45deg);
          animation: ray-pass 2.5s infinite;
        }
        @keyframes ray-pass {
          0% { top: -100%; left: -100%; }
          40% { top: 100%; left: 100%; }
          100% { top: 100%; left: 100%; }
        }

        .aura-card {
          position: relative;
          z-index: 1;
        }
        .aura-card::before {
          content: '';
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          background: conic-gradient(from 0deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6, #ec4899, #3b82f6);
          border-radius: inherit;
          z-index: -1;
          animation: rotate-aura 5s linear infinite;
          opacity: 0.7;
          filter: blur(4px);
        }
        @keyframes rotate-aura {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#001021] via-[#003366] to-[#0052cc] pt-12 pb-32 md:pt-24 md:pb-56 px-6 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[70%] bg-blue-500 rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-400 rounded-full blur-[120px]"></div>
        </div>

        {/* O botão de voltar foi removido conforme solicitado */}
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse opacity-30 blur-2xl"></div>
            <div className="w-32 h-32 md:w-52 md:h-52 rounded-full border-[8px] border-white/10 shadow-2xl overflow-hidden relative z-10 bg-white/5 backdrop-blur-md p-2 transition-all duration-700 group-hover:scale-105">
              <img src={consultant.photoUrl} alt={consultant.name} className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <h2 className="text-3xl md:text-7xl font-black tracking-tighter leading-none uppercase drop-shadow-2xl">{consultant.name}</h2>
              <div className="inline-flex items-center justify-center animate-pulse">
                 <svg className="w-8 h-8 md:w-16 md:h-16" viewBox="0 0 24 24" fill="none"><path fill="#0095f6" d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.66.54-1.27.4-2.73-.39-3.83-1.1-1.1-2.55-1.24-3.83-.39-.71-1.3-2.08-2.18-3.66-2.18s-2.95.88-3.66 2.18c-1.27-.54-2.73-.4-3.83.39-1.1 1.1-1.24 2.55-.39 3.83-1.3.71-2.18 2.08-2.18 3.66s.88 2.95 2.18 3.66c-.54 1.27-.4 2.73.39 3.83 1.1 1.1 2.55 1.24 3.83.39.71 1.3 2.08 2.18 3.66 2.18s2.95-.88 3.66-2.18c1.27.54 2.73.4 3.83-.39 1.1-1.1 1.24-2.55.39-3.83 1.3-.71 2.18-2.08 2.18-3.66z" /><path fill="white" d="M10.5 16.5l-3.5-3.5 1.4-1.4 2.1 2.1 5.6-5.6 1.4 1.4-7 7z" /></svg>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-blue-200 uppercase font-black tracking-[0.4em] mb-4 opacity-70">ID DE CONSULTOR: {consultant.cpf}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-10 -mt-16 md:-mt-32 relative z-20">
        <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-[0_40px_100px_rgba(0,30,80,0.1)] p-6 md:p-20 border border-slate-50 relative">
          
          {/* Search and Category Bar */}
          <div className="flex flex-col lg:flex-row items-stretch gap-3 mb-12 md:mb-20">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Busca Inteligente..."
                className="block w-full pl-14 pr-4 py-5 border-[3px] border-slate-50 rounded-2xl md:rounded-[3rem] bg-slate-50/50 focus:bg-white focus:border-blue-600 transition-all outline-none font-black text-slate-800 text-sm md:text-xl shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 h-auto lg:h-full">
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex-1 lg:flex-none lg:w-44 bg-white border-[3px] border-slate-100 text-slate-900 py-5 rounded-2xl md:rounded-[3rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"
              >
                Categorias
              </button>

              <button className="ray-btn flex-1 lg:flex-none lg:w-44 bg-blue-600 text-white py-5 rounded-2xl md:rounded-[3rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs hover:bg-slate-900 transition-all shadow-xl active:scale-95">
                Pesquisar
              </button>
            </div>
          </div>

          {/* Nome da Categoria Selecionada */}
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
              {selectedCategoryName}
            </h3>
            <div className="w-16 h-1.5 bg-blue-600 rounded-full md:mx-0 mx-auto"></div>
          </div>

          {/* Site Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16">
            {displaySites.map(site => (
              <div key={site.id} className="aura-card group bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700">
                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                  {site.mediaType === 'video' ? (
                    <video src={site.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" autoPlay muted loop />
                  ) : (
                    <img src={site.mediaUrl} alt={site.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  )}
                </div>
                
                <div className="p-8 md:p-12 text-center bg-white">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6 tracking-tight line-clamp-1">{site.title}</h3>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => { setSelectedSite(site); setIsModalOpen(true); }}
                      className="ray-btn w-full bg-blue-600 hover:bg-slate-950 text-white py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] md:text-xs transition-all shadow-lg active:scale-95"
                    >
                      Adquirir este site
                    </button>
                    
                    <a 
                      href={site.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full bg-slate-50 border border-slate-100 text-slate-400 py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] transition-all hover:text-blue-600 flex items-center justify-center gap-2"
                    >
                      Experimentar Agora
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {displaySites.length === 0 && (
            <div className="py-40 text-center">
              <p className="text-slate-300 font-black uppercase tracking-[0.5em] text-[10px]">Nenhum projeto disponível</p>
            </div>
          )}
        </div>
      </main>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden animate-[scaleUp_0.3s_ease-out]">
            <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-10 text-center uppercase">Escolha o Segmento</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
              <button
                onClick={() => { setSelectedCatId(null); setIsCategoryModalOpen(false); }}
                className={`p-5 rounded-2xl border-4 font-black uppercase tracking-widest text-[11px] transition-all ${!selectedCatId ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-blue-200'}`}
              >
                Todos os Projetos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCatId(cat.id); setIsCategoryModalOpen(false); }}
                  className={`p-5 rounded-2xl border-4 font-black uppercase tracking-widest text-[11px] transition-all ${selectedCatId === cat.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-blue-200'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Acquisition Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden animate-[scaleUp_0.3s_ease-out]">
            {isSaving && (
              <div className="absolute inset-0 z-[110] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="font-black text-[11px] uppercase tracking-[0.5em] text-blue-600 animate-pulse">Gravando Pedido...</p>
              </div>
            )}

            <button onClick={() => !isSaving && setIsModalOpen(false)} className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="text-center mb-10">
              <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">Solicitar Projeto</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">{selectedSite?.title}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                <input type="text" disabled={isSaving} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-blue-600 font-bold text-slate-800 shadow-inner disabled:opacity-50" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</label>
                  {formData.phone.length > 0 && <span className={`text-[9px] font-black uppercase ${isPhoneValid ? 'text-green-500' : 'text-red-400'}`}>{isPhoneValid ? '✓ Válido' : '❌ Inválido'}</span>}
                </div>
                <div className="flex gap-2">
                  <input type="tel" disabled={isSaving} className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-blue-600 font-bold text-slate-800 shadow-inner" value={formatPhone(formData.phone)} onChange={handlePhoneChange} placeholder="(00) 00000-0000" />
                  <button onClick={testWhatsApp} disabled={isSaving} className="bg-green-500 text-white p-4 rounded-xl hover:bg-green-600 transition-all shadow-lg active:scale-90"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.14l-.905 3.307 3.385-.888c.828.45 1.485.657 2.263.658 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm3.28 8.135c-.145.408-.847.741-1.164.787-.317.045-.698.075-1.163-.074-.242-.077-.557-.19-1.203-.467-1.745-.749-2.874-2.533-2.961-2.647-.087-.115-.714-.95-.714-1.813 0-.863.453-1.288.614-1.46.161-.173.351-.215.468-.215.117 0 .234.001.336.006.106.005.249-.04.391.299.144.344.491 1.196.534 1.284.043.089.072.191.014.306-.058.115-.087.19-.174.288-.087.1-.184.223-.263.3-.087.086-.177.18-.076.353.101.173.448.74 0.96 1.196.659.585 1.215.767 1.388.854.173.086.274.072.375-.043.101-.115.432-.504.548-.677.116-.172.23-.144.389-.086.158.058 1.008.475 1.181.562.173.086.288.13.331.201.043.072.043.414-.102.822z"/></svg></button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF (Apenas números)</label>
                  {formData.cpf.length === 11 && <span className={`text-[9px] font-black uppercase ${isCpfValid ? 'text-green-500' : 'text-red-400'}`}>{isCpfValid ? '✓ Válido' : '❌ Inválido'}</span>}
                </div>
                <input type="text" disabled={isSaving} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-blue-600 font-bold text-slate-800 shadow-inner disabled:opacity-50" value={formatCPF(formData.cpf)} onChange={handleCpfChange} placeholder="000.000.000-00" />
              </div>

              <button onClick={handleAcquisitionSubmit} disabled={isSaving} className="ray-btn w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] shadow-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 border-b-8 border-black/10">Finalizar Pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantPage;
