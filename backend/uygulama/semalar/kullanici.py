import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class KullaniciOlustur(BaseModel):
    email: EmailStr
    ad: str
    soyad: str


class KullaniciYanit(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    ad: str
    soyad: str
    profil_resmi: str | None = None
    aktif: bool
    olusturma_tarihi: datetime


class TokenYanit(BaseModel):
    erisim_tokeni: str
    token_tipi: str = "bearer"


class GoogleGirisIstek(BaseModel):
    kod: str
