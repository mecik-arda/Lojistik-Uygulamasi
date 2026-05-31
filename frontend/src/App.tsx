import { BrowserRouter as Yonlendirici, Routes as Rotalar, Route as Rota } from 'react-router-dom';
import { TemaSaglayici } from './baglam/TemaBaglami';
import { YetkilendirmeSaglayici } from './baglam/YetkilendirmeBaglami';
import { WebsocketSaglayici } from './baglam/WebsocketBaglami';
import { Toaster } from 'react-hot-toast';
import GirisSayfasi from './sayfalar/giris/GirisSayfasi';
import AnaYerlesim from './bilesenler/yerlesim/AnaYerlesim';
import AnaPano from './sayfalar/pano/AnaPano';
import MailTakipSayfasi from './sayfalar/mail-takip/MailTakipSayfasi';
import MailGonderimSayfasi from './sayfalar/mail-gonderim/MailGonderimSayfasi';
import BakimSayfasi from './sayfalar/bakim/BakimSayfasi';
import KurulumSayfasi from './sayfalar/ayarlar/KurulumSayfasi';
import HaritaSayfasi from './sayfalar/harita/HaritaSayfasi';

function App() {
  return (
    <TemaSaglayici>
      <YetkilendirmeSaglayici>
        <WebsocketSaglayici>
          <Yonlendirici>
            <Toaster position="bottom-right" />
            <Rotalar>
              <Rota path="/" element={<GirisSayfasi />} />
              <Rota element={<AnaYerlesim />}>
                <Rota path="/pano" element={<AnaPano />} />
                <Rota path="/mail-takip" element={<MailTakipSayfasi />} />
                <Rota path="/mail-gonderim" element={<MailGonderimSayfasi />} />
                <Rota path="/harita" element={<HaritaSayfasi />} />
                <Rota path="/bakim" element={<BakimSayfasi />} />
                <Rota path="/ayarlar" element={<KurulumSayfasi />} />
              </Rota>
            </Rotalar>
          </Yonlendirici>
        </WebsocketSaglayici>
      </YetkilendirmeSaglayici>
    </TemaSaglayici>
  );
}

export default App;
