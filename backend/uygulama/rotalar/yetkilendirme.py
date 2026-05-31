import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from uygulama.yapilandirma import ayarlar
from uygulama.veritabani import veritabani_oturumu_al
from uygulama.modeller.kullanici import KullaniciModeli
from uygulama.semalar.kullanici import KullaniciOlustur, KullaniciYanit, TokenYanit

yetki_yonlendirici = APIRouter(prefix="/api/yetki", tags=["Yetkilendirme"])

oauth2_semasi = OAuth2PasswordBearer(tokenUrl="/api/yetki/giris", auto_error=False)


def token_olustur(veri: dict) -> str:
    kodlanacak = veri.copy()
    bitis = datetime.now(timezone.utc) + timedelta(minutes=ayarlar.jwt_sure_dakika)
    kodlanacak.update({"exp": bitis})
    return jwt.encode(kodlanacak, ayarlar.gizli_anahtar, algorithm=ayarlar.jwt_algoritmasi)


async def mevcut_kullanici_al(
    token: str | None = Depends(oauth2_semasi),
    token_sorgu: str | None = Query(None, alias="token"),
    oturum: AsyncSession = Depends(veritabani_oturumu_al),
) -> KullaniciModeli:
    kimlik_hatasi = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik doğrulanamadı",
        headers={"WWW-Authenticate": "Bearer"},
    )
    aktif_token = token or token_sorgu
    if aktif_token is None:
        raise kimlik_hatasi
    try:
        yukle = jwt.decode(aktif_token, ayarlar.gizli_anahtar, algorithms=[ayarlar.jwt_algoritmasi])
        kullanici_id: str | None = yukle.get("sub")
        if kullanici_id is None:
            raise kimlik_hatasi
    except JWTError:
        raise kimlik_hatasi

    sorgu = select(KullaniciModeli).where(KullaniciModeli.id == uuid.UUID(kullanici_id))
    sonuc = await oturum.execute(sorgu)
    kullanici = sonuc.scalar_one_or_none()
    if kullanici is None:
        raise kimlik_hatasi
    return kullanici


@yetki_yonlendirici.post("/giris", response_model=TokenYanit)
async def giris(
    giris_verisi: KullaniciOlustur,
    oturum: AsyncSession = Depends(veritabani_oturumu_al),
):
    sorgu = select(KullaniciModeli).where(KullaniciModeli.email == giris_verisi.email)
    sonuc = await oturum.execute(sorgu)
    kullanici = sonuc.scalar_one_or_none()

    if kullanici is None:
        kullanici = KullaniciModeli(
            email=giris_verisi.email,
            ad=giris_verisi.ad,
            soyad=giris_verisi.soyad,
        )
        oturum.add(kullanici)
        await oturum.flush()

    kullanici.son_giris = datetime.now(timezone.utc)

    erisim_tokeni = token_olustur(veri={"sub": str(kullanici.id)})
    return TokenYanit(erisim_tokeni=erisim_tokeni, token_tipi="bearer")

@yetki_yonlendirici.get("/google/giris")
async def google_giris():
    kapsamlar = "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"
    yonlendirme = "http://localhost:8000/api/yetki/google/geri_donus"
    url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={ayarlar.google_istemci_id}&redirect_uri={yonlendirme}&response_type=code&scope={kapsamlar}&access_type=offline&prompt=consent"
    return RedirectResponse(url=url)

@yetki_yonlendirici.get("/google/geri_donus")
async def google_geri_donus(code: str, oturum: AsyncSession = Depends(veritabani_oturumu_al)):
    yonlendirme = "http://localhost:8000/api/yetki/google/geri_donus"
    async with httpx.AsyncClient() as istemci:
        token_yanit = await istemci.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": ayarlar.google_istemci_id,
                "client_secret": ayarlar.google_istemci_sirri,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": yonlendirme,
            }
        )
        token_veri = token_yanit.json()
        
        if "error" in token_veri:
            raise HTTPException(status_code=400, detail="Google dogrulamasi basarisiz")
            
        erisim_anahtari = token_veri.get("access_token")
        yenileme_anahtari = token_veri.get("refresh_token")
        
        kullanici_yanit = await istemci.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {erisim_anahtari}"}
        )
        kullanici_veri = kullanici_yanit.json()
        
        email = kullanici_veri.get("email")
        ad = kullanici_veri.get("given_name", "")
        soyad = kullanici_veri.get("family_name", "")
        
        sorgu = select(KullaniciModeli).where(KullaniciModeli.email == email)
        sonuc = await oturum.execute(sorgu)
        kullanici = sonuc.scalar_one_or_none()
        
        if kullanici is None:
            kullanici = KullaniciModeli(
                email=email,
                ad=ad,
                soyad=soyad,
                google_token=erisim_anahtari,
                google_refresh_token=yenileme_anahtari
            )
            oturum.add(kullanici)
        else:
            kullanici.google_token = erisim_anahtari
            if yenileme_anahtari:
                kullanici.google_refresh_token = yenileme_anahtari
                
        kullanici.son_giris = datetime.now(timezone.utc)
        await oturum.commit()
        
        uygulama_tokeni = token_olustur(veri={"sub": str(kullanici.id)})
        
        return RedirectResponse(url=f"{ayarlar.frontend_url}/pano?token={uygulama_tokeni}")


@yetki_yonlendirici.get("/ben", response_model=KullaniciYanit)
async def ben(
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
):
    return mevcut_kullanici
