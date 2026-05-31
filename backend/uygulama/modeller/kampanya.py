import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from uygulama.veritabani import TemelModel


class KampanyaModeli(TemelModel):
    __tablename__ = "kampanyalar"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kullanici_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kullanicilar.id"), nullable=False)
    baslik: Mapped[str] = mapped_column(String(255), nullable=False)
    konu: Mapped[str] = mapped_column(String(500), nullable=False)
    sablon_html: Mapped[str] = mapped_column(Text, nullable=False)
    durum: Mapped[str] = mapped_column(String(50), default="taslak")
    toplam_alici: Mapped[int] = mapped_column(Integer, default=0)
    gonderilen: Mapped[int] = mapped_column(Integer, default=0)
    acilan: Mapped[int] = mapped_column(Integer, default=0)
    tiklanan: Mapped[int] = mapped_column(Integer, default=0)
    bounce: Mapped[int] = mapped_column(Integer, default=0)
    planlanan_tarih: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    saatlik_limit: Mapped[int] = mapped_column(Integer, default=100)
    olusturma_tarihi: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class AliciModeli(TemelModel):
    __tablename__ = "alicilar"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kampanya_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kampanyalar.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    ad: Mapped[str] = mapped_column(String(200), nullable=False)
    sirket: Mapped[str | None] = mapped_column(String(255), nullable=True)
    etiket: Mapped[str | None] = mapped_column(String(100), nullable=True)
    durum: Mapped[str] = mapped_column(String(50), default="bekliyor")
    gonderim_tarihi: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    acildi: Mapped[bool] = mapped_column(Boolean, default=False)
    tikladi: Mapped[bool] = mapped_column(Boolean, default=False)


class SablonModeli(TemelModel):
    __tablename__ = "sablonlar"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kullanici_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kullanicilar.id"), nullable=False)
    ad: Mapped[str] = mapped_column(String(200), nullable=False)
    kategori: Mapped[str] = mapped_column(String(100), nullable=False)
    html_icerik: Mapped[str] = mapped_column(Text, nullable=False)
    bloklar: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    olusturma_tarihi: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
