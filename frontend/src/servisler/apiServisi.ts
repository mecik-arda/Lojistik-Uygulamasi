import axios from 'axios';
import type { Mail } from '../tipler';

export const apiIstemcisi = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiIstemcisi.interceptors.request.use((yapilandirma) => {
  const token = localStorage.getItem('erisim_anahtari');
  if (token && yapilandirma.headers) {
    yapilandirma.headers.Authorization = `Bearer ${token}`;
  }
  return yapilandirma;
});

apiIstemcisi.interceptors.response.use(
  (yanit) => yanit,
  (hata) => {
    if (hata.response?.status === 401) {
      localStorage.removeItem('erisim_anahtari');
      window.location.href = '/';
    }
    return Promise.reject(hata);
  }
);

const mailDonustur = (veri: any): Mail => {
  if (!veri) return veri;
  return {
    ...veri,
    gonderenAd: veri.gonderen_ad || 'Bilinmeyen Gönderici',
    aciliyetSkoru: veri.aciliyet_skoru || 1,
    aiOzeti: veri.ai_ozeti || '',
    onIzleme: veri.icerik || '',
    kategori: veri.kategori || 'bilgi_amacli',
  } as Mail;
};

export const mailleriSenkronizeEt = async () => {
  const yanit = await apiIstemcisi.post('/mailler/senkronize');
  return yanit.data;
};

export const dogalArama = async (sorgu: string) => {
  const yanit = await apiIstemcisi.post('/mailler/dogal-arama', { sorgu });
  if (Array.isArray(yanit.data)) {
    return yanit.data.map(mailDonustur);
  }
  return yanit.data;
};

export const mailleriTopluIslem = async (mailIdleri: string[], islem: string, veri?: any) => {
  const yanit = await apiIstemcisi.post('/mailler/toplu-islem', { mailIdleri, islem, veri });
  return yanit.data;
};

export const mailleriGetir = async (): Promise<{ mailler: Mail[] }> => {
  const yanit = await apiIstemcisi.get('/mailler');
  const veri = yanit.data;
  if (veri && Array.isArray(veri.mailler)) {
    veri.mailler = veri.mailler.map(mailDonustur);
  }
  return veri;
};

export const bakimDurumuGetir = async () => {
  const yanit = await apiIstemcisi.get('/bakim/durum');
  return yanit.data;
};

export const bakimCalistir = async (mod: string) => {
  const yanit = await apiIstemcisi.post('/bakim/calistir', { mod });
  return yanit.data;
};

export const yapilandirmaGetir = async () => {
  const yanit = await apiIstemcisi.get('/ayarlar/getir');
  return yanit.data;
};

export const yapilandirmaGuncelle = async (veri: any) => {
  const yanit = await apiIstemcisi.put('/ayarlar/guncelle', veri);
  return yanit.data;
};

export const kendiRolumuGuncelle = async (yeni_rol: string) => {
  const yanit = await apiIstemcisi.put(`/yetki/ben/rol?yeni_rol=${yeni_rol}`);
  return yanit.data;
};
