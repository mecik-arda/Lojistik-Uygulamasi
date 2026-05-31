import { useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useYetkilendirme } from '../../baglam/YetkilendirmeBaglami';
import { rastgeleId } from '../../yardimcilar';

export default function GirisSayfasi() {
  const { girisYap } = useYetkilendirme();
  const yonlendir = useNavigate();

  const girisIsle = () => {
    window.location.href = 'http://localhost:8000/api/yetki/google/giris';
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e293b 70%, #0f172a 100%)',
      }}
    >
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #6366f1, transparent 70%)',
          top: '-10%',
          right: '-5%',
          animation: 'kureHareket1 15s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, #f97316, transparent 70%)',
          bottom: '-8%',
          left: '-3%',
          animation: 'kureHareket2 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
          top: '50%',
          left: '60%',
          animation: 'kureHareket3 20s ease-in-out infinite',
        }}
      />

      <div
        className="relative z-10 w-full max-w-md p-10 rounded-2xl animate-solma-iceri"
        style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl gradient-vurgu flex items-center justify-center mb-5 shadow-turuncu-parlama">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold gradient-metin mb-2">LojistikAI</h1>
          <p className="text-sm" style={{ color: 'var(--metin-soluk)' }}>
            Lojistik Yönetim Platformu
          </p>
        </div>

        <button
          onClick={girisIsle}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-turuncu-parlama"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #f97316)',
            backgroundSize: '200% 200%',
            animation: 'gradientKayma 5s ease infinite',
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google ile Giriş Yap
        </button>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--metin-soluk)' }}>
          Devam ederek kullanım koşullarını kabul etmiş olursunuz.
        </p>
      </div>

      <style>{`
        @keyframes kureHareket1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes kureHareket2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, -20px) scale(1.05); }
          66% { transform: translate(30px, 15px) scale(0.9); }
        }
        @keyframes kureHareket3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 25px) scale(1.15); }
        }
        @keyframes gradientKayma {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
