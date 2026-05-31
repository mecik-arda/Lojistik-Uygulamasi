import { useState, useEffect } from 'react';
import { Plus, Copy, Eye, Users, Calendar, Send } from 'lucide-react';
import type { Kampanya, KampanyaDurumu } from '../../tipler';
import { kisaTarih, sayiBicimle } from '../../yardimcilar';
import { apiIstemcisi } from '../../servisler/apiServisi';
import YeniKampanyaModal from './YeniKampanyaModal';

const durumRozeti: Record<KampanyaDurumu, { sinif: string; etiket: string }> = {
  taslak: { sinif: 'rozet-notr', etiket: 'Taslak' },
  planlandi: { sinif: 'rozet-bilgi', etiket: 'Planlandı' },
  gonderiliyor: { sinif: 'rozet-uyari', etiket: 'Gönderiliyor' },
  tamamlandi: { sinif: 'rozet-basari', etiket: 'Tamamlandı' },
  duraklatildi: { sinif: 'rozet-tehlike', etiket: 'Duraklatıldı' },
};

const filtreler: { anahtar: KampanyaDurumu | 'tumunu'; etiket: string }[] = [
  { anahtar: 'tumunu', etiket: 'Tümü' },
  { anahtar: 'taslak', etiket: 'Taslak' },
  { anahtar: 'gonderiliyor', etiket: 'Gönderiliyor' },
  { anahtar: 'tamamlandi', etiket: 'Tamamlandı' },
];

export default function MailGonderimSayfasi() {
  const [aktifFiltre, aktifFiltreAyarla] = useState<KampanyaDurumu | 'tumunu'>('tumunu');
  const [kampanyalar, kampanyalarAyarla] = useState<Kampanya[]>([]);
  const [modalAcik, modalAcikAyarla] = useState(false);
  const [yukleniyor, yukleniyorAyarla] = useState(true);

  const kampanyalariGetir = async () => {
    try {
      yukleniyorAyarla(true);
      const yanit = await apiIstemcisi.get('/kampanyalar/');
      
      const apiVerisi = yanit.data.map((k: any) => ({
        id: k.id,
        baslik: k.baslik,
        konu: k.konu,
        durum: k.durum,
        toplamAlici: k.toplam_alici,
        gonderilen: k.gonderilen,
        acilan: k.acilan,
        tiklanan: 0,
        bounce: 0,
        olusturmaTarihi: k.olusturma_tarihi,
        planlananTarih: null
      }));
      kampanyalarAyarla(apiVerisi);
    } catch (hata) {
      console.error(hata);
    } finally {
      yukleniyorAyarla(false);
    }
  };

  useEffect(() => {
    kampanyalariGetir();
    const interval = setInterval(kampanyalariGetir, 10000); // 10 saniyede bir guncelle
    return () => clearInterval(interval);
  }, []);

  const filtrelenmisKampanyalar = kampanyalar.filter((k) =>
    aktifFiltre === 'tumunu' ? true : k.durum === aktifFiltre
  );

  const acilmaOrani = (k: Kampanya) => {
    if (k.gonderilen === 0) return 0;
    return Math.round((k.acilan / k.gonderilen) * 100);
  };

  return (
    <div className="space-y-6 animate-solma-iceri relative">
      {modalAcik && (
        <YeniKampanyaModal 
          kapat={() => modalAcikAyarla(false)} 
          basariylaOlusturuldu={() => {
            modalAcikAyarla(false);
            kampanyalariGetir();
          }} 
        />
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--metin-birincil)' }}>
            Kampanyalar
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--metin-ikincil)' }}>
            Mail kampanyalarınızı yönetin ve doğrudan Gmail ile gönderin.
          </p>
        </div>
        <button className="buton-birincil" onClick={() => modalAcikAyarla(true)}>
          <Plus className="w-4 h-4" />
          Yeni Kampanya
        </button>
      </div>

      <div className="flex items-center gap-2">
        {filtreler.map((f) => (
          <button
            key={f.anahtar}
            onClick={() => aktifFiltreAyarla(f.anahtar)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: aktifFiltre === f.anahtar
                ? 'linear-gradient(135deg, var(--vurgu-birincil), var(--vurgu-ikincil))'
                : 'var(--arka-plan-ikincil)',
              color: aktifFiltre === f.anahtar ? 'white' : 'var(--metin-ikincil)',
              border: `1px solid ${aktifFiltre === f.anahtar ? 'transparent' : 'var(--kenarlık)'}`,
            }}
          >
            {f.etiket}
          </button>
        ))}
      </div>

      {yukleniyor && kampanyalar.length === 0 ? (
        <div className="p-10 text-center" style={{ color: 'var(--metin-soluk)' }}>Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filtrelenmisKampanyalar.map((kampanya) => (
            <div key={kampanya.id} className="cam-kart p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold flex-1 mr-2" style={{ color: 'var(--metin-birincil)' }}>
                  {kampanya.baslik}
                </h3>
                <span className={`rozet text-[10px] shrink-0 ${durumRozeti[kampanya.durum]?.sinif || 'rozet-notr'}`}>
                  {durumRozeti[kampanya.durum]?.etiket || kampanya.durum}
                </span>
              </div>

              <p className="text-xs mb-4" style={{ color: 'var(--metin-ikincil)' }}>
                {kampanya.konu}
              </p>

              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--metin-ikincil)' }}>
                  <Users className="w-3.5 h-3.5" style={{ color: 'var(--metin-soluk)' }} />
                  <span>{sayiBicimle(kampanya.toplamAlici)} alıcı</span>
                </div>

                {kampanya.planlananTarih && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--metin-ikincil)' }}>
                    <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--metin-soluk)' }} />
                    <span>{kisaTarih(kampanya.planlananTarih)}</span>
                  </div>
                )}

                {kampanya.gonderilen > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--metin-ikincil)' }}>
                        Açılma Oranı
                      </span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--vurgu-birincil)' }}>
                        %{acilmaOrani(kampanya)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--arka-plan-ikincil)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${acilmaOrani(kampanya)}%`,
                          background: 'linear-gradient(135deg, var(--vurgu-birincil), var(--vurgu-ikincil))',
                        }}
                      />
                    </div>
                  </div>
                )}

                {(kampanya.durum === 'gonderiliyor' || kampanya.gonderilen > 0) && (
                  <div>
                    <div className="flex items-center justify-between mb-1 mt-2">
                      <span className="text-xs" style={{ color: 'var(--metin-ikincil)' }}>
                        Gönderim İlerlemesi
                      </span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--uyari)' }}>
                        {sayiBicimle(kampanya.gonderilen)} / {sayiBicimle(kampanya.toplamAlici)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--arka-plan-ikincil)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500 animate-nabiz"
                        style={{
                          width: `${Math.round((kampanya.gonderilen / kampanya.toplamAlici) * 100)}%`,
                          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-5 pt-4" style={{ borderTop: '1px solid var(--kenarlık)' }}>
                <button className="buton-ikincil text-xs py-2 px-3 flex-1">
                  <Eye className="w-3.5 h-3.5" />
                  Detay
                </button>
                <button className="buton-ikincil text-xs py-2 px-3">
                  <Copy className="w-3.5 h-3.5" />
                  Kopyala
                </button>
              </div>
            </div>
          ))}

          <div
            onClick={() => modalAcikAyarla(true)}
            className="rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-200 min-h-[240px] group"
            style={{
              border: '2px dashed var(--kenarlık)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--vurgu-birincil)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--kenarlık)';
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200"
              style={{ background: 'var(--arka-plan-ikincil)' }}
            >
              <Send className="w-5 h-5" style={{ color: 'var(--metin-soluk)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--metin-ikincil)' }}>
              Yeni Kampanya Oluştur
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
