import { describe, expect, it } from "vitest";
import { parseNasaImage } from "@/src/lib/nasa-media";

describe("NASA Image Library adapter", () => {
  it("returns only a trusted NASA image asset and its archive detail link", () => {
    expect(parseNasaImage({ collection: { items: [{ data: [{ nasa_id: "PIA00342", title: "The Earth & Moon" }], links: [{ href: "https://images-assets.nasa.gov/image/PIA00342/PIA00342~medium.jpg" }] }] } })).toEqual({ title: "The Earth & Moon", thumbnailUrl: "https://images-assets.nasa.gov/image/PIA00342/PIA00342~medium.jpg", sourceUrl: "https://images.nasa.gov/details/PIA00342" });
  });

  it("rejects images from an untrusted host", () => {
    expect(parseNasaImage({ collection: { items: [{ data: [{ nasa_id: "nope" }], links: [{ href: "https://example.com/image.jpg" }] }] } })).toBeNull();
  });
});
