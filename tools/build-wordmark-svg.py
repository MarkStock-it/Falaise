"""Trace the FALAISE wordmark PNG into an exact, scalable SVG.

The source mark is flat white-on-transparent geometry. We walk the pixel
boundaries of the alpha mask (crack following), simplify the stair-steps with
Ramer–Douglas–Peucker, and emit one path per outline. This keeps the original
letterforms rather than substituting a lookalike font.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "tools" / "falaise-wordmark-source.png"
TARGETS = {
    "falaise-wordmark-ink.svg": "#0a0a0a",
    "falaise-wordmark-paper.svg": "#f3f1ea",
}
# Trace an upscaled mask: a low-resolution edge produces a visible staircase
# when the mark is blown up across the footer.
SCALE = 8
TOLERANCE = 2.2


def rdp(points: list[tuple[float, float]], epsilon: float) -> list[tuple[float, float]]:
    if len(points) < 3:
        return points

    start, end = np.array(points[0]), np.array(points[-1])
    line = end - start
    length = np.hypot(*line)

    if length == 0:
        distances = [np.hypot(*(np.array(point) - start)) for point in points[1:-1]]
    else:
        distances = [
            abs(line[0] * (start[1] - point[1]) - (start[0] - point[0]) * line[1]) / length
            for point in points[1:-1]
        ]

    index = int(np.argmax(distances)) + 1
    if distances[index - 1] > epsilon:
        return rdp(points[: index + 1], epsilon)[:-1] + rdp(points[index:], epsilon)
    return [points[0], points[-1]]


def trace(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    height, width = mask.shape
    edges: dict[tuple[int, int], list[tuple[int, int]]] = {}

    def add(edge: tuple[tuple[int, int], tuple[int, int]]) -> None:
        edges.setdefault(edge[0], []).append(edge[1])

    for y in range(height):
        for x in range(width):
            if not mask[y, x]:
                continue
            if y == 0 or not mask[y - 1, x]:
                add(((x, y), (x + 1, y)))
            if x == width - 1 or not mask[y, x + 1]:
                add(((x + 1, y), (x + 1, y + 1)))
            if y == height - 1 or not mask[y + 1, x]:
                add(((x + 1, y + 1), (x, y + 1)))
            if x == 0 or not mask[y, x - 1]:
                add(((x, y + 1), (x, y)))

    loops: list[list[tuple[int, int]]] = []
    while edges:
        start = next(iter(edges))
        loop = [start]
        current = start
        while True:
            options = edges.get(current)
            if not options:
                break
            nxt = options.pop()
            if not options:
                del edges[current]
            loop.append(nxt)
            current = nxt
            if current == start:
                break
        if len(loop) > 4:
            loops.append(loop[:-1])
    return loops


def format_number(value: float) -> str:
    rounded = round(value, 2)
    if rounded == int(rounded):
        return str(int(rounded))
    return f"{rounded:.2f}".rstrip("0").rstrip(".")


# The six straight letters are rebuilt from the measured mask. Tracing their
# pixel edges leaves visible corrugation at footer scale; the S keeps its trace
# because it is the only curved glyph.
STRAIGHT_PATHS = [
    "M38 41 L126 41 L126 56 L56 56 L56 80 L119 80 L119 95 L56 95 L56 134 L38 134 Z",
    "M232 41 L184 134 L204 134 L243 60 L280 134 L301 134 L252 41 Z",
    "M374 41 L393 41 L393 120 L458 120 L458 134 L374 134 Z",
    "M569 41 L521 134 L541 134 L580 60 L617 134 L638 134 L589 41 Z",
    "M707 41 L726 41 L726 134 L707 134 Z",
    "M971 41 L1055 41 L1055 56 L989 56 L989 80 L1048 80 L1048 94 L989 94 L989 120 L1055 120 L1055 134 L971 134 Z",
]


def smooth_s(loops: list[list[tuple[int, int]]]) -> str:
    for loop in loops:
        xs = [point[0] / SCALE for point in loop]
        if 790 <= min(xs) <= 810 and 885 <= max(xs) <= 900:
            simplified = rdp(loop + [loop[0]], 1.4)
            simplified = [(x / SCALE, y / SCALE) for x, y in simplified]
            first_x, first_y = simplified[0]
            commands = [f"M{format_number(first_x)} {format_number(first_y)}"]
            commands += [f"L{format_number(x)} {format_number(y)}" for x, y in simplified[1:-1]]
            return " ".join(commands) + " Z"
    raise RuntimeError("S contour not found")


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    width, height = image.size
    smooth = image.resize((width * SCALE, height * SCALE), Image.LANCZOS)
    mask = np.array(smooth)[:, :, 3] > 127

    loops = trace(mask)
    s_path = smooth_s(loops)
    paths = STRAIGHT_PATHS + [s_path]
    points_used = sum(path.count(" L") + 1 for path in paths)

    for name, fill in TARGETS.items():
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
            f'role="img" aria-label="FALAISE">\n'
            f'  <title>FALAISE</title>\n'
            f'  <path fill="{fill}" fill-rule="evenodd" d="{" ".join(paths)}"/>\n'
            f"</svg>\n"
        )
        (ROOT / "public" / "brand" / name).write_text(svg, encoding="utf-8")
        print(f"{name}: {len(svg):,} bytes")

    print(f"{len(paths)} outlines, {points_used} points")


if __name__ == "__main__":
    main()
