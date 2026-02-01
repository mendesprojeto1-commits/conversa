
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, DemoSite, Consultant, Acquisition, AcquisitionStatus } from '../types';

interface ManagerProps {
  categories: Category[];
  sites: DemoSite[];
  consultants: Consultant[];
  acquisitions: Acquisition[];
  onAddCategory: (name: string) => Promise<void>;
  onAddSite: (site: Omit<DemoSite, 'id'>) => Promise<void>;
  onUpdateSite: (id: string, site: Omit<DemoSite, 'id'>) => Promise<void>;
  onDeleteSite: (id: string) => Promise<void>;
  onAddConsultant: (consultant: Omit<Consultant, 'id'>) => Promise<void>;
  onDeleteConsultant: (id: string) => Promise<void>;
  onUpdateAcquisition: (id: string, updates: Partial<Acquisition>) => Promise<void>;
}

const Manager: React.FC<ManagerProps> = ({ 
  categories, 
  sites, 
  consultants,
  acquisitions,
  onAddCategory, 
  onAddSite, 
  onUpdateSite,
  onDeleteSite,
  onAddConsultant,
  onDeleteConsultant,
  onUpdateAcquisition
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sites' | 'consultants' | 'sales'>('sites');
  const [catName, setCatName] = useState('');
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filtros de Vendas
  const [saleSearchQuery, setSaleSearchQuery] = useState('');
  const [saleStatusFilter, setSaleStatusFilter] = useState<AcquisitionStatus | 'all'>('all');
  const [saleDateFilter, setSaleDateFilter] = useState('');

  const siteFileRef = useRef<HTMLInputElement>(null);
  const consultantFileRef = useRef<HTMLInputElement>(null);
  const saleFileRef = useRef<HTMLInputElement>(null);
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);

  const [siteForm, setSiteForm] = useState({
    title: '',
    link: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
    categoryId: '',
    description: ''
  });

  const [consultantForm, setConsultantForm] = useState({
    name: '',
    cpf: '',
    photoUrl: ''
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSiteFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const isVideo = file.type.startsWith('video/');
      setSiteForm(prev => ({ ...prev, mediaUrl: base64, mediaType: isVideo ? 'video' : 'image' }));
    }
  };

  const handleConsultantFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setConsultantForm(prev => ({ ...prev, photoUrl: base64 }));
    }
  };

  const handleSaleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentSaleId) {
      setIsSubmitting(true);
      const base64 = await fileToBase64(file);
      await onUpdateAcquisition(currentSaleId, { attachmentUrl: base64 });
      setCurrentSaleId(null);
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (catName.trim()) {
      setIsSubmitting(true);
      await onAddCategory(catName);
      setCatName('');
      setIsSubmitting(false);
    }
  };

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (siteForm.title && siteForm.link && siteForm.categoryId && siteForm.mediaUrl) {
      setIsSubmitting(true);
      if (editingSiteId) {
        await onUpdateSite(editingSiteId, siteForm);
        setEditingSiteId(null);
      } else {
        await onAddSite(siteForm);
      }
      setSiteForm({ title: '', link: '', mediaUrl: '', mediaType: 'image', categoryId: '', description: '' });
      if (siteFileRef.current) siteFileRef.current.value = '';
      setIsSubmitting(false);
    }
  };

  const handleConsultantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (consultantForm.name && consultantForm.cpf && consultantForm.photoUrl) {
      setIsSubmitting(true);
      await onAddConsultant(consultantForm);
      setConsultantForm({ name: '', cpf: '', photoUrl: '' });
      if (consultantFileRef.current) consultantFileRef.current.value = '';
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: AcquisitionStatus) => {
    switch (status) {
      case 'pending': return 'Aguardando';
      case 'processing': return 'Em Produção';
      case 'done': return 'Finalizado';
      default: return status;
    }
  };

  const getStatusColor = (status: AcquisitionStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'done': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Lógica de Filtragem de Vendas
  const filteredAcquisitions = useMemo(() => {
    return acquisitions.filter(acq => {
      const matchesName = acq.clientName.toLowerCase().includes(saleSearchQuery.toLowerCase());
      const matchesStatus = saleStatusFilter === 'all' || acq.status === saleStatusFilter;
      
      const acqDate = new Date(acq.timestamp).toISOString().split('T')[0];
      const matchesDate = !saleDateFilter || acqDate === saleDateFilter;
      
      return matchesName && matchesStatus && matchesDate;
    });
  }, [acquisitions, saleSearchQuery, saleStatusFilter, saleDateFilter]);

  const clearFilters = () => {
    setSaleSearchQuery('');
    setSaleStatusFilter('all');
    setSaleDateFilter('');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <input type="file" accept="image/*" className="hidden" ref={saleFileRef} onChange={handleSaleFileChange} />
      
      {isSubmitting && (
        <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-4">
             <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black text-[10px] uppercase tracking-widest text-slate-900">Processando Alteração...</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/')} className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center hover:underline">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            Início
          </button>
          <div className="text-right">
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Painel TUPÃ</h1>
             <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Database Realtime</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
          {['sites', 'consultants', 'sales'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
              {tab === 'sites' ? 'Gerenciar Sites' : tab === 'consultants' ? 'Consultores' : 'Vendas e Leads'}
            </button>
          ))}
        </div>

        {activeTab === 'sites' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-black mb-6 text-slate-900 tracking-tighter">Nova Categoria</h2>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Ex: Landing Pages"
                    className="w-full px-6 py-4 border-2 border-slate-50 bg-slate-50 rounded-2xl focus:border-blue-600 outline-none font-bold"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    Criar Categoria
                  </button>
                </form>
              </section>
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-black mb-6 text-slate-900 tracking-tighter">Existentes</h2>
                <div className="space-y-2">
                  {categories.map(c => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 flex justify-between items-center">
                      {c.name}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-black mb-6 text-slate-900 tracking-tighter">{editingSiteId ? 'Editar Demo' : 'Publicar Nova Demo'}</h2>
                <form onSubmit={handleSiteSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título do Projeto</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold" value={siteForm.title} onChange={(e) => setSiteForm({ ...siteForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Link Live Demo</label>
                    <input type="url" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold" value={siteForm.link} onChange={(e) => setSiteForm({ ...siteForm, link: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Segmento</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold" value={siteForm.categoryId} onChange={(e) => setSiteForm({ ...siteForm, categoryId: e.target.value })}>
                      <option value="">Selecione...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mídia de Capa (Vídeo ou Foto)</label>
                    <input type="file" accept="image/*,video/*" className="hidden" ref={siteFileRef} onChange={handleSiteFileChange} />
                    <div onClick={() => siteFileRef.current?.click()} className="border-4 border-dashed border-slate-100 p-12 rounded-3xl text-center cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/50">
                      {siteForm.mediaUrl ? (
                         siteForm.mediaType === 'video' ? <video src={siteForm.mediaUrl} className="h-24 mx-auto rounded-xl" /> : <img src={siteForm.mediaUrl} className="h-24 mx-auto rounded-xl" />
                      ) : (
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Selecionar Arquivo do Dispositivo</p>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all">
                    {editingSiteId ? 'Atualizar Dados' : 'Confirmar Publicação'}
                  </button>
                </form>
              </section>

              <div className="space-y-4">
                {sites.map(s => (
                  <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden">
                        {s.mediaType === 'video' ? <video src={s.mediaUrl} className="w-full h-full object-cover" /> : <img src={s.mediaUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{s.title}</p>
                        <p className="text-[9px] uppercase font-black text-blue-500 tracking-widest">{categories.find(c => c.id === s.categoryId)?.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { window.scrollTo({top: 0}); setEditingSiteId(s.id); setSiteForm({...s}); }} className="text-blue-600 font-bold text-[10px] uppercase">Editar</button>
                      <button onClick={() => onDeleteSite(s.id)} className="text-red-500 font-bold text-[10px] uppercase">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consultants' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-black mb-6 text-slate-900 tracking-tighter">Credenciar Consultor</h2>
                <form onSubmit={handleConsultantSubmit} className="space-y-6">
                  <input type="text" placeholder="Nome Completo" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold" value={consultantForm.name} onChange={(e) => setConsultantForm({ ...consultantForm, name: e.target.value })} />
                  <input type="text" placeholder="CPF do Consultor" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold" value={consultantForm.cpf} onChange={(e) => setConsultantForm({ ...consultantForm, cpf: e.target.value })} />
                  <div onClick={() => consultantFileRef.current?.click()} className="border-4 border-dashed border-slate-100 p-10 rounded-3xl text-center cursor-pointer bg-slate-50/50">
                    <input type="file" accept="image/*" className="hidden" ref={consultantFileRef} onChange={handleConsultantFileChange} />
                    {consultantForm.photoUrl ? <img src={consultantForm.photoUrl} className="h-20 w-20 rounded-full mx-auto border-4 border-white shadow-lg" /> : <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Foto de Perfil</p>}
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Salvar Credenciamento</button>
                </form>
             </section>
             <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-black mb-6 text-slate-900 tracking-tighter">Corpo de Consultores</h2>
                <div className="space-y-4">
                  {consultants.map(c => (
                    <div key={c.id} className="flex flex-col p-6 bg-slate-50 rounded-[2.5rem] gap-5 border border-slate-100 transition-all hover:bg-white hover:shadow-xl group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                            <img src={c.photoUrl} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 uppercase tracking-tighter text-lg">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.cpf}</p>
                          </div>
                        </div>
                        <button onClick={() => onDeleteConsultant(c.id)} className="text-red-500 font-black text-[9px] uppercase tracking-widest p-3 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all">Excluir</button>
                      </div>
                      <button 
                        onClick={() => navigate(`/consultant/${c.id}`)}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                      >
                        Abrir Painel Público do Consultor
                      </button>
                    </div>
                  ))}
                  {consultants.length === 0 && (
                    <div className="py-20 text-center">
                      <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest opacity-50">Nenhum consultor registrado no sistema TUPÃ</p>
                    </div>
                  )}
                </div>
             </section>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Relatório de Leads</h2>
              <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200">
                {filteredAcquisitions.length} Solicitações Filtradas
              </div>
            </div>

            {/* BARRA DE FILTROS AVANÇADOS */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px] w-full">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Pesquisar por Nome</label>
                <input 
                  type="text" 
                  placeholder="Nome do cliente..."
                  className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-700 shadow-inner"
                  value={saleSearchQuery}
                  onChange={(e) => setSaleSearchQuery(e.target.value)}
                />
              </div>

              <div className="w-full md:w-auto min-w-[180px]">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Situação da Venda</label>
                <select 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-black text-[10px] uppercase tracking-widest text-slate-700 shadow-inner cursor-pointer"
                  value={saleStatusFilter}
                  onChange={(e) => setSaleStatusFilter(e.target.value as any)}
                >
                  <option value="all">Todas as situações</option>
                  <option value="pending">Aguardando (Pendente)</option>
                  <option value="processing">Em Produção</option>
                  <option value="done">Finalizado / Concluído</option>
                </select>
              </div>

              <div className="w-full md:w-auto">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Filtrar por Data</label>
                <input 
                  type="date" 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-black text-[10px] uppercase tracking-widest text-slate-700 shadow-inner"
                  value={saleDateFilter}
                  onChange={(e) => setSaleDateFilter(e.target.value)}
                />
              </div>

              {(saleSearchQuery || saleStatusFilter !== 'all' || saleDateFilter) && (
                <button 
                  onClick={clearFilters}
                  className="w-full md:w-auto p-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 transition-colors shadow-lg active:scale-95"
                >
                  Limpar
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              {filteredAcquisitions.map(acq => (
                <div key={acq.id} className="p-8 md:p-12 bg-white rounded-[3.5rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] flex flex-col gap-10 transition-all hover:shadow-[0_40px_80px_rgba(0,40,150,0.1)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-40 translate-x-1/2 -translate-y-1/2"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(acq.status)}`}>
                           {getStatusLabel(acq.status)}
                         </span>
                         <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">{acq.siteTitle}</span>
                         <div className="flex items-center gap-2 text-[11px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                           {new Date(acq.timestamp).toLocaleDateString('pt-BR')} | {new Date(acq.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                         </div>
                      </div>
                      <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">{acq.clientName}</h4>
                      <div className="flex items-center gap-4 text-slate-400 font-bold">
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs uppercase">CPF: {acq.clientCpf}</span>
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs uppercase">WhatsApp: {acq.clientPhone}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => window.open(`https://wa.me/55${acq.clientPhone.replace(/\D/g,'')}`, '_blank')}
                        className="bg-green-500 text-white p-5 rounded-[2rem] hover:bg-green-600 transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.14l-.905 3.307 3.385-.888c.828.45 1.485.657 2.263.658 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm3.28 8.135c-.145.408-.847.741-1.164.787-.317.045-.698.075-1.163-.074-.242-.077-.557-.19-1.203-.467-1.745-.749-2.874-2.533-2.961-2.647-.087-.115-.714-.95-.714-1.813 0-.863.453-1.288.614-1.46.161-.173.351-.215.468-.215.117 0 .234.001.336.006.106.005.249-.04.391.299.144.344.491 1.196.534 1.284.043.089.072.191.014.306-.058.115-.087.19-.174.288-.087.1-.184.223-.263.3-.087.086-.177.18-.076.353.101.173.448.74 0.96 1.196.659.585 1.215.767 1.388.854.173.086.274.072.375-.043.101-.115.432-.504.548-.677.116-.172.23-.144.389-.086.158.058 1.008.475 1.181.562.173.086.288.13.331.201.043.072.043.414-.102.822z"/></svg>
                        <span className="font-black text-[10px] uppercase tracking-[0.2em]">Falar com Cliente</span>
                      </button>
                      {acq.location && (
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps?q=${acq.location?.latitude},${acq.location?.longitude}`, '_blank')}
                          className="bg-blue-600 text-white p-5 rounded-[2rem] hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          <span className="font-black text-[10px] uppercase tracking-[0.2em]">Ir ao Destino</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-10 border-t border-slate-50">
                    <div className="md:col-span-1 space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fluxo de Trabalho</label>
                      <select 
                        value={acq.status} 
                        onChange={(e) => onUpdateAcquisition(acq.id, { status: e.target.value as AcquisitionStatus })}
                        className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-black text-[11px] uppercase tracking-widest text-slate-700 shadow-inner"
                      >
                        <option value="pending">Aguardando (Pendente)</option>
                        <option value="processing">Em Desenvolvimento</option>
                        <option value="done">Projeto Concluído</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações TUPÃ</label>
                      <textarea 
                        className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:border-blue-600 font-bold text-slate-700 min-h-[120px] shadow-inner"
                        placeholder="Adicione detalhes internos sobre o andamento..."
                        onBlur={(e) => onUpdateAcquisition(acq.id, { comment: e.target.value })}
                        defaultValue={acq.comment}
                      ></textarea>
                    </div>

                    <div className="md:col-span-3 space-y-6">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentação Fotográfica / Comprovantes</label>
                       <div className="flex flex-col md:flex-row items-center gap-10">
                         <button 
                            onClick={() => { setCurrentSaleId(acq.id); saleFileRef.current?.click(); }}
                            className="w-full md:w-auto px-10 py-5 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[11px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
                         >
                           {acq.attachmentUrl ? 'Substituir Mídia' : 'Anexar Foto de Processo'}
                         </button>
                         {acq.attachmentUrl && (
                           <div className="relative group/photo">
                             <div className="w-40 h-40 rounded-[2rem] border-4 border-slate-100 shadow-xl overflow-hidden bg-slate-50">
                               <img src={acq.attachmentUrl} className="w-full h-full object-cover transition-transform group-hover/photo:scale-110" />
                             </div>
                             <button onClick={() => onUpdateAcquisition(acq.id, { attachmentUrl: undefined })} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-xl hover:bg-red-600 transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                             </button>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAcquisitions.length === 0 && (
                <div className="py-40 text-center flex flex-col items-center">
                   <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
                     <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Nenhum Lead Encontrado</h3>
                   <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">Tente ajustar os filtros ou pesquisar por outro nome</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Manager;
