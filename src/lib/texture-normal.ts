/**
 * Build a tangent-space normal map from a rendered source texture.
 *
 * This is deliberately a visual micro-relief treatment, not a scientific
 * elevation model: it should only be applied to source mosaics where subtle
 * surface relief makes sense, never to changing gas-giant atmospheres.
 */
export function deriveNormalMapPixels(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number, strength: number) {
  const result = new Uint8Array(width * height * 4);
  const luminanceAt = (x: number, y: number) => {
    const wrappedX = (x + width) % width;
    const clampedY = Math.max(0, Math.min(height - 1, y));
    const offset = (clampedY * width + wrappedX) * 4;
    return (rgba[offset] * .2126 + rgba[offset + 1] * .7152 + rgba[offset + 2] * .0722) / 255;
  };

  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const slopeX = (luminanceAt(x + 1, y) - luminanceAt(x - 1, y)) * strength;
    const slopeY = (luminanceAt(x, y + 1) - luminanceAt(x, y - 1)) * strength;
    const length = Math.hypot(slopeX, slopeY, 1);
    const offset = (y * width + x) * 4;
    result[offset] = Math.round((-.5 * slopeX / length + .5) * 255);
    result[offset + 1] = Math.round((-.5 * slopeY / length + .5) * 255);
    result[offset + 2] = Math.round((.5 / length + .5) * 255);
    result[offset + 3] = 255;
  }

  return result;
}
