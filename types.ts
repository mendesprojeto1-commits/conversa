export interface Category {
  id: string;
  name: string;
}

export interface DemoSite {
  id: string;
  title: string;
  link: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  categoryId: string;
  description: string;
}

export interface Consultant {
  id: string;
  name: string;
  cpf: string;
  photoUrl: string;
}

export type AcquisitionStatus = 'pending' | 'processing' | 'done';

export interface Acquisition {
  id: string;
  siteId: string;
  siteTitle: string;
  consultantId: string;
  clientName: string;
  clientPhone: string;
  clientCpf: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  status: AcquisitionStatus;
  comment?: string;
  attachmentUrl?: string;
}

export interface AppState {
  categories: Category[];
  sites: DemoSite[];
  consultants: Consultant[];
  acquisitions: Acquisition[];
}