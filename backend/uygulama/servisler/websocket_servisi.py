import json
from fastapi import WebSocket

class BaglantiYoneticisi:
    def __init__(self):
        self.aktif_baglantilar: list[WebSocket] = []

    async def baglan(self, websocket: WebSocket):
        await websocket.accept()
        self.aktif_baglantilar.append(websocket)

    def baglantiyi_kes(self, websocket: WebSocket):
        if websocket in self.aktif_baglantilar:
            self.aktif_baglantilar.remove(websocket)

    async def yayinla(self, mesaj_dict: dict):
        mesaj_metni = json.dumps(mesaj_dict)
        for baglanti in self.aktif_baglantilar:
            try:
                await baglanti.send_text(mesaj_metni)
            except Exception:
                pass

websocket_yoneticisi = BaglantiYoneticisi()
