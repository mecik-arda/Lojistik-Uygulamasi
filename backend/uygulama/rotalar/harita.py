from fastapi import APIRouter, Depends
from typing import List, Dict, Any
import math
import random

from uygulama.rotalar.yetkilendirme import mevcut_kullanici_al
from uygulama.modeller.kullanici import KullaniciModeli
from uygulama.servisler.gemini_servisi import rota_analiz_et

harita_yonlendirici = APIRouter(prefix="/api/harita", tags=["Harita"])

def mesafe_hesapla(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@harita_yonlendirici.get("/araclar")
async def arac_konumlari(mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al)) -> List[Dict[str, Any]]:
    tum_araclar = [
        {"id": 1, "plaka": "34 ABC 123", "surucu": "Ahmet Yılmaz", "lat": 41.0082, "lng": 28.9784, "durum": "Yolda", "hiz": 65},
        {"id": 2, "plaka": "06 DEF 456", "surucu": "Mehmet Demir", "lat": 41.0122, "lng": 29.0011, "durum": "Bekliyor", "hiz": 0},
        {"id": 3, "plaka": "35 GHI 789", "surucu": "Ayşe Kaya", "lat": 40.9876, "lng": 29.0345, "durum": "Teslimat", "hiz": 45}
    ]
    if mevcut_kullanici.rol == "Müşteri":
        return [tum_araclar[0]]
    return tum_araclar

@harita_yonlendirici.get("/rota")
async def akilli_rota(mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al)) -> Dict[str, Any]:
    baslangic = {"lat": 41.0082, "lng": 28.9784, "isim": "Merkez Depo"}
    teslimat_noktalari = [
        {"id": 1, "lat": 41.0350, "lng": 28.9833, "isim": "Müşteri A"},
        {"id": 2, "lat": 40.9900, "lng": 29.0200, "isim": "Müşteri B"},
        {"id": 3, "lat": 41.0500, "lng": 29.0100, "isim": "Müşteri C"}
    ]
    
    if mevcut_kullanici.rol == "Müşteri":
        teslimat_noktalari = [teslimat_noktalari[0]]
        
    ziyaret_edilecek = teslimat_noktalari.copy()
    mevcut_konum = baslangic
    sirali_rota = [baslangic]
    toplam_mesafe = 0.0
    
    while ziyaret_edilecek:
        en_yakin = min(ziyaret_edilecek, key=lambda nokta: mesafe_hesapla(mevcut_konum["lat"], mevcut_konum["lng"], nokta["lat"], nokta["lng"]))
        toplam_mesafe += mesafe_hesapla(mevcut_konum["lat"], mevcut_konum["lng"], en_yakin["lat"], en_yakin["lng"])
        sirali_rota.append(en_yakin)
        mevcut_konum = en_yakin
        ziyaret_edilecek.remove(en_yakin)
        
    toplam_mesafe_km = round(toplam_mesafe, 2)
    
    hava_durumlari = ["Güneşli", "Yağmurlu", "Karlı", "Bulutlu"]
    trafik_durumlari = ["Akıcı", "Yoğun", "Kilitli", "Normal"]
    hava = random.choice(hava_durumlari)
    trafik = random.choice(trafik_durumlari)
    
    ai_analizi = await rota_analiz_et(toplam_mesafe_km, hava, trafik)
    
    return {
        "rota": sirali_rota,
        "toplam_mesafe_km": toplam_mesafe_km,
        "ai_analizi": ai_analizi.model_dump()
    }
