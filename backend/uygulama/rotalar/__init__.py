from uygulama.rotalar.yetkilendirme import yetki_yonlendirici
from uygulama.rotalar.ayarlar import ayarlar_yonlendirici
from uygulama.rotalar.mail_takip import mail_yonlendirici
from uygulama.rotalar.saglik import saglik_yonlendirici
from uygulama.rotalar.websockets import websockets_yonlendirici
from uygulama.rotalar.kampanya import kampanya_yonlendirici
from uygulama.rotalar.bakim import bakim_yonlendirici
from uygulama.rotalar.harita import harita_yonlendirici
from uygulama.rotalar.yedekleme import yedekleme_yonlendirici

__all__ = [
    "yetki_yonlendirici",
    "ayarlar_yonlendirici",
    "mail_yonlendirici",
    "saglik_yonlendirici",
    "websockets_yonlendirici",
    "kampanya_yonlendirici",
    "bakim_yonlendirici",
    "harita_yonlendirici",
    "yedekleme_yonlendirici"
]
