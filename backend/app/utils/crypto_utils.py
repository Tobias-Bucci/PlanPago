import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEY_PATH = os.path.join(os.path.dirname(__file__), '../../encryption.key')
KEY_SIZE = 32  # 256 bit
NONCE_SIZE = 12  # 96 bit, recommended for GCM


def get_key():
    if not os.path.exists(KEY_PATH):
        key = AESGCM.generate_key(bit_length=KEY_SIZE * 8)
        with open(KEY_PATH, 'wb') as f:
            f.write(key)
    else:
        with open(KEY_PATH, 'rb') as f:
            key = f.read()
    if len(key) != KEY_SIZE:
        raise ValueError('Invalid key size')
    return key


def encrypt_file(infile, outfile):
    key = get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(NONCE_SIZE)
    data = infile.read()
    ct = aesgcm.encrypt(nonce, data, None)
    # Schreibe Nonce + Ciphertext
    outfile.write(nonce + ct)


def decrypt_file(infile, outfile):
    key = get_key()
    aesgcm = AESGCM(key)
    nonce = infile.read(NONCE_SIZE)
    ct = infile.read()
    data = aesgcm.decrypt(nonce, ct, None)
    outfile.write(data)
