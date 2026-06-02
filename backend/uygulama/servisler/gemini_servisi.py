import json
from enum import Enum
from pydantic import BaseModel, Field
from google import genai
from pydantic import ConfigDict
from google.genai import types

from uygulama.yapilandirma import ayarlar
from uygulama.api_guvenligi import setup_config_if_needed, get_gemini_api_key

# AES-256 Şifreleme sistemi ile data/config.json içerisine anahtarı güvenle taşı
setup_config_if_needed(ayarlar.gemini_api_anahtari)

def _aktif_anahtar_al():
    return get_gemini_api_key() or ayarlar.gemini_api_anahtari

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

class RotaAnalizSonucu(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    eta_dakika: int
    hava_durumu: str
    trafik_durumu: str
    ai_tavsiyesi: str

async def mail_analiz_et(metin: str) -> MailAnalizSonucu:
    if not _aktif_anahtar_al():
        return MailAnalizSonucu(
            kategori=KategoriEnum.musteri_sikayeti,
            aciliyet_skoru=4,
            ai_ozeti="[MOCK] Bu mail API anahtarı olmadan yerel olarak analiz edildi. Acil bir müşteri şikayeti gibi görünüyor."
        )

    try:
        istemci = genai.Client(api_key=_aktif_anahtar_al())
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
    if not _aktif_anahtar_al():
        return DogalDilSorguSonucu(kategori="müşteri şikayeti")

    istemci = genai.Client(api_key=_aktif_anahtar_al())
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

async def rota_analiz_et(mesafe_km: float, hava_durumu: str, trafik_durumu: str) -> RotaAnalizSonucu:
    if not _aktif_anahtar_al():
        # Fallback if no API key is provided
        tahmini_hiz = 40 if trafik_durumu == "Yoğun" else (80 if hava_durumu == "Güneşli" else 60)
        tahmini_dakika = int((mesafe_km / tahmini_hiz) * 60) + (10 if hava_durumu in ["Yağmurlu", "Karlı"] else 0)
        return RotaAnalizSonucu(
            eta_dakika=tahmini_dakika,
            hava_durumu=hava_durumu,
            trafik_durumu=trafik_durumu,
            ai_tavsiyesi="[MOCK] Hava koşulları ve trafik nedeniyle dikkatli olun."
        )

    istemci = genai.Client(api_key=_aktif_anahtar_al())
    sistem_komutu = "Sen bir lojistik yapay zekasısın. Verilen mesafe, hava durumu ve trafik bilgilerine dayanarak gerçekçi bir Tahmini Varış Süresi (ETA - dakika olarak) ve kısa bir sürücü tavsiyesi oluştur."
    sorgu = f"Mesafe: {mesafe_km:.2f} km\nHava Durumu: {hava_durumu}\nTrafik Durumu: {trafik_durumu}"
    
    try:
        yanit = istemci.models.generate_content(
            model='gemini-3.5-flash',
            contents=f"{sistem_komutu}\n{sorgu}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RotaAnalizSonucu,
            ),
        )
        return RotaAnalizSonucu.model_validate_json(yanit.text)
    except Exception as e:
        # Fallback in case of an API error
        return RotaAnalizSonucu(
            eta_dakika=int((mesafe_km / 60) * 60),
            hava_durumu=hava_durumu,
            trafik_durumu=trafik_durumu,
            ai_tavsiyesi=f"AI sistemine ulaşılamadı. Lütfen normal hız limitlerine uyun."
        )
