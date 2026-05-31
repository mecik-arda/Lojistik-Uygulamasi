import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from uygulama.veritabani import TemelModel


class BakimKaydiModeli(TemelModel):
    __tablename__ = "bakim_kayitlari"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kullanici_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kullanicilar.id"), nullable=False)
    mod: Mapped[str] = mapped_column(String(50), nullable=False)
    saglik_skoru: Mapped[int] = mapped_column(Integer, nullable=False)
    temizlik_sonucu: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    guvenlik_sonucu: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    kaynak_raporu: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    pdf_yolu: Mapped[str | None] = mapped_column(String(500), nullable=True)
    calistirma_tarihi: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    durum: Mapped[str] = mapped_column(String(50), nullable=False)


class BakimAyarlariModeli(TemelModel):
    __tablename__ = "bakim_ayarlari"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kullanici_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kullanicilar.id"), unique=True, nullable=False)
    oto_calistirma_saati: Mapped[str] = mapped_column(String(10), nullable=False)
    rapor_mail_adresi: Mapped[str] = mapped_column(String(255), nullable=False)
    disk_aktif: Mapped[bool] = mapped_column(Boolean, default=True)
    guncellemeler_aktif: Mapped[bool] = mapped_column(Boolean, default=True)
    guvenlik_aktif: Mapped[bool] = mapped_column(Boolean, default=True)
    kaynaklar_aktif: Mapped[bool] = mapped_column(Boolean, default=True)
