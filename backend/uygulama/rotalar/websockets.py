import uuid
import asyncio
import psutil
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from uygulama.servisler.websocket_servisi import websocket_yoneticisi

websockets_yonlendirici = APIRouter(prefix="/api/ws", tags=["WebSocket"])

@websockets_yonlendirici.websocket("/{kullanici_id}")
async def websocket_uc_noktasi(websocket: WebSocket, kullanici_id: uuid.UUID):
    await websocket_yoneticisi.baglan(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_yoneticisi.baglantiyi_kes(websocket)

@websockets_yonlendirici.websocket("/saglik/{kullanici_id}")
async def saglik_websocket_uc_noktasi(websocket: WebSocket, kullanici_id: uuid.UUID):
    await websocket.accept()
    try:
        while True:
            cpu = psutil.cpu_percent(interval=None)
            ram = psutil.virtual_memory().percent
            disk = psutil.disk_usage('/').percent
            
            veri = {
                "tip": "saglik_guncellemesi",
                "cpu": cpu,
                "ram": ram,
                "disk": disk
            }
            await websocket.send_json(veri)
            await asyncio.sleep(1)
    except Exception:
        pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
