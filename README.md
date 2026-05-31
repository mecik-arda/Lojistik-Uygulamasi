# LojistikAI - Yeni Nesil Lojistik Yönetim Sistemi

LojistikAI, modern ve ölçeklenebilir bir mimari kullanılarak geliştirilmiş, gerçek zamanlı araç takibi, gelişmiş e-posta yönetimi ve detaylı sistem sağlığı analizleri sunan kapsamlı bir lojistik yönetim platformudur.

## Özellikler

*   **Gerçek Zamanlı Harita ve Rota Optimizasyonu:** Araçların anlık konumlarını harita (Leaflet) üzerinde görüntüleyin ve duraklar arası mesafeye göre otomatik olarak optimize edilmiş en kısa rotayı çizin.
*   **Gelişmiş Sistem Bakım Paneli:** 
    *   Sistem yükünü (CPU ve RAM) WebSocket üzerinden canlı bir akış grafiği ile anlık olarak takip edin.
    *   Geçici dizinleri (%temp%, Prefetch) tek tıkla güvenle temizleyin.
    *   Port taraması ve statik kod analizi ile güvenlik zafiyetlerini anında tespit edin.
*   **Şifreli Veritabanı Yedekleme:** Tek tıkla SQLite veritabanı yedeğinizi oluşturun ve AES-128 şifreleme ile güvenli bir formata (`.enc`) dönüştürerek bilgisayarınıza indirin.
*   **Gelişmiş E-Posta Yönetimi:** Çoklu alıcı havuzları oluşturun, şablon bazlı toplu e-postalar gönderin ve açık/tıklama oranlarını detaylı kampanyalar halinde analiz edin.
*   **Tamamen Türkçe:** Kullanıcı arayüzünden backend isimlendirmelerine kadar projede Türkçe kullanılmıştır.

## Kullanılan Teknolojiler

### Frontend
*   **React 18 & Vite:** Yüksek performanslı ve hızlı derlenen arayüz altyapısı.
*   **TypeScript:** Statik tip güvenliği.
*   **Tailwind CSS:** Esnek ve hızlı modern stil yönetimi.
*   **Leaflet & React-Leaflet:** Gerçek zamanlı harita görünümü ve rota çizimi.
*   **Recharts:** Anlık websocket verilerini okuyarak çizilen animasyonlu performans grafikleri.
*   **Lucide React:** Modern ve hafif ikon seti.

### Backend
*   **FastAPI:** Modern, hızlı (yüksek performanslı) asenkron web framework.
*   **SQLAlchemy (Async):** Asenkron veritabanı ORM.
*   **SQLite:** Veritabanı yönetim sistemi (Kolay taşınabilir ve şifreli yedeklemeye uygun).
*   **WebSockets:** Canlı CPU/RAM verilerinin ve bildirimlerin istemciye anlık aktarımı.
*   **Psutil:** Sunucu sistem kaynaklarının canlı olarak okunması.
*   **ReportLab:** Bakım ve analiz sonuçlarının anında PDF olarak raporlanması.
*   **Cryptography (Fernet):** Çevresel değişkenler ve veritabanı yedekleri için güçlü simetrik (AES) şifreleme.

## Kurulum ve Çalıştırma

### Gereksinimler
*   Node.js (v18+)
*   Python (3.10+)

### Backend Kurulumu
1. Backend dizinine gidin:
   ```bash
   cd backend
   ```
2. Gerekli kütüphaneleri yükleyin:
   ```bash
   pip install -r requirements.txt
   ```
3. API sunucusunu başlatın:
   ```bash
   uvicorn uygulama.ana:uygulama --reload
   ```

### Frontend Kurulumu
1. Frontend dizinine gidin:
   ```bash
   cd frontend
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Güvenlik Önlemleri
Bu projede şifreleme büyük bir titizlikle ele alınmıştır. Hassas yapılandırma verileri ve API anahtarları `.env` dosyasında AES-128 (Fernet) ile şifrelenmiş olarak tutulmaktadır. Sistem çalışırken hafızada dinamik olarak çözülürler, bu sayede yetkisiz disk erişimlerinde bile anahtarlarınız güvendedir.

## Lisans
Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakabilirsiniz.
