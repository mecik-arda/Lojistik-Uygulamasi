import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { TemaModu } from '../tipler';

interface TemaBaglamiTipi {
  tema: TemaModu;
  temaDegistir: () => void;
}

const TemaBaglami = createContext<TemaBaglamiTipi | undefined>(undefined);

export function TemaSaglayici({ children }: { children: ReactNode }) {
  const [tema, temaAyarla] = useState<TemaModu>(() => {
    const kayitliTema = localStorage.getItem('tema') as TemaModu | null;
    return kayitliTema || 'koyu';
  });

  useEffect(() => {
    const kokElement = document.documentElement;
    if (tema === 'koyu') {
      kokElement.classList.add('dark');
    } else {
      kokElement.classList.remove('dark');
    }
    localStorage.setItem('tema', tema);
  }, [tema]);

  const temaDegistir = () => {
    temaAyarla((onceki) => (onceki === 'koyu' ? 'acik' : 'koyu'));
  };

  return (
    <TemaBaglami.Provider value={{ tema, temaDegistir }}>
      {children}
    </TemaBaglami.Provider>
  );
}

export function useTema() {
  const baglam = useContext(TemaBaglami);
  if (!baglam) {
    throw new Error('useTema, TemaSaglayici icinde kullanilmalidir');
  }
  return baglam;
}
