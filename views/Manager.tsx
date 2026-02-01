
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
  onDeleteAcquisition: (id: string) => Promise<void>;
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
  onUpdateAcquisition,
  onDeleteAcquisition
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sites' | 'consultants' | 'sales'>('sites');
  const [catName, setCatName] = useState('');
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  const [saleSearchQuery, setSaleSearchQuery] = useState('');
  const [saleStatusFilter, setSaleStatusFilter] = useState<AcquisitionStatus | 'all'>('all');
  const [saleDateFilter, setSaleDateFilter] = useState('');

  const [editingSale, setEditingSale] = useState<Acquisition | null>(null);
  const [saleEditForm, setSaleEditForm] = useState<{status: AcquisitionStatus, comment: string, attachmentUrl: string}>({
    status: 'pending',
    comment: '',
    attachmentUrl: ''
  });

  const siteFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const consultantFileRef = useRef<HTMLInputElement>(null);
  const saleFileRef = useRef<HTMLInputElement>(null);

  const [siteForm, setSiteForm] = useState({
    title: '',
    link: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
    categoryId: '',
    description: '',
    galleryUrls: [] as string[]
  });

  const [consultantForm, setConsultantForm] = useState({
    name: '',
    cpf: '',
    photoUrl: ''
  });

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/#/consultant/${id}`;
    navigator.clipboard.writeText(url);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

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

  const handleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await fileToBase64(files[i]);
        newUrls.push(base64);
      }
      setSiteForm(prev => ({ ...prev, galleryUrls: [...prev.galleryUrls, ...newUrls] }));
    }
  };

  const removeGalleryImage = (index: number) => {
    setSiteForm(prev => ({
      ...prev,
      galleryUrls: prev.galleryUrls.filter((_, i) => i !== index)
    }));
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
    if (file) {
      const base64 = await fileToBase64(file);
      setSaleEditForm(prev => ({ ...prev, attachmentUrl: base64 }));
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
      setSiteForm({ title: '', link: '', mediaUrl: '', mediaType: 'image', categoryId: '', description: '', galleryUrls: [] });
      if (siteFileRef.current) siteFileRef.current.value = '';
      if (galleryFileRef.current) galleryFileRef.current.value = '';
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

  const handleSaleUpdateSubmit = async () => {
    if (editingSale) {
      setIsSubmitting(true);
      await onUpdateAcquisition(editingSale.id, {
        status: saleEditForm.status,
        comment: saleEditForm.comment,
        attachmentUrl: saleEditForm.attachmentUrl
      });
      setEditingSale(null);
      setIsSubmitting(false);
    }
  };

  const filteredAcquisitions = useMemo(() => {
    return acquisitions.filter(acq => {
      const matchesSearch = 
        acq.clientName.toLowerCase().includes(saleSearchQuery.toLowerCase()) ||
        acq.clientCpf.includes(saleSearchQuery) ||
        acq.siteTitle.toLowerCase().includes(saleSearchQuery.toLowerCase());
      const matchesStatus = saleStatusFilter === 'all' || acq.status === saleStatusFilter;
      const acqDate = new Date(acq.timestamp).toISOString().split('T')[0];
      const matchesDate = !saleDateFilter || acqDate === saleDateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [acquisitions, saleSearchQuery, saleStatusFilter, saleDateFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-['Inter']">
      
      {isSubmitting && (
        <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex items-center gap-4 animate-pulse">
             <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black text-xs uppercase tracking-widest text-slate-900">Sincronizando Banco de Dados...</p>
          </div>
        </div>
      )}

      {/* Modal de Edição de Venda */}
      {editingSale && (
        <div className="fixed inset-0 z-[800] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-[fadeIn_0.3s]">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-[scaleUp_0.3s] max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Atualizar Venda</h3>
            <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-8">Cliente: {editingSale.clientName}</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Status do Pedido</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold focus:border-blue-600 outline-none uppercase text-xs"
                  value={saleEditForm.status}
                  onChange={(e) => setSaleEditForm({...saleEditForm, status: e.target.value as AcquisitionStatus})}
                >
                  <option value="pending">Aguardando Aprovação</option>
                  <option value="processing">Em Produção / Processamento</option>
                  <option value="done">Concluído / Entregue</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Comentários Internos</label>
                <textarea 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold focus:border-blue-600 outline-none min-h-[120px]"
                  placeholder="Notas sobre a negociação..."
                  value={saleEditForm.comment}
                  onChange={(e) => setSaleEditForm({...saleEditForm, comment: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Anexo de Comprovante (Opcional)</label>
                <input type="file" className="hidden" ref={saleFileRef} onChange={handleSaleFileChange} />
                <div 
                  onClick={() => saleFileRef.current?.click()}
                  className="border-4 border-dashed border-slate-100 p-8 rounded-2xl text-center cursor-pointer hover:bg-slate-50 transition-all bg-slate-50/50"
                >
                  {saleEditForm.attachmentUrl ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={saleEditForm.attachmentUrl} className="h-16 w-16 object-cover rounded-lg shadow-md" />
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Trocar Anexo</span>
                    </div>
                  ) : (
                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Clique para subir arquivo</span>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setEditingSale(null)}
                  className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaleUpdateSubmit}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button onClick={() => navigate('/')} className="mb-4 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-blue-50 px-4 py-2 rounded-full transition-all w-fit">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
              Voltar ao Início
            </button>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Painel de Controle</h1>
            <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.4em] mt-2">Tupã Management Engine</p>
          </div>
        </header>

        <nav className="flex gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { id: 'sites', label: 'Projetos Demo', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'consultants', label: 'Consultores', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'sales', label: 'Relatório de Vendas', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}/></svg>
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'sites' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-10">
              <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <h2 className="text-2xl font-black mb-8 text-slate-900 tracking-tight uppercase">Segmentos</h2>
                <form onSubmit={handleAddCategory} className="space-y-4 mb-8">
                  <input
                    type="text"
                    placeholder="Nome da Categoria"
                    className="w-full px-8 py-5 border-2 border-slate-50 bg-slate-50 rounded-[1.5rem] focus:border-blue-600 outline-none font-bold text-slate-800"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">
                    Criar Categoria
                  </button>
                </form>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map(c => (
                    <div key={c.id} className="p-4 bg-slate-50 rounded-2xl font-black text-[9px] uppercase tracking-widest text-slate-500 border border-slate-100">
                      {c.name}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-2 space-y-10">
              <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <h2 className="text-2xl font-black mb-8 text-slate-900 tracking-tight uppercase">{editingSiteId ? 'Editar Demo' : 'Nova Demo'}</h2>
                <form onSubmit={handleSiteSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Título do Projeto</label>
                    <input type="text" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold" value={siteForm.title} onChange={(e) => setSiteForm({ ...siteForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Live URL</label>
                    <input type="url" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold" value={siteForm.link} onChange={(e) => setSiteForm({ ...siteForm, link: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Categoria</label>
                    <select className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-black text-[10px] uppercase" value={siteForm.categoryId} onChange={(e) => setSiteForm({ ...siteForm, categoryId: e.target.value })}>
                      <option value="">Selecione...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Capa Principal</label>
                    <input type="file" accept="image/*,video/*" className="hidden" ref={siteFileRef} onChange={handleSiteFileChange} />
                    <div onClick={() => siteFileRef.current?.click()} className="border-4 border-dashed border-slate-100 p-10 rounded-[2.5rem] text-center cursor-pointer hover:bg-slate-50 transition-all bg-slate-50/50 group">
                      {siteForm.mediaUrl ? (
                         <div className="relative inline-block">
                           {siteForm.mediaType === 'video' ? <video src={siteForm.mediaUrl} className="h-24 rounded-2xl shadow-xl" /> : <img src={siteForm.mediaUrl} className="h-24 rounded-2xl shadow-xl" />}
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                             <span className="text-white font-black text-[9px] uppercase tracking-widest">Alterar</span>
                           </div>
                         </div>
                      ) : (
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Upload Capa</p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Galeria do Projeto (Múltiplas Fotos)</label>
                    <input type="file" accept="image/*" multiple className="hidden" ref={galleryFileRef} onChange={handleGalleryFilesChange} />
                    <div className="flex flex-wrap gap-4 mb-4">
                      {siteForm.galleryUrls.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img src={url} className="w-24 h-24 rounded-xl object-cover border border-slate-200 shadow-sm" />
                          <button 
                            type="button" 
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => galleryFileRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-all"
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="md:col-span-2 bg-slate-900 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
                    {editingSiteId ? 'Atualizar Projeto' : 'Publicar Demonstração'}
                  </button>
                </form>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sites.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group shadow-sm hover:shadow-xl transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shadow-inner">
                        {s.mediaType === 'video' ? <video src={s.mediaUrl} className="w-full h-full object-cover" /> : <img src={s.mediaUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-none mb-1">{s.title}</p>
                        <p className="text-[9px] uppercase font-black text-blue-500 tracking-widest">{categories.find(c => c.id === s.categoryId)?.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); setEditingSiteId(s.id); setSiteForm({...s, galleryUrls: s.galleryUrls || []}); }} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">Editar</button>
                      <button onClick={() => { if(confirm('Excluir demo?')) onDeleteSite(s.id); }} className="text-[9px] font-black uppercase tracking-widest text-red-300 hover:text-red-500">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consultants' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 h-fit">
                <h2 className="text-2xl font-black mb-8 text-slate-900 tracking-tight uppercase">Novo Consultor</h2>
                <form onSubmit={handleConsultantSubmit} className="space-y-6">
                  <input type="text" placeholder="Nome do Consultor" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold" value={consultantForm.name} onChange={(e) => setConsultantForm({ ...consultantForm, name: e.target.value })} />
                  <input type="text" placeholder="CPF" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold" value={consultantForm.cpf} onChange={(e) => setConsultantForm({ ...consultantForm, cpf: e.target.value })} />
                  <div onClick={() => consultantFileRef.current?.click()} className="border-4 border-dashed border-slate-100 p-12 rounded-[2.5rem] text-center cursor-pointer bg-slate-50/50 hover:bg-slate-100 transition-all">
                    <input type="file" accept="image/*" className="hidden" ref={consultantFileRef} onChange={handleConsultantFileChange} />
                    {consultantForm.photoUrl ? (
                      <div className="relative inline-block">
                        <img src={consultantForm.photoUrl} className="h-32 w-32 rounded-full mx-auto border-8 border-white shadow-2xl object-cover" />
                        <span className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></span>
                      </div>
                    ) : (
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto de Identificação</p>
                    )}
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-600 transition-all">Salvar Credenciamento</button>
                </form>
             </section>

             <div className="space-y-6">
                {consultants.map(c => (
                  <div key={c.id} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-2xl group relative overflow-hidden">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50">
                        <img src={c.photoUrl} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 uppercase tracking-tighter text-2xl leading-none mb-1">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID: {c.cpf}</p>
                      </div>
                      <button onClick={() => { if(confirm('Excluir consultor?')) onDeleteConsultant(c.id); }} className="p-3 text-red-200 hover:text-red-500 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleCopyLink(c.id)}
                        className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${copyStatus === c.id ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {copyStatus === c.id ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                            Copiado
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                            Copiar Link Público
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => navigate(`/consultant/${c.id}`)}
                        className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:shadow-blue-100 active:scale-95 transition-all"
                      >
                        Visualizar Painel
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Fluxo Comercial</h2>
              <div className="bg-blue-600 text-white px-8 py-3 rounded-full text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-200">
                {filteredAcquisitions.length} Negócios Registrados
              </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row flex-wrap gap-6 items-end">
              <div className="flex-1 min-w-[280px] w-full">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-3">Localizar Venda (Nome, CPF ou Site)</label>
                <div className="relative">
                  <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input 
                    type="text" 
                    placeholder="Pesquisa rápida..."
                    className="w-full pl-14 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] outline-none focus:border-blue-600 font-bold text-slate-700 shadow-inner"
                    value={saleSearchQuery}
                    onChange={(e) => setSaleSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full md:w-auto min-w-[220px]">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-3">Status</label>
                <select 
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] outline-none focus:border-blue-600 font-black text-[10px] uppercase tracking-widest text-slate-700 shadow-inner cursor-pointer"
                  value={saleStatusFilter}
                  onChange={(e) => setSaleStatusFilter(e.target.value as any)}
                >
                  <option value="all">Todos Status</option>
                  <option value="pending">Pendentes</option>
                  <option value="processing">Processando</option>
                  <option value="done">Finalizados</option>
                </select>
              </div>

              <div className="w-full md:w-auto">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-3">Filtrar por Data</label>
                <input 
                  type="date" 
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] outline-none focus:border-blue-600 font-black text-[10px] uppercase tracking-widest text-slate-700 shadow-inner"
                  value={saleDateFilter}
                  onChange={(e) => setSaleDateFilter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {filteredAcquisitions.map(acq => (
                <div key={acq.id} className="p-8 md:p-12 bg-white rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col gap-8 transition-all hover:translate-y-[-4px] group overflow-hidden">
                  <div className="flex flex-col lg:flex-row justify-between gap-10">
                    {/* Informações Principais */}
                    <div className="flex-1 space-y-6">
                      <div className="flex flex-wrap items-center gap-3">
                         <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${acq.status === 'pending' ? 'bg-amber-100 text-amber-700' : acq.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                           {acq.status === 'pending' ? '• Aguardando' : acq.status === 'processing' ? '• Em Produção' : '• Finalizado'}
                         </span>
                         <span className="bg-slate-900 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">{acq.siteTitle}</span>
                         <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest ml-auto">{new Date(acq.timestamp).toLocaleDateString()} às {new Date(acq.timestamp).toLocaleTimeString()}</span>
                      </div>
                      
                      <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{acq.clientName}</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest bg-slate-50 p-6 rounded-3xl">
                         <div className="flex flex-col gap-1">
                           <span className="text-slate-300 text-[8px]">CPF DO CLIENTE</span>
                           <span className="text-slate-700">{acq.clientCpf}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-slate-300 text-[8px]">WHATSAPP</span>
                           <span className="text-slate-700">{acq.clientPhone}</span>
                         </div>
                         <div className="flex flex-col gap-1 sm:col-span-2">
                           <span className="text-slate-300 text-[8px]">CONSULTOR RESPONSÁVEL</span>
                           <span className="text-slate-700">{consultants.find(c => c.id === acq.consultantId)?.name || 'N/A'}</span>
                         </div>
                      </div>

                      {acq.comment && (
                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">Comentário Interno</p>
                          <p className="text-xs text-blue-900 font-medium italic">"{acq.comment}"</p>
                        </div>
                      )}
                    </div>

                    {/* Ações Verticais */}
                    <div className="flex flex-col gap-3 w-full lg:w-64">
                      <button 
                        onClick={() => window.open(`https://wa.me/55${acq.clientPhone.replace(/\D/g,'')}`, '_blank')}
                        className="bg-[#25D366] text-white py-4 rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.14l-.905 3.307 3.385-.888c.828.45 1.485.657 2.263.658 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm3.28 8.135c-.145.408-.847.741-1.164.787-.317.045-.698.075-1.163-.074-.242-.077-.557-.19-1.203-.467-1.745-.749-2.874-2.533-2.961-2.647-.087-.115-.714-.95-.714-1.813 0-.863.453-1.288.614-1.46.161-.173.351-.215.468-.215.117 0 .234.001.336.006.106.005.249-.04.391.299.144.344.491 1.196.534 1.284.043.089.072.191.014.306-.058.115-.087.19-.174.288-.087.1-.184.223-.263.3-.087.086-.177.18-.076.353.101.173.448.74 0.96 1.196.659.585 1.215.767 1.388.854.173.086.274.072.375-.043.101-.115.432-.504.548-.677.116-.172.23-.144.389-.086.158.058 1.008.475 1.181.562.173.086.288.13.331.201.043.072.043.414-.102.822z"/></svg>
                        <span className="font-black text-[9px] uppercase tracking-widest">WhatsApp</span>
                      </button>

                      {acq.location && (
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps?q=${acq.location?.latitude},${acq.location?.longitude}`, '_blank')}
                          className="bg-slate-900 text-white py-4 rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          <span className="font-black text-[9px] uppercase tracking-widest">Ver Localização</span>
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button 
                          onClick={() => {
                            setEditingSale(acq);
                            setSaleEditForm({
                              status: acq.status,
                              comment: acq.comment || '',
                              attachmentUrl: acq.attachmentUrl || ''
                            });
                          }}
                          className="py-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm(`Excluir permanentemente o registro de ${acq.clientName}?`)) onDeleteAcquisition(acq.id);
                          }}
                          className="py-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all"
                        >
                          Apagar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAcquisitions.length === 0 && (
                <div className="py-20 text-center opacity-30 text-slate-300 font-black uppercase text-sm">Nenhum registro encontrado para estes filtros</div>
              )}
            </div>
          </div>
        )}
      </div>
      <footer className="mt-20 py-10 text-center opacity-20 text-[10px] font-black uppercase tracking-[0.5em]">TUPÃ Management • High Performance Instance</footer>
    </div>
  );
};

export default Manager;
