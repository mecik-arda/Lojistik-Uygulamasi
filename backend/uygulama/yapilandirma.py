from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, ValidationInfo
from uygulama.sifreleme import sifre_coz


class Ayarlar(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    veritabani_url: str
    gizli_anahtar: str
    google_istemci_id: str = ""
    google_istemci_sirri: str = ""
    gemini_api_anahtari: str = ""
    sendgrid_api_anahtari: str = ""
    varsayilan_mail: str = ""
    frontend_url: str = "http://localhost:5173"
    jwt_algoritmasi: str = "HS256"
    jwt_sure_dakika: int = 1440

    @field_validator("google_istemci_id", "google_istemci_sirri", "gemini_api_anahtari", "sendgrid_api_anahtari", mode="after")
    @classmethod
    def anahtarlari_coz(cls, v: str, info: ValidationInfo) -> str:
        gizli = info.data.get("gizli_anahtar", "")
        if v and gizli:
            return sifre_coz(v, gizli)
        return v


ayarlar = Ayarlar()
