import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

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

export default function HaritaSayfasi() {
  const [araclar, araclarAyarla] = useState<any[]>([]);
  const [rota, rotaAyarla] = useState<any[]>([]);
  const [mesafe, mesafeAyarla] = useState(0);
  const [yukleniyor, yukleniyorAyarla] = useState(true);

  useEffect(() => {
    const verileriGetir = async () => {
      try {
        const erisimAnahtari = localStorage.getItem('erisim_anahtari');
        const config = { headers: { Authorization: `Bearer ${erisimAnahtari}` } };
        
        const [aracYanit, rotaYanit] = await Promise.all([
          axios.get('http://localhost:8000/api/harita/araclar', config),
          axios.get('http://localhost:8000/api/harita/rota', config)
        ]);
        
        araclarAyarla(aracYanit.data);
        rotaAyarla(rotaYanit.data.rota);
        mesafeAyarla(rotaYanit.data.toplam_mesafe_km);
      } catch (hata) {
        toast.error('Harita verileri yüklenemedi');
      } finally {
        yukleniyorAyarla(false);
      }
    };
    
    verileriGetir();
    const aralik = setInterval(verileriGetir, 10000); // 10 saniyede bir güncelle
    return () => clearInterval(aralik);
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
