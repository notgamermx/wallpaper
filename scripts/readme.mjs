import { readFile, writeFile } from "node:fs/promises";
const catalog = JSON.parse(await readFile("catalog.json", "utf8"));
const names = {
  nature: "Nature",
  space: "Space",
  abstract: "Abstract",
  anime: "Anime-style scenery",
  gaming: "Gaming-style backgrounds",
};
let text = `# Free wallpapers for Lumen

**25 live video wallpapers**, plus matching still images, for [Lumen](https://github.com/notgamermx/lumen-new-tab). Five videos in each style: nature, space, abstract, anime-style scenery, and gaming-style backgrounds. All full-size files are **1920 × 1080** and free to use, modify, and share under [CC0](LICENSE).

[Browse video downloads](#live-wallpapers) · [Download everything](https://github.com/notgamermx/wallpaper/archive/refs/heads/main.zip)

![The full collection: five wallpapers in each of five styles](previews/collection.jpg)

## Use a wallpaper

1. Choose a PNG or live WebM below. Open the file and save it to your device. On GitHub, use the download button on the file page, or **Save image as** for an opened image.
2. Open a Lumen new tab, then **Customize → Wallpaper**.
3. Choose your downloaded file or drop it into the upload area.

PNG files are still images. WebM files are silent 6-second animated loops. Lumen repeats them automatically. These are original vector illustrations, including anime-inspired scenery and gaming-inspired designs; no franchise characters or third-party screenshots are included.

[Download the entire collection as a ZIP](https://github.com/notgamermx/wallpaper/archive/refs/heads/main.zip)

## Live wallpapers

| Animated preview | Video download |
| --- | --- |
`;
for (const item of catalog.filter((i) => i.video))
  text += `| ![${item.name} animated preview](./${item.animatedPreview}) | **${item.name}** · [Download video (WebM)](https://github.com/notgamermx/wallpaper/raw/refs/heads/main/${item.video}) · ${names[item.category]} |\n`;
for (const [category, title] of Object.entries(names)) {
  text += `\n## ${title}\n\n| Preview | Download |\n| --- | --- |\n`;
  for (const item of catalog.filter((i) => i.category === category))
    text += `| ![${item.name}](./${item.preview}) | **${item.name}** · [PNG](./${item.image}) · [Editable SVG](./${item.source}) |\n`;
}
text += `\n## Source and license

The artwork is drawn locally from vector shapes. SVG sources are included in \`sources/\`; \`catalog.json\` lists every export, category, resolution, and license. Artwork is dedicated under [CC0](LICENSE), and the export scripts use the [MIT license](scripts/LICENSE). Attribution is optional.

To recreate the collection with Node.js 22 or newer, Python with Pillow, and Microsoft Edge on Windows:

\`\`\`sh
npm run generate
npm run render
node scripts/readme.mjs
\`\`\`

Set \`BROWSER_PATH\` to use another Chromium browser and \`PYTHON_PATH\` to select a Python executable. The renderer uses an isolated browser profile and checks that every image and video decodes at full-HD resolution. Generated browser profiles stay in the ignored \`.cache/\` folder. The GIFs are small animated previews; import the full-size WebM files into Lumen.
`;
await writeFile("README.md", text);
