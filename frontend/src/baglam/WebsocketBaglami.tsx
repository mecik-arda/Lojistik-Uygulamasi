import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useYetkilendirme } from './YetkilendirmeBaglami';
import { apiIstemcisi } from '../servisler/apiServisi';

interface Mesaj {
  id: string;
  icerik: string;
  tur: string;
}

interface WebsocketBaglamiTuru {
  mesajlar: Mesaj[];
  bagliMi: boolean;
}

const WebsocketBaglami = createContext<WebsocketBaglamiTuru | undefined>(undefined);

export const WebsocketSaglayici: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mesajlar, mesajlariAyarla] = useState<Mesaj[]>([]);
  const [bagliMi, bagliMiAyarla] = useState(false);

  const { kullanici } = useYetkilendirme();

  useEffect(() => {
    if (!kullanici) return;

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const baglan = () => {
      const wsBase = apiIstemcisi.defaults.baseURL?.replace('http', 'ws') || 'ws://localhost:8000/api';
      ws = new WebSocket(`${wsBase}/ws/${kullanici.id}`);

      ws.onopen = () => {
        bagliMiAyarla(true);
      };

      ws.onmessage = (olay) => {
        try {
          const veri = JSON.parse(olay.data);
          mesajlariAyarla((onceki) => [...onceki, veri]);
          if (veri.tur !== 'arac_guncellemesi' && veri.tur !== 'saglik_guncellemesi') {
            toast(veri.icerik || 'Yeni bildirim', {
              icon: '🔔',
              style: {
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            });
          }
        } catch (hata) {
          toast('Yeni bildirim alındı', {
              icon: '🔔',
              style: {
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            });
        }
      };

      ws.onclose = () => {
        bagliMiAyarla(false);
        reconnectTimeout = setTimeout(baglan, 5000);
      };
    };

    baglan();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [kullanici]);

  return (
    <WebsocketBaglami.Provider value={{ mesajlar, bagliMi }}>
      {children}
    </WebsocketBaglami.Provider>
  );
};

export const useWebsocket = () => {
  const baglam = useContext(WebsocketBaglami);
  if (baglam === undefined) {
    throw new Error('useWebsocket, WebsocketSaglayici icinde kullanilmalidir');
  }
  return baglam;
};
