import json
from enum import Enum
from pydantic import BaseModel, Field
from google import genai
from pydantic import ConfigDict
from google.genai import types

from uygulama.yapilandirma import ayarlar

class KategoriEnum(str, Enum):
    siparis_talebi = "sipariş talebi"
    musteri_sikayeti = "müşteri şikayeti"
    tedarikci_bildirimi = "tedarikçi bildirimi"
    odeme = "ödeme"
    bilgi_amacli = "bilgi amaçlı"
    spam = "spam"

class MailAnalizSonucu(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    kategori: KategoriEnum
    aciliyet_skoru: int = Field(ge=1, le=5)
    ai_ozeti: str

class DogalDilSorguSonucu(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    kategori: str | None = None
    baslangic_tarihi: str | None = None
    bitis_tarihi: str | None = None

async def mail_analiz_et(metin: str) -> MailAnalizSonucu:
    if not ayarlar.gemini_api_anahtari:
        return MailAnalizSonucu(
            kategori=KategoriEnum.musteri_sikayeti,
            aciliyet_skoru=4,
            ai_ozeti="[MOCK] Bu mail API anahtarı olmadan yerel olarak analiz edildi. Acil bir müşteri şikayeti gibi görünüyor."
        )

    try:
        istemci = genai.Client(api_key=ayarlar.gemini_api_anahtari)
        yanit = istemci.models.generate_content(
            model='gemini-3.5-flash',
            contents=f"Şu metni analiz et:\n{metin}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MailAnalizSonucu,
            ),
        )
        return MailAnalizSonucu.model_validate_json(yanit.text)
    except Exception as e:
        return MailAnalizSonucu(
            kategori=KategoriEnum.bilgi_amacli,
            aciliyet_skoru=1,
            ai_ozeti=f"Sistem: AI analizi sırasında hata oluştu. Orijinal metin incelenmeli."
        )

async def dogal_dil_sorgusu_analiz_et(sorgu: str) -> DogalDilSorguSonucu:
    if not ayarlar.gemini_api_anahtari:
        return DogalDilSorguSonucu(kategori="müşteri şikayeti")

    istemci = genai.Client(api_key=ayarlar.gemini_api_anahtari)
    sistem_komutu = "Kullanıcı metnini SQL filtre parametrelerine (kategori, baslangic_tarihi (ISO), bitis_tarihi (ISO)) çevir."
    yanit = istemci.models.generate_content(
        model='gemini-3.5-flash',
        contents=f"{sistem_komutu}\nSorgu: {sorgu}",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DogalDilSorguSonucu,
        ),
    )
    return DogalDilSorguSonucu.model_validate_json(yanit.text)
