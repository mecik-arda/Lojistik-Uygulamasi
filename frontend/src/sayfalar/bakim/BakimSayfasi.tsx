import { useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  Shield,
  Activity,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Info,
  X,
  Database
} from 'lucide-react';
import { bakimDurumuGetir, bakimCalistir } from '../../servisler/apiServisi';
import toast from 'react-hot-toast';
import axios from 'axios';
import SistemGrafikleri from './SistemGrafikleri';
import { useYetkilendirme } from '../../baglam/YetkilendirmeBaglami';

const durumIkonu: Record<string, { Ikon: typeof CheckCircle; renk: string; arkaplan: string }> = {
  basarili: { Ikon: CheckCircle, renk: '#10b981', arkaplan: 'rgba(16, 185, 129, 0.1)' },
  uyari: { Ikon: AlertTriangle, renk: '#f59e0b', arkaplan: 'rgba(245, 158, 11, 0.1)' },
  hata: { Ikon: AlertTriangle, renk: '#ef4444', arkaplan: 'rgba(239, 68, 68, 0.1)' },
};

const modSecenekleri = [
  'Tam Bakım',
  'Sadece Temizlik',
  'Sadece Güvenlik',
  'Sadece Rapor',
];

export default function BakimSayfasi() {
  const [seciliMod, seciliModAyarla] = useState('Tam Bakım');
  const [durum, durumAyarla] = useState<any>(null);
  const [calisiyor, calisiyorAyarla] = useState(false);
  const [sonRaporId, sonRaporIdAyarla] = useState<string | null>(null);
  const [modalAcik, modalAcikAyarla] = useState(false);
  const { kullanici } = useYetkilendirme();

  const dosyaIndir = (url: string, dosyaAdi: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = dosyaAdi;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const veritabaniniYedekle = async () => {
    toast.loading('Veritabanı yedekleniyor ve şifreleniyor...', { id: 'yedekleme' });
    try {
      const erisimAnahtari = localStorage.getItem('erisim_anahtari');
      const yanit = await axios.post(
        'http://localhost:8000/api/yedekleme/olustur',
        {},
        { headers: { Authorization: `Bearer ${erisimAnahtari}` } }
      );
      toast.success(yanit.data.mesaj, { id: 'yedekleme' });
      dosyaIndir(`http://localhost:8000/api/yedekleme/indir/${yanit.data.dosya}?token=${erisimAnahtari}`, yanit.data.dosya);
    } catch (hata) {
      toast.error('Yedekleme sırasında hata oluştu.', { id: 'yedekleme' });
    }
  };

  const verileriGetir = async () => {
    try {
      const yanit = await bakimDurumuGetir();
      durumAyarla(yanit);
    } catch (hata) {
      toast.error('Sistem durumu alınamadı');
    }
  };

  useEffect(() => {
    verileriGetir();
    
    // Canlı kaynak verileri için WebSocket bağlantısı
    const ws = new WebSocket(`ws://localhost:8000/api/ws/saglik/${kullanici?.id || 'anon'}`);
    
    ws.onmessage = (event) => {
      try {
        const veri = JSON.parse(event.data);
        if (veri.tip === 'saglik_guncellemesi') {
          durumAyarla((onceki: any) => {
            if (!onceki) return onceki;
            return {
              ...onceki,
              cpu_kullanimi: veri.cpu,
              ram_kullanimi: veri.ram,
            };
          });
        }
      } catch (err) {
        console.error('WebSocket veri hatası:', err);
      }
    };
    
    return () => {
      ws.close();
    };
  }, [kullanici]);

  const bakimBaslat = async () => {
    calisiyorAyarla(true);
    toast.loading('Bakım görevi çalıştırılıyor...', { id: 'bakim' });
    try {
      const yanit = await bakimCalistir(seciliMod);
      toast.success('Bakım görevi tamamlandı!', { id: 'bakim' });
      sonRaporIdAyarla(yanit.id);
      await verileriGetir();
    } catch (hata) {
      toast.error('Bakım çalıştırılırken hata oluştu', { id: 'bakim' });
    } finally {
      calisiyorAyarla(false);
    }
  };

  const raporIndir = () => {
    if (sonRaporId) {
      const erisimAnahtari = localStorage.getItem('erisim_anahtari');
      dosyaIndir(`http://localhost:8000/api/bakim/rapor/${sonRaporId}?token=${erisimAnahtari}`, `bakim_raporu_${sonRaporId}.pdf`);
    }
  };

  if (!durum) {
    return <div className="p-8 text-center" style={{ color: 'var(--metin-soluk)' }}>Yükleniyor...</div>;
  }

  const saglikSkoru = durum.saglik_skoru || 0;
  const daireselYuzde = (2 * Math.PI * 56) * (1 - saglikSkoru / 100);

  const moduller = [
    {
      id: 'disk',
      baslik: 'Disk Temizliği',
      Ikon: HardDrive,
      aciklama: `Durum: ${durum.disk_durumu}`,
      durum: durum.disk_durumu === 'Normal' ? 'basarili' : 'uyari',
      detay: 'Geçici dosyalar, log arşivleri ve önbellek analizi.',
    },
    {
      id: 'guncelleme',
      baslik: 'Güncellemeler',
      Ikon: Download,
      aciklama: `Durum: ${durum.guncelleme_durumu}`,
      durum: durum.guncelleme_durumu === 'Guncel' ? 'basarili' : 'uyari',
      detay: 'Sistem bileşenleri, güvenlik yamaları ve veritabanı güncellemeleri.',
    },
    {
      id: 'guvenlik',
      baslik: 'Güvenlik',
      Ikon: Shield,
      aciklama: `Durum: ${durum.guvenlik_durumu}`,
      durum: durum.guvenlik_durumu === 'Temiz' ? 'basarili' : 'uyari',
      detay: 'Zararlı yazılım taraması, port kontrolü ve erişim log analizi.',
    },
    {
      id: 'kaynak',
      baslik: 'Kaynaklar (Canlı)',
      Ikon: Activity,
      aciklama: `CPU: %${durum.cpu_kullanimi.toFixed(1)}, RAM: %${durum.ram_kullanimi.toFixed(1)}`,
      durum: (durum.cpu_kullanimi > 80 || durum.ram_kullanimi > 80) ? 'hata' : 'basarili',
      detay: 'Sistem kaynak kullanımı canlı (psutil) olarak takip ediliyor.',
    },
  ];

  return (
    <div className="space-y-6 animate-solma-iceri">
      <div className="cam-kart p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="var(--arka-plan-ikincil)"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="url(#saglikGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={daireselYuzde}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="saglikGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor={saglikSkoru < 50 ? "#ef4444" : "#6366f1"} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: 'var(--metin-birincil)' }}>
                  %{saglikSkoru}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--metin-soluk)' }}>
                  Sağlık Skoru
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: 'var(--metin-soluk)' }}>
                  Son Çalıştırma
                </p>
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--metin-birincil)' }}>
                  <Clock className="w-4 h-4" style={{ color: 'var(--metin-ikincil)' }} />
                  {durum.son_calistirma ? new Date(durum.son_calistirma).toLocaleString('tr-TR') : 'Hiç çalıştırılmadı'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--metin-soluk)' }}>
                  Sistem Yükü
                </p>
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--metin-birincil)' }}>
                  <Activity className="w-4 h-4" style={{ color: 'var(--vurgu-birincil)' }} />
                  CPU: %{durum.cpu_kullanimi.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              <button onClick={() => modalAcikAyarla(true)} className="buton-ikincil" title="Modül Bilgileri">
                <Info className="w-4 h-4" />
                Bilgi Al
              </button>
              {sonRaporId && (
                <button onClick={raporIndir} className="buton-ikincil" title="Son raporu indir">
                  <FileText className="w-4 h-4" />
                  Rapor (PDF)
                </button>
              )}
            </div>
            <span className={`rozet ${saglikSkoru >= 80 ? 'rozet-basari' : 'rozet-tehlike'}`}>
              <CheckCircle className="w-3.5 h-3.5" />
              {saglikSkoru >= 80 ? 'Sistem Sağlıklı' : 'Kritik Durum'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {moduller.map((modul) => {
          const durumBilgisi = durumIkonu[modul.durum];
          return (
            <div key={modul.id} className="cam-kart p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: durumBilgisi.arkaplan }}
                  >
                    <modul.Ikon className="w-5 h-5" style={{ color: durumBilgisi.renk }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--metin-birincil)' }}>
                      {modul.baslik}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--metin-ikincil)' }}>
                      {modul.aciklama}
                    </p>
                  </div>
                </div>
                <durumBilgisi.Ikon className="w-5 h-5" style={{ color: durumBilgisi.renk }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--metin-soluk)' }}>
                {modul.detay}
              </p>
            </div>
          );
        })}
      </div>

      {kullanici && (
        <SistemGrafikleri kullaniciId={kullanici.id} />
      )}

      <div className="cam-kart p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={seciliMod}
              onChange={(e) => seciliModAyarla(e.target.value)}
              className="giris-alani py-2 px-4 text-sm w-auto"
              disabled={calisiyor}
            >
              {modSecenekleri.map((mod) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
            <span className="text-xs" style={{ color: 'var(--metin-soluk)' }}>
              Bakım modunu seçip çalıştırın. PDF raporu otomatik oluşturulacaktır.
            </span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={veritabaniniYedekle} 
              disabled={calisiyor}
              className="buton-ikincil flex items-center gap-2"
              title="Şifreli Yedek Al"
            >
              <Database className="w-4 h-4 text-purple-500" />
              Yedekle
            </button>
            <button 
              onClick={bakimBaslat} 
              disabled={calisiyor}
              className="buton-birincil"
            >
              <Play className={`w-4 h-4 ${calisiyor ? 'animate-pulse' : ''}`} />
              {calisiyor ? 'Çalışıyor...' : 'Şimdi Çalıştır'}
            </button>
          </div>
        </div>
      </div>

      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-solma-iceri">
          <div className="cam-kart max-w-2xl w-full p-6 relative flex flex-col max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => modalAcikAyarla(false)} 
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: 'var(--metin-birincil)' }} />
            </button>
            
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--metin-birincil)' }}>
              <Info className="w-5 h-5 text-blue-500" />
              Sistem Bakım Modülleri Bilgilendirme
            </h2>
            
            <div className="space-y-6 text-sm">
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-semibold text-base flex items-center gap-2 mb-2" style={{ color: 'var(--metin-birincil)' }}>
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  1. Disk Temizliği
                </h3>
                <p style={{ color: 'var(--metin-ikincil)' }} className="mb-2">
                  Sistemdeki gereksiz geçici dosyaları temizleyerek disk alanını boşaltır.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: 'var(--metin-soluk)' }}>
                  <li>Kullanıcı Geçici Dizinleri (%temp%) taranır ve temizlenir.</li>
                  <li>Sistem Geçici Dizinleri (C:\Windows\Temp) taranır ve temizlenir.</li>
                  <li>Windows Prefetch (Önbellek) dizini taranır ve temizlenir.</li>
                  <li>Kilitli veya kullanımda olan dosyalar güvenle atlanır.</li>
                </ul>
              </div>

              <div className="border-b border-white/10 pb-4">
                <h3 className="font-semibold text-base flex items-center gap-2 mb-2" style={{ color: 'var(--metin-birincil)' }}>
                  <Download className="w-4 h-4 text-amber-500" />
                  2. Sistem Güncellemeleri
                </h3>
                <p style={{ color: 'var(--metin-ikincil)' }} className="mb-2">
                  Uygulamanın çalışması için gerekli olan sistem kütüphanelerini, güvenlik yamalarını ve veritabanı şema durumlarını denetler.
                </p>
              </div>

              <div className="border-b border-white/10 pb-4">
                <h3 className="font-semibold text-base flex items-center gap-2 mb-2" style={{ color: 'var(--metin-birincil)' }}>
                  <Shield className="w-4 h-4 text-blue-500" />
                  3. Güvenlik Taraması
                </h3>
                <p style={{ color: 'var(--metin-ikincil)' }} className="mb-2">
                  Hem ağ (port) hem de uygulama (statik kod) düzeyinde zafiyet analizleri gerçekleştirir.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: 'var(--metin-soluk)' }}>
                  <li><b>Port Taraması:</b> Localhost üzerinde aktif çalışan veya dışarıya açık olan kritik portları (21, 22, 23, 80, 443, 3306, 5432, 6379, 8000, 5173 vb.) socket ile tarar.</li>
                  <li><b>Zararlı Yazılım Taraması:</b> Proje kök dizinindeki kod dosyalarını analiz ederek zafiyet oluşturabilecek şüpheli kod kalıplarını (eval, exec, os.system vb.) statik yöntemle tespit eder.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-base flex items-center gap-2 mb-2" style={{ color: 'var(--metin-birincil)' }}>
                  <Activity className="w-4 h-4 text-purple-500" />
                  4. Canlı Kaynak İzleme
                </h3>
                <p style={{ color: 'var(--metin-ikincil)' }}>
                  Python psutil servisi aracılığıyla ana bilgisayarın anlık CPU ve RAM kullanım oranlarını canlı olarak takip eder ve arayüze aktarır.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
