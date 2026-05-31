import { Outlet, useLocation } from 'react-router-dom';
import KenarCubugu from './KenarCubugu';
import UstBar from './UstBar';

const sayfaBasliklari: Record<string, string> = {
  '/pano': 'Gösterge Paneli',
  '/mail-takip': 'Mail Takip',
  '/mail-gonderim': 'Mail Gönderim',
  '/harita': 'Canlı Harita',
  '/bakim': 'Bakım Paneli',
  '/ayarlar': 'Sistem Yapılandırması',
};

export default function AnaYerlesim() {
  const konum = useLocation();
  const baslik = sayfaBasliklari[konum.pathname] || 'LojistikAI';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--arka-plan-birincil)' }}>
      <KenarCubugu />
      <div className="flex-1 flex flex-col overflow-hidden">
        <UstBar baslik={baslik} />
        <main className="flex-1 overflow-y-auto p-8 kaydirma-cubugu">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
