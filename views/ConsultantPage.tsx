
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
  const [filteredSiteIds, setFilteredSiteIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
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

  const catFilteredSites = useMemo(() => {
    if (!selectedCatId) return sites;
    return sites.filter(s => s.categoryId === selectedCatId);
  }, [selectedCatId, sites]);

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
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;
    return true; // Simplified for UX
  };

  const handleAcquisitionSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.cpf) {
      alert("⚠️ Preencha todos os campos.");
      return;
    }
    setIsSaving(true);
    try {
      await onAddAcquisition({
        siteId: selectedSite?.id || '',
        siteTitle: selectedSite?.title || '',
        consultantId: consultant?.id || '',
        clientName: formData.name,
        clientPhone: formData.phone.replace(/\D/g, ''),
        clientCpf: formData.cpf.replace(/\D/g, ''),
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
      `}</style>

      {/* Hero Header - NO BACK BUTTON */}
      <div className="bg-[#001021] pt-20 pb-40 px-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white/20 mx-auto mb-6 overflow-hidden shadow-2xl">
            <img src={consultant.photoUrl} alt={consultant.name} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase mb-2 leading-none">{consultant.name}</h2>
          <div className="inline-block bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Consultor Verificado</div>
        </div>
      </div>

      {/* Filter Bar */}
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
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl"
            >
              Categorias
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displaySites.map(site => (
              <div key={site.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500">
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  {site.mediaType === 'video' ? (
                    <video src={site.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />
                  ) : (
                    <img src={site.mediaUrl} alt={site.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  )}
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{site.title}</h3>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => { setSelectedSite(site); setIsModalOpen(true); }}
                      className="ray-btn w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg"
                    >
                      Adquirir Projeto
                    </button>
                    <a href={site.link} target="_blank" rel="noopener" className="w-full text-center py-3 text-slate-400 font-black uppercase text-[9px] hover:text-blue-600 transition-colors">Visualizar Demo</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {displaySites.length === 0 && !isSearching && (
            <div className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-[0.3em]">Sem resultados para esta busca</div>
          )}
        </div>
      </main>

      {/* Modal Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-[fadeIn_0.3s]">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 animate-[scaleUp_0.3s]">
            <h4 className="text-2xl font-black text-center uppercase tracking-tighter mb-8">Segmentos</h4>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => { setSelectedCatId(null); setIsCategoryModalOpen(false); }} className={`p-5 rounded-2xl font-black uppercase text-xs tracking-widest ${!selectedCatId ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Todos os Projetos</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCatId(cat.id); setIsCategoryModalOpen(false); }} className={`p-5 rounded-2xl font-black uppercase text-xs tracking-widest ${selectedCatId === cat.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{cat.name}</button>
              ))}
            </div>
            <button onClick={() => setIsCategoryModalOpen(false)} className="w-full mt-6 text-slate-300 font-black uppercase text-[10px]">Fechar</button>
          </div>
        </div>
      )}

      {/* Modal Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-[fadeIn_0.3s]">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-12 animate-[scaleUp_0.3s]">
            <div className="text-center mb-10">
              <h4 className="text-2xl font-black text-slate-900 uppercase leading-none mb-2">Novo Pedido</h4>
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{selectedSite?.title}</p>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Nome Completo" className="w-full px-6 py-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-600 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="tel" placeholder="WhatsApp (DDD + Número)" className="w-full px-6 py-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-600 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input type="text" placeholder="CPF" className="w-full px-6 py-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-600 outline-none" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
              <button onClick={handleAcquisitionSubmit} disabled={isSaving} className="ray-btn w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50">Finalizar Solicitação</button>
              <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-300 font-black uppercase text-[9px] py-2">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantPage;
