from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from uygulama.veritabani import AsyncOturumFabrikasi

saglik_yonlendirici = APIRouter(prefix="/api", tags=["Sağlık"])


@saglik_yonlendirici.get("/saglik")
async def saglik_kontrolu():
    veritabani_durumu = "bagli"
    try:
        async with AsyncOturumFabrikasi() as oturum:
            await oturum.execute(text("SELECT 1"))
    except Exception:
        veritabani_durumu = "baglanti_hatasi"

    return {
        "durum": "calisiyor",
        "veritabani": veritabani_durumu,
        "zaman": datetime.now(timezone.utc).isoformat(),
    }
