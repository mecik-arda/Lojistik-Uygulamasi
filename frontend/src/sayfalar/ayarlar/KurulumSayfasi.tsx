import { useState, useEffect } from 'react';
import { Eye, EyeOff, Info, CheckCircle, XCircle, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { yapilandirmaGetir, yapilandirmaGuncelle } from '../../servisler/apiServisi';

interface AyarBolumuOzellikleri {
  baslik: string;
  yapilandirildi: boolean;
  children: React.ReactNode;
}

function AyarBolumu({ baslik, yapilandirildi, children }: AyarBolumuOzellikleri) {
  return (
    <div className="cam-kart p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold" style={{ color: 'var(--metin-birincil)' }}>
          {baslik}
        </h3>
        {yapilandirildi ? (
          <span className="rozet rozet-basari">
            <CheckCircle className="w-3.5 h-3.5" />
            Yapılandırıldı
          </span>
        ) : (
          <span className="rozet rozet-tehlike">
            <XCircle className="w-3.5 h-3.5" />
            Yapılandırılmadı
          </span>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface SifreAlaniOzellikleri {
  etiket: string;
  deger: string;
  degistir: (deger: string) => void;
  ipucu: string;
  placeholder?: string;
}

function SifreAlani({ etiket, deger, degistir, ipucu, placeholder }: SifreAlaniOzellikleri) {
  const [goster, gosterAyarla] = useState(false);
  const [ipucuGoster, ipucuGosterAyarla] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--metin-ikincil)' }}>
          {etiket}
        </label>
        <div className="relative">
          <button
            onMouseEnter={() => ipucuGosterAyarla(true)}
            onMouseLeave={() => ipucuGosterAyarla(false)}
            className="p-0.5 rounded-full transition-colors"
            style={{ color: 'var(--metin-soluk)' }}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          {ipucuGoster && (
            <div
              className="absolute left-6 top-0 z-50 w-56 p-2.5 rounded-lg text-xs animate-solma-iceri"
              style={{
                background: 'var(--arka-plan-kart)',
                border: '1px solid var(--kenarlık)',
                color: 'var(--metin-ikincil)',
                boxShadow: 'var(--golge-yukselti)',
              }}
            >
              {ipucu}
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type={goster ? 'text' : 'password'}
          value={deger}
          onChange={(e) => degistir(e.target.value)}
          placeholder={placeholder || ''}
          className="giris-alani pr-10"
        />
        <button
          onClick={() => gosterAyarla(!goster)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--metin-soluk)' }}
        >
          {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function KurulumSayfasi() {
  const [googleClientId, googleClientIdAyarla] = useState('');
  const [googleClientSecret, googleClientSecretAyarla] = useState('');
  const [geminiApiAnahtari, geminiApiAnahtariAyarla] = useState('');
  const [sendgridApiAnahtari, sendgridApiAnahtariAyarla] = useState('');
  const [varsayilanMail, varsayilanMailAyarla] = useState('');
  const [kullaniciAdi, kullaniciAdiAyarla] = useState(() => localStorage.getItem('kullaniciAdi') || '');
  const [bildirimTercihi, bildirimTercihiAyarla] = useState(() => {
    const kayitli = localStorage.getItem('bildirimTercihi');
    return kayitli !== null ? kayitli === 'true' : true;
  });
  const [yukleniyor, yukleniyorAyarla] = useState(true);

  useEffect(() => {
    const yukle = async () => {
      try {
        const veri = await yapilandirmaGetir();
        if (veri.google_istemci_id) googleClientIdAyarla(veri.google_istemci_id);
        if (veri.google_istemci_sirri) googleClientSecretAyarla(veri.google_istemci_sirri);
        if (veri.gemini_api_anahtari) geminiApiAnahtariAyarla(veri.gemini_api_anahtari);
        if (veri.sendgrid_api_anahtari) sendgridApiAnahtariAyarla(veri.sendgrid_api_anahtari);
        if (veri.varsayilan_mail) varsayilanMailAyarla(veri.varsayilan_mail);
      } catch (hata) {
        console.error('Ayarlar yüklenemedi:', hata);
      } finally {
        yukleniyorAyarla(false);
      }
    };
    yukle();
  }, []);

  const kaydet = async () => {
    localStorage.setItem('varsayilanMail', varsayilanMail);
    localStorage.setItem('bildirimTercihi', String(bildirimTercihi));
    localStorage.setItem('kullaniciAdi', kullaniciAdi);
    window.dispatchEvent(new Event('kullaniciGuncellendi'));

    try {
      await yapilandirmaGuncelle({
        google_istemci_id: googleClientId,
        google_istemci_sirri: googleClientSecret,
        gemini_api_anahtari: geminiApiAnahtari,
        sendgrid_api_anahtari: sendgridApiAnahtari,
        varsayilan_mail: varsayilanMail
      });
      toast.success('Ayarlar başarıyla kaydedildi!');
    } catch (hata) {
      toast.error('Ayarlar kaydedilirken hata oluştu');
    }
  };

  if (yukleniyor) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--vurgu)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-solma-iceri">
      <div className="mb-2">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--metin-birincil)' }}>
          Sistem Yapılandırması
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--metin-ikincil)' }}>
          Uygulama servislerini yapılandırmak için gerekli bilgileri girin.
        </p>
      </div>

      <AyarBolumu baslik="Google OAuth Ayarları" yapilandirildi={!!(googleClientId && googleClientSecret)}>
        <SifreAlani
          etiket="Client ID"
          deger={googleClientId}
          degistir={googleClientIdAyarla}
          ipucu="Google Cloud Console'dan alınan OAuth 2.0 Client ID değeri."
          placeholder="xxxx.apps.googleusercontent.com"
        />
        <SifreAlani
          etiket="Client Secret"
          deger={googleClientSecret}
          degistir={googleClientSecretAyarla}
          ipucu="Google Cloud Console'dan alınan OAuth 2.0 Client Secret değeri."
          placeholder="GOCSPX-..."
        />
      </AyarBolumu>

      <AyarBolumu baslik="Gemini API" yapilandirildi={!!geminiApiAnahtari}>
        <SifreAlani
          etiket="API Anahtarı"
          deger={geminiApiAnahtari}
          degistir={geminiApiAnahtariAyarla}
          ipucu="Google AI Studio'dan alınan Gemini API anahtarı. Mail analizi için gereklidir."
          placeholder="AIzaSy..."
        />
      </AyarBolumu>

      <AyarBolumu baslik="SendGrid" yapilandirildi={!!sendgridApiAnahtari}>
        <SifreAlani
          etiket="API Anahtarı"
          deger={sendgridApiAnahtari}
          degistir={sendgridApiAnahtariAyarla}
          ipucu="SendGrid hesabınızdan alınan API anahtarı. Toplu mail gönderimi için gereklidir."
          placeholder="SG...."
        />
      </AyarBolumu>

      <AyarBolumu baslik="Genel Ayarlar" yapilandirildi={!!varsayilanMail}>
        <div className="mb-4">
          <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--metin-ikincil)' }}>
            Görünen Ad (Boş bırakılırsa mailden alınır)
          </label>
          <input
            type="text"
            value={kullaniciAdi}
            onChange={(e) => kullaniciAdiAyarla(e.target.value)}
            placeholder="Adınızı girin"
            className="giris-alani"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--metin-ikincil)' }}>
            Varsayılan Mail Adresi
          </label>
          <input
            type="email"
            value={varsayilanMail}
            onChange={(e) => varsayilanMailAyarla(e.target.value)}
            placeholder="noreply@lojistikai.com"
            className="giris-alani"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--metin-ikincil)' }}>
              Bildirimler
            </label>
            <div className="relative">
              <Info className="w-3.5 h-3.5" style={{ color: 'var(--metin-soluk)' }} />
            </div>
          </div>
          <button
            onClick={() => bildirimTercihiAyarla(!bildirimTercihi)}
            className={`w-11 h-6 rounded-full transition-all duration-300 relative ${bildirimTercihi ? 'bg-green-500' : ''}`}
            style={!bildirimTercihi ? { background: 'var(--kenarlık)' } : {}}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300"
              style={{ left: bildirimTercihi ? '22px' : '2px' }}
            />
          </button>
        </div>
      </AyarBolumu>

      <div className="flex justify-end">
        <button onClick={kaydet} className="buton-birincil">
          <Save className="w-4 h-4" />
          Kaydet
        </button>
      </div>
    </div>
  );
}
