export type TemaModu = 'koyu' | 'acik';

export type MailKategorisi =
  | 'siparis_talebi'
  | 'musteri_sikayeti'
  | 'tedarikci_bildirimi'
  | 'odeme'
  | 'bilgi_amacli'
  | 'spam';

export type KampanyaDurumu =
  | 'taslak'
  | 'planlandi'
  | 'gonderiliyor'
  | 'tamamlandi'
  | 'duraklatildi';

export interface Kullanici {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  profilResmi: string;
  aktif: boolean;
}

export interface Mail {
  id: string;
  gonderen: string;
  gonderenAd: string;
  konu: string;
  onIzleme: string;
  kategori: MailKategorisi;
  aciliyetSkoru: 1 | 2 | 3 | 4 | 5;
  aiOzeti: string;
  okundu: boolean;
  arsivlendi: boolean;
  tarih: string;
  icerik?: string;
}

export interface Kampanya {
  id: string;
  baslik: string;
  konu: string;
  durum: KampanyaDurumu;
  toplamAlici: number;
  gonderilen: number;
  acilan: number;
  tiklanan: number;
  bounce: number;
  olusturmaTarihi: string;
  planlananTarih: string;
}

export interface BakimKaydi {
  id: string;
  mod: string;
  saglikSkoru: number;
  calistirmaTarihi: string;
  durum: string;
}

export interface Bildirim {
  id: string;
  tip: string;
  mesaj: string;
  goruldu: boolean;
  olusturmaTarihi: string;
  mailId?: string;
}

export interface YapilandirmaAyari {
  anahtar: string;
  deger: string;
  aciklama: string;
  zorunlu: boolean;
}
