"""Daily sky strip for the profile README.

No altitude model - at three rows there is no vertical axis. Coverage sets
density; the convective fraction sets horizontal grain (clumped vs smeared).

Stdlib only. Run with --probe to dump the raw API response instead of
writing, which is how the field names get verified on a runner.
"""

import datetime
import json
import math
import os
import random
import re
import sys
import urllib.request

PLACE = "Amsterdam"
LAT, LON = 52.3676, 4.9041
COLS, ROWS = 100, 3
TUNED_COLS = 64  # the width GRAIN_* were tuned against
RAMP = " ░▒▓█"
JITTER = 0.55  # speckle at level boundaries
GRAIN_SMEARED, GRAIN_CLUMPED = 2.0, 9.0  # horizontal features across the width
HARD_SMEARED, HARD_CLUMPED = 2.2, 5.0
FALLBACK = (0.70, 0.55)  # a plausible Dutch sky, not an error state
README = "README.md"

API = (
    "https://api.open-meteo.com/v1/forecast?latitude={}&longitude={}"
    "&current=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high"
)

smooth = lambda t: t * t * (3 - 2 * t)
clamp = lambda v: 0.0 if v < 0 else (1.0 if v > 1 else v)
lerp = lambda a, b, t: a + (b - a) * t


def noise(seed, w, h, fx, fy, octaves=3, falloff=0.42):
    acc = [[0.0] * w for _ in range(h)]
    amp, total = 1.0, 0.0
    for o in range(octaves):
        nx, ny = max(1, int(fx * 2**o)), max(1, int(fy * 2**o))
        rnd = random.Random(seed + o * 7919)
        g = [[rnd.random() for _ in range(nx + 2)] for _ in range(ny + 2)]
        for y in range(h):
            gy = y / h * ny
            y0 = int(gy)
            ty = smooth(gy - y0)
            r0, r1 = g[y0], g[y0 + 1]
            for x in range(w):
                gx = x / w * nx
                x0 = int(gx)
                tx = smooth(gx - x0)
                acc[y][x] += (
                    (r0[x0] * (1 - tx) + r0[x0 + 1] * tx) * (1 - ty)
                    + (r1[x0] * (1 - tx) + r1[x0 + 1] * tx) * ty
                ) * amp
        total += amp
        amp *= falloff
    return [[v / total for v in row] for row in acc]


def strip(coverage, convective, seed):
    """convective 0..1 - share of cloud that is low/cumuliform."""
    # grain counts features across the width, so holding it fixed while the
    # strip widens just stretches every clump. Scaling it keeps them the size
    # they were tuned to be and puts more of them on screen instead.
    grain = lerp(GRAIN_SMEARED, GRAIN_CLUMPED, convective) * (COLS / TUNED_COLS)
    hard = lerp(HARD_SMEARED, HARD_CLUMPED, convective)
    n = noise(seed, COLS, ROWS, grain, 1.6)
    flat = sorted(v for row in n for v in row)
    thr = flat[int((1 - coverage) * (len(flat) - 1))]
    rnd = random.Random(seed * 97 + 5)
    lines = []
    for y in range(ROWS):
        row = ""
        for x in range(COLS):
            lvl = clamp((n[y][x] - thr) * hard) * (len(RAMP) - 1) + (rnd.random() - 0.5) * JITTER
            row += RAMP[max(0, min(len(RAMP) - 1, int(round(lvl))))]
        lines.append(row.rstrip())  # no trailing space inside the fence
    return "\n".join(lines)


def raw():
    with urllib.request.urlopen(API.format(LAT, LON), timeout=10) as r:
        return json.load(r)


def fetch():
    """Returns (coverage, convective, live). Falls back to a plausible sky."""
    try:
        current = raw()["current"]
        total = current["cloud_cover"] / 100
        low = current["cloud_cover_low"] / 100
        return total, (low / total if total > 0.02 else 0.0), True
    except Exception as exc:
        # Deliberately not fatal: a failed run should leave a plausible strip
        # rather than an empty README. Loud in the log so it is not silent.
        print(f"open-meteo unavailable ({exc.__class__.__name__}: {exc}); using fallback", file=sys.stderr)
        return FALLBACK[0], FALLBACK[1], False


def label(coverage, convective):
    cov = (
        "clear"
        if coverage < 0.15
        else "few clouds"
        if coverage < 0.35
        else "scattered cloud"
        if coverage < 0.60
        else "broken cloud"
        if coverage < 0.88
        else "overcast"
    )
    form = "cumuliform" if convective > 0.5 else "stratiform"
    # under a nearly empty sky the cloud form describes almost nothing, so
    # naming it reads as precision the figure does not have
    return cov if coverage < 0.15 else f"{cov}, {form}"


def footer(coverage, convective, today):
    day = f"{today:%d}".lstrip("0")
    return (
        f"{PLACE}, {day} {today:%b %Y}. "
        f"{label(coverage, convective).capitalize()} with {round(coverage * 100)}% cover."
    )


# The fence, and the footer if one is still there - it has been deleted by
# hand before, and a pattern that requires it silently matches nothing. Both
# footer forms are matched: the "Generated: [" one is what is committed today
# and has to be consumed on the changeover rather than left stranded.
BLOCK = re.compile(
    r"```\n.*?\n```(?:\n+(?:Generated: \[|" + re.escape(PLACE) + r", )[^\n]*)?",
    re.DOTALL,
)


def render(coverage, convective, today):
    art = strip(coverage, convective, seed=today.toordinal())
    return "```\n" + art + "\n```\n\n" + footer(coverage, convective, today)


def main():
    if "--probe" in sys.argv:
        # verifies the field names the parser depends on
        print(json.dumps(raw(), indent=2))
        return 0

    coverage, convective, live = fetch()
    today = datetime.date.today()
    block = render(coverage, convective, today)

    if "--stdout" in sys.argv:
        print(block)
        return 0

    existing = ""
    if os.path.exists(README):
        with open(README, encoding="utf-8") as f:
            existing = f.read()

    if BLOCK.search(existing):
        updated = BLOCK.sub(lambda _: block, existing, count=1)
    elif existing.strip():
        print(f"{README} has content but no fenced block; refusing to clobber it", file=sys.stderr)
        return 1
    else:
        updated = block + "\n"

    with open(README, "w", encoding="utf-8") as f:
        f.write(updated)

    source = "live" if live else "fallback"
    print(f"{source}: {footer(coverage, convective, today)}")
    print(block)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
