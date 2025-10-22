import re

def normalize(text: str) -> str:
    t = text.strip().lower()
    t = re.sub(r"\s+", " ", t)      # squeeze spaces
    t = re.sub(r"[^\w\s]", "", t)   # drop punctuation
    return t
