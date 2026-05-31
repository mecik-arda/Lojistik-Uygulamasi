from fastapi import APIRouter, Depends
from typing import List, Dict, Any
import math

from uygulama.rotalar.yetkilendirme import mevcut_kullanici_al
from uygulama.modeller.kullanici import KullaniciModeli

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
    return [
        {"id": 1, "plaka": "34 ABC 123", "surucu": "Ahmet Yılmaz", "lat": 41.0082, "lng": 28.9784, "durum": "Yolda", "hiz": 65},
        {"id": 2, "plaka": "06 DEF 456", "surucu": "Mehmet Demir", "lat": 41.0122, "lng": 29.0011, "durum": "Bekliyor", "hiz": 0},
        {"id": 3, "plaka": "35 GHI 789", "surucu": "Ayşe Kaya", "lat": 40.9876, "lng": 29.0345, "durum": "Teslimat", "hiz": 45}
    ]

@harita_yonlendirici.get("/rota")
async def akilli_rota(mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al)) -> Dict[str, Any]:
    baslangic = {"lat": 41.0082, "lng": 28.9784, "isim": "Merkez Depo"}
    teslimat_noktalari = [
        {"id": 1, "lat": 41.0350, "lng": 28.9833, "isim": "Müşteri A"},
        {"id": 2, "lat": 40.9900, "lng": 29.0200, "isim": "Müşteri B"},
        {"id": 3, "lat": 41.0500, "lng": 29.0100, "isim": "Müşteri C"}
    ]
    
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
        
    return {
        "rota": sirali_rota,
        "toplam_mesafe_km": round(toplam_mesafe, 2)
    }
