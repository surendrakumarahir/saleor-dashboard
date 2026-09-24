/**
 * Standalone Production Amazon Scraper & Image Proxy Server
 * Runs independently on any port (default: 9005 or process.env.PORT)
 * Zero external dependencies (uses native Node.js http, https, url, zlib)
 */
import http from "http";
import https from "https";
import { URL } from "url";
import zlib from "zlib";

function fetchUrl(targetUrl, timeoutMs = 15000, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error("Too many redirects"));
    }

    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === "https:";
      const client = isHttps ? https : http;

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Sec-Ch-Ua": '"Not-A.Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: timeoutMs,
      };

      const req = client.get(options, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          let redirectUrl = res.headers.location;
          try {
            redirectUrl = new URL(redirectUrl, targetUrl).toString();
          } catch {
            if (!redirectUrl.startsWith("http")) {
              redirectUrl = `${parsed.protocol}//${parsed.hostname}${redirectUrl}`;
            }
          }
          return fetchUrl(redirectUrl, timeoutMs, maxRedirects - 1)
            .then(resolve)
            .catch(reject);
        }

        const encoding = (res.headers["content-encoding"] || "").toLowerCase();
        let stream = res;
        if (encoding === "gzip") {
          const gunzip = zlib.createGunzip();
          res.pipe(gunzip);
          stream = gunzip;
        } else if (encoding === "deflate") {
          const inflate = zlib.createInflate();
          res.pipe(inflate);
          stream = inflate;
        } else if (encoding === "br") {
          const brotli = zlib.createBrotliDecompress();
          res.pipe(brotli);
          stream = brotli;
        }

        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const html = buffer.toString("utf-8");
          resolve({ html, finalUrl: targetUrl });
        });
        stream.on("error", (err) => reject(err));
      });

      req.on("error", (err) => reject(err));
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out"));
      });
    } catch (e) {
      reject(e);
    }
  });
}

function proxyImageRequest(imageUrl, fallbackUrl, req, res, maxRedirects = 5) {
  if (maxRedirects <= 0) {
    res.statusCode = 502;
    res.end("Too many redirects fetching image");
    return;
  }

  try {
    const parsed = new URL(imageUrl);
    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.amazon.in/",
      },
      timeout: 10000,
    };

    const imgReq = client.get(options, (imgRes) => {
      if (
        imgRes.statusCode &&
        imgRes.statusCode >= 300 &&
        imgRes.statusCode < 400 &&
        imgRes.headers.location
      ) {
        let redirectUrl = imgRes.headers.location;
        try {
          redirectUrl = new URL(redirectUrl, imageUrl).toString();
        } catch {
          if (!redirectUrl.startsWith("http")) {
            redirectUrl = `${parsed.protocol}//${parsed.hostname}${redirectUrl}`;
          }
        }
        return proxyImageRequest(redirectUrl, fallbackUrl, req, res, maxRedirects - 1);
      }

      if (imgRes.statusCode !== 200) {
        if (fallbackUrl && fallbackUrl !== imageUrl) {
          return proxyImageRequest(fallbackUrl, null, req, res, maxRedirects - 1);
        }
        res.statusCode = imgRes.statusCode || 502;
        res.end("Failed to fetch image from Amazon");
        return;
      }

      res.statusCode = 200;
      res.setHeader(
        "Content-Type",
        imgRes.headers["content-type"] || "image/jpeg"
      );
      res.setHeader("Cache-Control", "public, max-age=86400");
      imgRes.pipe(res);
    });

    imgReq.on("error", (err) => {
      if (fallbackUrl && fallbackUrl !== imageUrl) {
        return proxyImageRequest(fallbackUrl, null, req, res, maxRedirects - 1);
      }
      res.statusCode = 502;
      res.end(`Image proxy error: ${err.message}`);
    });
  } catch (err) {
    res.statusCode = 500;
    res.end(`Invalid URL: ${err.message}`);
  }
}

function cleanText(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAsinFromUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:\/dp\/|\/gp\/product\/|\/asin\/|ASIN=|\/d\/)([A-Z0-9]{10})/i);
  if (match) return match[1];
  const directMatch = url.trim().match(/^[A-Z0-9]{10}$/i);
  if (directMatch) return directMatch[0];
  return null;
}

function normalizeAmazonUrl(input) {
  const clean = input.trim();
  const asinMatch = clean.match(/^[A-Z0-9]{10}$/i);
  if (asinMatch) {
    return `https://www.amazon.in/dp/${asinMatch[0].toUpperCase()}`;
  }
  return clean;
}

function extractAmazonProduct(html, originalUrl, finalUrl) {
  const effectiveUrl = finalUrl || originalUrl;
  const asin = extractAsinFromUrl(effectiveUrl) || extractAsinFromUrl(originalUrl) || "";

  // Title
  let title = "";
  const titleMatch =
    html.match(/<span[^>]*id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/<h1[^>]*id=["']title["'][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = cleanText(titleMatch[1]);
    title = title.replace(/\s*:\s*Amazon\.in.*$/i, "").trim();
  }

  // Author
  let author = "";
  const authorMatch =
    html.match(/<span[^>]*class=["'][^"']*author[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
    html.match(/by\s+<a[^>]*class=["'][^"']*contributorNameID[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) ||
    html.match(/<a[^>]*id=["']bylineContributor["'][^>]*>([\s\S]*?)<\/a>/i);
  if (authorMatch) {
    author = cleanText(authorMatch[1]);
  }

  // Price & MRP
  let sellingPrice = null;
  let mrp = null;

  const priceWhole = html.match(/<span[^>]*class=["'][^"']*a-price-whole[^"']*["'][^>]*>([\d,]+)/i);
  const priceFraction = html.match(/<span[^>]*class=["'][^"']*a-price-fraction[^"']*["'][^>]*>(\d+)/i);
  if (priceWhole) {
    const whole = priceWhole[1].replace(/,/g, "");
    const frac = priceFraction ? priceFraction[1] : "00";
    sellingPrice = parseFloat(`${whole}.${frac}`);
  }

  if (sellingPrice === null) {
    const offscreen = html.match(/<span[^>]*class=["'][^"']*a-offscreen[^"']*["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i);
    if (offscreen) {
      sellingPrice = parseFloat(offscreen[1].replace(/,/g, ""));
    }
  }

  const basisMatch =
    html.match(/<span[^>]*class=["'][^"']*a-price\s+a-text-price[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*a-offscreen[^"']*["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i) ||
    html.match(/M\.R\.P\.:[\s\S]*?<span[^>]*class=["'][^"']*a-offscreen[^"']*["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i);
  if (basisMatch) {
    mrp = parseFloat(basisMatch[1].replace(/,/g, ""));
  }

  if (sellingPrice !== null && mrp === null) {
    mrp = sellingPrice;
  }

  // Specs
  const specs = {};
  const bulletMatches = html.matchAll(/<span[^>]*class=["'][^"']*a-list-item[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*a-text-bold[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>/gi);
  for (const m of bulletMatches) {
    const key = cleanText(m[1]).replace(/[:\u200E\u200F]/g, "").trim();
    const val = cleanText(m[2]).trim();
    if (key && val) specs[key] = val;
  }

  const tableMatches = html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi);
  for (const m of tableMatches) {
    const key = cleanText(m[1]).replace(/[:\u200E\u200F]/g, "").trim();
    const val = cleanText(m[2]).trim();
    if (key && val) specs[key] = val;
  }

  const publisher = specs["Publisher"] || specs["Publisher:"] || "";
  const publicationDate = specs["Publication date"] || specs["Publication date:"] || "";
  const pubYearMatch = publicationDate.match(/\b(19\d\d|20\d\d)\b/);
  const publicationYear = pubYearMatch ? pubYearMatch[1] : "";
  const itemWeight = specs["Item Weight"] || specs["Item Weight:"] || "";
  const dimensions = specs["Dimensions"] || specs["Dimensions:"] || "";
  const language = specs["Language"] || specs["Language:"] || "";

  // Description
  let description = "";
  const descMatch =
    html.match(/<div[^>]*id=["']productDescription["'][^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]*id=["']feature-bullets["'][^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch) {
    description = cleanText(descMatch[1]);
  }

  // Images
  const rawImages = [];
  const dynMatch = html.match(/data-a-dynamic-image=["']({[^"']+})["']/i);
  if (dynMatch) {
    try {
      const parsed = JSON.parse(dynMatch[1].replace(/&quot;/g, '"'));
      rawImages.push(...Object.keys(parsed));
    } catch {
      // ignore
    }
  }

  const colorImagesMatch = html.match(/'colorImages':\s*\{\s*'initial':\s*(\[[^\]]+\])/i);
  if (colorImagesMatch) {
    try {
      const parsed = JSON.parse(colorImagesMatch[1].replace(/'/g, '"'));
      for (const item of parsed) {
        if (item.hiRes) rawImages.push(item.hiRes);
        else if (item.large) rawImages.push(item.large);
      }
    } catch {
      // ignore
    }
  }

  const landingImg = html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i);
  if (landingImg) rawImages.push(landingImg[1]);

  const cleanImages = [
    ...new Set(
      rawImages
        .map((img) => {
          return img.replace(/\._[A-Z0-9_]+_(\.[a-z]+)$/i, "._SL1500_$1");
        })
        .filter((img) => img.startsWith("http") && !img.includes("transparent-pixel"))
    ),
  ];

  return {
    asin,
    url: effectiveUrl,
    title,
    author,
    publisher,
    publicationDate,
    publicationYear,
    itemWeight,
    dimensions,
    language,
    sellingPrice,
    mrp,
    description,
    specs,
    images: cleanImages,
    primaryImage: cleanImages[0] || "",
  };
}

const PORT = process.env.PORT || 9005;

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  // Health check
  if (pathname === "/health" || pathname === "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: "ok",
        service: "Amazon Scraper Microservice",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // GET /api/amazon-image-proxy?url=...
  if (pathname === "/api/amazon-image-proxy" && req.method === "GET") {
    const imageUrl = parsedUrl.searchParams.get("url");
    if (!imageUrl || !imageUrl.startsWith("http")) {
      res.statusCode = 400;
      res.end("Invalid image URL");
      return;
    }
    proxyImageRequest(imageUrl, null, req, res);
    return;
  }

  // POST /api/amazon-extract
  if (pathname === "/api/amazon-extract" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const urls = payload.urls || [];
        const cleanUrls = urls
          .map((u) => normalizeAmazonUrl(u))
          .filter((u) => u.startsWith("http"));

        if (cleanUrls.length === 0) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "No valid URLs or ASINs provided" }));
          return;
        }

        const results = [];
        const errors = [];

        for (const targetUrl of cleanUrls) {
          try {
            const { html, finalUrl } = await fetchUrl(targetUrl);
            const product = extractAmazonProduct(html, targetUrl, finalUrl);
            results.push(product);
          } catch (err) {
            console.error(`Failed to extract ${targetUrl}:`, err);
            errors.push({
              url: targetUrl,
              error: err instanceof Error ? err.message : "Failed to fetch Amazon page",
            });
          }
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            success: results.length > 0,
            products: results,
            errors,
          })
        );
      } catch (e) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            error: e instanceof Error ? e.message : "Internal Server Error",
          })
        );
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Amazon Scraper Production Server running on port ${PORT}`);
});
