import os
import json
import base64
import stat
from functools import lru_cache
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
SECRET_KEY_PATH = os.path.join(DATA_DIR, "secret.key")
CONFIG_JSON_PATH = os.path.join(DATA_DIR, "config.json")

def generate_secret_key():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    
    if not os.path.exists(SECRET_KEY_PATH):
        # AES-256 için 32 byte (256-bit) anahtar üretimi
        key = os.urandom(32)
        with open(SECRET_KEY_PATH, "wb") as f:
            f.write(base64.b64encode(key))
        try:
            os.chmod(SECRET_KEY_PATH, stat.S_IRUSR | stat.S_IWUSR) # chmod 600
        except Exception:
            pass

def get_secret_key() -> bytes:
    generate_secret_key()
    with open(SECRET_KEY_PATH, "rb") as f:
        return base64.b64decode(f.read())

def encrypt_aes256(plaintext: str, key: bytes) -> str:
    iv = os.urandom(12) # GCM için standart 96-bit (12 byte) IV
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext.encode("utf-8")) + encryptor.finalize()
    return base64.b64encode(iv + encryptor.tag + ciphertext).decode("utf-8")

def decrypt_aes256(encrypted_data: str, key: bytes) -> str:
    data = base64.b64decode(encrypted_data)
    iv = data[:12]
    tag = data[12:28]
    ciphertext = data[28:]
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=default_backend())
    decryptor = cipher.decryptor()
    return (decryptor.update(ciphertext) + decryptor.finalize()).decode("utf-8")

def setup_config_if_needed(default_api_key: str):
    if not default_api_key:
        return
        
    generate_secret_key()
    key = get_secret_key()
    
    if not os.path.exists(CONFIG_JSON_PATH):
        encrypted_key = encrypt_aes256(default_api_key, key)
        with open(CONFIG_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump({"GEMINI_API_KEY": encrypted_key}, f, indent=4)

@lru_cache(maxsize=1)
def get_gemini_api_key() -> str:
    if not os.path.exists(CONFIG_JSON_PATH):
        return ""
    
    key = get_secret_key()
    with open(CONFIG_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        encrypted_key = data.get("GEMINI_API_KEY", "")
        if encrypted_key:
            try:
                return decrypt_aes256(encrypted_key, key)
            except Exception:
                return ""
    return ""
