from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import shutil
import os
import asyncio
from datetime import datetime
from fastapi.responses import FileResponse

from uygulama.rotalar.yetkilendirme import mevcut_kullanici_al, yonetici_gerekli
from uygulama.modeller.kullanici import KullaniciModeli
from uygulama.sifreleme import sifrele_bayt
from uygulama.yapilandirma import ayarlar

yedekleme_yonlendirici = APIRouter(prefix="/api/yedekleme", tags=["Yedekleme"])

VERITABANI_YOLU = "lojistik.db"
YEDEK_DIZINI = "yedekler"

@yedekleme_yonlendirici.post("/olustur")
async def yedek_olustur(mevcut_kullanici: KullaniciModeli = Depends(yonetici_gerekli)):
    if not os.path.exists(VERITABANI_YOLU):
        raise HTTPException(status_code=404, detail="Veritabanı bulunamadı")
        
    if not os.path.exists(YEDEK_DIZINI):
        os.makedirs(YEDEK_DIZINI)
        
    tarih_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    yedek_adi = f"yedek_{tarih_str}.enc"
    yedek_yolu = os.path.join(YEDEK_DIZINI, yedek_adi)
    
    try:
        def dosyalari_isle():
            with open(VERITABANI_YOLU, "rb") as f:
                veri = f.read()
                sifreli_veri = sifrele_bayt(veri, ayarlar.gizli_anahtar)
            with open(yedek_yolu, "wb") as f:
                f.write(sifreli_veri)
                
        await asyncio.to_thread(dosyalari_isle)
            
        return {"mesaj": "Yedek başarıyla oluşturuldu ve şifrelendi", "dosya": yedek_adi}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@yedekleme_yonlendirici.get("/indir/{dosya_adi}")
async def yedek_indir(dosya_adi: str, mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al)):
    if ".." in dosya_adi or "/" in dosya_adi or "\\" in dosya_adi or not dosya_adi.endswith(".enc"):
        raise HTTPException(status_code=400, detail="Geçersiz dosya formatı")
    
    dosya_yolu = os.path.join(YEDEK_DIZINI, dosya_adi)
    if not os.path.exists(dosya_yolu):
        raise HTTPException(status_code=404, detail="Yedek dosyası bulunamadı")
    return FileResponse(dosya_yolu, filename=dosya_adi)
