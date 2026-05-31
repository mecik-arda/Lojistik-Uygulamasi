import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from uygulama.veritabani import TemelModel


class MailModeli(TemelModel):
    __tablename__ = "mailler"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kullanici_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kullanicilar.id"), nullable=False)
    gmail_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    gonderen: Mapped[str] = mapped_column(String(255), nullable=False)
    gonderen_ad: Mapped[str] = mapped_column(String(255), nullable=False)
    konu: Mapped[str] = mapped_column(String(500), nullable=False)
    icerik: Mapped[str] = mapped_column(Text, nullable=False)
    kategori: Mapped[str | None] = mapped_column(String(100), nullable=True)
    aciliyet_skoru: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_ozeti: Mapped[str | None] = mapped_column(Text, nullable=True)
    okundu: Mapped[bool] = mapped_column(Boolean, default=False)
    arsivlendi: Mapped[bool] = mapped_column(Boolean, default=False)
    tarih: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    senkron_tarihi: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class BildirimModeli(TemelModel):
    __tablename__ = "bildirimler"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kullanici_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kullanicilar.id"), nullable=False)
    mail_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("mailler.id"), nullable=True)
    tip: Mapped[str] = mapped_column(String(100), nullable=False)
    mesaj: Mapped[str] = mapped_column(String(500), nullable=False)
    goruldu: Mapped[bool] = mapped_column(Boolean, default=False)
    olusturma_tarihi: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
