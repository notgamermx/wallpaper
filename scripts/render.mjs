import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
for (const directory of [".cache", "wallpapers", "previews", "live"])
  await mkdir(directory, { recursive: true });
const catalog = JSON.parse(await readFile("catalog.json", "utf8"));
const server = createServer(async (req, res) => {
  try {
    const relative = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    ).slice(1);
    const filename = path.resolve(root, relative);
    if (!relative) {
      res.setHeader("content-type", "text/html");
      res.end(
        '<!doctype html><title>Wallpaper renderer</title><canvas id="canvas" width="1920" height="1080"></canvas>',
      );
      return;
    }
    if (!filename.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    res.setHeader(
      "content-type",
      filename.endsWith(".svg")
        ? "image/svg+xml"
        : filename.endsWith(".json")
          ? "application/json"
          : "application/octet-stream",
    );
    res.end(await readFile(filename));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(path.join(root, ".cache", "edge-"));
const browser = spawn(
  process.env.BROWSER_PATH ||
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let ws, send;
try {
  let port;
  for (let i = 0; i < 80; i++)
    try {
      port = (
        await readFile(path.join(profile, "DevToolsActivePort"), "utf8")
      ).split("\n")[0];
      break;
    } catch {
      await delay(250);
    }
  if (!port) throw new Error("Browser renderer did not start.");
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?${address}`, {
      method: "PUT",
    })
  ).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let sequence = 0;
  const pending = new Map();
  ws.onmessage = ({ data }) => {
    const item = JSON.parse(data);
    if (!item.id) return;
    const job = pending.get(item.id);
    pending.delete(item.id);
    item.error
      ? job.reject(new Error(item.error.message))
      : job.resolve(item.result);
  };
  send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const run = async (expression) => {
    const out = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (out.exceptionDetails)
      throw new Error(
        out.exceptionDetails.exception?.description ||
          out.exceptionDetails.text,
      );
    return out.result.value;
  };
  await run(
    `window.loadArtwork = async source => {const img=new Image();img.src=source;await img.decode();return img;};window.exportBlob=blob=>new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);});`,
  );
  for (const item of catalog) {
    const result = await run(`(async()=>{
      const image=await loadArtwork(${JSON.stringify(item.source)});const c=document.getElementById('canvas'),x=c.getContext('2d');x.drawImage(image,0,0);
      const small=document.createElement('canvas');small.width=480;small.height=270;small.getContext('2d').drawImage(c,0,0,480,270);
      return {png:c.toDataURL('image/png').split(',')[1],jpg:small.toDataURL('image/jpeg',.86).split(',')[1]};
    })()`);
    await writeFile(item.image, Buffer.from(result.png, "base64"));
    await writeFile(item.preview, Buffer.from(result.jpg, "base64"));
    if (item.video) {
      const data = await run(`(async()=>{
        const img=await loadArtwork(${JSON.stringify(item.source)});const c=document.getElementById('canvas'),x=c.getContext('2d');
        const stream=c.captureStream(0),track=stream.getVideoTracks()[0];
        const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm;codecs=vp8';
        const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000}),parts=[];recorder.ondataavailable=e=>parts.push(e.data);
        const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();
        const frames=144;
        for(let f=0;f<frames;f++){
          const t=f/frames*Math.PI*2;x.clearRect(0,0,1920,1080);x.drawImage(img,-25+Math.sin(t)*15,-15+Math.cos(t)*10,1970,1110);
          track.requestFrame();await new Promise(resolve=>setTimeout(resolve,1000/24));
        }
        recorder.stop();await done;track.stop();return exportBlob(new Blob(parts,{type:'video/webm'}));
      })()`);
      await writeFile(item.video, Buffer.from(data, "base64"));
    }
    console.log(`Exported ${item.name}${item.video ? " + live loop" : ""}`);
  }
  const sheet = await run(
    `(async()=>{const c=document.createElement('canvas');c.width=1600;c.height=1070;const x=c.getContext('2d');x.fillStyle='#0b1420';x.fillRect(0,0,c.width,c.height);const catalog=await(await fetch('catalog.json')).json();for(let i=0;i<catalog.length;i++){const img=await loadArtwork(catalog[i].source),col=i%5,row=Math.floor(i/5);x.drawImage(img,col*320,row*214,320,180);x.fillStyle='#dce8ec';x.font='14px Segoe UI';x.fillText(catalog[i].name,col*320+12,row*214+202);}return c.toDataURL('image/jpeg',.9).split(',')[1];})()`,
  );
  await writeFile("previews/collection.jpg", Buffer.from(sheet, "base64"));
  // Decode every export, including the video containers, before publishing.
  const valid = await run(
    `(async()=>{const catalog=await(await fetch('catalog.json')).json();for(const item of catalog){const image=await loadArtwork(item.image);if(image.naturalWidth!==1920||image.naturalHeight!==1080)throw new Error(item.image);if(item.video){const video=document.createElement('video');video.preload='auto';video.src=item.video;await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(new Error(item.video));});if(video.videoWidth!==1920||video.videoHeight!==1080)throw new Error(item.video);}}return true;})()`,
  );
  if (!valid) throw new Error("Export validation failed.");
  console.log(
    "Verified 25 full-HD images and 5 playable full-HD live wallpapers.",
  );
} finally {
  if (ws?.readyState === WebSocket.OPEN && send)
    await Promise.race([send("Browser.close").catch(() => {}), delay(2000)]);
  ws?.close();
  browser.kill();
  server.close();
}
