import {
  Mail,
  Clock,
  Send,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Settings,
  RefreshCw,
  Plus,
  Sparkles,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { useYetkilendirme } from '../../baglam/YetkilendirmeBaglami';
import { kategoriyiTurkcele, aciliyetRengi } from '../../yardimcilar';
import type { MailKategorisi, Mail as MailTipi } from '../../tipler';
import { useNavigate } from 'react-router-dom';
import { mailleriGetir } from '../../servisler/apiServisi';

const bugunTarihi = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(new Date());

const istatistikler = [
  {
    baslik: 'Bugünkü Mailler',
    deger: 47,
    degisim: 12,
    yukseliyor: true,
    renk: '#10b981',
    arkaplan: 'rgba(16, 185, 129, 0.1)',
    Ikon: Mail,
  },
  {
    baslik: 'Bekleyen Yanıtlar',
    deger: 12,
    degisim: 3,
    yukseliyor: false,
    renk: '#ef4444',
    arkaplan: 'rgba(239, 68, 68, 0.1)',
    Ikon: Clock,
  },
  {
    baslik: 'Aktif Kampanyalar',
    deger: 3,
    degisim: 1,
    yukseliyor: true,
    renk: '#f97316',
    arkaplan: 'rgba(249, 115, 22, 0.1)',
    Ikon: Send,
  },
  {
    baslik: 'Sistem Sağlığı',
    deger: 94,
    degisim: 2,
    yukseliyor: true,
    renk: '#10b981',
    arkaplan: 'rgba(16, 185, 129, 0.1)',
    Ikon: Shield,
    yuzde: true,
  },
];



const haftalikVeri = [
  { gun: 'Pzt', gelen: 42, giden: 18 },
  { gun: 'Sal', gelen: 38, giden: 22 },
  { gun: 'Çar', gelen: 55, giden: 31 },
  { gun: 'Per', gelen: 47, giden: 25 },
  { gun: 'Cum', gelen: 61, giden: 34 },
  { gun: 'Cmt', gelen: 15, giden: 8 },
  { gun: 'Paz', gelen: 8, giden: 3 },
];

const kategoriRozeti: Record<string, string> = {
  siparis_talebi: 'rozet-bilgi',
  musteri_sikayeti: 'rozet-tehlike',
  tedarikci_bildirimi: 'rozet-uyari',
  odeme: 'rozet-basari',
  bilgi_amacli: 'rozet-notr',
  spam: 'rozet-notr',
};

export default function AnaPano() {
  const { kullanici } = useYetkilendirme();
  const yonlendir = useNavigate();
  const [sonMailler, sonMaillerAyarla] = useState<MailTipi[]>([]);

  useEffect(() => {
    const verileriGetir = async () => {
      try {
        const yanit = await mailleriGetir();
        sonMaillerAyarla((yanit.mailler || []).slice(0, 5));
      } catch (hata) {
      }
    };
    verileriGetir();
  }, []);

  const hizliIslemler = [
    { etiket: 'Yeni Kampanya Oluştur', Ikon: Plus, yol: '/mail-gonderim' },
    { etiket: 'Bakım Çalıştır', Ikon: Shield, yol: '/bakim' },
    { etiket: 'Mailler Senkronize Et', Ikon: RefreshCw, yol: '/mail-takip' },
    { etiket: 'Ayarları Düzenle', Ikon: Settings, yol: '/ayarlar' },
  ];

  return (
    <div className="space-y-6 animate-solma-iceri">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--metin-birincil)' }}>
          Merhaba, {kullanici?.ad || 'Kullanıcı'} 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--metin-ikincil)' }}>
          {bugunTarihi}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {istatistikler.map((ist) => (
          <div key={ist.baslik} className="cam-kart p-5">
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: ist.arkaplan }}
              >
                <ist.Ikon className="w-5 h-5" style={{ color: ist.renk }} />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium"
                style={{ color: ist.yukseliyor ? '#10b981' : '#ef4444' }}
              >
                {ist.yukseliyor ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                %{ist.degisim}
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--metin-birincil)' }}>
              {ist.yuzde ? `%${ist.deger}` : ist.deger}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--metin-ikincil)' }}>
              {ist.baslik}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 cam-kart p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: 'var(--vurgu-ikincil)' }} />
              <h3 className="text-base font-semibold" style={{ color: 'var(--metin-birincil)' }}>
                Son Mailler
              </h3>
            </div>
            <button
              onClick={() => yonlendir('/mail-takip')}
              className="text-xs font-medium flex items-center gap-1 transition-colors"
              style={{ color: 'var(--vurgu-birincil)' }}
            >
              Tümünü Gör
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {sonMailler.map((mail) => (
              <div
                key={mail.id}
                className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200"
                style={{ borderBottom: '1px solid var(--kenarlık)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--arka-plan-ikincil)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                  style={{
                    background: 'var(--arka-plan-ikincil)',
                    color: 'var(--metin-ikincil)',
                  }}
                >
                  {mail.gonderenAd.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--metin-birincil)' }}>
                      {mail.gonderenAd}
                    </span>
                    <span className={`rozet text-[10px] px-2 py-0.5 ${kategoriRozeti[mail.kategori]}`}>
                      {kategoriyiTurkcele(mail.kategori)}
                    </span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--metin-ikincil)' }}>
                    {mail.konu}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: aciliyetRengi(mail.aciliyetSkoru) }}
                    title={`Aciliyet: ${mail.aciliyetSkoru}`}
                  />
                  <span className="text-xs" style={{ color: 'var(--metin-soluk)' }}>
                    {new Date(mail.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cam-kart p-6">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--metin-birincil)' }}>
            Hızlı İşlemler
          </h3>
          <div className="space-y-2.5">
            {hizliIslemler.map((islem) => (
              <button
                key={islem.etiket}
                onClick={() => yonlendir(islem.yol)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all duration-200 text-left"
                style={{
                  background: 'var(--arka-plan-ikincil)',
                  color: 'var(--metin-birincil)',
                  border: '1px solid var(--kenarlık)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--vurgu-birincil)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kenarlık)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <islem.Ikon className="w-4 h-4" style={{ color: 'var(--vurgu-birincil)' }} />
                {islem.etiket}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cam-kart p-6">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--metin-birincil)' }}>
          Haftalık Mail Trafiği
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={haftalikVeri} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--kenarlık)" />
            <XAxis dataKey="gun" tick={{ fill: 'var(--metin-ikincil)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--metin-ikincil)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--arka-plan-kart)',
                border: '1px solid var(--kenarlık)',
                borderRadius: '12px',
                color: 'var(--metin-birincil)',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="gelen" name="Gelen" fill="#6366f1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="giden" name="Giden" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
