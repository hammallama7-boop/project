"""
Magic Internet Artworks — procedural pixel-art series generator.

98 images, each 420x690 px (42x69 logical grid scaled by 10).
Each artwork depicts ONE living noun with 5 character traits:
  Subject, Style, Palette, Backdrop, Detail

Output:
  O:\\Magic_Internet_Artworks\\artwork\\magic-internet-artwork-0001.png ... 0098.png
  O:\\Magic_Internet_Artworks\\metadata\\magic-internet-artwork-0001.json ... 0098.json

Usage:  python generate.py
"""
import json
import os
import random
import math

from PIL import Image

W, H, SCALE = 42, 69, 10
OUT_ART = os.path.join("artwork")
OUT_META = os.path.join("metadata")
SUPPLY = 98

# ---------------------------------------------------------------- palettes
# (sky_top, sky_bottom, ground, fur, belly, accent, eye)
PALETTES = [
    ("Aurora",     (16, 28, 66), (48, 96, 160), (30, 46, 88), (120, 84, 220), (200, 160, 255), (80, 240, 210), (255, 255, 255)),
    ("Sunset",     (56, 24, 74), (236, 96, 90), (120, 44, 60), (240, 150, 90), (255, 216, 150), (255, 200, 90), (255, 255, 255)),
    ("Tide",       (10, 44, 78), (40, 170, 190), (28, 90, 110), (90, 200, 200), (210, 245, 240), (60, 210, 255), (255, 255, 255)),
    ("Forest",     (12, 30, 24), (52, 100, 64), (36, 70, 44), (140, 110, 70), (205, 175, 120), (120, 230, 130), (80, 40, 20)),
    ("Desert",     (214, 156, 94), (240, 210, 150), (186, 120, 62), (200, 150, 90), (240, 210, 170), (210, 90, 60), (60, 40, 20)),
    ("Arctic",     (150, 190, 235), (225, 240, 255), (190, 215, 240), (235, 245, 252), (250, 252, 255), (80, 170, 235), (140, 200, 250)),
    ("Nocturne",   (8, 8, 24), (30, 30, 66), (16, 16, 40), (56, 60, 110), (110, 115, 190), (150, 90, 220), (255, 220, 120)),
    ("Meadow",     (110, 200, 150), (190, 235, 170), (74, 150, 82), (120, 90, 150), (200, 170, 220), (255, 220, 100), (80, 60, 30)),
    ("Ember",      (44, 16, 12), (120, 44, 20), (60, 24, 14), (230, 110, 40), (255, 190, 100), (255, 220, 60), (40, 16, 8)),
    ("Violet",     (40, 18, 70), (110, 60, 170), (66, 30, 100), (150, 90, 200), (220, 170, 250), (90, 220, 255), (255, 255, 255)),
    ("Citrus",     (150, 220, 120), (255, 240, 150), (130, 160, 90), (255, 190, 60), (255, 235, 150), (40, 180, 120), (120, 90, 20)),
    ("Berry",      (80, 16, 70), (210, 70, 140), (110, 34, 96), (230, 110, 150), (255, 180, 210), (90, 220, 150), (255, 255, 255)),
    ("Marsh",      (96, 120, 70), (150, 180, 100), (84, 110, 58), (110, 90, 70), (190, 180, 140), (240, 210, 110), (50, 40, 20)),
    ("Dusk",       (30, 30, 70), (140, 70, 110), (46, 40, 74), (90, 100, 160), (190, 180, 230), (110, 230, 210), (255, 255, 255)),
]
# ---------------------------------------------------------------- styles
STYLES = ["Pixel Classic", "Gradient Wash", "Neon Edge", "Dither Shade", "Scanline", "Grain Print", "Split Shade"]
# ---------------------------------------------------------------- backdrops
BACKDROPS = ["Starfield", "Sunset Horizon", "Rolling Waves", "Desert Dunes", "Snowfall", "Forest Edge",
             "Coral Reef", "Thunderhead", "Meadow Breeze", "Cave Glow", "Marsh Reeds", "Jungle Canopy",
             "Savanna Sun", "Aurora Skies"]
# ---------------------------------------------------------------- details
DETAILS = ["Star Charm", "Silk Scarf", "Amber Goggles", "Tiny Crown", "Lucky Clover", "Crescent Pin",
           "Diamond Droplet", "Rose Adorn", "Sapphire Collar", "Sunglasses", "Feather Trim", "Golden Bell",
           "Mystic Rune", "Pearl Strand"]

# ---------------------------------------------------------------- the 98 living nouns
# body: 'mammal' | 'bird' | 'fish' | 'sea' | 'reptile' | 'bug' | 'plant' | 'fungi' | 'crab'
# spec: (body, ear, tail, snout, wings, horns, pattern)
NOUNS = [
    "Fox", "Owl", "Whale", "Octopus", "Frog", "Deer", "Butterfly", "Wolf", "Penguin", "Turtle",
    "Beaver", "Hawk", "Salmon", "Bat", "Rabbit", "Wasp", "Dragonfly", "Eel", "Mole", "Falcon",
    "Swan", "Crane", "Squirrel", "Hedgehog", "Otter", "Seal", "Walrus", "Narwhal", "Dolphin", "Shark",
    "Stingray", "Crab", "Lobster", "Snail", "Jellyfish", "Starfish", "Koi", "Trout", "Pike", "Heron",
    "Kingfisher", "Woodpecker", "Robin", "Sparrow", "Crow", "Raven", "Magpie", "Parrot", "Toucan", "Rooster",
    "Hen", "Duck", "Goose", "Flamingo", "Ostrich", "Emu", "Peacock", "Turkey", "Lizard", "Gecko",
    "Iguana", "Chameleon", "Snake", "Python", "Newt", "Salamander", "Toad", "Scorpion", "Beetle", "Ladybug",
    "Ant", "Bee", "Mantis", "Moth", "Spider", "Sea Urchin", "Fern", "Rose", "Sunflower", "Cactus",
    "Tulip", "Dandelion", "Lotus", "Bamboo", "Oak", "Pine", "Maple", "Birch", "Palm", "Mushroom",
    "Moss", "Panda", "Lemur", "Mongoose", "Sea Horse", "Fiddler Crab", "Firefly", "Anglerfish",
]
assert len(NOUNS) == SUPPLY, f"need {SUPPLY} nouns, have {len(NOUNS)}"

def spec_for(noun, idx):
    s = noun.lower()
    body = "mammal"
    ear = "point"; tail = "bushy"; snout = "short"; wings = False; horns = False; pattern = "plain"
    if s in ("fish",) + ("salmon", "trout") + ("eel", "shark", "stingray") + ("koi", "anglerfish"):
        body = "fish"; tail = "fin"; snout = "none"; ear = "fin"
    if s in ("whale", "dolphin", "seal", "walrus", "narwhal", "otter"):
        body = "sea"; tail = "fin"; ear = "fin"
        if s == "otter": tail = "long"
        if s == "walrus": snout = "tusk"
        if s == "narwhal": horns = True
    if s in ("owl", "hawk", "falcon", "swan", "crane", "heron", "kingfisher", "woodpecker", "robin",
             "sparrow", "crow", "raven", "magpie", "parrot", "toucan", "rooster", "hen", "duck",
             "goose", "flamingo", "ostrich", "emu", "peacock", "turkey", "moth", "butterfly", "bat"):
        body = "bird"; snout = "beak"; wings = True; tail = "fan"; ear = "none"
        if s in ("moth", "butterfly"): body = "bug"; ear = "antenna"; pattern = "spots"
        if s == "bat": body = "bird"; ear = "point"; pattern = "none"
    if s in ("squirrel", "rabbit", "mole", "hedgehog", "beaver", "panda", "lemur", "mongoose"):
        if s == "rabbit": ear = "long"; tail = "fluff"
        elif s == "squirrel": tail = "bushy"
        elif s == "mole": ear = "none"; tail = "stub"
        elif s == "hedgehog": ear = "round"; tail = "none"; pattern = "spikes"
        elif s == "beaver": tail = "paddle"; ear = "round"
        elif s == "panda": ear = "round"; pattern = "patches"
        elif s == "lemur": tail = "ringed"; pattern = "stripes"
        elif s == "mongoose": tail = "long"
    if s == "deer": horns = True; tail = "fluff"
    if s == "fox": tail = "bushy"; snout = "long"
    if s == "wolf": tail = "bushy"; snout = "long"
    if s == "frog": body = "reptile"; ear = "none"; tail = "none"; snout = "none"; pattern = "spots"
    if s in ("turtle",): body = "reptile"; ear = "none"; tail = "stub"; snout = "none"; pattern = "scales"
    if s in ("chameleon", "iguana", "gecko", "lizard", "newt", "salamander", "snake", "python"):
        body = "reptile"; tail = "long"; ear = "none"; snout = "long"
        if s == "chameleon": pattern = "spots"
        elif s == "python": pattern = "bands"
    if s == "toad": body = "reptile"; ear = "none"; tail = "none"; pattern = "spots"
    if s in ("octopus", "jellyfish"): body = "fish"; tail = "squid"; ear = "none"; pattern = "dots"
    if s in ("crab", "lobster", "fiddler crab"): body = "crab"; ear = "none"; tail = "none"; pattern = "none"
    if s in ("scorpion",): body = "crab"; tail = "scorpion"; pattern = "none"
    if s in ("beetle", "ladybug", "ant", "bee", "mantis", "spider", "wasp", "dragonfly", "firefly"):
        body = "bug"; ear = "antenna"; wings = s in ("bee", "wasp", "dragonfly", "firefly", "moth", "butterfly")
        tail = "none"
        if s == "ladybug": pattern = "ladybug"
        if s == "bee": pattern = "stripes"
        if s == "wasp": pattern = "stripes"
        if s == "dragonfly": tail = "long"
    if s in ("sea urchin", "starfish"): body = "plant"; ear = "none"; tail = "none"; pattern = "spikes"
    if s in ("snail",): body = "bug"; ear = "eye"; tail = "none"; pattern = "stripes"
    if s == "eel": body = "fish"; tail = "long"
    if s in ("fern", "pine", "maple", "birch", "bamboo", "palm", "oak", "moss"):
        body = "plant"; ear = "none"; tail = "none"; snout = "none"
        if s in ("ferns", "fern",): pattern = "fronds"
        if s in ("pine", "birch", "maple",): tail = "tree"
    if s in ("rose", "sunflower", "tulip", "dandelion", "lotus"):
        body = "plant"; ear = "petal"; tail = "stem"; snout = "none"; pattern = "flower"
    if s == "cactus": body = "plant"; ear = "none"; tail = "none"; pattern = "spines"
    if s == "mushroom": body = "fungi"; pattern = "spots"
    if s == "sea horse": body = "fish"; tail = "curl"; snout = "none"; ear = "none"
    return dict(body=body, ear=ear, tail=tail, snout=snout, wings=wings, horns=horns, pattern=pattern)


# ---------------------------------------------------------------- drawing helpers
class Art:
    def __init__(self, pal):
        self.grid = [[None] * W for _ in range(H)]
        self.pal = pal

    def set(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            self.grid[y][x] = c

    def fill_rect(self, x0, y0, x1, y1, c):
        for yy in range(y0, y1 + 1):
            for xx in range(x0, x1 + 1):
                self.set(xx, yy, c)

    def hollow_rect(self, x0, y0, x1, y1, c):
        for xx in range(x0, x1 + 1):
            self.set(xx, y0, c); self.set(xx, y1, c)
        for yy in range(y0 + 1, y1):
            self.set(x0, yy, c); self.set(x1, yy, c)

    def ellipse(self, cx, cy, rw, rh, c):
        rw = max(1, rw); rh = max(1, rh)
        for a in range(0, 360, 4):
            x = round(cx + rw * math.cos(math.radians(a)))
            y = round(cy + rh * math.sin(math.radians(a)))
            self.set(x, y, c)

    def fill_ellipse(self, cx, cy, rw, rh, c):
        rw = max(1, rw); rh = max(1, rh)
        for yy in range(cy - rh, cy + rh + 1):
            for xx in range(cx - rw, cx + rw + 1):
                if ((xx - cx) / rw) ** 2 + ((yy - cy) / rh) ** 2 <= 1.0:
                    self.set(xx, yy, c)

    def line(self, x0, y0, x1, y1, c):
        steps = max(abs(x1 - x0), abs(y1 - y0), 1)
        for i in range(steps + 1):
            t = i / steps
            self.set(round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), c)

    def tri(self, x0, y0, x1, y1, x2, y2, c):
        # ordered scanline triangle
        pts = sorted([(x0, y0), (x1, y1), (x2, y2)], key=lambda p: p[1])
        (xa, ya), (xb, yb), (xc, yc) = pts
        for yy in range(ya, yc + 1):
            def edge(p1, p2):
                if p1[1] == p2[1]:
                    return None
                t = (yy - p1[1]) / (p2[1] - p1[1])
                return round(p1[0] + t * (p2[0] - p1[0]))
            left = edge((xa, ya), (xb, yb))
            right = edge((xa, ya), (xc, yc))
            if yy >= yb:
                left = edge((xb, yb), (xc, yc))
                right = edge((xa, ya), (xc, yc))
            if left is None or right is None:
                continue
            for xx in range(min(left, right), max(left, right) + 1):
                self.set(xx, yy, c)

    def copy_pixels(self):
        pix = [row[:] for row in self.grid]
        return pix

    def paste(self, pix, ox=0, oy=0):
        for yy, row in enumerate(pix):
            for xx, c in enumerate(row):
                if c is not None:
                    self.set(xx + ox, yy + oy, c)


# ---------------------------------------------------------------- backdrops
def paint_backdrop(a, rng):
    pal = a.pal
    top, bot, ground = pal[0], pal[1], pal[2]
    kind = rng.choice(BACKDROPS)
    for y in range(H):
        t = y / (H - 1)
        c = tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        for x in range(W):
            a.set(x, y, c)
    # ground band
    gy = rng.randint(56, 60)
    for y in range(gy, H):
        for x in range(W):
            a.set(x, y, ground)

    def star():
        for _ in range(rng.randint(6, 10)):
            a.set(rng.randint(0, W - 1), rng.randint(2, 30), (255, 250, 210))
    if kind == "Starfield":
        star()
    elif kind == "Sunset Horizon":
        cx = W // 2
        a.fill_ellipse(cx, 52, 9, 5, (255, 235, 170))
        a.line(0, 54, W, 54, (255, 235, 170))
    elif kind == "Rolling Waves":
        for yy in range(50, 69, 3):
            a.line(0, yy, W, yy, pal[6])
        for yy in range(48, 66, 6):
            for x in range(0, W, 14):
                a.set(x, yy, (255, 255, 255))
    elif kind == "Desert Dunes":
        a.fill_ellipse(W // 2, 46, 8, 4, (255, 244, 214))
        for yy in range(62, 60 - 1, -1):
            a.line(0, yy, W, yy, pal[2])
        a.line(0, 60, W, 66, (215, 150, 90))
    elif kind == "Snowfall":
        for _ in range(26):
            a.set(rng.randint(0, W - 1), rng.randint(0, H - 6), (255, 255, 255))
        a.fill_ellipse(W // 2, 12, 5, 5, (235, 245, 255))
    elif kind == "Forest Edge":
        for _ in range(6):
            x = rng.randint(1, W - 6)
            a.tri(x, 54, x + 3, rng.randint(16, 34), x + 6, 54, (18, 50, 34))
    elif kind == "Coral Reef":
        for _ in range(8):
            x = rng.randint(0, W - 4); y0 = rng.randint(55, 66)
            a.fill_ellipse(x + 2, y0, 3, rng.randint(4, 8), rng.choice([(220, 90, 120), (230, 140, 60), (200, 70, 200)]))
        for y in range(48, H, 4):
            for x in range(0, W, 10):
                a.set(x, y, (210, 240, 250))
    elif kind == "Thunderhead":
        a.fill_ellipse(10, 12, 7, 4, (54, 54, 78)); a.fill_ellipse(W - 10, 16, 7, 4, (54, 54, 78))
        a.tri(W // 2 - 1, 22, W // 2 + 1, 22, W // 2, 36, (255, 240, 150))
        star()
    elif kind == "Meadow Breeze":
        for _ in range(18):
            x = rng.randint(0, W - 1)
            a.line(x, 69, x, rng.randint(58, 66), (120, 210, 120))
        a.fill_ellipse(W // 2, 8, 4, 3, (255, 244, 200))
    elif kind == "Cave Glow":
        a.fill_ellipse(W // 2, 40, 12, 8, (30, 30, 40))
        for _ in range(9):
            a.set(rng.randint(8, W - 8), rng.randint(30, 50), pal[6])
    elif kind == "Marsh Reeds":
        for _ in range(12):
            x = rng.randint(0, W - 1)
            a.line(x, 69, x, rng.randint(40, 56), (70, 120, 70))
        a.fill_ellipse(W // 2, 12, 5, 3, (220, 210, 160))
    elif kind == "Jungle Canopy":
        for _ in range(10):
            x = rng.randint(0, W - 5); y = rng.randint(2, 26)
            a.fill_ellipse(x + 3, y, 5, 3, (30, 120, 60))
    elif kind == "Savanna Sun":
        a.fill_ellipse(W // 2, 34, 7, 4, (255, 200, 90))
        for _ in range(14):
            x = rng.randint(0, W - 1)
            a.line(x, 69, x, rng.randint(58, 66), pal[3])
    elif kind == "Aurora Skies":
        for i in range(8):
            y = 6 + i * 4
            c = (40 + i * 20, 220, 40 + i * 22,)
        for i in range(6):
            c = (30 + i * 26, 220, 90)
            for x in range(W):
                if ((i * 7 + x // 3) % 6) == 0:
                    a.set(x, 4 + i * 5, c)
        star()
    return kind


# ---------------------------------------------------------------- creatures
def draw_creature(a, spec, rng, pal):
    body = spec["body"]
    fur = pal[3]; belly = pal[4]; accent = pal[5]; eye = pal[6]; out = (10, 10, 14)
    cx = W // 2

    def parts(spec):
        return spec

    if body == "mammal":
        bx = cx - 7; by = 40; bw, bh = 14, 10
        # legs
        for dx in range(0, 7, 2):
            a.fill_rect(bx + 1 + dx, by + bh - 1, bx + 2 + dx, by + bh + 3, fur)
        # body
        a.fill_rect(bx, by, bx + bw - 1, by + bh, belly)
        a.fill_rect(bx + 1, by + 1, bx + bw - 2, by + bh - 1, fur)
        # head
        hx = bx + bw - 4; hy = by - 4
        a.fill_rect(hx, hy, hx + 6, hy + 6, fur)
        a.fill_rect(hx + 3, hy + 4, hx + 6, hy + 6, belly)  # snout
        # snout long
        if spec["snout"] == "long":
            a.fill_rect(hx + 4, hy + 3, hx + 8, hy + 6, fur)
        if spec["snout"] == "tusk":
            a.fill_rect(hx + 4, hy + 3, hx + 8, hy + 5, fur)
            a.fill_rect(hx + 6, hy + 5, hx + 7, hy + 8, (230, 240, 250))
        # ears
        if spec["ear"] == "point":
            a.tri(hx + 1, hy, hx + 3, hy - 3, hx + 5, hy, fur)
            a.tri(hx + 2, hy, hx + 3, hy - 2, hx + 4, hy, belly)
        elif spec["ear"] == "round":
            a.fill_rect(hx - 1, hy - 2, hx + 1, hy - 1, fur)
            a.fill_rect(hx + 5, hy - 2, hx + 7, hy - 1, fur)
        elif spec["ear"] == "long":
            a.fill_rect(hx + 1, hy - 5, hx + 2, hy - 1, fur)
            a.fill_rect(hx + 5, hy - 5, hx + 6, hy - 1, belly)
        elif spec["ear"] == "none":
            pass
        # horns / antlers
        if spec["horns"]:
            a.line(hx + 2, hy - 2, hx + 1, hy - 7, (210, 190, 160))
            a.line(hx + 4, hy - 2, hx + 5, hy - 7, (210, 190, 160))
            a.line(hx + 1, hy - 5, hx - 1, hy - 4, (210, 190, 160))
            a.line(hx + 5, hy - 5, hx + 7, hy - 4, (210, 190, 160))
        # eyes
        a.set(hx + 1, hy + 2, eye); a.set(hx + 4, hy + 2, eye)
        # tail
        if spec["tail"] == "bushy":
            a.fill_rect(bx - 2, by + 1, bx, by + 5, accent)
        elif spec["tail"] == "long":
            a.line(bx - 1, by + 2, bx - 5, by + 6, fur)
        elif spec["tail"] == "ringed":
            a.line(bx - 1, by + 2, bx - 6, by + 6, fur)
            a.line(bx - 4, by + 4, bx - 5, by + 5, (200, 220, 240))
        elif spec["tail"] == "fluff":
            a.fill_ellipse(bx - 1, by + 2, 2, 2, (245, 245, 250))
        elif spec["tail"] == "paddle":
            a.fill_ellipse(bx - 2, by + 4, 3, 2, fur)
        # patterns
        if spec["pattern"] == "patches":
            a.fill_rect(bx + 3, by + 3, bx + 4, by + 4, (16, 16, 20))
            a.fill_rect(bx + 9, by + 4, bx + 10, by + 5, (16, 16, 20))
            a.fill_rect(bx - 1, by + 5, bx, by + 6, (16, 16, 20))
        elif spec["pattern"] == "stripes":
            a.fill_rect(bx + 2, by + 1, bx + 2, by + 4, accent)
            a.fill_rect(bx + 6, by + 1, bx + 6, by + 4, accent)
            a.fill_rect(bx + 10, by + 1, bx + 10, by + 4, accent)
        elif spec["pattern"] == "spikes":
            for dx in range(1, bw - 1, 2):
                a.tri(bx + dx, by + 1, bx + dx + 2, by + 1, bx + dx + 1, by - 2, accent)
    elif body == "bird":
        bx = cx - 6; by = 42
        a.fill_rect(bx + 3, by - 4, bx + 9, by + 6, fur)  # body
        a.fill_ellipse(bx + 8, by - 2, 3, 3, fur)          # head
        a.tri(bx + 11, by - 3, bx + 14, by - 2, bx + 11, by - 1, accent)  # beak
        a.set(bx + 8, by - 3, eye)
        if spec["wings"]:
            a.tri(bx + 4, by - 1, bx + 2, by + 6, bx + 8, by + 2, belly)  # wing
        a.fill_rect(bx + 5, by + 6, bx + 5, by + 8, fur)
        a.fill_rect(bx + 8, by + 6, bx + 8, by + 8, fur)
        if spec["tail"] == "fan":
            a.tri(bx + 1, by + 2, bx - 3, by + 8, bx + 3, by + 7, accent)
        if spec["pattern"] == "spots":
            a.set(bx + 3, by + 1, accent); a.set(bx + 6, by + 3, accent)
    elif body == "fish":
        bx = cx - 8; by = 40; bw = 16
        a.fill_ellipse(bx + bw // 2, by + 4, 8, 5, fur)
        a.tri(bx + 2, by + 1, bx - 4, by + 4, bx + 2, by + 8, belly)   # tail fin
        a.tri(bx + 6, by - 2, bx + 10, by - 2, bx + 8, by + 1, fur)     # dorsal
        a.set(bx + 12, by + 3, eye)
        if spec["tail"] == "long":  # eel
            a.line(bx - 3, by + 4, bx - 12, by + 6, fur)
        if spec["tail"] == "squid":  # octopus / jellyfish dome
            a.fill_ellipse(bx + 8, by + 2, 7, 6, fur)
            for i in range(4):
                a.line(bx + 3 + i * 3, by + 6, bx + 3 + i * 3, by + 14, belly)
        if spec["tail"] == "curl":  # sea horse
            a.line(bx + 2, by + 8, bx - 1, by + 16, fur)
            a.fill_ellipse(bx - 1, by + 16, 2, 2, fur)
            a.line(bx + 5, by + 1, bx + 5, by - 4, fur)
            a.fill_ellipse(bx + 5, by - 4, 2, 2, belly)
        if spec["pattern"] == "dots":
            a.set(bx + 6, by + 2, belly); a.set(bx + 10, by + 5, belly); a.set(bx + 4, by + 6, belly)
        if spec["pattern"] == "bands":
            a.fill_rect(bx + 5, by + 1, bx + 6, by + 8, belly)
            a.fill_rect(bx + 11, by + 1, bx + 12, by + 8, belly)
    elif body == "sea":
        bx = cx - 9; by = 38; bw = 18
        a.fill_ellipse(bx + bw // 2, by + 5, 9, 6, fur)
        a.tri(bx + 1, by + 2, bx - 6, by + 1, bx + 1, by + 9, belly)     # fluke top
        a.tri(bx + 1, by + 9, bx - 6, by + 10, bx + 1, by + 16, belly)   # fluke bottom
        a.fill_ellipse(bx + 14, by + 4, 3, 3, belly)                      # flipper
        a.set(bx + 13, by + 5, eye)
        if spec["horns"]:  # narwhal tusk
            a.line(bx + 13, by + 3, bx + 17, by - 8, (230, 240, 250))
    elif body == "reptile":
        bx = cx - 8; by = 44
        a.fill_rect(bx, by - 2, bx + 16, by + 4, fur)      # long body
        for dx in (2, 13):
            a.fill_rect(bx + dx, by + 4, bx + dx + 1, by + 6, fur)
        a.fill_rect(bx + 13, by - 4, bx + 17, by - 1, fur)  # head
        a.set(bx + 15, by - 3, eye)
        a.fill_rect(bx + 15, by - 1, bx + 16, by + 1, accent)  # tongue
        if spec["tail"] == "long":
            a.line(bx - 1, by + 1, bx - 8, by + 3, fur)
            a.line(bx - 8, by + 3, bx - 12, by + 1, fur)
        if spec["pattern"] == "scales":
            for dx in range(bx + 2, bx + 15, 3):
                a.set(dx, by - 1, belly)
        elif spec["pattern"] == "spots":
            for dx in range(bx + 3, bx + 15, 4):
                a.set(dx, by + 1, belly)
        elif spec["pattern"] == "bands":
            a.fill_rect(bx + 4, by - 2, bx + 5, by + 4, belly)
            a.fill_rect(bx + 10, by - 2, bx + 11, by + 4, belly)
    elif body == "crab":
        bx = cx - 6; by = 44
        a.fill_ellipse(bx + 6, by + 2, 6, 4, fur)
        a.fill_rect(bx + 1, by + 6, bx + 11, by + 7, fur)   # legs pad
        for dx in range(1, 12, 2):
            a.fill_rect(bx + dx, by + 7, bx + dx, by + 9, fur)
        # claws
        a.fill_ellipse(bx - 1, by + 1, 2, 2, belly)
        a.fill_ellipse(bx + 13, by + 1, 2, 2, belly)
        a.set(bx + 2, by + 1, eye); a.set(bx + 10, by + 1, eye)
        if spec["tail"] == "scorpion":  # scorpion tail + stinger
            a.line(bx + 6, by + 6, bx + 6, by + 12, fur)
            a.fill_ellipse(bx + 6, by + 13, 2, 1, belly)
            a.fill_ellipse(bx + 10, by - 1, 2, 2, fur)  # claws
            a.set(bx + 2, by - 2, eye); a.set(bx + 10, by - 2, eye)
    elif body == "bug":
        bx = cx - 5; by = 46
        a.fill_ellipse(bx + 5, by + 3, 5, 3, fur)
        # legs
        for sx in (-1, 1):
            for i in range(3):
                a.line(bx + 5 + sx * i, by + 4, bx + 5 + sx * (i + 3), by + 8, fur)
        if spec["wings"]:
            a.fill_ellipse(bx + 3, by - 1, 4, 3, belly)
            a.fill_ellipse(bx + 7, by - 1, 4, 3, belly)
        if spec["pattern"] == "spots":  # butterfly
            a.set(bx + 1, by - 1, accent); a.set(bx + 9, by - 1, accent)
            a.set(bx + 2, by + 1, accent); a.set(bx + 8, by + 1, accent)
        elif spec["pattern"] == "ladybug":
            a.fill_ellipse(bx + 5, by + 3, 4, 3, (230, 40, 50))
            a.set(bx + 3, by + 2, (20, 20, 24)); a.set(bx + 7, by + 2, (20, 20, 24))
            a.set(bx + 5, by + 4, (20, 20, 24))
        elif spec["pattern"] == "stripes":
            a.fill_rect(bx + 2, by + 1, bx + 2, by + 4, accent)
            a.fill_rect(bx + 8, by + 1, bx + 8, by + 4, accent)
        if spec["ear"] == "antenna":
            a.line(bx + 3, by - 1, bx + 1, by - 5, fur)
            a.line(bx + 7, by - 1, bx + 9, by - 5, fur)
        if spec["tail"] == "long":  # dragonfly
            a.line(bx + 5, by + 4, bx + 5, by + 12, belly)
        # firefly glow
        if noun_override("firefly", our_noun=spec.get("_n", "")):
            a.fill_ellipse(bx + 5, by + 6, 2, 2, (255, 240, 120))
        # spider
        if spec.get("_n", "") == "spider":
            for sx in (-1, 1):
                for i in range(4):
                    a.line(bx + 5, by + 2, bx + 5 + sx * i * 2, by + 8 - i, fur)
        a.set(bx + 4, by + 2, eye); a.set(bx + 7, by + 2, eye)
    elif body in ("plant", "fungi"):
        bx = cx - 5; by = 46
        n = spec.get("_n", "")
        if n == "cactus":
            a.fill_rect(bx + 2, by - 8, bx + 8, by + 12, fur)
            a.fill_rect(bx, by - 6, bx + 2, by - 2, fur)
            a.fill_rect(bx + 8, by - 4, bx + 10, by, fur)
            for dx in range(bx + 2, bx + 9, 2):
                a.set(dx, by - 5, accent)
        elif spec["pattern"] == "flower":
            cy = by - 10
            for i in range(6):
                a.fill_ellipse(bx + 5 + int(2 * math.cos(i * math.pi / 3)),
                               cy + int(2 * math.sin(i * math.pi / 3)), 2, 2, accent)
            a.fill_ellipse(bx + 5, cy, 2, 2, (255, 240, 160))
            a.line(bx + 5, by - 8, bx + 5, by + 12, (60, 140, 60))
            a.set(bx + 4, by + 3, (60, 140, 70))
        elif n == "sunflower":
            a.fill_ellipse(bx + 5, by - 12, 5, 4, (60, 110, 40))
            a.fill_ellipse(bx + 5, by - 14, 3, 3, (255, 200, 60))
            a.line(bx + 5, by - 10, bx + 5, by + 12, (60, 140, 60))
        elif n == "mushroom":
            a.line(bx + 5, by + 2, bx + 5, by + 13, (240, 230, 210))
            a.fill_ellipse(bx + 5, by, 6, 4, (background for background in [accent]) .__iter__().__next__())
            for sx in (-3, -1, 1, 3):
                a.set(bx + 5 + sx, by - 2, (250, 240, 220))
        elif n == "fern":
            a.line(bx + 5, by + 12, bx + 5, by - 12, (40, 120, 50))
            for dx in range(-4, 5, 2):
                a.line(bx + 5, by - 10 + abs(dx) * 2, bx + 5 + dx, by - 12 + abs(dx) * 2, (70, 160, 60))
        elif n == "palm":
            a.line(bx + 5, by + 12, bx + 5, by - 10, (120, 90, 50))
            for i in range(6):
                a.line(bx + 5, by - 10, bx + 5 + int(8 * math.cos(i * math.pi / 3)), by - 14 + int(3 * math.sin(i * math.pi / 3)), (60, 150, 70))
        elif n in ("pine",):
            a.tri(bx + 5, by - 16, bx + 10, by - 6, bx, by - 6, (40, 110, 50))
            a.fill_rect(bx + 3, by - 4, bx + 7, by + 12, (110, 80, 50))
        elif n in ("birch", "maple", "oak"):
            a.fill_rect(bx + 4, by - 4, bx + 6, by + 12, (120, 90, 60))
            a.fill_ellipse(bx + 5, by - 12, 7, 6, (70, 150, 70) if n != "maple" else (210, 90, 50))
        elif n == "bamboo":
            a.fill_rect(bx + 3, by + 12, bx + 5, by - 12, (90, 160, 70))
            a.line(bx + 4, by - 8, bx + 2, by - 12, (70, 140, 60))
            a.line(bx + 4, by - 2, bx + 6, by - 6, (70, 140, 60))
            a.set(bx + 3, by - 4, (60, 130, 55)); a.set(bx + 5, by + 2, (60, 130, 55))
        elif n == "moss":
            a.fill_ellipse(bx + 5, by + 2, 6, 3, (90, 150, 70))
            for dx in range(bx + 1, bx + 10, 2):
                a.set(dx, by + 1, (60, 120, 55))
        elif n in ("sea urchin", "starfish"):
            a.fill_ellipse(bx + 5, by + 2, 4, 4, (170, 80, 190))
            for i in range(8):
                a.line(bx + 5, by + 2, bx + 5 + int(6 * math.cos(i * 2 * math.pi / 8)),
                       by + 2 + int(6 * math.sin(i * 2 * math.pi / 8)), (180, 100, 200))
        else:  # simple shrub / sea horse like fill
            a.fill_ellipse(bx + 5, by - 2, 5, 4, fur)
            a.fill_rect(bx + 4, by + 2, bx + 6, by + 12, (80, 120, 70))
    # outline pass
    thick = a.copy_pixels()
    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    for y in range(H):
        for x in range(W):
            cur = a.grid[y][x]
            if cur is None or cur[0] < 0:
                continue
            if cur == pal[2] or cur == pal[1] or cur == pal[0]:
                continue  # skip sky/ground boundaries
            for dx, dy in dirs:
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and a.grid[ny][nx] is None:
                    a.set(x, y, out)
    return body


def noun_override(key, our_noun):
    return key == our_noun


# ---------------------------------------------------------------- details
def draw_detail(a, spec, rng, pal):
    accent = pal[5]
    kind = rng.choice(DETAILS)
    cx = W // 2
    if "Crown" in kind:
        a.tri(cx + 2, 30, cx + 4, 26, cx + 6, 30, (255, 220, 90))
        a.tri(cx + 5, 30, cx + 7, 26, cx + 9, 30, (255, 220, 90))
        a.line(cx + 2, 30, cx + 9, 30, (255, 220, 90))
    elif "Scarf" in kind:
        for y in range(47, 51):
            a.set(cx - 1, y, accent); a.set(cx, y, accent); a.set(cx + 1, y, accent)
    elif "Goggles" in kind or "Sunglasses" in kind:
        a.fill_rect(cx - 3, 38, cx - 1, 41, (30, 30, 40)); a.fill_rect(cx + 1, 38, cx + 3, 41, (30, 30, 40))
    elif "Clover" in kind:
        a.line(cx + 6, 44, cx + 6, 48, (50, 140, 60))
        a.fill_rect(cx + 5, 42, cx + 6, 43, (70, 180, 80)); a.fill_rect(cx + 6, 43, cx + 7, 44, (70, 180, 80))
    elif "Crescent" in kind:
        for i in range(4):
            a.set(cx - 10 + i, 30 - i, (255, 240, 180))
    elif "Droplet" in kind:
        a.fill_ellipse(cx + 11, 44, 1, 2, (120, 220, 255))
        a.set(cx + 11, 42, (200, 245, 255))
    elif "Rose" in kind:
        a.fill_ellipse(cx - 9, 47, 2, 2, (230, 80, 120))
        a.set(cx - 9, 45, (60, 160, 90))
    elif "Sunglasses" in kind:
        a.fill_rect(cx - 3, 38, cx - 1, 41, (30, 30, 40)); a.fill_rect(cx + 1, 38, cx + 3, 41, (30, 30, 40))
    elif "Rune" in kind:
        a.set(cx + 13, 38, (180, 160, 255)); a.set(cx + 14, 39, (180, 160, 255)); a.set(cx + 13, 40, (180, 160, 255))
    elif "Pearl" in kind:
        a.set(cx - 12, 50, (240, 235, 250)); a.set(cx - 13, 51, (240, 235, 250))
    elif "Feather" in kind:
        a.line(cx + 12, 42, cx + 14, 46, (240, 240, 245))
    elif "Bell" in kind:
        a.fill_ellipse(cx, 48, 2, 2, (255, 210, 60))
    return kind


# ---------------------------------------------------------------- style post-fx
def apply_style(im_arr, style, pal, rng):
    accent = pal[5]
    if style == "Gradient Wash":
        for y in range(H):
            for x in range(W):
                p = im_arr[y][x]
                f = 0.18 * (1 - y / H)
                im_arr[y][x] = tuple(max(0, min(255, round(p[i] * (1 - f) + accent[i] * f))) for i in range(3))
    elif style == "Neon Edge":
        # overdraw silhouette glow: add accent halo around each creature pixel
        src = [row[:] for row in im_arr]
        for y in range(H):
            for x in range(W):
                p = src[y][x]
                if p == pal[1] or p == pal[2] or p == (10, 10, 14) or p == pal[3] or p == pal[4] or p == pal[5] or p == pal[6]:
                    continue
                if src[y][x] == pal[0]:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < H and src[ny][nx] in (pal[0], pal[1], pal[2]):
                        im_arr[ny][nx] = accent
    elif style == "Scanline":
        for y in range(0, H, 3):
            for x in range(W):
                p = im_arr[y][x]
                im_arr[y][x] = tuple(round(p[i] * 0.7) for i in range(3))
    elif style == "Grain Print":
        for y in range(H):
            for x in range(W):
                if rng.random() < 0.06:
                    p = im_arr[y][x]
                    d = rng.randint(-22, 22)
                    im_arr[y][x] = tuple(max(0, min(255, p[i] + d)) for i in range(3))
    elif style == "Dither Shade":
        for y in range(H):
            for x in range(W):
                p = im_arr[y][x]
                f = 0.12 if ((x + y) % 2 == 0) else 0.0
                im_arr[y][x] = tuple(max(0, min(255, round(p[i] * (1 - f) + 10 * f))) for i in range(3))
    elif style == "Split Shade":
        for y in range(H):
            for x in range(W):
                p = im_arr[y][x]
                lum = max(p) - min(p)
                im_arr[y][x] = (round(p[0]), round(p[1]), round(p[2])) if lum < 90 else tuple(round(c * 0.55 + accent[i] * 0.45) for i, c in enumerate(p))
    return im_arr


# ---------------------------------------------------------------- render one
def render(idx):
    rng = random.Random(20240906 + idx)
    noun = NOUNS[idx]
    spec = spec_for(noun, idx)
    spec["_n"] = noun.lower()
    pal_name, *pal = PALETTES[idx % len(PALETTES)]
    a = Art(pal)
    backdrop = paint_backdrop(a, rng)
    draw_creature(a, spec, rng, pal)
    detail = draw_detail(a, spec, rng, pal)
    style = STYLES[idx % len(STYLES)]

    im_arr = a.copy_pixels()
    # fill Nones with backdrop base already handled; any leftover -> horizon blend
    for y in range(H):
        t = y / (H - 1)
        base = tuple(round(pal[0][i] + (pal[1][i] - pal[0][i]) * t) for i in range(3))
        for x in range(W):
            if im_arr[y][x] is None:
                im_arr[y][x] = base
    im_arr = apply_style(im_arr, style, pal, rng)

    img = Image.new("RGB", (W, H))
    img.putdata([tuple(v) for row in im_arr for v in row])
    img = img.resize((W * SCALE, H * SCALE), Image.NEAREST)

    name = f"magic-internet-artwork-{idx + 1:04d}"
    png = os.path.join(OUT_ART, name + ".png")
    img.save(png)

    meta = {
        "name": f"Magic Internet Artwork #{idx + 1}",
        "description": "Magic Internet Artworks — a series of 98 procedurally generated pixel artworks on the O: drive. Each piece depicts one living subject with five character traits.",
        "image": name + ".png",
        "attributes": [
            {"trait_type": "Subject", "value": noun},
            {"trait_type": "Style", "value": style},
            {"trait_type": "Palette", "value": pal_name},
            {"trait_type": "Backdrop", "value": backdrop},
            {"trait_type": "Detail", "value": detail},
        ],
    }
    jp = os.path.join(OUT_META, name + ".json")
    with open(jp, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    return name, noun


def main():
    os.makedirs(OUT_ART, exist_ok=True)
    os.makedirs(OUT_META, exist_ok=True)
    nouns_seen = {}
    for idx in range(SUPPLY):
        name, noun = render(idx)
        nouns_seen.setdefault(noun, []).append(name)
        if idx % 10 == 0 or idx == SUPPLY - 1:
            print(f"generated {idx + 1}/{SUPPLY} ({name})")
    dups = {k: v for k, v in nouns_seen.items() if len(v) > 1}
    print("done. duplicate subjects:", dups if dups else "none")


if __name__ == "__main__":
    main()