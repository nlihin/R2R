import secrets
import string
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerifyMismatchError

ph = PasswordHasher()  # Argon2id by default


def hash_password(raw: str) -> str:
    return ph.hash(raw)


def verify_password(stored_hash: str, raw: str) -> bool:
    try:
        ph.verify(stored_hash, raw)
        return True
    except VerifyMismatchError:
        return False


def validate_password_strength(password: str) -> bool:
    """12+ chars, at least 1 upper, 1 lower, 1 digit"""
    if len(password) < 12:
        return False
    if not any(c.isupper() for c in password):
        return False
    if not any(c.islower() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    return True


def generate_temp_password(length: int = 12) -> str:
    chars = string.ascii_letters + string.digits
    while True:
        pwd = ''.join(secrets.choice(chars) for _ in range(length))
        if validate_password_strength(pwd):
            return pwd
