from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import uuid
from fastapi.responses import FileResponse
import os
import asyncio

from uygulama.veritabani import veritabani_oturumu_al
from uygulama.rotalar.yetkilendirme import mevcut_kullanici_al
from uygulama.modeller.kullanici import KullaniciModeli
from uygulama.modeller.bakim import BakimKaydiModeli

from uygulama.semalar.bakim import BakimIstek, BakimDurumYanit, BakimKaydiYanit
from uygulama.servisler.bakim_servisi import sistem_durumu_al, bakim_calistir, pdf_rapor_olustur

bakim_yonlendirici = APIRouter(prefix="/api/bakim", tags=["Bakim"])

@bakim_yonlendirici.get("/durum", response_model=BakimDurumYanit)
async def durum_getir(
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al)
):
    durum = await asyncio.to_thread(sistem_durumu_al)
    
    # Son calistirma kaydini al
    sorgu = select(BakimKaydiModeli).where(
        BakimKaydiModeli.kullanici_id == mevcut_kullanici.id
    ).order_by(desc(BakimKaydiModeli.calistirma_tarihi)).limit(1)
    
    sonuc = await oturum.execute(sorgu)
    son_kayit = sonuc.scalar_one_or_none()
    
    if son_kayit:
        durum["son_calistirma"] = son_kayit.calistirma_tarihi
        
    return durum

@bakim_yonlendirici.post("/calistir", response_model=BakimKaydiYanit)
async def calistir(
    istek: BakimIstek,
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al)
):
    skor, kaynak, temizlik, guvenlik = await asyncio.to_thread(bakim_calistir, istek.mod)
    
    yeni_kayit = BakimKaydiModeli(
        kullanici_id=mevcut_kullanici.id,
        mod=istek.mod,
        saglik_skoru=skor,
        temizlik_sonucu=temizlik,
        guvenlik_sonucu=guvenlik,
        kaynak_raporu=kaynak,
        durum="tamamlandi"
    )
    
    oturum.add(yeni_kayit)
    await oturum.flush()  # ID almak icin
    
    # PDF uret
    pdf_yolu = await asyncio.to_thread(pdf_rapor_olustur, yeni_kayit.id, kaynak, temizlik, guvenlik)
    yeni_kayit.pdf_yolu = pdf_yolu
    
    await oturum.commit()
    await oturum.refresh(yeni_kayit)
    
    return yeni_kayit

@bakim_yonlendirici.get("/rapor/{kayit_id}")
async def rapor_indir(
    kayit_id: uuid.UUID,
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al)
):
    sorgu = select(BakimKaydiModeli).where(
        BakimKaydiModeli.id == kayit_id,
        BakimKaydiModeli.kullanici_id == mevcut_kullanici.id
    )
    sonuc = await oturum.execute(sorgu)
    kayit = sonuc.scalar_one_or_none()
    
    if not kayit or not kayit.pdf_yolu or not os.path.exists(kayit.pdf_yolu):
        raise HTTPException(status_code=404, detail="Rapor bulunamadi")
        
    return FileResponse(kayit.pdf_yolu, filename=f"bakim_raporu_{kayit_id}.pdf")
