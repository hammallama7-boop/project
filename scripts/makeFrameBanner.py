# Builds frame/og banner (1200x630, 1.91:1) from Magic Internet Artwork #1.
# Usage: python scripts/makeFrameBanner.py
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "magic-internet-artworks", "artwork", "magic-internet-artwork-0001.png")
OUT = os.path.join(ROOT, "magic-internet-artworks", "frame", "frame-banner.png")

W, H = 1200, 630
BG = (13, 13, 18)
CARD = (23, 23, 28)
BORDER = (255, 255, 255, 22)

def font(size, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    for d in ("C:/Windows/Fonts", "C:\\Windows\\Fonts"):
        p = os.path.join(d, name)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

art = Image.open(SRC).convert("RGBA")
scale = 390 / art.height
art = art.resize((round(art.width * scale), 390), Image.NEAREST)
ax, ay = 70, (H - art.height) // 2

canvas = Image.new("RGBA", (W, H), BG)
canvas.paste(art, (ax, ay))
card = Image.new("RGBA", (470, 390), CARD)
canvas.paste(card, (680, ay))
d = ImageDraw.Draw(canvas)

tx = 705
d.text((tx, 150), "MAGIC INTERNET", font=font(40, True), fill=(255, 255, 255))
d.text((tx, 202), "ARTWORKS", font=font(40, True), fill=(255, 255, 255))
d.text((tx, 262), "A series of 98 procedural", font=font(22), fill=(210, 210, 218))
d.text((tx, 296), "pixel artworks. Each piece:", font=font(22), fill=(210, 210, 218))
d.text((tx, 330), "one living subject, five traits.", font=font(22), fill=(210, 210, 218))
d.text((tx, 384), "Mint on Robinhood Chain testnet", font=font(22, True), fill=(139, 107, 240))
d.rectangle((ax, ay, ax + art.width, ay + art.height), outline=BORDER, width=3)
d.rectangle((680, ay, 680 + 470, ay + 390), outline=(64, 64, 74), width=1)

canvas.convert("RGB").save(OUT, optimize=True)
print("banner:", OUT, canvas.size)