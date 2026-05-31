from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class BakimIstek(BaseModel):
    mod: str

class BakimDurumYanit(BaseModel):
    saglik_skoru: int
    cpu_kullanimi: float
    ram_kullanimi: float
    son_calistirma: datetime | None = None
    sonraki_calistirma: datetime | None = None
    disk_durumu: str
    guncelleme_durumu: str
    guvenlik_durumu: str

class BakimKaydiYanit(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    mod: str
    saglik_skoru: int
    temizlik_sonucu: dict | None = None
    guvenlik_sonucu: dict | None = None
    kaynak_raporu: dict | None = None
    pdf_yolu: str | None = None
    calistirma_tarihi: datetime
    durum: str
