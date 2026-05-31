from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from uygulama.yapilandirma import ayarlar
from uygulama.veritabani import veritabani_olustur
from uygulama.modeller import (
    KullaniciModeli,
    MailModeli,
    BildirimModeli,
    KampanyaModeli,
    AliciModeli,
    SablonModeli,
    BakimKaydiModeli,
    BakimAyarlariModeli,
)
from uygulama.rotalar import (
    yetki_yonlendirici,
    ayarlar_yonlendirici,
    mail_yonlendirici,
    saglik_yonlendirici,
    websockets_yonlendirici,
    kampanya_yonlendirici,
    bakim_yonlendirici,
    harita_yonlendirici,
    yedekleme_yonlendirici
)


@asynccontextmanager
async def yasam_dongusu(uygulama: FastAPI):
    await veritabani_olustur()
    yield


uygulama = FastAPI(
    title="LojistikAI API",
    description="Lojistik Yönetim Sistemi Backend API",
    version="1.0.0",
    lifespan=yasam_dongusu,
)

uygulama.add_middleware(
    CORSMiddleware,
    allow_origins=[ayarlar.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uygulama.include_router(saglik_yonlendirici)
uygulama.include_router(yetki_yonlendirici)
uygulama.include_router(ayarlar_yonlendirici)
uygulama.include_router(mail_yonlendirici)
uygulama.include_router(websockets_yonlendirici)
uygulama.include_router(kampanya_yonlendirici)
uygulama.include_router(bakim_yonlendirici)
uygulama.include_router(harita_yonlendirici)
uygulama.include_router(yedekleme_yonlendirici)


@uygulama.get("/")
async def kok():
    return {
        "uygulama": "LojistikAI API",
        "surum": "1.0.0",
        "belgeler": "/docs",
        "durum": "calisiyor",
    }
