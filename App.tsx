
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './views/Home.tsx';
import Manager from './views/Manager.tsx';
import Showcase from './views/Showcase.tsx';
import ConsultantPage from './views/ConsultantPage.tsx';
import { Category, DemoSite, Consultant, Acquisition } from './types.ts';
import { supabase } from './services/supabase.ts';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<DemoSite[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [acquisitions, setAcquisitions] = useState<Acquisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { data: cats, error: catErr } = await supabase.from('categories').select('*').order('name');
      const { data: dSites, error: siteErr } = await supabase.from('demo_sites').select('*').order('created_at', { ascending: false });
      const { data: cons, error: consErr } = await supabase.from('consultants').select('*').order('name');
      const { data: acqs, error: acqErr } = await supabase.from('acquisitions').select('*').order('created_at', { ascending: false });

      if (catErr || siteErr || consErr || acqErr) {
        throw new Error("Erro ao sincronizar dados do servidor.");
      }

      if (cats) setCategories(cats);
      if (dSites) setSites(dSites.map(s => ({
        ...s,
        categoryId: s.category_id,
        mediaUrl: s.media_url,
        mediaType: s.media_type,
        galleryUrls: s.gallery_urls || [],
        objectPosition: s.object_position || '50% 50%'
      })));
      if (cons) setConsultants(cons.map(c => ({
        ...c,
        photoUrl: c.photo_url,
        photoPosition: c.photo_position || '50% 50%',
        whatsapp: c.whatsapp
      })));
      if (acqs) setAcquisitions(acqs.map(a => ({
        ...a,
        siteId: a.site_id,
        siteTitle: a.site_title,
        consultantId: a.consultant_id,
        clientName: a.client_name,
        clientPhone: a.client_phone,
        clientCpf: a.client_cpf,
        attachmentUrl: a.attachment_url,
        comment: a.comment,
        timestamp: new Date(a.created_at).getTime(),
        location: a.latitude ? { latitude: a.latitude, longitude: a.longitude } : undefined
      })));
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('db-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const addCategory = async (name: string) => {
    const { error } = await supabase.from('categories').insert([{ name }]);
    if (error) throw error;
  };

  const addSite = async (site: Omit<DemoSite, 'id'>) => {
    const { error } = await supabase.from('demo_sites').insert([{
      title: site.title,
      link: site.link,
      media_url: site.mediaUrl,
      media_type: site.mediaType,
      category_id: site.categoryId,
      description: site.description,
      gallery_urls: site.galleryUrls,
      object_position: site.objectPosition
    }]);
    if (error) throw error;
  };

  const updateSite = async (id: string, site: Omit<DemoSite, 'id'>) => {
    const { error } = await supabase.from('demo_sites').update({
      title: site.title,
      link: site.link,
      media_url: site.mediaUrl,
      media_type: site.mediaType,
      category_id: site.categoryId,
      description: site.description,
      gallery_urls: site.galleryUrls,
      object_position: site.objectPosition
    }).eq('id', id);
    if (error) throw error;
  };

  const deleteSite = async (id: string) => {
    const { error } = await supabase.from('demo_sites').delete().eq('id', id);
    if (error) throw error;
  };

  const addConsultant = async (consultant: Omit<Consultant, 'id'>) => {
    const { error } = await supabase.from('consultants').insert([{
      name: consultant.name,
      cpf: consultant.cpf,
      whatsapp: consultant.whatsapp,
      photo_url: consultant.photoUrl,
      photo_position: consultant.photoPosition
    }]);
    if (error) throw error;
  };

  const updateConsultant = async (id: string, consultant: Omit<Consultant, 'id'>) => {
    const { error } = await supabase.from('consultants').update({
      name: consultant.name,
      cpf: consultant.cpf,
      whatsapp: consultant.whatsapp,
      photo_url: consultant.photoUrl,
      photo_position: consultant.photoPosition
    }).eq('id', id);
    if (error) throw error;
  };

  const deleteConsultant = async (id: string) => {
    const { error } = await supabase.from('consultants').delete().eq('id', id);
    if (error) throw error;
  };

  const addAcquisition = async (acquisition: Omit<Acquisition, 'id' | 'timestamp' | 'status'>) => {
    const { error } = await supabase.from('acquisitions').insert([{
      site_id: acquisition.siteId,
      site_title: acquisition.siteTitle,
      consultant_id: acquisition.consultantId,
      client_name: acquisition.clientName,
      client_phone: acquisition.clientPhone,
      client_cpf: acquisition.clientCpf,
      latitude: acquisition.location?.latitude,
      longitude: acquisition.location?.longitude,
      status: 'pending'
    }]);
    if (error) throw error;
  };

  const updateAcquisition = async (id: string, updates: Partial<Acquisition>) => {
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.comment !== undefined) payload.comment = updates.comment;
    if (updates.attachmentUrl !== undefined) payload.attachment_url = updates.attachmentUrl;

    const { error } = await supabase.from('acquisitions').update(payload).eq('id', id);
    if (error) throw error;
  };

  const deleteAcquisition = async (id: string) => {
    const { error } = await supabase.from('acquisitions').delete().eq('id', id);
    if (error) throw error;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001A33]">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white font-black uppercase tracking-[0.5em] text-xs">Sincronizando Sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000814] p-6 text-white">
        <div className="max-w-md text-center bg-red-500/10 p-10 rounded-[2.5rem] border border-red-500/20">
          <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Erro de Inicialização</h2>
          <p className="text-red-200/60 mb-8">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/manager" 
          element={
            <Manager 
              categories={categories} 
              sites={sites} 
              consultants={consultants}
              acquisitions={acquisitions}
              onAddCategory={addCategory} 
              onAddSite={addSite}
              onUpdateSite={updateSite}
              onDeleteSite={deleteSite}
              onAddConsultant={addConsultant}
              onUpdateConsultant={updateConsultant}
              onDeleteConsultant={deleteConsultant}
              onUpdateAcquisition={updateAcquisition}
              onDeleteAcquisition={deleteAcquisition}
            />
          } 
        />
        <Route path="/showcase" element={<Showcase categories={categories} sites={sites} />} />
        <Route path="/consultant/:id" element={<ConsultantPage categories={categories} sites={sites} consultants={consultants} onAddAcquisition={addAcquisition} />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
