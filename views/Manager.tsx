
import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  onUpdateConsultant: (id: string, consultant: Omit<Consultant, 'id'>) => Promise<void>;
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
  onUpdateConsultant,
  onDeleteConsultant,
  onUpdateAcquisition,
  onDeleteAcquisition
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sites' | 'consultants' | 'sales'>('sites');
  const [catName, setCatName] = useState('');
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editingConsultantId, setEditingConsultantId] = useState<string | null>(null);
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
  const siteDragRef = useRef<HTMLDivElement>(null);
  const consultantDragRef = useRef<HTMLDivElement>(null);

  const [siteForm, setSiteForm] = useState({
    title: '',
    link: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
    categoryId: '',
    description: '',
    galleryUrls: [] as string[],
    objectPosition: '50% 50%'
  });

  const [consultantForm, setConsultantForm] = useState({
    name: '',
    cpf: '',
    photoUrl: '',
    photoPosition: '50% 50%'
  });

  const [isDraggingFocus, setIsDraggingFocus] = useState(false);
  const [isDraggingConsultantFocus, setIsDraggingConsultantFocus] = useState(false);

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
      setSiteForm(prev => ({ ...prev, mediaUrl: base64, mediaType: isVideo ? 'video' : 'image', objectPosition: '50% 50%' }));
    }
  };

  const handleDragPosition = (e: React.MouseEvent | React.TouchEvent, ref: React.RefObject<HTMLDivElement>, setter: (pos: string) => void) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const xPercent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    setter(`${Math.round(xPercent)}% ${Math.round(yPercent)}%`);
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
      setConsultantForm(prev => ({ ...prev, photoUrl: base64, photoPosition: '50% 50%' }));
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
      try {
        await onAddCategory(catName);
        setCatName('');
      } catch (err: any) {
        alert("Erro ao adicionar categoria: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (siteForm.title && siteForm.link && siteForm.categoryId && siteForm.mediaUrl) {
      setIsSubmitting(true);
      try {
        if (editingSiteId) {
          await onUpdateSite(editingSiteId, siteForm);
          setEditingSiteId(null);
        } else {
          await onAddSite(siteForm);
        }
        setSiteForm({ title: '', link: '', mediaUrl: '', mediaType: 'image', categoryId: '', description: '', galleryUrls: [], objectPosition: '50% 50%' });
        if (siteFileRef.current) siteFileRef.current.value = '';
        if (galleryFileRef.current) galleryFileRef.current.value = '';
      } catch (err: any) {
        alert("Erro ao salvar projeto: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleConsultantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultantForm.name || !consultantForm.cpf || !consultantForm.photoUrl) {
      alert("⚠️ Preencha Nome, CPF e selecione uma Foto.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingConsultantId) {
        await onUpdateConsultant(editingConsultantId, consultantForm);
        alert("✅ Cadastro ATUALIZADO com sucesso!");
        setEditingConsultantId(null);
      } else {
        await onAddConsultant(consultantForm);
        alert("✅ Consultor CADASTRADO com sucesso!");
      }
      // Limpa formulário após sucesso
      setConsultantForm({ name: '', cpf: '', photoUrl: '', photoPosition: '50% 50%' });
      if (consultantFileRef.current) consultantFileRef.current.value = '';
    } catch (err: any) {
      console.error("Erro no Banco de Dados:", err);
      // Alerta detalhado para o usuário
      alert(`❌ FALHA AO SALVAR: ${err.message || 'Erro desconhecido.'}\n\nDica: Verifique se o CPF já existe ou se as tabelas foram criadas no SQL Editor.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditConsultant = (c: Consultant) => {
    setEditingConsultantId(c.id);
    setConsultantForm({
      name: c.name,
      cpf: c.cpf,
      photoUrl: c.photoUrl,
      photoPosition: c.photoPosition || '50% 50%'
    });
    // Rola para o topo onde está o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaleUpdateSubmit = async () => {
    if (editingSale) {
      setIsSubmitting(true);
      try {
        await onUpdateAcquisition(editingSale.id, {
          status: saleEditForm.status,
          comment: saleEditForm.comment,
          attachmentUrl: saleEditForm.attachmentUrl
        });
        setEditingSale(null);
      } catch (err: any) {
        alert("Erro ao atualizar venda: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
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
             <p className="font-black text-xs uppercase tracking-widest text-slate-900">Comunicando com o Banco...</p>
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
              onClick={() => { setActiveTab(tab.id as any); setEditingConsultantId(null); setConsultantForm({ name: '', cpf: '', photoUrl: '', photoPosition: '50% 50%' }); }}
              className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}/></svg>
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'consultants' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <section className={`p-10 rounded-[3rem] shadow-sm border h-fit transition-all duration-500 ${editingConsultantId ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-500/10' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className={`text-2xl font-black tracking-tight uppercase ${editingConsultantId ? 'text-blue-600' : 'text-slate-900'}`}>
                    {editingConsultantId ? 'Editando Consultor' : 'Novo Credenciamento'}
                  </h2>
                  {editingConsultantId && (
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Modo Edição Ativo</span>
                  )}
                </div>

                <form onSubmit={handleConsultantSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Nome Completo</label>
                    <input type="text" placeholder="Nome do Consultor" className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold" value={consultantForm.name} onChange={(e) => setConsultantForm({ ...consultantForm, name: e.target.value })} />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">CPF (Somente Números)</label>
                    <input type="text" placeholder="00000000000" className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold" value={consultantForm.cpf} onChange={(e) => setConsultantForm({ ...consultantForm, cpf: e.target.value.replace(/\D/g,'') })} />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Foto de Identificação (Clique na prévia para ajustar o foco)</label>
                    <input type="file" accept="image/*" className="hidden" ref={consultantFileRef} onChange={handleConsultantFileChange} />
                    
                    <div onClick={() => !consultantForm.photoUrl && consultantFileRef.current?.click()} className={`border-4 border-dashed p-8 rounded-[2.5rem] text-center cursor-pointer transition-all ${consultantForm.photoUrl ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                      {consultantForm.photoUrl ? (
                        <div className="space-y-6">
                          <div 
                            ref={consultantDragRef}
                            className="w-48 h-48 rounded-full mx-auto border-4 border-slate-100 shadow-2xl overflow-hidden relative cursor-crosshair select-none group/photo"
                            onMouseDown={() => setIsDraggingConsultantFocus(true)}
                            onMouseUp={() => setIsDraggingConsultantFocus(false)}
                            onMouseLeave={() => setIsDraggingConsultantFocus(false)}
                            onMouseMove={(e) => isDraggingConsultantFocus && handleDragPosition(e, consultantDragRef, (p) => setConsultantForm(prev => ({ ...prev, photoPosition: p })))}
                            onTouchStart={() => setIsDraggingConsultantFocus(true)}
                            onTouchEnd={() => setIsDraggingConsultantFocus(false)}
                            onTouchMove={(e) => isDraggingConsultantFocus && handleDragPosition(e, consultantDragRef, (p) => setConsultantForm(prev => ({ ...prev, photoPosition: p })))}
                            onClick={(e) => handleDragPosition(e, consultantDragRef, (p) => setConsultantForm(prev => ({ ...prev, photoPosition: p })))}
                          >
                            <img 
                              src={consultantForm.photoUrl} 
                              className="w-full h-full object-cover pointer-events-none" 
                              style={{ objectPosition: consultantForm.photoPosition }} 
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-black text-[8px] uppercase">Arraste para ajustar</span>
                            </div>
                            <div 
                              className="absolute w-6 h-6 -ml-3 -mt-3 border-2 border-white rounded-full bg-blue-500/50 backdrop-blur-sm pointer-events-none"
                              style={{ 
                                left: consultantForm.photoPosition.split(' ')[0], 
                                top: consultantForm.photoPosition.split(' ')[1] 
                              }}
                            />
                          </div>
                          <button type="button" onClick={() => consultantFileRef.current?.click()} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Trocar Imagem</button>
                        </div>
                      ) : (
                        <div className="py-4">
                           <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviar Foto</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    {editingConsultantId && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingConsultantId(null); setConsultantForm({ name: '', cpf: '', photoUrl: '', photoPosition: '50% 50%' }); }} 
                        className="flex-1 bg-slate-200 text-slate-500 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                    <button type="submit" disabled={isSubmitting} className={`flex-[2] py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all disabled:opacity-50 active:scale-95 ${editingConsultantId ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
                      {isSubmitting ? 'Processando...' : (editingConsultantId ? 'Atualizar Dados' : 'Finalizar Credenciamento')}
                    </button>
                  </div>
                </form>
             </section>

             <div className="space-y-6 overflow-y-auto max-h-[800px] pr-2 scrollbar-hide">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Consultores Ativos ({consultants.length})</h3>
                {consultants.length === 0 && (
                  <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-slate-300 font-bold uppercase text-xs">Nenhum consultor encontrado.</p>
                  </div>
                )}
                {consultants.map(c => (
                  <div key={c.id} className={`p-8 bg-white rounded-[3rem] border shadow-sm transition-all hover:shadow-2xl group relative overflow-hidden ${editingConsultantId === c.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50 relative">
                        <img src={c.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: c.photoPosition }} />
                        <button 
                          onClick={() => startEditConsultant(c)}
                          className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          title="Clique para Editar"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 uppercase tracking-tighter text-2xl leading-none mb-1">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Matrícula CPF: {c.cpf}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => startEditConsultant(c)} 
                          className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Editar Cadastro"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button 
                          onClick={() => { if(confirm('Excluir este consultor permanentemente?')) onDeleteConsultant(c.id).catch(e => alert(e.message)); }} 
                          className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Remover Consultor"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleCopyLink(c.id)}
                        className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${copyStatus === c.id ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-sm'}`}
                      >
                        {copyStatus === c.id ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                            Copiado
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                            Link Público
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => navigate(`/consultant/${c.id}`)}
                        className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all"
                      >
                        Abrir Perfil
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Capa Principal & Foco Visual (Clique e arraste na prévia)</label>
                    <input type="file" accept="image/*,video/*" className="hidden" ref={siteFileRef} onChange={handleSiteFileChange} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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

                      {siteForm.mediaUrl && (
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ajuste de Posição (Arraste)</p>
                          <div 
                            ref={siteDragRef}
                            className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 shadow-inner relative cursor-crosshair select-none"
                            onMouseDown={() => setIsDraggingFocus(true)}
                            onMouseUp={() => setIsDraggingFocus(false)}
                            onMouseLeave={() => setIsDraggingFocus(false)}
                            onMouseMove={(e) => isDraggingFocus && handleDragPosition(e, siteDragRef, (p) => setSiteForm(prev => ({ ...prev, objectPosition: p })))}
                            onTouchStart={() => setIsDraggingFocus(true)}
                            onTouchEnd={() => setIsDraggingFocus(false)}
                            onTouchMove={(e) => isDraggingFocus && handleDragPosition(e, siteDragRef, (p) => setSiteForm(prev => ({ ...prev, objectPosition: p })))}
                            onClick={(e) => handleDragPosition(e, siteDragRef, (p) => setSiteForm(prev => ({ ...prev, objectPosition: p })))}
                          >
                            {siteForm.mediaType === 'video' ? (
                              <video 
                                src={siteForm.mediaUrl} 
                                className="w-full h-full object-cover pointer-events-none" 
                                style={{ objectPosition: siteForm.objectPosition }} 
                                muted autoPlay loop 
                              />
                            ) : (
                              <img 
                                src={siteForm.mediaUrl} 
                                className="w-full h-full object-cover pointer-events-none" 
                                style={{ objectPosition: siteForm.objectPosition }} 
                              />
                            )}
                            
                            <div 
                              className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-white rounded-full bg-blue-500/50 backdrop-blur-sm pointer-events-none"
                              style={{ 
                                left: siteForm.objectPosition.split(' ')[0], 
                                top: siteForm.objectPosition.split(' ')[1] 
                              }}
                            >
                              <div className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full"></div>
                            </div>
                          </div>
                        </div>
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
                      <button onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); setEditingSiteId(s.id); setSiteForm({...s, galleryUrls: s.galleryUrls || [], objectPosition: s.objectPosition || '50% 50%'}); }} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">Editar</button>
                      <button onClick={() => { if(confirm('Excluir demo?')) onDeleteSite(s.id); }} className="text-[9px] font-black uppercase tracking-widest text-red-300 hover:text-red-500">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
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
                    {/* Main Info */}
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

                    {/* Actions */}
                    <div className="flex flex-col gap-3 w-full lg:w-64">
                      <button 
                        onClick={() => window.open(`https://wa.me/55${acq.clientPhone.replace(/\D/g,'')}`, '_blank')}
                        className="bg-[#25D366] text-white py-4 rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl"
                      >
                        <span className="font-black text-[9px] uppercase tracking-widest">WhatsApp</span>
                      </button>

                      {acq.location && (
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps?q=${acq.location?.latitude},${acq.location?.longitude}`, '_blank')}
                          className="bg-slate-900 text-white py-4 rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl"
                        >
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
                            if(confirm(`Excluir permanentemente o registro de ${acq.clientName}?`)) onDeleteAcquisition(acq.id).catch(e => alert(e.message));
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
            </div>
          </div>
        )}
      </div>
      <footer className="mt-20 py-10 text-center opacity-20 text-[10px] font-black uppercase tracking-[0.5em]">TUPÃ Management • High Performance</footer>
    </div>
  );
};

export default Manager;
