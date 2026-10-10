import { mkdir, writeFile } from "node:fs/promises";

// Original vector artwork. Every scene is built locally from shapes and seeded noise.
const groups = {
  nature: [
    ["Alpine dawn", "#081d38", "#699bbc", "#f9d4a3", "mountain"],
    ["Forest mist", "#0b2529", "#3e766c", "#d4e3bd", "forest"],
    ["Desert rose", "#3e254a", "#b67377", "#f7bb8c", "dunes"],
    ["Quiet coast", "#072b45", "#278796", "#bbddcf", "sea"],
    ["Autumn lake", "#382c48", "#946b6d", "#e6b891", "lake"],
  ],
  space: [
    ["Saturn drift", "#080e28", "#393557", "#d2ae87", "saturn"],
    ["Blue orbit", "#040c21", "#173c65", "#78d8ed", "planet"],
    ["Lunar silence", "#060d1e", "#283448", "#c4cbd2", "moon"],
    ["Violet nebula", "#0d0b25", "#503366", "#da9ee8", "nebula"],
    ["Solar eclipse", "#070e1d", "#273948", "#f5c386", "eclipse"],
  ],
  abstract: [
    ["Mint silk", "#061d26", "#235356", "#a8e1c0", "silk"],
    ["Amber rings", "#1d1522", "#66413b", "#e4b47e", "rings"],
    ["Indigo flow", "#0c153a", "#343572", "#9c9ae9", "flow"],
    ["Coral prism", "#261d38", "#944d64", "#e9a4a3", "prism"],
    ["Ice glass", "#071e32", "#327689", "#b4dfeb", "glass"],
  ],
  anime: [
    ["Sakura evening", "#212340", "#866b92", "#ffd1c6", "sakura"],
    ["Rainy rooftops", "#081c31", "#335775", "#9bccd0", "rain"],
    ["Summer crossing", "#12375b", "#63a9c0", "#ffe0ac", "summer"],
    ["Blue hour station", "#151b40", "#455180", "#cbb4dc", "station"],
    ["Lantern street", "#1b1836", "#704058", "#f6af83", "lantern"],
  ],
  gaming: [
    ["Neon highway", "#100d2e", "#563269", "#ec8faf", "grid"],
    ["Pixel valley", "#071e33", "#245a72", "#79b9ab", "pixel"],
    ["Portal chamber", "#071821", "#174c58", "#73e9d5", "portal"],
    ["Arcade skyline", "#151032", "#452a64", "#c395f4", "arcade"],
    ["Moonlit dungeon", "#091626", "#2c3d52", "#b3c0d0", "dungeon"],
  ],
};
const slugs = (text) => text.toLowerCase().replaceAll(" ", "-");
const W = 1920,
  H = 1080;
const rect = (x, y, w, h, fill, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const circle = (x, y, r, fill, extra = "") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const path = (d, fill, extra = "") =>
  `<path d="${d}" fill="${fill}" ${extra}/>`;
function art(category, item, index, phase = 0) {
  const [name, dark, mid, light, type] = item;
  let seed = 131 + index * 347;
  const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const defs = `<defs>
    <linearGradient id="sky" x2="0" y2="1"><stop stop-color="${dark}"/><stop offset=".65" stop-color="${mid}"/><stop offset="1" stop-color="${light}"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="${light}" stop-opacity=".5"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    <linearGradient id="world" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="${light}"/><stop offset=".45" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <linearGradient id="fade" x2="0" y2="1"><stop stop-color="${dark}" stop-opacity="0"/><stop offset="1" stop-color="${dark}"/></linearGradient>
  </defs>`;
  let shapes = rect(0, 0, W, H, "url(#sky)");
  const orbX = 1460 + Math.sin(phase) * 12,
    orbY = 310 + index * 12;
  shapes += circle(orbX, orbY, 410, "url(#glow)");
  const stars = (count = 230) =>
    Array.from({ length: count }, () =>
      circle(
        Math.round(rand() * W),
        Math.round(rand() * 760),
        0.6 + rand() * 1.7,
        light,
        `opacity="${0.2 + rand() * 0.6}"`,
      ),
    ).join("");
  const hills = (layers = 5, angular = false) =>
    Array.from({ length: layers }, (_, layer) => {
      let d = `M-30 ${H}`;
      const points = Array.from({ length: 17 }, (_, i) => [
        i * 128 - 40,
        610 + layer * 75 + (rand() - 0.5) * (angular ? 300 : 140),
      ]);
      if (angular) for (const [x, y] of points) d += `L${x} ${y}`;
      else {
        d += `L${points[0][0]} ${points[0][1]}`;
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1],
            b = points[i];
          d += `Q${a[0] + 64} ${a[1]} ${b[0]} ${b[1]}`;
        }
      }
      return path(
        d + `L${W + 30} ${H}Z`,
        dark,
        `opacity="${0.15 + layer * 0.17}"`,
      );
    }).join("");
  const city = (pixel = false) =>
    Array.from({ length: 35 }, (_, i) => {
      const x = i * 62 - 20,
        y = 610 + rand() * 200,
        w = 40 + rand() * 32;
      let b = rect(x, y, w, H - y, dark);
      for (let yy = y + 20; yy < 960; yy += 32)
        for (let xx = x + 8; xx < x + w - 5; xx += 14)
          if (rand() > 0.45)
            b += rect(
              xx,
              yy,
              pixel ? 8 : 4,
              7,
              light,
              `opacity="${0.15 + rand() * 0.6}"`,
            );
      if (!pixel)
        b += path(
          `M${x - 6} ${y}L${x + w / 2} ${y - 30}L${x + w + 6} ${y}Z`,
          dark,
        );
      return b;
    }).join("");
  if (category === "nature") {
    shapes += circle(orbX, orbY, 49, light, 'opacity=".85"');
    if (type === "sea") {
      shapes += rect(0, 650, W, 430, dark, 'opacity=".6"');
      for (let i = 0; i < 35; i++) {
        const y = 660 + i * 12;
        shapes += path(
          `M0 ${y}Q480 ${y - 15 * Math.sin(i + phase)} 960 ${y}T1920 ${y}`,
          "none",
          `stroke="${light}" stroke-opacity="${0.09 + i * 0.002}" stroke-width="${1 + i * 0.025}"`,
        );
      }
      shapes += path("M0 960Q350 720 660 800Q960 870 1100 1080Z", dark);
    } else {
      shapes += hills(5, type === "mountain");
      if (type === "lake") {
        shapes += path("M390 820Q880 730 1500 850L1920 1080H0Z", mid);
        for (let i = 0; i < 15; i++)
          shapes += path(
            `M${500 - i * 20} ${850 + i * 13}H${1420 + i * 20}`,
            "none",
            `stroke="${light}" stroke-opacity=".15"`,
          );
      }
      if (type === "forest")
        for (let i = 0; i < 100; i++) {
          const x = rand() * W,
            y = 760 + rand() * 320,
            size = 30 + rand() * 130;
          shapes += path(
            `M${x - size / 2} ${y}L${x} ${y - size}L${x + size / 2} ${y}Z`,
            dark,
            `opacity="${0.5 + rand() * 0.5}"`,
          );
        }
    }
  }
  if (category === "space") {
    shapes += stars(420);
    if (type === "nebula") {
      for (let i = 0; i < 12; i++)
        shapes += `<ellipse cx="${300 + i * 120}" cy="${360 + Math.sin(i * 0.6 + phase) * 120}" rx="${200 + i * 12}" ry="${110 + i * 9}" fill="url(#glow)" opacity=".35" transform="rotate(-24 ${300 + i * 120} 360)"/>`;
    } else {
      const radius = type === "eclipse" ? 165 : 190;
      if (type === "saturn")
        shapes += `<ellipse cx="${orbX}" cy="${orbY}" rx="355" ry="83" fill="none" stroke="${light}" stroke-width="32" opacity=".45" transform="rotate(-24 ${orbX} ${orbY})"/>`;
      shapes += circle(
        orbX,
        orbY,
        radius,
        type === "eclipse" ? dark : "url(#world)",
      );
      if (type === "eclipse")
        shapes += circle(
          orbX,
          orbY,
          radius + 2,
          "none",
          `stroke="${light}" stroke-width="3"`,
        );
      if (type === "moon")
        for (let i = 0; i < 24; i++) {
          const x = (rand() - 0.5) * 250,
            y = (rand() - 0.5) * 250;
          shapes += circle(
            orbX + x,
            orbY + y,
            5 + rand() * 22,
            dark,
            'opacity=".15"',
          );
        }
      if (type === "planet")
        for (let i = 0; i < 9; i++)
          shapes += path(
            `M${orbX - 125} ${orbY - 130 + i * 28}Q${orbX} ${orbY - 100 + i * 28} ${orbX + 125} ${orbY - 130 + i * 28}`,
            "none",
            `stroke="${light}" stroke-width="6" stroke-opacity=".12"`,
          );
    }
    shapes += hills(3, true);
  }
  if (category === "abstract") {
    if (type === "rings")
      for (let i = 0; i < 15; i++)
        shapes += circle(
          1420,
          600,
          100 + i * 45,
          "none",
          `stroke="${light}" stroke-opacity="${0.1 + i * 0.015}" stroke-width="${1 + i * 0.5}"`,
        );
    else if (type === "prism" || type === "glass")
      for (let i = 0; i < 11; i++) {
        const x = 170 + i * 180,
          y = 140 + rand() * 340;
        shapes += path(
          `M${x} ${y}L${x + 360} ${y + 140}L${x + 210} ${y + 650}L${x - 170} ${y + 450}Z`,
          "url(#world)",
          `opacity=".18" stroke="${light}" stroke-opacity=".3"`,
        );
      }
    else
      for (let i = 0; i < 21; i++) {
        const y = 100 + i * 39;
        shapes += path(
          `M-100 ${y + 120}C350 ${y - 330 + Math.sin(phase) * 35} 980 ${y + 540} 2020 ${y - 120}`,
          "none",
          `stroke="${light}" stroke-width="${type === "silk" ? 20 : 4}" stroke-opacity="${0.04 + i * 0.006}"`,
        );
      }
  }
  if (category === "anime") {
    if (type !== "rain")
      shapes += circle(orbX, orbY, 43, light, 'opacity=".8"');
    for (let i = 0; i < 5; i++)
      shapes += `<ellipse cx="${200 + i * 390}" cy="${190 + rand() * 150}" rx="${150 + rand() * 100}" ry="18" fill="${light}" opacity=".1"/>`;
    shapes += hills(3) + city();
    shapes += path("M0 1000L1920 925V1080H0Z", dark);
    if (type === "sakura") {
      shapes += path(
        "M0 850Q140 580 130 0M130 300Q340 210 560 100M100 510Q230 410 390 440",
        "none",
        `stroke="${dark}" stroke-width="34"`,
      );
      for (let i = 0; i < 145; i++) {
        const x = rand() * 610,
          y = rand() * 490;
        shapes += circle(
          x,
          y,
          8 + rand() * 16,
          light,
          `opacity="${0.3 + rand() * 0.5}"`,
        );
      }
      for (let i = 0; i < 30; i++)
        shapes += `<ellipse cx="${300 + rand() * 1450}" cy="${rand() * H}" rx="4" ry="8" fill="${light}" opacity=".5" transform="rotate(35)"/>`;
    }
    if (type === "rain")
      for (let i = 0; i < 230; i++) {
        const x = rand() * W,
          y = rand() * H;
        shapes += path(
          `M${x} ${y}l-7 32`,
          "none",
          `stroke="${light}" stroke-opacity=".15"`,
        );
      }
    if (type === "summer" || type === "station") {
      shapes += path(
        "M0 935H1920M0 1000H1920",
        "none",
        `stroke="${light}" stroke-opacity=".3" stroke-width="3"`,
      );
      for (const x of [300, 1580]) {
        shapes +=
          rect(x, 320, 12, 700, dark) +
          path(
            `M${x - 160} 370H${x + 180}`,
            "none",
            `stroke="${dark}" stroke-width="8"`,
          );
      }
      shapes += path(
        "M0 370Q800 480 1920 365M0 405Q800 505 1920 400",
        "none",
        `stroke="${dark}" stroke-width="3"`,
      );
      if (type === "station")
        shapes +=
          rect(1350, 820, 300, 60, mid) + rect(1380, 780, 240, 45, dark);
    }
    if (type === "lantern") {
      shapes += path(
        "M0 140Q960 360 1920 140",
        "none",
        `stroke="${dark}" stroke-width="4"`,
      );
      for (let i = 0; i < 10; i++) {
        const x = 130 + i * 185,
          y = 150 + 100 * Math.sin((i / 9) * Math.PI);
        shapes +=
          circle(x, y + 35, 80, "url(#glow)") +
          rect(x - 20, y, 40, 64, light, 'rx="18" opacity=".85"') +
          rect(x - 15, y - 4, 30, 5, dark);
      }
    }
  }
  if (category === "gaming") {
    shapes += stars(140);
    if (type === "grid") {
      shapes += circle(1430, 420, 110, light, 'opacity=".8"');
      shapes += rect(0, 690, W, 390, dark);
      for (let i = 0; i < 20; i++) {
        const y = 695 + (i / 19) ** 2 * 385;
        shapes += path(
          `M0 ${y}H1920`,
          "none",
          `stroke="${light}" stroke-opacity=".3"`,
        );
      }
      for (let i = -15; i < 16; i++)
        shapes += path(
          `M960 690L${960 + i * 185} 1080`,
          "none",
          `stroke="${light}" stroke-opacity=".25"`,
        );
      shapes += city(true);
    } else if (type === "pixel") {
      shapes += rect(1460, 200, 70, 70, light) + hills(4, true);
      for (let i = 0; i < 60; i++) {
        const x = Math.floor((rand() * W) / 16) * 16,
          y = 770 + Math.floor((rand() * 280) / 16) * 16;
        shapes += rect(x, y, 16, 16, light, 'opacity=".1"');
      }
    } else if (type === "portal") {
      for (let i = 0; i < 8; i++)
        shapes += path(
          `M${130 + i * 80} 1080V${70 + i * 50}H${1790 - i * 80}V1080`,
          "none",
          `stroke="${light}" stroke-opacity="${0.04 + i * 0.025}" stroke-width="12"`,
        );
      shapes +=
        `<ellipse cx="1450" cy="650" rx="100" ry="180" fill="${dark}" stroke="${light}" stroke-width="5"/>` +
        circle(1450, 650, 290, "url(#glow)");
    } else if (type === "arcade")
      shapes +=
        city(true) +
        path("M0 1005H1920", "none", `stroke="${light}" stroke-width="3"`);
    else {
      shapes += circle(1480, 255, 65, light, 'opacity=".7"');
      for (let i = 0; i < 6; i++)
        shapes += rect(i * 370 - 60, 0, 170, 1080, dark, 'opacity=".65"');
      for (let row = 0; row < 9; row++)
        for (let col = 0; col < 13; col++)
          shapes += rect(
            col * 160 + (row % 2 ? 80 : 0),
            row * 130,
            155,
            125,
            dark,
            'opacity=".25"',
          );
      shapes += path(
        "M1250 1080V550A210 210 0 0 1 1670 550V1080",
        "none",
        `stroke="${light}" stroke-opacity=".15" stroke-width="25"`,
      );
    }
  }
  shapes += rect(0, 780, W, 300, "url(#fade)", 'opacity=".35"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><title>${name}</title>${defs}${shapes}</svg>`;
}
await mkdir("sources", { recursive: true });
const catalog = [];
for (const [category, items] of Object.entries(groups))
  for (const [i, item] of items.entries()) {
    const slug = slugs(item[0]);
    const source = `sources/${slug}.svg`;
    await writeFile(source, art(category, item, i));
    catalog.push({
      name: item[0],
      category,
      slug,
      source,
      image: `wallpapers/${slug}.png`,
      preview: `previews/${slug}.jpg`,
      width: W,
      height: H,
      license: "CC0-1.0",
      video: `live/${slug}.webm`,
      animatedPreview: `previews/${slug}.gif`,
    });
  }
await writeFile("catalog.json", JSON.stringify(catalog, null, 2) + "\n");
// The renderer uses the same original artwork for the still and live exports.
export { art, groups };
console.log(`Generated ${catalog.length} original SVG wallpapers.`);
