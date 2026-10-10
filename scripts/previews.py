"""Encode browser-rendered frames as a looping GIF for the GitHub gallery."""
import sys
from pathlib import Path
from PIL import Image

folder, destination = map(Path, sys.argv[1:])
frames = [Image.open(file).convert("RGB") for file in sorted(folder.glob("*.png"))]
if len(frames) != 36:
    raise ValueError("Expected 36 preview frames per loop")
frames[0].save(destination, save_all=True, append_images=frames[1:], duration=167, loop=0, optimize=True)
for frame in frames:
    frame.close()
