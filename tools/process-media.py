#!/usr/bin/env python3
"""Turn the Higgsfield originals in source-media/ into the web assets in
public/media/. Re-runnable: drop new originals in and run it again.

    python3 tools/process-media.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'source-media')
OUT = os.path.join(ROOT, 'public', 'media')

os.makedirs(os.path.join(OUT, 'products'), exist_ok=True)


def save_webp(img, path, width, quality=82):
    w, h = img.size
    img = img.resize((width, round(h * width / w)), Image.LANCZOS)
    img.save(path, 'WEBP', quality=quality, method=6)
    return os.path.getsize(path)


def cutout(path, out_path, size=192, tol=110, floor=34):
    """Flat-background logo -> transparent PNG, cropped to the mark.

    Alpha comes from distance to the background colour rather than a hard key,
    so the antialiased edges of the mark survive instead of going crunchy.
    """
    img = Image.open(path).convert('RGB')
    bg = img.getpixel((4, 4))
    px = img.load()
    w, h = img.size
    alpha = Image.new('L', (w, h))
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            d = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            # `floor` kills the source's faint vignette, which would otherwise
            # leave low-level alpha across the whole canvas — a visible square
            # halo behind the mark, and a much larger file.
            if d <= floor:
                ap[x, y] = 0
            elif d >= tol:
                ap[x, y] = 255
            else:
                ap[x, y] = int(255 * (d - floor) / (tol - floor))
    img.putalpha(alpha)
    box = img.getbbox()
    if box:
        pad = 8
        box = (max(0, box[0] - pad), max(0, box[1] - pad),
               min(w, box[2] + pad), min(h, box[3] + pad))
        img = img.crop(box)
    # square it up on a transparent canvas so the mark never distorts
    side = max(img.size)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    canvas = canvas.resize((size, size), Image.LANCZOS)
    # WEBP with alpha rather than PNG: a flat mark with a soft alpha edge costs
    # ~400KB as PNG and ~10KB here, and this is rendered at 28px in the topbar.
    canvas.save(out_path, 'WEBP', quality=90, method=6, exact=True)
    return os.path.getsize(out_path)


report = []

# --- product vials: square, reused across the whole catalogue ---------------
for name in ('gold', 'green', 'ice', 'violet'):
    src = os.path.join(SRC, f'vial-{name}.png')
    if not os.path.exists(src):
        continue
    dst = os.path.join(OUT, 'products', f'vial-{name}.webp')
    report.append((f'products/vial-{name}.webp', save_webp(Image.open(src).convert('RGB'), dst, 900)))

# --- hero still: the poster, and the fallback the app shows without clips ----
hero = os.path.join(SRC, 'hero-before.png')
if os.path.exists(hero):
    im = Image.open(hero).convert('RGB')
    w, h = im.size
    jpg = im.resize((1920, round(h * 1920 / w)), Image.LANCZOS)
    p = os.path.join(OUT, 'hero-poster.jpg')
    jpg.save(p, 'JPEG', quality=86, optimize=True, progressive=True)
    report.append(('hero-poster.jpg', os.path.getsize(p)))
    report.append(('hero-poster.webp', save_webp(im, os.path.join(OUT, 'hero-poster.webp'), 1920, 80)))

# --- gold leaf for buttons --------------------------------------------------
# The raw shot drifts ~70 levels corner to corner, which reads as blotchy once
# it is stretched across a wide button. Flat-fielding (divide by a heavily
# blurred copy of itself) evens the lighting out while keeping every crease.
leaf_src = os.path.join(SRC, 'goldleaf.png')
if os.path.exists(leaf_src):
    from PIL import ImageFilter, ImageStat
    im = Image.open(leaf_src).convert('RGB')
    lum = im.convert('L')
    blur = lum.filter(ImageFilter.GaussianBlur(radius=im.width / 9))
    target = ImageStat.Stat(lum).mean[0]
    bp, ip = blur.load(), im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            k = target / max(bp[x, y], 1)
            r, g, b = ip[x, y]
            ip[x, y] = (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)))
    report.append(('goldleaf.webp', save_webp(im, os.path.join(OUT, 'goldleaf.webp'), 420, 80)))

# --- the reveal page's seal: transparent, cropped ---------------------------
# Shot on pure black, so the threshold sits much lower than the logos' — the
# seal's own shadowed rim must survive the cut or it gains a hard bright edge.
seal_src = os.path.join(SRC, 'seal-a.png')
if os.path.exists(seal_src):
    seal_out = os.path.join(ROOT, 'public', 'hello', 'assets')
    os.makedirs(seal_out, exist_ok=True)
    report.append(('hello/assets/seal.webp',
                   cutout(seal_src, os.path.join(seal_out, 'seal.webp'),
                          size=640, tol=64, floor=8)))

# --- logos: transparent, cropped to the mark --------------------------------
for src_name, out_name in (('logo-b.png', 'logo.webp'), ('logo-a.png', 'logo-chain.webp')):
    src = os.path.join(SRC, src_name)
    if os.path.exists(src):
        report.append((out_name, cutout(src, os.path.join(OUT, out_name))))

for name, size in report:
    print(f'{name:34s} {size/1024:8.1f} KB')
