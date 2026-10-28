"""Generate 2 charts for the research report (English labels, DM-1 palette)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

PRIMARY = "#1B6B7A"   # darkened DM-1 accent (table-safe)
ACCENT = "#37DCF2"
INK = "#12242E"
GRID = "#D9E4E8"

plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["axes.unicode_minus"] = False

OUT = "/home/z/my-project/research/figs"


def style_ax(ax):
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color("#9FB3BA")
    ax.tick_params(colors=INK, labelsize=10)
    ax.xaxis.grid(True, color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)


def hbar(data, xlabel, path, xmax_pad=1.14):
    labels = [d[0] for d in data][::-1]
    values = [d[1] for d in data][::-1]
    fig, ax = plt.subplots(figsize=(8.6, 3.9), dpi=200, constrained_layout=True)
    bars = ax.barh(labels, values, height=0.58, color=PRIMARY, edgecolor="none")
    bars[-1].set_color(ACCENT)  # highlight the largest (top row after reversal)
    bars[-1].set_edgecolor(PRIMARY)
    bars[-1].set_linewidth(1.2)
    for b, v in zip(bars, values):
        ax.text(v + max(values) * 0.015, b.get_y() + b.get_height() / 2,
                f"{v:,}", va="center", ha="left", fontsize=10, color=INK)
    ax.set_xlim(0, max(values) * xmax_pad)
    ax.set_xlabel(xlabel, fontsize=10, color=INK)
    style_ax(ax)
    fig.savefig(path, facecolor="white")
    plt.close(fig)
    print("saved", path)


# Figure 1 - machine-readable catalog size of component libraries
hbar(
    [("react-bits (registry items)", 872),
     ("Watermelon UI (catalog entries)", 849),
     ("soundcn (registry items)", 816),
     ("ThreeUI (catalog items, approx.)", 810),
     ("OpenSourceUI.in (components)", 204)],
    "Items exposed via registry / catalog / API",
    f"{OUT}/fig1_catalog_sizes.png",
)

# Figure 2 - curated gallery collection sizes (Refero's 100k+ excluded, noted in text)
hbar(
    [("footer.design", 776),
     ("supahero.io", 573),
     ("cta.gallery", 519),
     ("navbar.gallery", 496)],
    "Curated items in collection",
    f"{OUT}/fig2_gallery_sizes.png",
)
