import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
  Send,
  Shield,
  Settings,
  LogOut,
  Truck,
  MapPin,
} from 'lucide-react';
import { useYetkilendirme } from '../../baglam/YetkilendirmeBaglami';
import { kendiRolumuGuncelle } from '../../servisler/apiServisi';

const menuOgeleri = [
  { yol: '/pano', etiket: 'Gösterge Paneli', Ikon: LayoutDashboard, roller: ['Yönetici', 'Sürücü', 'Müşteri'] },
  { yol: '/harita', etiket: 'Canlı Harita', Ikon: MapPin, roller: ['Yönetici', 'Sürücü', 'Müşteri'] },
  { yol: '/mail-takip', etiket: 'Mail Takip', Ikon: Mail, roller: ['Yönetici'] },
  { yol: '/mail-gonderim', etiket: 'Mail Gönderim', Ikon: Send, roller: ['Yönetici'] },
  { yol: '/bakim', etiket: 'Bakım Paneli', Ikon: Shield, roller: ['Yönetici'] },
];

export default function KenarCubugu() {
  const { kullanici, cikisYap } = useYetkilendirme();
  const yonlendir = useNavigate();

  const cikisIsle = () => {
    cikisYap();
    yonlendir('/');
  };

  return (
    <aside className="w-[280px] min-h-screen flex flex-col"
      style={{
        background: 'var(--arka-plan-cam)',
        backdropFilter: 'blur(var(--cam-bulanik))',
        borderRight: '1px solid var(--kenarlık)',
      }}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-vurgu flex items-center justify-center">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold gradient-metin">LojistikAI</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuOgeleri.filter(oge => !kullanici || oge.roller.includes(kullanici.rol)).map((oge) => (
          <NavLink
            key={oge.yol}
            to={oge.yol}
            className={({ isActive }) =>
              `kenar-cubugu-baglantisi group relative overflow-hidden ${isActive ? 'aktif' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-300"
                  style={{
                    background: isActive
                      ? 'linear-gradient(to bottom, var(--vurgu-ikincil), var(--vurgu-birincil))'
                      : 'transparent',
                    opacity: isActive ? 1 : 0,
                  }}
                />
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                  style={{
                    background: 'linear-gradient(to bottom, var(--vurgu-ikincil), var(--vurgu-birincil))',
                  }}
                />
                <oge.Ikon className="w-5 h-5" />
                <span>{oge.etiket}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-2">
        <NavLink
          to="/ayarlar"
          className={({ isActive }) =>
            `kenar-cubugu-baglantisi group relative overflow-hidden ${isActive ? 'aktif' : ''}`
          }
        >
          <Settings className="w-5 h-5" />
          <span>Ayarlar</span>
        </NavLink>
      </div>

      <div className="p-4 mx-4 mb-4 rounded-xl"
        style={{ background: 'var(--arka-plan-ikincil)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-vurgu flex items-center justify-center text-white text-sm font-semibold">
            {kullanici ? kullanici.ad.charAt(0) + kullanici.soyad.charAt(0) : 'KU'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--metin-birincil)' }}>
              {kullanici ? `${kullanici.ad} ${kullanici.soyad}` : 'Kullanıcı'}
            </p>
            <p className="text-xs truncate font-medium text-emerald-400">
              {kullanici?.rol || 'Rol Yok'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--metin-soluk)' }}>
              {kullanici?.email || ''}
            </p>
          </div>
          <button
            onClick={cikisIsle}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
            style={{ color: 'var(--tehlike)' }}
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        {/* Test Amaçlı Rol Değiştirici */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <label className="text-[10px] uppercase font-bold tracking-wider mb-1 block" style={{ color: 'var(--metin-soluk)' }}>
            Rolü Değiştir (Test)
          </label>
          <select 
            className="w-full bg-black/20 border border-white/10 rounded-md p-1 text-xs text-white"
            value={kullanici?.rol || 'Yönetici'}
            onChange={async (e) => {
              const yeni_rol = e.target.value;
              try {
                await kendiRolumuGuncelle(yeni_rol);
                localStorage.setItem('kullaniciRol', yeni_rol);
                window.dispatchEvent(new Event('kullaniciGuncellendi'));
                window.location.reload();
              } catch (err) {
                console.error("Rol güncellenirken hata oluştu:", err);
              }
            }}
          >
            <option value="Yönetici">Yönetici</option>
            <option value="Sürücü">Sürücü</option>
            <option value="Müşteri">Müşteri</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
