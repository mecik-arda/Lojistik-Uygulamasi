from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from uygulama.yapilandirma import ayarlar


motor = create_async_engine(ayarlar.veritabani_url, echo=False)

AsyncOturumFabrikasi = async_sessionmaker(motor, class_=AsyncSession, expire_on_commit=False)


class TemelModel(DeclarativeBase):
    pass


async def veritabani_oturumu_al():
    async with AsyncOturumFabrikasi() as oturum:
        try:
            yield oturum
            await oturum.commit()
        except Exception:
            await oturum.rollback()
            raise


async def veritabani_olustur():
    async with motor.begin() as baglanti:
        await baglanti.run_sync(TemelModel.metadata.create_all)
