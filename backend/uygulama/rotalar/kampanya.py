import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from uygulama.veritabani import veritabani_oturumu_al
from uygulama.modeller.kampanya import KampanyaModeli, AliciModeli
from uygulama.modeller.kullanici import KullaniciModeli
from uygulama.semalar.kampanya import KampanyaOlusturIstek, KampanyaYanit
from uygulama.rotalar.yetkilendirme import mevcut_kullanici_al
from uygulama.servisler.gmail_servisi import GmailServisi

kampanya_yonlendirici = APIRouter(prefix="/api/kampanyalar", tags=["Kampanyalar"])

@kampanya_yonlendirici.post("/", response_model=KampanyaYanit)
async def kampanya_olustur(
    istek: KampanyaOlusturIstek,
    kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al)
):
    yeni_kampanya = KampanyaModeli(
        kullanici_id=kullanici.id,
        baslik=istek.baslik,
        konu=istek.konu,
        sablon_html=istek.sablon_html,
        durum="taslak",
        toplam_alici=len(istek.alicilar)
    )
    oturum.add(yeni_kampanya)
    await oturum.flush()

    for alici in istek.alicilar:
        yeni_alici = AliciModeli(
            kampanya_id=yeni_kampanya.id,
            email=alici.email,
            ad=alici.ad,
            sirket=alici.sirket
        )
        oturum.add(yeni_alici)
    
    await oturum.commit()
    await oturum.refresh(yeni_kampanya)
    return yeni_kampanya

@kampanya_yonlendirici.get("/", response_model=List[KampanyaYanit])
async def kampanyalari_getir(
    kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al)
):
    sorgu = select(KampanyaModeli).where(KampanyaModeli.kullanici_id == kullanici.id).order_by(KampanyaModeli.olusturma_tarihi.desc())
    sonuc = await oturum.execute(sorgu)
    return sonuc.scalars().all()

from uygulama.veritabani import AsyncOturumFabrikasi

async def kampanya_gonderim_gorevi(kampanya_id: uuid.UUID, kullanici_id: uuid.UUID):
    async with AsyncOturumFabrikasi() as oturum:
        sorgu = select(KullaniciModeli).where(KullaniciModeli.id == kullanici_id)
        kullanici = (await oturum.execute(sorgu)).scalar_one_or_none()
        if not kullanici: return
        
        sorgu_kampanya = select(KampanyaModeli).where(KampanyaModeli.id == kampanya_id)
        kampanya = (await oturum.execute(sorgu_kampanya)).scalar_one_or_none()
        if not kampanya: return
    
        sorgu_alicilar = select(AliciModeli).where(AliciModeli.kampanya_id == kampanya.id, AliciModeli.durum == "bekliyor")
        alicilar = (await oturum.execute(sorgu_alicilar)).scalars().all()
    
        gmail_servisi = GmailServisi(token=kullanici.google_token, yenileme_anahtari=kullanici.google_refresh_token)
        
        gonderilen_sayisi = 0
        for alici in alicilar:
            basari = await gmail_servisi.mail_gonder(
                alici_email=alici.email,
                konu=kampanya.konu,
                icerik_html=kampanya.sablon_html
            )
            if basari:
                alici.durum = "gonderildi"
                gonderilen_sayisi += 1
            else:
                alici.durum = "hata"
        
        kampanya.gonderilen += gonderilen_sayisi
        if kampanya.gonderilen >= kampanya.toplam_alici:
            kampanya.durum = "tamamlandi"
        else:
            kampanya.durum = "kismen_tamamlandi"
    
        await oturum.commit()

@kampanya_yonlendirici.post("/{kampanya_id}/baslat")
async def kampanya_baslat(
    kampanya_id: uuid.UUID,
    arka_plan_gorevleri: BackgroundTasks,
    kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al)
):
    sorgu = select(KampanyaModeli).where(KampanyaModeli.id == kampanya_id, KampanyaModeli.kullanici_id == kullanici.id)
    kampanya = (await oturum.execute(sorgu)).scalar_one_or_none()
    
    if not kampanya:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı")
        
    kampanya.durum = "gonderiliyor"
    await oturum.commit()
    
    arka_plan_gorevleri.add_task(kampanya_gonderim_gorevi, kampanya_id, kullanici.id, oturum)
    
    return {"mesaj": "Kampanya başlatıldı"}
