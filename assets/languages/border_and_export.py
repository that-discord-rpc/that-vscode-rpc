#!/usr/bin/env python3
"""
Interactive SVG -> PNG batch converter with auto background.

Prompts for:
  - Source folder          (where the .svg files are)
  - Output folder          (where the .png files go)
  - Background             : hex color, "auto", or blank for transparent
  - Zoom factor            (positive = zoom in, negative = zoom out)
  - Output size in pixels  (width x height)

Auto background logic:
  - If the icon contains very light / white-ish pixels, use DARK_YELLOW
    so the icon stands out against a deep amber.
  - Otherwise, use LIGHT_YELLOW for a soft warm canvas.
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile

# --- Inkscape discovery ----------------------------------------------------

INKSCAPE_CANDIDATES = [
    r"C:\Program Files\Inkscape\bin\inkscape.exe",
    r"C:\Program Files (x86)\Inkscape\bin\inkscape.exe",
    "inkscape",
    "inkscape.exe",
]


def find_inkscape() -> str:
    for candidate in INKSCAPE_CANDIDATES:
        if os.path.isabs(candidate) and os.path.isfile(candidate):
            return candidate
        found = shutil.which(candidate)
        if found:
            return found
    print("  ✗ Inkscape not found.")
    print("    Install it, or add inkscape.exe to your PATH.")
    sys.exit(1)


# --- Auto background palettes ----------------------------------------------

DARK_YELLOW  = "#4A3A00"     # deep amber / dark ochre
LIGHT_YELLOW = "#FFE58A"     # soft light yellow

# Thresholds for "very light" and "very dark" pixels (0-255, per channel)
LIGHT_THRESHOLD = 200
DARK_THRESHOLD  = 60


# --- Interactive prompts ---------------------------------------------------

def ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    answer = input(f"{prompt}{suffix}: ").strip()
    return answer if answer else default


def ask_yes_no(prompt: str, default: bool = True) -> bool:
    d = "Y/n" if default else "y/N"
    answer = input(f"{prompt} [{d}]: ").strip().lower()
    if not answer:
        return default
    return answer in ("y", "yes")


def ask_existing_dir(prompt: str, default: str) -> str:
    while True:
        raw = ask(prompt, default)
        path = os.path.abspath(os.path.expanduser(raw))
        if os.path.isdir(path):
            return path
        print(f"  ✗ Not a directory: {path}")


def ask_output_dir(prompt: str, default: str) -> str:
    raw = ask(prompt, default)
    path = os.path.abspath(os.path.expanduser(raw))
    if os.path.isdir(path):
        return path
    if ask_yes_no(f"  Directory does not exist. Create it? ({path})",
                  default=True):
        os.makedirs(path, exist_ok=True)
        return path
    return ask_output_dir(prompt, default)


def ask_float(prompt: str, default: float) -> float:
    while True:
        raw = ask(prompt, str(default))
        try:
            return float(raw)
        except ValueError:
            print("  ✗ Please enter a number.")


def ask_int(prompt: str, default: int, minimum: int = 1) -> int:
    while True:
        raw = ask(prompt, str(default))
        try:
            value = int(raw)
        except ValueError:
            print("  ✗ Please enter a whole number.")
            continue
        if value < minimum:
            print(f"  ✗ Must be at least {minimum}.")
            continue
        return value


def ask_background(prompt: str) -> str:
    """
    Ask for a background. Returns:
      - ""          for transparent
      - "auto"      for automatic light/dark yellow selection
      - "#RRGGBB"   for an explicit hex color
    """
    while True:
        raw = ask(prompt).strip()
        low = raw.lower()

        if raw == "" or low in ("none", "null", "transparent"):
            return ""

        if low == "auto":
            return "auto"

        value = raw.lstrip("#")
        if len(value) == 3:
            value = "".join(c * 2 for c in value)
        if len(value) == 6 and all(c in "0123456789abcdefABCDEF" for c in value):
            return "#" + value.upper()

        print("  ✗ Enter a hex code (e.g. #1E1E1E), 'auto', or leave blank.")


# --- SVG handling ----------------------------------------------------------

def get_svg_dimensions(svg_path: str) -> tuple:
    """Read width/height or viewBox from the SVG. Fallback: 32x32."""
    with open(svg_path, "r", encoding="utf-8", errors="replace") as f:
        head = f.read(4096)

    w = re.search(r'\bwidth\s*=\s*"([\d.]+)(?:px)?"', head)
    h = re.search(r'\bheight\s*=\s*"([\d.]+)(?:px)?"', head)
    if w and h:
        return float(w.group(1)), float(h.group(1))

    vb = re.search(r'\bviewBox\s*=\s*"([-\d.\s]+)"', head)
    if vb:
        parts = vb.group(1).split()
        if len(parts) == 4:
            return float(parts[2]), float(parts[3])

    return 32.0, 32.0


def extract_colors(svg: str) -> list:
    """
    Find all hex colors in an SVG string.
    Returns a list of (r, g, b) tuples.
    """
    colors = []
    for m in re.finditer(r'#([0-9a-fA-F]{3,8})\b', svg):
        hexval = m.group(1)
        if len(hexval) == 3:
            hexval = "".join(c * 2 for c in hexval)
        if len(hexval) == 8:
            hexval = hexval[:6]
        if len(hexval) == 6:
            try:
                r = int(hexval[0:2], 16)
                g = int(hexval[2:4], 16)
                b = int(hexval[4:6], 16)
                colors.append((r, g, b))
            except ValueError:
                pass
    return colors


def luma(rgb: tuple) -> float:
    """Perceived brightness (0-255)."""
    r, g, b = rgb
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def pick_auto_background(svg: str) -> str:
    """
    Decide between DARK_YELLOW and LIGHT_YELLOW based on the SVG's colors.

    - Icons with LIGHT pixels (near white) → DARK_YELLOW
      (dark bg makes white/light artwork pop)
    - Icons without light pixels          → LIGHT_YELLOW
      (light bg makes dark/mid artwork pop)
    """
    colors = extract_colors(svg)

    if not colors:
        # No extractable colors — assume a dark icon, use LIGHT_YELLOW
        return LIGHT_YELLOW

    light_count = sum(1 for c in colors if luma(c) >= LIGHT_THRESHOLD)
    dark_count  = sum(1 for c in colors if luma(c) <= DARK_THRESHOLD)

    if light_count > 0 and light_count >= dark_count:
        return DARK_YELLOW

    return LIGHT_YELLOW


def resolve_background(bg_choice: str, svg_text: str) -> str:
    """
    Turn the user's background choice into a concrete hex color.
    Returns "" for transparent, otherwise a '#RRGGBB' string.
    """
    if bg_choice == "":
        return ""
    if bg_choice == "auto":
        return pick_auto_background(svg_text)
    return bg_choice


def apply_zoom(svg_path: str, out_path: str,
               w: float, h: float, zoom: float,
               bg_color: str) -> None:
    """
    Wrap SVG content in a <g> that scales by `zoom` and recenters.
    A background rect (if bg_color is set) is drawn OUTSIDE the
    transform group, so it stays full-canvas and unzoomed.
    """
    with open(svg_path, "r", encoding="utf-8", errors="replace") as f:
        svg = f.read()

    # Resolve "auto" per-icon, based on this icon's own colors.
    bg_color = resolve_background(bg_color, svg)

    if zoom == 0:
        s = 1.0
    elif zoom > 0:
        s = 1.0 + zoom
    else:
        s = 1.0 / (1.0 + abs(zoom))

    cx = w * (1.0 - s) / 2.0
    cy = h * (1.0 - s) / 2.0

    open_match = re.search(r"<svg\b[^>]*>", svg, re.IGNORECASE)
    if not open_match or "</svg>" not in svg:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(svg)
        return

    open_end    = open_match.end()
    close_start = svg.rfind("</svg>")

    head = svg[:open_end]
    body = svg[open_end:close_start]
    tail = svg[close_start:]

    parts = [head]

    # 1. Background rect — OUTSIDE the transform, so full-canvas
    if bg_color:
        parts.append(
            f'<rect x="0" y="0" width="{w}" height="{h}" '
            f'fill="{bg_color}" />'
        )

    # 2. Icon content, wrapped in the zoom/recenter group
    parts.append(
        f'<g transform="translate({cx:.6f} {cy:.6f}) scale({s:.6f})">'
    )
    parts.append(body)
    parts.append("</g>")
    parts.append(tail)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(parts))


def export_png(inkscape: str, svg_path: str, png_path: str,
               width: int, height: int) -> bool:
    cmd = [
        inkscape,
        svg_path,
        "--export-type=png",
        f"--export-filename={png_path}",
        f"--export-width={width}",
        f"--export-height={height}",
    ]
    try:
        subprocess.run(cmd, check=True,
                       stdout=subprocess.DEVNULL,
                       stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False


# --- Main ------------------------------------------------------------------

def main() -> None:
    print("=== SVG -> PNG batch converter ===\n")

    inkscape = find_inkscape()
    print(f"Using Inkscape: {inkscape}\n")

    # 1. Source folder
    src_dir = ask_existing_dir("Source folder (with .svg files)", ".")

    # 2. Output folder
    default_out = os.path.join(src_dir, "png")
    out_dir = ask_output_dir("Output folder", default_out)

    # 3. Background
    print("\nBackground:")
    print("  hex code     -> e.g. #1E1E1E, #fff")
    print("  'auto'       -> light or dark yellow, chosen per icon by contrast")
    print("  blank        -> transparent")
    bg_choice = ask_background("Background")

    # 4. Zoom factor
    print("\nZoom factor:")
    print("  positive = zoom IN  (e.g.,  0.5 → 1.5× larger)")
    print("  negative = zoom OUT (e.g., -0.5 → 1.5× smaller)")
    print("  zero     = no change")
    zoom = ask_float("Zoom factor", -0.5)

    if zoom > 0:
        scale = 1.0 + zoom
        direction = "zoom in"
    elif zoom < 0:
        scale = 1.0 / (1.0 + abs(zoom))
        direction = "zoom out"
    else:
        scale = 1.0
        direction = "no change"

    # 5. Output size
    print()
    width  = ask_int("Output width (px)",  1024)
    height = ask_int("Output height (px)", 1024)

    # --- Summary ---
    if bg_choice == "":
        bg_display = "(transparent)"
    elif bg_choice == "auto":
        bg_display = (
            f"auto (dark yellow {DARK_YELLOW} / light yellow {LIGHT_YELLOW})"
        )
    else:
        bg_display = bg_choice

    print("\n" + "=" * 60)
    print(f"Source folder : {src_dir}")
    print(f"Output folder : {out_dir}")
    print(f"Background    : {bg_display}")
    print(f"Zoom factor   : {zoom:+g}  ({direction}, scale = {scale:.4f})")
    print(f"Output size   : {width} x {height} px")
    print("=" * 60)

    if not ask_yes_no("\nProceed?", default=True):
        print("Aborted.")
        return

    # --- Gather SVGs ---
    svgs = sorted(f for f in os.listdir(src_dir)
                  if f.lower().endswith(".svg")
                  and os.path.isfile(os.path.join(src_dir, f)))

    if not svgs:
        print("No .svg files found in the source folder.")
        return

    os.makedirs(out_dir, exist_ok=True)
    print(f"\nFiles found: {len(svgs)}\n")

    ok, fail = 0, 0
    for i, svg_name in enumerate(svgs, start=1):
        src  = os.path.join(src_dir, svg_name)
        base = os.path.splitext(svg_name)[0]
        png  = os.path.join(out_dir, base + ".png")

        try:
            w, h = get_svg_dimensions(src)
        except Exception:
            w, h = 32.0, 32.0

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".svg", delete=False, encoding="utf-8"
        ) as tmp:
            tmp_path = tmp.name

        try:
            apply_zoom(src, tmp_path, w, h, zoom, bg_choice)
            if export_png(inkscape, tmp_path, png, width, height):
                ok += 1
                print(f"  [{i}/{len(svgs)}] ✓ {base}.png")
            else:
                fail += 1
                print(f"  [{i}/{len(svgs)}] ✗ {base}.png (export failed)")
        except Exception as e:
            fail += 1
            print(f"  [{i}/{len(svgs)}] ✗ {base}.png ({e})")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    print(f"\nDone. {ok} exported, {fail} failed.")
    print(f"PNGs are in: {out_dir}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(130)
