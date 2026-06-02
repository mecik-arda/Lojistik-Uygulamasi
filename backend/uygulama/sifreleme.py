import base64
import hashlib
from cryptography.fernet import Fernet

def anahtar_uret(gizli_anahtar: str) -> bytes:
    hash_obj = hashlib.sha256(gizli_anahtar.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(hash_obj)

def sifrele(metin: str, gizli_anahtar: str) -> str:
    if not metin or not str(metin).strip() or str(metin).startswith("enc:"):
        return metin
    fernet = Fernet(anahtar_uret(gizli_anahtar))
    sifreli_baytlar = fernet.encrypt(str(metin).encode('utf-8'))
    return f"enc:{sifreli_baytlar.decode('utf-8')}"

def sifrele_bayt(veri: bytes, gizli_anahtar: str) -> bytes:
    fernet = Fernet(anahtar_uret(gizli_anahtar))
    return fernet.encrypt(veri)

def sifre_coz_bayt(veri: bytes, gizli_anahtar: str) -> bytes:
    fernet = Fernet(anahtar_uret(gizli_anahtar))
    return fernet.decrypt(veri)

def sifre_coz(metin: str, gizli_anahtar: str) -> str:
    if not metin or not str(metin).startswith("enc:"):
        return metin
    gercek_metin = str(metin)[4:]
    fernet = Fernet(anahtar_uret(gizli_anahtar))
    try:
        cozulmus = fernet.decrypt(gercek_metin.encode('utf-8'))
        return cozulmus.decode('utf-8')
    except Exception:
        return metin
