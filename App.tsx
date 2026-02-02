
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import Manager from './views/Manager';
import Showcase from './views/Showcase';
import ConsultantPage from './views/ConsultantPage';
import { AppState, Category, DemoSite, Consultant, Acquisition } from './types';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<DemoSite[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [acquisitions, setAcquisitions] = useState<Acquisition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      const { data: dSites } = await supabase.from('demo_sites').select('*').order('created_at', { ascending: false });
      const { data: cons } = await supabase.from('consultants').select('*').order('name');
      const { data: acqs } = await supabase.from('acquisitions').select('*').order('created_at', { ascending: false });

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
        photoPosition: c.photo_position || '50% 50%'
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

      setLoading(false);
    };

    fetchData();

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const addCategory = async (name: string) => {
    await supabase.from('categories').insert([{ name }]);
  };

  const addSite = async (site: Omit<DemoSite, 'id'>) => {
    await supabase.from('demo_sites').insert([{
      title: site.title,
      link: site.link,
      media_url: site.mediaUrl,
      media_type: site.mediaType,
      category_id: site.categoryId,
      description: site.description,
      gallery_urls: site.galleryUrls,
      object_position: site.objectPosition
    }]);
  };

  const updateSite = async (id: string, site: Omit<DemoSite, 'id'>) => {
    await supabase.from('demo_sites').update({
      title: site.title,
      link: site.link,
      media_url: site.mediaUrl,
      media_type: site.mediaType,
      category_id: site.categoryId,
      description: site.description,
      gallery_urls: site.galleryUrls,
      object_position: site.objectPosition
    }).eq('id', id);
  };

  const deleteSite = async (id: string) => {
    await supabase.from('demo_sites').delete().eq('id', id);
  };

  const addConsultant = async (consultant: Omit<Consultant, 'id'>) => {
    await supabase.from('consultants').insert([{
      name: consultant.name,
      cpf: consultant.cpf,
      photo_url: consultant.photoUrl,
      photo_position: consultant.photoPosition
    }]);
  };

  const deleteConsultant = async (id: string) => {
    await supabase.from('consultants').delete().eq('id', id);
  };

  const addAcquisition = async (acquisition: Omit<Acquisition, 'id' | 'timestamp' | 'status'>) => {
    await supabase.from('acquisitions').insert([{
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
  };

  const updateAcquisition = async (id: string, updates: Partial<Acquisition>) => {
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.comment !== undefined) payload.comment = updates.comment;
    if (updates.attachmentUrl !== undefined) payload.attachment_url = updates.attachmentUrl;

    await supabase.from('acquisitions').update(payload).eq('id', id);
  };

  const deleteAcquisition = async (id: string) => {
    await supabase.from('acquisitions').delete().eq('id', id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001A33]">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white font-black uppercase tracking-[0.5em] text-xs">Verificando sua internet</p>
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
              onDeleteConsultant={deleteConsultant}
              onUpdateAcquisition={updateAcquisition}
              onDeleteAcquisition={deleteAcquisition}
            />
          } 
        />
        <Route 
          path="/showcase" 
          element={
            <Showcase 
              categories={categories} 
              sites={sites} 
            />
          } 
        />
        <Route 
          path="/consultant/:id" 
          element={
            <ConsultantPage 
              categories={categories} 
              sites={sites} 
              consultants={consultants}
              onAddAcquisition={addAcquisition}
            />
          } 
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
