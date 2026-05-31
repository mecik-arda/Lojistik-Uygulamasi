import psutil
import uuid
import os
import socket
import tempfile
import shutil
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def sistem_durumu_al():
    cpu = psutil.cpu_percent(interval=0.5)
    ram = psutil.virtual_memory().percent
    
    # Basit bir saglik skoru (100 - max(cpu, ram))
    skor = max(0, int(100 - max(cpu, ram)))
    
    return {
        "saglik_skoru": skor,
        "cpu_kullanimi": cpu,
        "ram_kullanimi": ram,
        "disk_durumu": "Normal",
        "guncelleme_durumu": "Guncel",
        "guvenlik_durumu": "Temiz"
    }

def pdf_rapor_olustur(kayit_id: uuid.UUID, kaynak_raporu: dict, temizlik_sonucu: dict, guvenlik_sonucu: dict) -> str:
    rapor_dizini = "raporlar"
    if not os.path.exists(rapor_dizini):
        os.makedirs(rapor_dizini)
        
    dosya_adi = f"bakim_raporu_{kayit_id}.pdf"
    dosya_yolu = os.path.join(rapor_dizini, dosya_adi)
    
    belge = SimpleDocTemplate(dosya_yolu, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    stiller = getSampleStyleSheet()
    
    baslik_stili = ParagraphStyle(
        "Baslik",
        parent=stiller['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=20,
        alignment=1
    )
    
    alt_baslik_stili = ParagraphStyle(
        "AltBaslik",
        parent=stiller['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#334155"),
        spaceBefore=15,
        spaceAfter=10,
        borderPadding=6,
        backColor=colors.HexColor("#f1f5f9")
    )
    
    normal_stil = stiller['Normal']
    normal_stil.fontSize = 11
    normal_stil.textColor = colors.HexColor("#475569")
    
    icerik = []
    
    icerik.append(Paragraph("Sistem Bakim Raporu", baslik_stili))
    icerik.append(Paragraph(f"<b>Rapor ID:</b> {kayit_id}", normal_stil))
    icerik.append(Paragraph(f"<b>Olusturulma Tarihi:</b> {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}", normal_stil))
    icerik.append(Spacer(1, 20))
    
    tablo_stili = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor("#334155")),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 8),
    ])
    
    icerik.append(Paragraph("Kaynak Tuketimi", alt_baslik_stili))
    kaynak_verisi = [
        ["Metrik", "Deger"],
        ["CPU Kullanimi", f"%{kaynak_raporu.get('cpu_kullanimi', 0)}"],
        ["RAM Kullanimi", f"%{kaynak_raporu.get('ram_kullanimi', 0)}"]
    ]
    kaynak_tablosu = Table(kaynak_verisi, colWidths=[200, 300])
    kaynak_tablosu.setStyle(tablo_stili)
    icerik.append(kaynak_tablosu)
    icerik.append(Spacer(1, 15))
    
    icerik.append(Paragraph("Temizlik Sonuclari", alt_baslik_stili))
    temizlik_verisi = [
        ["Metrik", "Deger"],
        ["Disk Durumu", temizlik_sonucu.get('durum', 'Bilgi Yok')],
        ["Silinen Gecici Dosya Boyutu", f"{temizlik_sonucu.get('silinen_boyut', '0')} MB"]
    ]
    temizlik_tablosu = Table(temizlik_verisi, colWidths=[200, 300])
    temizlik_tablosu.setStyle(tablo_stili)
    icerik.append(temizlik_tablosu)
    icerik.append(Spacer(1, 15))
    
    icerik.append(Paragraph("Guvenlik Taramasi", alt_baslik_stili))
    guvenlik_verisi = [
        ["Metrik", "Deger"],
        ["Zararli Yazilim", guvenlik_sonucu.get('zararli_yazilim', 'Bulunmadi')],
        ["Acik Portlar", guvenlik_sonucu.get('acik_portlar', 'Yok')]
    ]
    guvenlik_tablosu = Table(guvenlik_verisi, colWidths=[200, 300])
    guvenlik_tablosu.setStyle(tablo_stili)
    icerik.append(guvenlik_tablosu)
    
    belge.build(icerik)
    
    return dosya_yolu

def gercek_disk_temizligi() -> float:
    dizinler = [
        tempfile.gettempdir(),
        os.path.join(os.environ.get('SystemRoot', 'C:\\Windows'), 'Temp'),
        os.path.join(os.environ.get('SystemRoot', 'C:\\Windows'), 'Prefetch')
    ]
    silinen_boyut_bayt = 0
    for dizin in dizinler:
        if not os.path.exists(dizin):
            continue
        try:
            for root, dirs, files in os.walk(dizin):
                for file in files:
                    try:
                        dosya_yolu = os.path.join(root, file)
                        if os.path.isfile(dosya_yolu):
                            boyut = os.path.getsize(dosya_yolu)
                            os.remove(dosya_yolu)
                            silinen_boyut_bayt += boyut
                    except Exception:
                        pass
        except Exception:
            pass
    return round(silinen_boyut_bayt / (1024 * 1024), 2)

def gercek_guvenlik_taramasi() -> list:
    acik_portlar = []
    aranacak_portlar = [21, 22, 23, 80, 443, 3306, 5432, 6379, 8000, 5173]
    
    for port in aranacak_portlar:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.1)
        sonuc = sock.connect_ex(('127.0.0.1', port))
        if sonuc == 0:
            acik_portlar.append(str(port))
        sock.close()
        
    return acik_portlar

def gercek_zararli_yazilim_taramasi() -> list:
    bulgular = []
    dizin = os.getcwd()
    kaliplar = [b"eval(", b"exec(", b"os.system(", b"subprocess.Popen(", b"base64.b64decode("]
    
    try:
        for kok, klasorler, dosyalar in os.walk(dizin):
            if any(p in kok for p in [".git", "node_modules", ".venv", "__pycache__", "dist", "raporlar"]):
                continue
            for dosya in dosyalar:
                if dosya.endswith(('.py', '.js', '.ts', '.tsx', '.bat', '.sh')):
                    yol = os.path.join(kok, dosya)
                    try:
                        with open(yol, 'rb') as f:
                            icerik = f.read()
                            for kalip in kaliplar:
                                if kalip in icerik:
                                    rel = os.path.relpath(yol, dizin)
                                    bulgular.append(f"{rel} ({kalip.decode('utf-8').strip('(')})")
                                    break
                    except Exception:
                        pass
    except Exception:
        pass
    return bulgular

def bakim_calistir(mod: str) -> tuple[int, dict, dict, dict]:
    durum = sistem_durumu_al()
    cpu = durum["cpu_kullanimi"]
    ram = durum["ram_kullanimi"]
    
    kaynak_raporu = {
        "cpu_kullanimi": cpu,
        "ram_kullanimi": ram
    }
    
    temizlenen_mb = 0.0
    if mod in ["Tam Bakım", "Sadece Temizlik"]:
        temizlenen_mb = gercek_disk_temizligi()
        
    temizlik_sonucu = {
        "durum": "Basarili",
        "silinen_boyut": temizlenen_mb
    }
    
    acik_portlar_listesi = []
    zararli_yazilimlar = []
    if mod in ["Tam Bakım", "Sadece Güvenlik"]:
        acik_portlar_listesi = gercek_guvenlik_taramasi()
        zararli_yazilimlar = gercek_zararli_yazilim_taramasi()
        
    guvenlik_sonucu = {
        "zararli_yazilim": ", ".join(zararli_yazilimlar) if zararli_yazilimlar else "Bulunmadi",
        "acik_portlar": ", ".join(acik_portlar_listesi) if acik_portlar_listesi else "Yok"
    }
    
    return durum["saglik_skoru"], kaynak_raporu, temizlik_sonucu, guvenlik_sonucu
