import os
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080
FPS = 60
FRAMES = 60  # 1.0 segundo exacto; punto de corte en 500 ms (frame 30)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "transitions")
OUT_FILE = os.path.join(OUT_DIR, "stinger-chango.webm")
FONT_PATH = os.path.join(ROOT, "fonts", "montserrat-latin-var.woff2")


def ease_in_out_cubic(t: float) -> float:
    return 4 * t * t * t if t < 0.5 else 1 - pow(-2 * t + 2, 3) / 2


def build_badge_overlay() -> Image.Image:
    badge = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge)

    card_w, card_h = 820, 210
    x0 = (WIDTH - card_w) // 2
    y0 = (HEIGHT - card_h) // 2
    x1 = x0 + card_w
    y1 = y0 + card_h

    draw.rounded_rectangle(
        [x0, y0, x1, y1],
        radius=28,
        fill=(11, 25, 44, 248),
        outline=(44, 234, 163, 220),
        width=3,
    )

    # Barra superior tricolor
    draw.rounded_rectangle(
        [x0 + 36, y0 + 20, x1 - 36, y0 + 26],
        radius=3,
        fill=(229, 184, 75, 255),
    )

    try:
        font_big = ImageFont.truetype(FONT_PATH, 74)
        font_sub = ImageFont.truetype(FONT_PATH, 20)
        try:
            font_big.set_variation_by_axes([900])
            font_sub.set_variation_by_axes([800])
        except Exception:
            pass
    except Exception:
        font_big = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Texto principal: DE UNA, CHANGO!
    t1 = "DE UNA, "
    t2 = "CHANGO!"
    b1 = draw.textbbox((0, 0), t1, font=font_big)
    b2 = draw.textbbox((0, 0), t2, font=font_big)
    w1 = b1[2] - b1[0]
    w2 = b2[2] - b2[0]
    total_w = w1 + w2
    tx = (WIDTH - total_w) // 2
    ty = y0 + 52

    draw.text((tx, ty), t1, font=font_big, fill=(242, 100, 68, 255))
    draw.text((tx + w1, ty), t2, font=font_big, fill=(44, 234, 163, 255))

    sub_text = "TECNOLOGÍA EN VIVO · TARIJA, BOLIVIA"
    bs = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = bs[2] - bs[0]
    draw.text(((WIDTH - sw) // 2, y0 + 150), sub_text, font=font_sub, fill=(229, 184, 75, 255))

    return badge


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    badge_img = build_badge_overlay()

    # Precalculamos la grilla diagonal u = x + 0.42 * y
    x_grid = np.linspace(0, WIDTH - 1, WIDTH, dtype=np.float32)[None, :]
    y_grid = np.linspace(0, HEIGHT - 1, HEIGHT, dtype=np.float32)[:, None]
    u = x_grid + 0.42 * y_grid  # Rango: 0 .. ~2373
    u_max = float(WIDTH + 0.42 * HEIGHT)

    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgba",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-c:v",
        "libvpx-vp9",
        "-pix_fmt",
        "yuva420p",
        "-b:v",
        "4M",
        "-crf",
        "18",
        "-row-mt",
        "1",
        "-auto-alt-ref",
        "0",
        OUT_FILE,
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    # Ancho total del bloque diagonal (> u_max + 2 * bordes para cubrir 100% en t=0.5)
    band_lead_coral = 140.0
    band_lead_mostaza = 110.0
    band_lead_turq = 120.0
    core_width = u_max + 260.0
    band_trail_turq = 120.0
    band_trail_mostaza = 110.0
    band_trail_coral = 140.0

    total_span = (
        band_lead_coral
        + band_lead_mostaza
        + band_lead_turq
        + core_width
        + band_trail_turq
        + band_trail_mostaza
        + band_trail_coral
    )

    for idx in range(FRAMES):
        if idx == 0 or idx == FRAMES - 1:
            empty = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
            proc.stdin.write(empty.tobytes())
            continue

        t = idx / float(FRAMES - 1)
        p = ease_in_out_cubic(t)

        # El frente delantero viaja desde 0 hasta u_max + total_span
        front = p * (u_max + total_span)
        d = front - u  # Distancia dentro del tren diagonal

        frame = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)

        c0 = 0.0
        c1 = c0 + band_lead_coral
        c2 = c1 + band_lead_mostaza
        c3 = c2 + band_lead_turq
        c4 = c3 + core_width
        c5 = c4 + band_trail_turq
        c6 = c5 + band_trail_mostaza
        c7 = c6 + band_trail_coral

        m_lead_coral = (d > c0) & (d <= c1)
        m_lead_mostaza = (d > c1) & (d <= c2)
        m_lead_turq = (d > c2) & (d <= c3)
        m_core = (d > c3) & (d <= c4)
        m_trail_turq = (d > c4) & (d <= c5)
        m_trail_mostaza = (d > c5) & (d <= c6)
        m_trail_coral = (d > c6) & (d <= c7)

        frame[m_lead_coral] = (242, 100, 68, 255)
        frame[m_lead_mostaza] = (229, 184, 75, 255)
        frame[m_lead_turq] = (44, 234, 163, 255)
        frame[m_core] = (7, 17, 31, 255)
        frame[m_trail_turq] = (44, 234, 163, 255)
        frame[m_trail_mostaza] = (229, 184, 75, 255)
        frame[m_trail_coral] = (242, 100, 68, 255)

        img = Image.fromarray(frame, mode="RGBA")

        # Mostrar insignia central cuando el núcleo cubre la pantalla (frames 16..44)
        if 15 <= idx <= 44:
            dist_center = abs(idx - 30) / 15.0
            alpha_scale = max(0.0, min(1.0, 1.0 - dist_center * dist_center))
            if alpha_scale > 0.02:
                b_copy = badge_img.copy()
                alpha_ch = b_copy.getchannel("A").point(lambda a: int(a * alpha_scale))
                b_copy.putalpha(alpha_ch)
                img = Image.alpha_composite(img, b_copy)

        proc.stdin.write(np.array(img, dtype=np.uint8).tobytes())

    proc.stdin.close()
    ret = proc.wait()
    if ret != 0:
        raise RuntimeError(f"FFmpeg devolvió código {ret}")
    print(f"[OK] Stinger generado: {OUT_FILE}")


if __name__ == "__main__":
    main()
