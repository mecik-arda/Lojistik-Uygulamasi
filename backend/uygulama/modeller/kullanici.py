import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from uygulama.veritabani import TemelModel


class KullaniciModeli(TemelModel):
    __tablename__ = "kullanicilar"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    ad: Mapped[str] = mapped_column(String(100), nullable=False)
    soyad: Mapped[str] = mapped_column(String(100), nullable=False)
    sifre_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    google_refresh_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    profil_resmi: Mapped[str | None] = mapped_column(String(500), nullable=True)
    aktif: Mapped[bool] = mapped_column(Boolean, default=True)
    olusturma_tarihi: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    son_giris: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
