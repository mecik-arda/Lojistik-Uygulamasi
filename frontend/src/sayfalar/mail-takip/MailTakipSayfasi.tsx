import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Reply,
  Forward,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail as MailIkonu,
  RefreshCw
} from 'lucide-react';
import { kategoriyiTurkcele, aciliyetRengi, tarihBicimle, metinKisalt } from '../../yardimcilar';
import type { Mail, MailKategorisi } from '../../tipler';
import { mailleriGetir, dogalArama, mailleriSenkronizeEt, mailleriTopluIslem } from '../../servisler/apiServisi';
import toast from 'react-hot-toast';

const kategoriler: { anahtar: MailKategorisi | 'tumunu'; etiket: string }[] = [
  { anahtar: 'tumunu', etiket: 'Tümü' },
  { anahtar: 'siparis_talebi', etiket: 'Sipariş Talebi' },
  { anahtar: 'musteri_sikayeti', etiket: 'Müşteri Şikayeti' },
  { anahtar: 'tedarikci_bildirimi', etiket: 'Tedarikçi Bildirimi' },
  { anahtar: 'odeme', etiket: 'Ödeme' },
  { anahtar: 'bilgi_amacli', etiket: 'Bilgi Amaçlı' },
  { anahtar: 'spam', etiket: 'Spam' },
];

const kategoriRozeti: Record<string, string> = {
  siparis_talebi: 'rozet-bilgi',
  musteri_sikayeti: 'rozet-tehlike',
  tedarikci_bildirimi: 'rozet-uyari',
  odeme: 'rozet-basari',
  bilgi_amacli: 'rozet-notr',
  spam: 'rozet-notr',
};

export default function MailTakipSayfasi() {
  const [aramaParametreleri] = useSearchParams();
  const aramaSorgusu = aramaParametreleri.get('q');

  const [mailler, mailleriAyarla] = useState<Mail[]>([]);
  const [yukleniyor, yukleniyorAyarla] = useState(false);
  
  const [seciliKategori, seciliKategoriAyarla] = useState<MailKategorisi | 'tumunu'>('tumunu');
  const [seciliMailId, seciliMailIdAyarla] = useState<string | null>(null);
  const [seciliMailIdleri, seciliMailIdleriAyarla] = useState<string[]>([]);
  
  const [siralama, siralamaAyarla] = useState('tarih');
  const [sayfa, sayfaAyarla] = useState(1);

  const verileriGetir = async () => {
    yukleniyorAyarla(true);
    try {
      if (aramaSorgusu) {
        const aramaSonuclari = await dogalArama(aramaSorgusu);
        mailleriAyarla(aramaSonuclari);
      } else {
        const tumMailler = await mailleriGetir();
        mailleriAyarla(tumMailler.mailler || []);
      }
    } catch (hata) {
      toast.error('Mailler yüklenemedi');
    } finally {
      yukleniyorAyarla(false);
    }
  };

  useEffect(() => {
    verileriGetir();
  }, [aramaSorgusu]);

  const senkronizeEt = async () => {
    try {
      toast.loading('Senkronize ediliyor...', { id: 'senkronize' });
      await mailleriSenkronizeEt();
      await verileriGetir();
      toast.success('Senkronizasyon başarılı', { id: 'senkronize' });
    } catch (hata) {
      toast.error('Senkronizasyon hatası', { id: 'senkronize' });
    }
  };

  const topluIslemYap = async (islem: string, veri?: any) => {
    if (seciliMailIdleri.length === 0) return;
    try {
      toast.loading('İşlem yapılıyor...', { id: 'toplu-islem' });
      await mailleriTopluIslem(seciliMailIdleri, islem, veri);
      await verileriGetir();
      seciliMailIdleriAyarla([]);
      toast.success('İşlem başarılı', { id: 'toplu-islem' });
    } catch (hata) {
      toast.error('İşlem başarısız', { id: 'toplu-islem' });
    }
  };

  const mailSecimGuncelle = (id: string, secili: boolean) => {
    if (secili) {
      seciliMailIdleriAyarla(onceki => [...onceki, id]);
    } else {
      seciliMailIdleriAyarla(onceki => onceki.filter(m => m !== id));
    }
  };

  const tumunuSec = (secili: boolean) => {
    if (secili) {
      seciliMailIdleriAyarla(sayfaliMailler.map(m => m.id));
    } else {
      seciliMailIdleriAyarla([]);
    }
  };

  const filtrelenmisMailler = mailler.filter((mail) =>
    seciliKategori === 'tumunu' ? true : mail.kategori === seciliKategori
  );

  const siraliMailler = [...filtrelenmisMailler].sort((a, b) => {
    if (siralama === 'aciliyet') return b.aciliyetSkoru - a.aciliyetSkoru;
    if (siralama === 'kategori') return a.kategori.localeCompare(b.kategori);
    return new Date(b.tarih).getTime() - new Date(a.tarih).getTime();
  });

  const sayfaBasina = 8;
  const toplamSayfa = Math.ceil(siraliMailler.length / sayfaBasina) || 1;
  const sayfaliMailler = siraliMailler.slice((sayfa - 1) * sayfaBasina, sayfa * sayfaBasina);

  const seciliMail = mailler.find((m) => m.id === seciliMailId);

  const kategoriSayilari = (kat: MailKategorisi | 'tumunu') => {
    if (kat === 'tumunu') return mailler.length;
    return mailler.filter((m) => m.kategori === kat).length;
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-8rem)] animate-solma-iceri">
      <div
        className="w-[240px] shrink-0 rounded-l-2xl overflow-y-auto kaydirma-cubugu p-4"
        style={{
          background: 'var(--arka-plan-cam)',
          backdropFilter: 'blur(var(--cam-bulanik))',
          border: '1px solid var(--kenarlik)',
          borderRight: 'none',
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
          style={{ color: 'var(--metin-soluk)' }}
        >
          Kategoriler
        </h3>
        <div className="space-y-0.5">
          {kategoriler.map((kat) => (
            <button
              key={kat.anahtar}
              onClick={() => { seciliKategoriAyarla(kat.anahtar); sayfaAyarla(1); seciliMailIdleriAyarla([]); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: seciliKategori === kat.anahtar ? 'var(--arka-plan-ikincil)' : 'transparent',
                color: seciliKategori === kat.anahtar ? 'var(--metin-birincil)' : 'var(--metin-ikincil)',
                borderLeft: seciliKategori === kat.anahtar ? '3px solid var(--vurgu-birincil)' : '3px solid transparent',
              }}
            >
              <span>{kat.etiket}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--arka-plan-ikincil)', color: 'var(--metin-soluk)' }}
              >
                {kategoriSayilari(kat.anahtar)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          background: 'var(--arka-plan-cam)',
          backdropFilter: 'blur(var(--cam-bulanik))',
          borderTop: '1px solid var(--kenarlik)',
          borderBottom: '1px solid var(--kenarlik)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--kenarlik)' }}
        >
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded cursor-pointer"
              checked={sayfaliMailler.length > 0 && seciliMailIdleri.length === sayfaliMailler.length}
              onChange={(e) => tumunuSec(e.target.checked)}
            />
            {seciliMailIdleri.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold mr-2" style={{ color: 'var(--metin-birincil)' }}>{seciliMailIdleri.length} seçili</span>
                <button 
                  onClick={() => topluIslemYap('arsivle')}
                  className="buton-ikincil text-xs py-1 px-2 flex items-center gap-1"
                >
                  <Archive className="w-3.5 h-3.5" /> Arşivle
                </button>
                <button 
                  onClick={() => topluIslemYap('sil')}
                  className="buton-tehlike text-xs py-1 px-2 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Sil
                </button>
              </div>
            ) : (
              <>
                <select
                  value={siralama}
                  onChange={(e) => siralamaAyarla(e.target.value)}
                  className="giris-alani py-1.5 px-3 text-xs w-auto"
                >
                  <option value="tarih">Tarih</option>
                  <option value="aciliyet">Aciliyet</option>
                  <option value="kategori">Kategori</option>
                </select>
                <span className="text-xs" style={{ color: 'var(--metin-soluk)' }}>
                  {filtrelenmisMailler.length} mail
                </span>
              </>
            )}
          </div>
          <button 
            onClick={senkronizeEt}
            className="buton-birincil text-xs py-1.5 px-3 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Senkronize Et
          </button>
        </div>

        <div className="flex-1 overflow-y-auto kaydirma-cubugu">
          {yukleniyor ? (
            <div className="flex justify-center items-center h-full">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--metin-soluk)' }} />
            </div>
          ) : sayfaliMailler.map((mail) => (
            <div
              key={mail.id}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150"
              style={{
                background: seciliMailId === mail.id ? 'var(--arka-plan-ikincil)' : 'transparent',
                borderBottom: '1px solid var(--kenarlik)',
                borderLeft: seciliMailId === mail.id ? '3px solid var(--vurgu-birincil)' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (seciliMailId !== mail.id) e.currentTarget.style.background = 'var(--arka-plan-ikincil)';
              }}
              onMouseLeave={(e) => {
                if (seciliMailId !== mail.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded cursor-pointer"
                  checked={seciliMailIdleri.includes(mail.id)}
                  onChange={(e) => mailSecimGuncelle(mail.id, e.target.checked)}
                />
              </div>
              <div
                onClick={() => seciliMailIdAyarla(mail.id)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                style={{
                  background: mail.okundu ? 'var(--arka-plan-ikincil)' : 'linear-gradient(135deg, var(--vurgu-birincil), var(--vurgu-ikincil))',
                  color: mail.okundu ? 'var(--metin-ikincil)' : 'white',
                }}
              >
                {mail.gonderenAd.charAt(0)}
              </div>
              <div onClick={() => seciliMailIdAyarla(mail.id)} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm truncate"
                    style={{
                      color: 'var(--metin-birincil)',
                      fontWeight: mail.okundu ? 400 : 600,
                    }}
                  >
                    {mail.gonderenAd}
                  </span>
                </div>
                <p
                  className="text-xs truncate"
                  style={{
                    color: 'var(--metin-birincil)',
                    fontWeight: mail.okundu ? 400 : 600,
                  }}
                >
                  {mail.konu}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--metin-soluk)' }}>
                  {metinKisalt(mail.onIzleme, 60)}
                </p>
              </div>
              <div onClick={() => seciliMailIdAyarla(mail.id)} className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px]" style={{ color: 'var(--metin-soluk)' }}>
                  {new Date(mail.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`rozet text-[9px] px-1.5 py-0 ${kategoriRozeti[mail.kategori] || 'rozet-notr'}`}>
                    {kategoriyiTurkcele(mail.kategori)}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${mail.aciliyetSkoru >= 4 ? 'animate-ping' : ''}`}
                    style={{ background: aciliyetRengi(mail.aciliyetSkoru) }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {toplamSayfa > 1 && (
          <div className="flex items-center justify-center gap-2 py-3"
            style={{ borderTop: '1px solid var(--kenarlik)' }}
          >
            <button
              onClick={() => sayfaAyarla(Math.max(1, sayfa - 1))}
              disabled={sayfa === 1}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
              style={{ color: 'var(--metin-ikincil)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs" style={{ color: 'var(--metin-ikincil)' }}>
              {sayfa} / {toplamSayfa}
            </span>
            <button
              onClick={() => sayfaAyarla(Math.min(toplamSayfa, sayfa + 1))}
              disabled={sayfa === toplamSayfa}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
              style={{ color: 'var(--metin-ikincil)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div
        className="w-[360px] shrink-0 rounded-r-2xl overflow-y-auto kaydirma-cubugu flex flex-col"
        style={{
          background: 'var(--arka-plan-cam)',
          backdropFilter: 'blur(var(--cam-bulanik))',
          border: '1px solid var(--kenarlik)',
          borderLeft: 'none',
        }}
      >
        {seciliMail ? (
          <>
            <div className="p-5" style={{ borderBottom: '1px solid var(--kenarlik)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold gradient-vurgu text-white shrink-0"
                >
                  {seciliMail.gonderenAd.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--metin-birincil)' }}>
                    {seciliMail.gonderenAd}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--metin-soluk)' }}>
                    {seciliMail.gonderen}
                  </p>
                </div>
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--metin-birincil)' }}>
                {seciliMail.konu}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rozet text-[10px] ${kategoriRozeti[seciliMail.kategori] || 'rozet-notr'}`}>
                  {kategoriyiTurkcele(seciliMail.kategori)}
                </span>
                <span className={`rozet text-[10px] ${seciliMail.aciliyetSkoru >= 4 ? 'animate-pulse font-bold border border-red-500' : ''}`} style={{
                  background: `${aciliyetRengi(seciliMail.aciliyetSkoru)}20`,
                  color: aciliyetRengi(seciliMail.aciliyetSkoru),
                }}>
                  Aciliyet: {seciliMail.aciliyetSkoru}/5
                </span>
                <span className="text-[10px]" style={{ color: 'var(--metin-soluk)' }}>
                  {tarihBicimle(seciliMail.tarih)}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div
                className={`rounded-xl p-4 mb-4 ${seciliMail.aciliyetSkoru >= 4 ? 'animate-solma-iceri shadow-lg' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(249, 115, 22, 0.05))',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--vurgu-ikincil)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--vurgu-birincil)' }}>
                    AI Özeti
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--metin-ikincil)' }}>
                  {seciliMail.aiOzeti || 'Özet bulunamadı.'}
                </p>
              </div>

              <div className="text-sm whitespace-pre-line leading-relaxed" style={{ color: 'var(--metin-ikincil)' }}>
                {seciliMail.icerik || seciliMail.onIzleme}
              </div>
            </div>

            <div className="mt-auto p-4" style={{ borderTop: '1px solid var(--kenarlik)' }}>
              <div className="flex items-center gap-2">
                <button className="buton-birincil text-xs py-2 px-3 flex-1">
                  <Reply className="w-3.5 h-3.5" />
                  Yanıtla
                </button>
                <button className="buton-ikincil text-xs py-2 px-3">
                  <Forward className="w-3.5 h-3.5" />
                </button>
                <button className="buton-ikincil text-xs py-2 px-3">
                  <Archive className="w-3.5 h-3.5" />
                </button>
                <button className="buton-tehlike text-xs py-2 px-3">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--arka-plan-ikincil)' }}
            >
              <MailIkonu className="w-8 h-8" style={{ color: 'var(--metin-soluk)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--metin-ikincil)' }}>
              Bir mail seçin
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--metin-soluk)' }}>
              Detayları görüntülemek için listeden bir mail seçin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
