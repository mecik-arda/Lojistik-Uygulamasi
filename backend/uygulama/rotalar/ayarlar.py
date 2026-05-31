from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from uygulama.yapilandirma import ayarlar, Ayarlar
from uygulama.veritabani import veritabani_oturumu_al
from uygulama.rotalar.yetkilendirme import mevcut_kullanici_al
from uygulama.modeller.kullanici import KullaniciModeli
from uygulama.semalar.yapilandirma import YapilandirmaGuncelleIstek, YapilandirmaDurumYanit
from uygulama.sifreleme import sifrele

ayarlar_yonlendirici = APIRouter(prefix="/api/ayarlar", tags=["Ayarlar"])

ENV_DOSYA_YOLU = Path(__file__).resolve().parent.parent.parent.parent / ".env"

IZIN_VERILEN_ANAHTARLAR = {
    "google_istemci_id": "GOOGLE_ISTEMCI_ID",
    "google_istemci_sirri": "GOOGLE_ISTEMCI_SIRRI",
    "gemini_api_anahtari": "GEMINI_API_ANAHTARI",
    "sendgrid_api_anahtari": "SENDGRID_API_ANAHTARI",
    "varsayilan_mail": "VARSAYILAN_MAIL",
}


def env_dosyasini_guncelle(guncellemeler: dict[str, str]) -> None:
    satirlar: list[str] = []
    if ENV_DOSYA_YOLU.exists():
        satirlar = ENV_DOSYA_YOLU.read_text(encoding="utf-8").splitlines()

    guncellenen_anahtarlar: set[str] = set()

    for i, satir in enumerate(satirlar):
        if "=" in satir:
            anahtar = satir.split("=", 1)[0].strip()
            if anahtar in guncellemeler:
                satirlar[i] = f"{anahtar}={guncellemeler[anahtar]}"
                guncellenen_anahtarlar.add(anahtar)

    for anahtar, deger in guncellemeler.items():
        if anahtar not in guncellenen_anahtarlar:
            satirlar.append(f"{anahtar}={deger}")

    ENV_DOSYA_YOLU.write_text("\n".join(satirlar) + "\n", encoding="utf-8")


@ayarlar_yonlendirici.get("/durum", response_model=YapilandirmaDurumYanit)
async def yapilandirma_durumu(
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
):
    return YapilandirmaDurumYanit(
        google_yapilandirildi=bool(ayarlar.google_istemci_id and ayarlar.google_istemci_sirri),
        gemini_yapilandirildi=bool(ayarlar.gemini_api_anahtari),
        sendgrid_yapilandirildi=bool(ayarlar.sendgrid_api_anahtari),
    )


@ayarlar_yonlendirici.get("/getir", response_model=YapilandirmaGuncelleIstek)
async def yapilandirma_getir(
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
):
    return YapilandirmaGuncelleIstek(
        google_istemci_id=ayarlar.google_istemci_id,
        google_istemci_sirri=ayarlar.google_istemci_sirri,
        gemini_api_anahtari=ayarlar.gemini_api_anahtari,
        sendgrid_api_anahtari=ayarlar.sendgrid_api_anahtari,
        varsayilan_mail=ayarlar.varsayilan_mail,
    )


@ayarlar_yonlendirici.put("/guncelle", response_model=YapilandirmaDurumYanit)
async def yapilandirma_guncelle(
    istek: YapilandirmaGuncelleIstek,
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
):
    env_guncellemeleri: dict[str, str] = {}
    istek_verisi = istek.model_dump(exclude_none=True)

    for alan_adi, deger in istek_verisi.items():
        if alan_adi in IZIN_VERILEN_ANAHTARLAR:
            env_anahtari = IZIN_VERILEN_ANAHTARLAR[alan_adi]
            if alan_adi in ["google_istemci_id", "google_istemci_sirri", "gemini_api_anahtari", "sendgrid_api_anahtari"]:
                env_guncellemeleri[env_anahtari] = sifrele(deger, ayarlar.gizli_anahtar)
            else:
                env_guncellemeleri[env_anahtari] = deger

    if env_guncellemeleri:
        env_dosyasini_guncelle(env_guncellemeleri)

    import uygulama.yapilandirma as yapilandirma_modulu
    yapilandirma_modulu.ayarlar = Ayarlar()

    from uygulama.yapilandirma import ayarlar as yeni_ayarlar

    return YapilandirmaDurumYanit(
        google_yapilandirildi=bool(yeni_ayarlar.google_istemci_id and yeni_ayarlar.google_istemci_sirri),
        gemini_yapilandirildi=bool(yeni_ayarlar.gemini_api_anahtari),
        sendgrid_yapilandirildi=bool(yeni_ayarlar.sendgrid_api_anahtari),
    )
