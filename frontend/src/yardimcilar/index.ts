import type { MailKategorisi } from '../tipler';

const turkceAylar = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const kisaAylar = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

export function tarihBicimle(tarih: string): string {
  const t = new Date(tarih);
  const gun = t.getDate();
  const ay = turkceAylar[t.getMonth()];
  const yil = t.getFullYear();
  const saat = t.getHours().toString().padStart(2, '0');
  const dakika = t.getMinutes().toString().padStart(2, '0');
  return `${gun} ${ay} ${yil}, ${saat}:${dakika}`;
}

export function kisaTarih(tarih: string): string {
  const t = new Date(tarih);
  const gun = t.getDate();
  const ay = kisaAylar[t.getMonth()];
  const yil = t.getFullYear();
  return `${gun} ${ay} ${yil}`;
}

export function sayiBicimle(sayi: number): string {
  return new Intl.NumberFormat('tr-TR').format(sayi);
}

export function metinKisalt(metin: string, uzunluk: number): string {
  if (metin.length <= uzunluk) return metin;
  return metin.slice(0, uzunluk) + '...';
}

export function rastgeleId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

const kategoriHaritasi: Record<MailKategorisi, string> = {
  siparis_talebi: 'Sipariş Talebi',
  musteri_sikayeti: 'Müşteri Şikayeti',
  tedarikci_bildirimi: 'Tedarikçi Bildirimi',
  odeme: 'Ödeme',
  bilgi_amacli: 'Bilgi Amaçlı',
  spam: 'Spam',
};

export function kategoriyiTurkcele(kategori: MailKategorisi): string {
  return kategoriHaritasi[kategori] || kategori;
}

export function aciliyetRengi(skor: number): string {
  const renkler: Record<number, string> = {
    1: '#10b981',
    2: '#3b82f6',
    3: '#f59e0b',
    4: '#f97316',
    5: '#ef4444',
  };
  return renkler[skor] || '#94a3b8';
}
