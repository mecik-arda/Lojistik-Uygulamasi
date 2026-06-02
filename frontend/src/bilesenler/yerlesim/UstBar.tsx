import { Search, Sun, Moon, Bell, Check } from 'lucide-react';
import { useTema } from '../../baglam/TemaBaglami';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UstBarOzellikleri {
  baslik: string;
}

export default function UstBar({ baslik }: UstBarOzellikleri) {
  const { tema, temaDegistir } = useTema();
  const [bildirimlerAcik, bildirimlerAcikAyarla] = useState(false);
  const [bildirimler, bildirimlerAyarla] = useState<any[]>([]);
  const okunanOlmayanSayisi = bildirimler.filter(b => !b.okundu).length;
  
  const [aramaSorgusu, aramaSorgusuAyarla] = useState('');
  const yonlendir = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const disariTiklama = (olay: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(olay.target as Node)) {
        bildirimlerAcikAyarla(false);
      }
    };
    document.addEventListener('mousedown', disariTiklama);
    return () => document.removeEventListener('mousedown', disariTiklama);
  }, []);

  const bildirimOkunduIsaretle = (id: number) => {
    bildirimlerAyarla(bildirimler.map(b => b.id === id ? { ...b, okundu: true } : b));
  };


  const aramaYap = (olay: React.KeyboardEvent<HTMLInputElement>) => {
    if (olay.key === 'Enter' && aramaSorgusu.trim()) {
      yonlendir(`/mail-takip?q=${encodeURIComponent(aramaSorgusu.trim())}`);
    }
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-8 shrink-0 relative z-50"
      style={{
        background: 'var(--arka-plan-cam)',
        backdropFilter: 'blur(var(--cam-bulanik))',
        borderBottom: '1px solid var(--kenarlik)',
      }}
    >
      <h1 className="text-lg font-bold" style={{ color: 'var(--metin-birincil)' }}>
        {baslik}
      </h1>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--metin-soluk)' }}
          />
          <input
            type="text"
            placeholder="Doğal dil ile ara..."
            className="giris-alani pl-10"
            value={aramaSorgusu}
            onChange={(olay) => aramaSorgusuAyarla(olay.target.value)}
            onKeyDown={aramaYap}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 relative" ref={menuRef}>
        <button
          onClick={temaDegistir}
          className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
          style={{
            background: 'var(--arka-plan-ikincil)',
            color: 'var(--metin-ikincil)',
          }}
        >
          {tema === 'koyu' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => bildirimlerAcikAyarla(!bildirimlerAcik)}
          className="p-2.5 rounded-xl transition-all duration-200 relative hover:scale-105"
          style={{
            background: 'var(--arka-plan-ikincil)',
            color: 'var(--metin-ikincil)',
          }}
        >
          <Bell className="w-5 h-5" />
          {okunanOlmayanSayisi > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-nabiz">
              {okunanOlmayanSayisi}
            </span>
          )}
        </button>

        {bildirimlerAcik && (
          <div className="absolute right-12 top-14 w-80 rounded-2xl shadow-lg border z-50 overflow-hidden animate-solma-iceri"
            style={{
              background: 'var(--arka-plan-cam)',
              backdropFilter: 'blur(16px)',
              borderColor: 'var(--kenarlik)'
            }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--kenarlik)' }}>
              <h3 className="font-bold" style={{ color: 'var(--metin-birincil)' }}>Bildirimler</h3>
              <button 
                onClick={() => bildirimlerAyarla(bildirimler.map(b => ({ ...b, okundu: true })))}
                className="text-xs hover:underline" style={{ color: 'var(--renk-birincil)' }}
              >
                Tümünü Okundu İşaretle
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {bildirimler.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: 'var(--metin-soluk)' }}>Bildiriminiz yok.</div>
              ) : (
                bildirimler.map(bildirim => (
                  <div 
                    key={bildirim.id} 
                    className="p-4 border-b last:border-0 flex gap-3 hover:bg-black/10 transition-colors"
                    style={{ borderColor: 'var(--kenarlik)', opacity: bildirim.okundu ? 0.6 : 1 }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--metin-birincil)' }}>{bildirim.mesaj}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--metin-soluk)' }}>{bildirim.tarih}</p>
                    </div>
                    {!bildirim.okundu && (
                      <button 
                        onClick={() => bildirimOkunduIsaretle(bildirim.id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-green-500/20 text-green-500"
                        title="Okundu İşaretle"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div
          className="w-9 h-9 rounded-full gradient-vurgu flex items-center justify-center text-white text-sm font-semibold ml-2 cursor-pointer"
        >
          AY
        </div>
      </div>
    </header>
  );
}
