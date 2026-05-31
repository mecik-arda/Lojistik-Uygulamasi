from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class AliciIstek(BaseModel):
    email: str
    ad: Optional[str] = None
    sirket: Optional[str] = None

class KampanyaOlusturIstek(BaseModel):
    baslik: str
    konu: str
    sablon_html: str
    alicilar: List[AliciIstek]

class KampanyaYanit(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    baslik: str
    konu: str
    durum: str
    toplam_alici: int
    gonderilen: int
    acilan: int
    olusturma_tarihi: datetime
