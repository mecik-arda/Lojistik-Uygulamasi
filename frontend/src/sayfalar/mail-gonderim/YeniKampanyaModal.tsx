import { useState } from 'react';
import { X, Plus, Trash } from 'lucide-react';
import { apiIstemcisi } from '../../servisler/apiServisi';
import toast from 'react-hot-toast';

interface Alici {
  email: string;
  ad: string;
  sirket: string;
}

interface Props {
  kapat: () => void;
  basariylaOlusturuldu: () => void;
}

export default function YeniKampanyaModal({ kapat, basariylaOlusturuldu }: Props) {
  const [baslik, baslikAyarla] = useState('');
  const [konu, konuAyarla] = useState('');
  const [sablon, sablonAyarla] = useState('<p>Merhaba {{ad}},</p>');
  const [alicilar, alicilarAyarla] = useState<Alici[]>([]);
  
  const [yeniAliciEmail, yeniAliciEmailAyarla] = useState('');
  const [yeniAliciAd, yeniAliciAdAyarla] = useState('');
  const [yukleniyor, yukleniyorAyarla] = useState(false);

  const aliciEkle = () => {
    if (!yeniAliciEmail) return;
    alicilarAyarla([...alicilar, { email: yeniAliciEmail, ad: yeniAliciAd, sirket: '' }]);
    yeniAliciEmailAyarla('');
    yeniAliciAdAyarla('');
  };

  const aliciSil = (index: number) => {
    alicilarAyarla(alicilar.filter((_, i) => i !== index));
  };

  const kaydetVeBaslat = async () => {
    if (!baslik || !konu || alicilar.length === 0) {
      toast.error('Lütfen başlık, konu ve en az 1 alıcı ekleyin.');
      return;
    }
    
    yukleniyorAyarla(true);
    try {
      const yanit = await apiIstemcisi.post('/kampanyalar/', {
        baslik,
        konu,
        sablon_html: sablon,
        alicilar
      });
      
      const kampanyaId = yanit.data.id;
      
      // Kampanyayi baslat
      await apiIstemcisi.post(`/kampanyalar/${kampanyaId}/baslat`);
      
      toast.success('Kampanya oluşturuldu ve gönderim başlatıldı!');
      basariylaOlusturuldu();
    } catch (hata) {
      toast.error('Kampanya oluşturulamadı.');
      console.error(hata);
    } finally {
      yukleniyorAyarla(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-solma-iceri">
      <div className="cam-kart w-[600px] max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: 'var(--metin-birincil)' }}>Yeni Kampanya Başlat</h3>
          <button onClick={kapat} className="p-1 hover:bg-black/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 kaydirma-cubugu">
          <div>
            <label className="text-sm font-medium mb-1 block">Kampanya Başlığı</label>
            <input type="text" className="giris-alani" value={baslik} onChange={e => baslikAyarla(e.target.value)} placeholder="Örn: Haziran Bülteni" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Mail Konusu</label>
            <input type="text" className="giris-alani" value={konu} onChange={e => konuAyarla(e.target.value)} placeholder="Örn: Yeni Lojistik Çözümleri" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Mail İçeriği (HTML)</label>
            <textarea className="giris-alani h-32 font-mono text-sm" value={sablon} onChange={e => sablonAyarla(e.target.value)} />
          </div>
          
          <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--kenarlik)' }}>
            <h4 className="text-sm font-bold mb-2">Alıcılar ({alicilar.length})</h4>
            <div className="flex gap-2 mb-2">
              <input type="text" className="giris-alani" placeholder="E-posta" value={yeniAliciEmail} onChange={e => yeniAliciEmailAyarla(e.target.value)} />
              <input type="text" className="giris-alani" placeholder="Ad Soyad" value={yeniAliciAd} onChange={e => yeniAliciAdAyarla(e.target.value)} />
              <button onClick={aliciEkle} className="buton-ikincil shrink-0 px-3"><Plus className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alicilar.map((alici, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-black/10 text-sm">
                  <span>{alici.ad} - {alici.email}</span>
                  <button onClick={() => aliciSil(idx)} className="text-red-500 hover:text-red-600"><Trash className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--kenarlik)' }}>
          <button onClick={kapat} className="buton-ikincil bg-transparent">İptal</button>
          <button onClick={kaydetVeBaslat} disabled={yukleniyor} className="buton-birincil bg-green-600 border-none shadow-green-900/50">
            {yukleniyor ? 'Başlatılıyor...' : 'Kaydet ve Başlat'}
          </button>
        </div>
      </div>
    </div>
  );
}
