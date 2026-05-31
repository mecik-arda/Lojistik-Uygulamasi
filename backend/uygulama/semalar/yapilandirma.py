from pydantic import BaseModel


class YapilandirmaGuncelleIstek(BaseModel):
    google_istemci_id: str | None = None
    google_istemci_sirri: str | None = None
    gemini_api_anahtari: str | None = None
    sendgrid_api_anahtari: str | None = None
    varsayilan_mail: str | None = None


class YapilandirmaDurumYanit(BaseModel):
    google_yapilandirildi: bool
    gemini_yapilandirildi: bool
    sendgrid_yapilandirildi: bool
