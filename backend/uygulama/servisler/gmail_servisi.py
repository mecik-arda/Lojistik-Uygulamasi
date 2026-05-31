import uuid
from datetime import datetime, timezone
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import base64
from email.message import EmailMessage
from uygulama.yapilandirma import ayarlar

class GmailServisi:
    def __init__(self, token: str | None = None, yenileme_anahtari: str | None = None):
        self.kimlik_bilgisi = None
        if token:
            self.kimlik_bilgisi = Credentials(
                token=token,
                refresh_token=yenileme_anahtari,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=ayarlar.google_istemci_id,
                client_secret=ayarlar.google_istemci_sirri
            )

    def _mock_mailler(self):
        return [
            {
                "gmail_id": f"mock-{uuid.uuid4()}",
                "gonderen": "musteri@ornek.com",
                "gonderen_ad": "Müşteri A.Ş.",
                "konu": "Sipariş Gecikmesi Hakkında",
                "icerik": "Siparişimiz henüz ulaşmadı, durumu nedir?",
                "tarih": datetime.now(timezone.utc)
            },
            {
                "gmail_id": f"mock-{uuid.uuid4()}",
                "gonderen": "fatura@sirket.com",
                "gonderen_ad": "Fatura Departmanı",
                "konu": "Haziran Ayı Faturası",
                "icerik": "Haziran ayına ait faturanız ektedir.",
                "tarih": datetime.now(timezone.utc)
            }
        ]

    async def mailleri_getir(self, sinir: int = 10) -> list[dict]:
        if not self.kimlik_bilgisi:
            return self._mock_mailler()
            
        try:
            servis = build('gmail', 'v1', credentials=self.kimlik_bilgisi)
            sonuclar = servis.users().messages().list(userId='me', maxResults=sinir).execute()
            mesajlar = sonuclar.get('messages', [])
            
            islenmis_mailler = []
            for mesaj_referansi in mesajlar:
                mesaj_detayi = servis.users().messages().get(userId='me', id=mesaj_referansi['id']).execute()
                basliklar = mesaj_detayi.get('payload', {}).get('headers', [])
                konu = next((baslik['value'] for baslik in basliklar if baslik['name'] == 'Subject'), "Konusuz")
                gonderen_ham = next((baslik['value'] for baslik in basliklar if baslik['name'] == 'From'), "Bilinmeyen")
                
                gonderen = gonderen_ham
                gonderen_ad = gonderen_ham
                if "<" in gonderen_ham and ">" in gonderen_ham:
                    parcalar = gonderen_ham.split("<")
                    gonderen_ad = parcalar[0].strip()
                    gonderen = parcalar[1].replace(">", "").strip()
                
                ozet = mesaj_detayi.get('snippet', '')
                islenmis_mailler.append({
                    "gmail_id": mesaj_referansi['id'],
                    "gonderen": gonderen,
                    "gonderen_ad": gonderen_ad,
                    "konu": konu,
                    "icerik": ozet,
                    "tarih": datetime.now(timezone.utc)
                })
            return islenmis_mailler
        except Exception:
            return self._mock_mailler()

    async def mail_gonder(self, alici_email: str, konu: str, icerik_html: str) -> bool:
        if not self.kimlik_bilgisi:
            print("Uyari: Kimlik bilgisi yok, mail_gonder calismadi.")
            return False
            
        try:
            servis = build('gmail', 'v1', credentials=self.kimlik_bilgisi)
            mesaj = EmailMessage()
            mesaj.set_content(icerik_html, subtype='html')
            mesaj['To'] = alici_email
            mesaj['Subject'] = konu
            
            kodlanmis_mesaj = base64.urlsafe_b64encode(mesaj.as_bytes()).decode()
            gonderilecek = {'raw': kodlanmis_mesaj}
            
            servis.users().messages().send(userId='me', body=gonderilecek).execute()
            return True
        except Exception as hata:
            print(f"Mail gonderme hatasi: {hata}")
            return False
