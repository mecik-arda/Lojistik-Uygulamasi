import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, Navigation, Clock, CloudRain, Sun, CloudSnow, Cloud, Car, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiIstemcisi } from '../../servisler/apiServisi';
import { useWebsocket } from '../../baglam/WebsocketBaglami';

// Leaflet ikon düzeltmesi
import L from 'leaflet';
import arabaIkonUrl from 'leaflet/dist/images/marker-icon.png';
import golgeIkonUrl from 'leaflet/dist/images/marker-shadow.png';

const varsayilanIkon = L.icon({
  iconUrl: arabaIkonUrl,
  shadowUrl: golgeIkonUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface Arac {
  id: number;
  plaka: string;
  surucu: string;
  lat: number;
  lng: number;
  durum: string;
  hiz: number;
}

export interface RotaNoktasi {
  id?: number;
  lat: number;
  lng: number;
  isim: string;
}

export interface AiAnalizi {
  eta_dakika: number;
  hava_durumu: string;
  trafik_durumu: string;
  ai_tavsiyesi: string;
}

export default function HaritaSayfasi() {
  const [araclar, araclarAyarla] = useState<Arac[]>([]);
  const [rota, rotaAyarla] = useState<RotaNoktasi[]>([]);
  const [mesafe, mesafeAyarla] = useState(0);
  const [aiAnalizVerisi, aiAnalizVerisiAyarla] = useState<AiAnalizi | null>(null);
  const [yukleniyor, yukleniyorAyarla] = useState(true);
  
  const { mesajlar } = useWebsocket();

  // WebSocket'ten gelen araç güncellemelerini dinle
  useEffect(() => {
    const sonMesaj = mesajlar[mesajlar.length - 1];
    if (sonMesaj && sonMesaj.tur === 'arac_guncellemesi' && sonMesaj.icerik) {
      try {
        const guncelAraclar = JSON.parse(sonMesaj.icerik);
        araclarAyarla(guncelAraclar);
      } catch (e) { }
    }
  }, [mesajlar]);

  useEffect(() => {
    const verileriGetir = async () => {
      try {
        const [aracYanit, rotaYanit] = await Promise.all([
          apiIstemcisi.get<Arac[]>('/harita/araclar'),
          apiIstemcisi.get<{ rota: RotaNoktasi[]; toplam_mesafe_km: number; ai_analizi?: AiAnalizi }>('/harita/rota')
        ]);
        
        araclarAyarla(aracYanit.data);
        rotaAyarla(rotaYanit.data.rota);
        mesafeAyarla(rotaYanit.data.toplam_mesafe_km);
        if (rotaYanit.data.ai_analizi) {
          aiAnalizVerisiAyarla(rotaYanit.data.ai_analizi);
        }
      } catch (hata) {
        toast.error('Harita verileri yüklenemedi');
      } finally {
        yukleniyorAyarla(false);
      }
    };
    
    verileriGetir();
    // setInterval kaldırıldı, websocket kullanılacak
  }, []);

  if (yukleniyor) {
    return <div className="p-8 text-center" style={{ color: 'var(--metin-soluk)' }}>Harita yükleniyor...</div>;
  }

  const rotaNoktalari = rota.map(n => [n.lat, n.lng] as [number, number]);

  return (
    <div className="space-y-6 animate-solma-iceri">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--metin-birincil)' }}>
          <MapPin className="w-6 h-6 text-blue-500" />
          Canlı Araç Takibi ve Akıllı Rota
        </h1>
        <div className="cam-kart px-4 py-2 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-500" />
          <span style={{ color: 'var(--metin-birincil)' }} className="font-semibold">
            Optimize Edilmiş Rota Uzunluğu: {mesafe} km
          </span>
        </div>
      </div>

      {aiAnalizVerisi && (
        <div className="cam-kart p-5 flex flex-col md:flex-row gap-6 items-center justify-between animate-solma-iceri" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--metin-ikincil)' }}>Tahmini Varış (ETA)</div>
              <div className="text-2xl font-bold text-white">{aiAnalizVerisi.eta_dakika} Dakika</div>
            </div>
          </div>
          
          <div className="flex gap-6 items-center">
            <div className="flex flex-col items-center gap-1">
              {aiAnalizVerisi.hava_durumu === 'Yağmurlu' ? <CloudRain className="w-6 h-6 text-blue-300" /> : 
               aiAnalizVerisi.hava_durumu === 'Karlı' ? <CloudSnow className="w-6 h-6 text-white" /> :
               aiAnalizVerisi.hava_durumu === 'Güneşli' ? <Sun className="w-6 h-6 text-yellow-400" /> :
               <Cloud className="w-6 h-6 text-gray-300" />}
              <span className="text-xs font-semibold" style={{ color: 'var(--metin-ikincil)' }}>{aiAnalizVerisi.hava_durumu}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Car className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-semibold" style={{ color: 'var(--metin-ikincil)' }}>{aiAnalizVerisi.trafik_durumu} Trafik</span>
            </div>
          </div>

          <div className="flex-1 max-w-lg bg-black/20 p-3 rounded-lg border border-white/5 flex gap-3 items-start">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-sm italic" style={{ color: 'var(--metin-soluk)' }}>
              {aiAnalizVerisi.ai_tavsiyesi}
            </p>
          </div>
        </div>
      )}

      <div className="cam-kart p-4 h-[600px] relative z-0">
        <MapContainer 
          center={[41.0082, 28.9784]} 
          zoom={11} 
          style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Araçları Göster */}
          {araclar.map((arac) => (
            <Marker key={arac.id} position={[arac.lat, arac.lng]} icon={varsayilanIkon}>
              <Popup>
                <div className="p-1">
                  <div className="font-bold flex items-center gap-1">
                    <Truck className="w-4 h-4" /> {arac.plaka}
                  </div>
                  <div className="text-sm mt-1">Sürücü: {arac.surucu}</div>
                  <div className="text-sm">Durum: {arac.durum}</div>
                  <div className="text-sm">Hız: {arac.hiz} km/s</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Rotayı Çiz */}
          {rotaNoktalari.length > 0 && (
            <Polyline positions={rotaNoktalari} color="blue" weight={4} opacity={0.7} />
          )}

          {/* Rota Duraklarını Göster */}
          {rota.map((durak, index) => (
            <Marker key={`durak-${index}`} position={[durak.lat, durak.lng]}>
              <Popup>
                <div className="font-bold">{durak.isim}</div>
                <div className="text-xs">Durak Sırası: {index + 1}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {araclar.map((arac) => (
          <div key={arac.id} className="cam-kart p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold flex items-center gap-2" style={{ color: 'var(--metin-birincil)' }}>
                <Truck className="w-4 h-4 text-blue-500" /> {arac.plaka}
              </span>
              <span className={`rozet ${arac.hiz > 0 ? 'rozet-basari' : 'rozet-uyari'}`}>
                {arac.durum}
              </span>
            </div>
            <div className="text-sm" style={{ color: 'var(--metin-ikincil)' }}>
              Sürücü: <span style={{ color: 'var(--metin-birincil)' }}>{arac.surucu}</span>
            </div>
            <div className="text-sm" style={{ color: 'var(--metin-ikincil)' }}>
              Güncel Hız: <span style={{ color: 'var(--metin-birincil)' }}>{arac.hiz} km/s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
