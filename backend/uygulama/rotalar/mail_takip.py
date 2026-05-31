import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc, asc, delete
from sqlalchemy.ext.asyncio import AsyncSession

from uygulama.veritabani import veritabani_oturumu_al
from uygulama.rotalar.yetkilendirme import mevcut_kullanici_al
from uygulama.modeller.kullanici import KullaniciModeli
from uygulama.modeller.mail import MailModeli
from uygulama.semalar.mail import MailYanit, MailListesiYanit, MailGuncelleIstek, TopluIslemIstek, DogalAramaIstek
from uygulama.servisler.mail_siniflandirma import senkronize_ve_siniflandir
from uygulama.servisler.gemini_servisi import dogal_dil_sorgusu_analiz_et

mail_yonlendirici = APIRouter(prefix="/api/mailler", tags=["Mailler"])


@mail_yonlendirici.get("/", response_model=MailListesiYanit)
async def mail_listesi(
    sayfa: int = Query(1, ge=1),
    sayfa_boyutu: int = Query(20, ge=1, le=100),
    kategori: str | None = Query(None),
    okundu: bool | None = Query(None),
    arsivlendi: bool | None = Query(None),
    siralama: str = Query("tarih"),
    siralama_yonu: str = Query("desc"),
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al),
):
    temel_sorgu = select(MailModeli).where(MailModeli.kullanici_id == mevcut_kullanici.id)

    if kategori is not None:
        temel_sorgu = temel_sorgu.where(MailModeli.kategori == kategori)
    if okundu is not None:
        temel_sorgu = temel_sorgu.where(MailModeli.okundu == okundu)
    if arsivlendi is not None:
        temel_sorgu = temel_sorgu.where(MailModeli.arsivlendi == arsivlendi)

    sayim_sorgusu = select(func.count()).select_from(temel_sorgu.subquery())
    sayim_sonucu = await oturum.execute(sayim_sorgusu)
    toplam = sayim_sonucu.scalar() or 0

    siralama_alani = getattr(MailModeli, siralama, MailModeli.tarih)
    siralama_fonksiyonu = desc if siralama_yonu == "desc" else asc
    temel_sorgu = temel_sorgu.order_by(siralama_fonksiyonu(siralama_alani))

    ofset = (sayfa - 1) * sayfa_boyutu
    temel_sorgu = temel_sorgu.offset(ofset).limit(sayfa_boyutu)

    sonuc = await oturum.execute(temel_sorgu)
    mailler = sonuc.scalars().all()

    return MailListesiYanit(
        mailler=[MailYanit.model_validate(m) for m in mailler],
        toplam=toplam,
        sayfa=sayfa,
        sayfa_boyutu=sayfa_boyutu,
    )


@mail_yonlendirici.get("/{mail_id}", response_model=MailYanit)
async def mail_detay(
    mail_id: uuid.UUID,
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al),
):
    sorgu = select(MailModeli).where(
        MailModeli.id == mail_id,
        MailModeli.kullanici_id == mevcut_kullanici.id,
    )
    sonuc = await oturum.execute(sorgu)
    mail = sonuc.scalar_one_or_none()
    if mail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mail bulunamadı")
    return mail


@mail_yonlendirici.patch("/{mail_id}", response_model=MailYanit)
async def mail_guncelle(
    mail_id: uuid.UUID,
    istek: MailGuncelleIstek,
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al),
):
    sorgu = select(MailModeli).where(
        MailModeli.id == mail_id,
        MailModeli.kullanici_id == mevcut_kullanici.id,
    )
    sonuc = await oturum.execute(sorgu)
    mail = sonuc.scalar_one_or_none()
    if mail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mail bulunamadı")

    guncelleme_verisi = istek.model_dump(exclude_none=True)
    for alan, deger in guncelleme_verisi.items():
        setattr(mail, alan, deger)

    return mail


@mail_yonlendirici.post("/toplu-islem")
async def toplu_islem(
    istek: TopluIslemIstek,
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al),
):
    if istek.islem_tipi == "sil":
        sorgu = delete(MailModeli).where(
            MailModeli.id.in_(istek.mail_idleri),
            MailModeli.kullanici_id == mevcut_kullanici.id,
        )
        sonuc = await oturum.execute(sorgu)
        await oturum.commit()
        return {"mesaj": "Silme başarılı", "etkilenen": sonuc.rowcount}

    sorgu = select(MailModeli).where(
        MailModeli.id.in_(istek.mail_idleri),
        MailModeli.kullanici_id == mevcut_kullanici.id,
    )
    sonuc = await oturum.execute(sorgu)
    mailler = sonuc.scalars().all()

    guncellenen = 0
    for mail in mailler:
        if istek.islem_tipi == "okundu_isaretle":
            mail.okundu = True
        elif istek.islem_tipi == "arsivle":
            mail.arsivlendi = True
        elif istek.islem_tipi == "kategori_degistir" and istek.yeni_kategori:
            mail.kategori = istek.yeni_kategori
        guncellenen += 1

    await oturum.commit()
    return {"guncellenen": guncellenen, "toplam": len(istek.mail_idleri)}


@mail_yonlendirici.post("/senkronize")
async def senkronize(
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al),
):
    eklenen = await senkronize_ve_siniflandir(mevcut_kullanici.id, oturum)
    return {"mesaj": "Senkronizasyon tamamlandı", "eklenen": eklenen}


@mail_yonlendirici.post("/dogal-arama", response_model=list[MailYanit])
async def dogal_arama(
    istek: DogalAramaIstek,
    mevcut_kullanici: KullaniciModeli = Depends(mevcut_kullanici_al),
    oturum: AsyncSession = Depends(veritabani_oturumu_al),
):
    analiz = await dogal_dil_sorgusu_analiz_et(istek.metin)
    
    sorgu = select(MailModeli).where(MailModeli.kullanici_id == mevcut_kullanici.id)
    
    if analiz.kategori:
        sorgu = sorgu.where(MailModeli.kategori == analiz.kategori)
        
    if analiz.baslangic_tarihi:
        try:
            baslangic = datetime.fromisoformat(analiz.baslangic_tarihi.replace("Z", "+00:00"))
            sorgu = sorgu.where(MailModeli.tarih >= baslangic)
        except ValueError:
            pass
            
    if analiz.bitis_tarihi:
        try:
            bitis = datetime.fromisoformat(analiz.bitis_tarihi.replace("Z", "+00:00"))
            sorgu = sorgu.where(MailModeli.tarih <= bitis)
        except ValueError:
            pass
            
    sorgu = sorgu.order_by(desc(MailModeli.tarih)).limit(50)
    sonuc = await oturum.execute(sorgu)
    mailler = sonuc.scalars().all()
    
    return mailler
