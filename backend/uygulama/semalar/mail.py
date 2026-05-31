import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MailYanit(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    gonderen: str
    gonderen_ad: str
    konu: str
    icerik: str
    kategori: str | None = None
    aciliyet_skoru: int | None = None
    ai_ozeti: str | None = None
    okundu: bool
    arsivlendi: bool
    tarih: datetime


class MailListesiYanit(BaseModel):
    mailler: list[MailYanit]
    toplam: int
    sayfa: int
    sayfa_boyutu: int


class MailGuncelleIstek(BaseModel):
    okundu: bool | None = None
    arsivlendi: bool | None = None
    kategori: str | None = None

class TopluIslemIstek(BaseModel):
    mail_idleri: list[uuid.UUID]
    islem_tipi: str
    yeni_kategori: str | None = None

class DogalAramaIstek(BaseModel):
    metin: str
