import { describe, expect, it } from "vitest";
import { parseSourcePreview } from "@/src/lib/source-preview";

describe("source preview parser", () => {
  it("reads an absolute official social preview", () => {
    expect(parseSourcePreview('<meta property="og:image" content="https://science.nasa.gov/example.jpg">', "https://science.nasa.gov/example")).toBe("https://science.nasa.gov/example.jpg");
  });

  it("resolves a relative Twitter preview and rejects non-HTTPS assets", () => {
    expect(parseSourcePreview('<meta name="twitter:image" content="/image.jpg">', "https://www.esa.int/page")).toBe("https://www.esa.int/image.jpg");
    expect(parseSourcePreview('<meta property="og:image" content="http://example.com/image.jpg">', "https://www.esa.int/page")).toBeNull();
  });

  it("uses the first non-navigation image when a source page has no social preview", () => {
    const html = '<img src="/logo.svg"><img class="image-bg" src="/var/esa/storage/images/mars.webp" alt="Mars Express">';
    expect(parseSourcePreview(html, "https://www.esa.int/page")).toBe("https://www.esa.int/var/esa/storage/images/mars.webp");
  });
});
