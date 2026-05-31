import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uygulama.modeller.mail import MailModeli, BildirimModeli
from uygulama.servisler.gmail_servisi import GmailServisi
from uygulama.servisler.gemini_servisi import mail_analiz_et
from uygulama.servisler.websocket_servisi import websocket_yoneticisi

from uygulama.modeller.kullanici import KullaniciModeli

async def senkronize_ve_siniflandir(kullanici_id: uuid.UUID, db_session: AsyncSession):
    sorgu_kul = select(KullaniciModeli).where(KullaniciModeli.id == kullanici_id)
    sonuc_kul = await db_session.execute(sorgu_kul)
    kullanici = sonuc_kul.scalar_one_or_none()
    
    if not kullanici:
        return 0

    gmail_servisi = GmailServisi(token=kullanici.google_token, yenileme_anahtari=kullanici.google_refresh_token)
    mailler = await gmail_servisi.mailleri_getir()
    
    eklenen_sayisi = 0
    for mail_verisi in mailler:
        gmail_id = mail_verisi["gmail_id"]
        sorgu = select(MailModeli).where(MailModeli.gmail_id == gmail_id, MailModeli.kullanici_id == kullanici_id)
        sonuc = await db_session.execute(sorgu)
        mevcut_mail = sonuc.scalar_one_or_none()
        
        if not mevcut_mail:
            analiz_metni = f"Konu: {mail_verisi['konu']}\nİçerik: {mail_verisi['icerik']}"
            analiz_sonucu = await mail_analiz_et(analiz_metni)
            
            yeni_mail = MailModeli(
                kullanici_id=kullanici_id,
                gmail_id=gmail_id,
                gonderen=mail_verisi["gonderen"],
                gonderen_ad=mail_verisi["gonderen_ad"],
                konu=mail_verisi["konu"],
                icerik=mail_verisi["icerik"],
                kategori=analiz_sonucu.kategori,
                aciliyet_skoru=analiz_sonucu.aciliyet_skoru,
                ai_ozeti=analiz_sonucu.ai_ozeti,
                tarih=mail_verisi["tarih"]
            )
            db_session.add(yeni_mail)
            await db_session.flush()
            eklenen_sayisi += 1
            
            if analiz_sonucu.aciliyet_skoru >= 4:
                yeni_bildirim = BildirimModeli(
                    kullanici_id=kullanici_id,
                    mail_id=yeni_mail.id,
                    tip="acil_mail",
                    mesaj=f"Acil: {mail_verisi['konu']}"
                )
                db_session.add(yeni_bildirim)
                
                mesaj_sozlugu = {
                    "tip": "yeni_bildirim",
                    "mail_id": str(yeni_mail.id),
                    "konu": mail_verisi["konu"],
                    "aciliyet_skoru": analiz_sonucu.aciliyet_skoru
                }
                await websocket_yoneticisi.yayinla(mesaj_sozlugu)
                
    await db_session.commit()
    return eklenen_sayisi
