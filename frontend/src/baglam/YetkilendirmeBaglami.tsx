import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Kullanici } from '../tipler';

interface YetkilendirmeBaglamiTipi {
  kullanici: Kullanici | null;
  girisYapildi: boolean;
  yukleniyor: boolean;
  girisYap: (token: string) => void;
  cikisYap: () => void;
}

const YetkilendirmeBaglami = createContext<YetkilendirmeBaglamiTipi | undefined>(undefined);

export function YetkilendirmeSaglayici({ children }: { children: ReactNode }) {
  const [kullanici, kullaniciAyarla] = useState<Kullanici | null>(null);
  const [yukleniyor, yukleniyorAyarla] = useState(true);

  const getDemoKullanici = (): Kullanici => {
    const emailAyar = localStorage.getItem('varsayilanMail') || 'demo@lojistikai.com';
    const kayitliAd = localStorage.getItem('kullaniciAdi');
    const ad = kayitliAd || emailAyar.split('@')[0];
    const rol = (localStorage.getItem('kullaniciRol') as any) || 'Yönetici';
    return {
      id: 'usr_001',
      email: emailAyar,
      ad,
      soyad: '',
      profilResmi: '',
      aktif: true,
      rol,
    };
  };

  useEffect(() => {
    const urlParametreleri = new URLSearchParams(window.location.search);
    const urlToken = urlParametreleri.get('token');
    
    if (urlToken) {
      localStorage.setItem('erisim_anahtari', urlToken);
      kullaniciAyarla(getDemoKullanici());
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const token = localStorage.getItem('erisim_anahtari');
      if (token) {
        kullaniciAyarla(getDemoKullanici());
      }
    }

    const guncelle = () => {
      if (localStorage.getItem('erisim_anahtari')) {
        kullaniciAyarla(getDemoKullanici());
      }
    };
    window.addEventListener('kullaniciGuncellendi', guncelle);

    yukleniyorAyarla(false);
    return () => window.removeEventListener('kullaniciGuncellendi', guncelle);
  }, []);

  const girisYap = (token: string) => {
    localStorage.setItem('erisim_anahtari', token);
    kullaniciAyarla(getDemoKullanici());
  };

  const cikisYap = () => {
    localStorage.removeItem('erisim_anahtari');
    kullaniciAyarla(null);
  };

  return (
    <YetkilendirmeBaglami.Provider
      value={{
        kullanici,
        girisYapildi: !!kullanici,
        yukleniyor,
        girisYap,
        cikisYap,
      }}
    >
      {children}
    </YetkilendirmeBaglami.Provider>
  );
}

export function useYetkilendirme() {
  const baglam = useContext(YetkilendirmeBaglami);
  if (!baglam) {
    throw new Error('useYetkilendirme, YetkilendirmeSaglayici icinde kullanilmalidir');
  }
  return baglam;
}
