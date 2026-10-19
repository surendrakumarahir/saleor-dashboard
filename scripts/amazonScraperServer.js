/**
 * Standalone Production Amazon Scraper & Image Proxy Server
 * Runs independently on any port (default: 9005 or process.env.PORT)
 * Zero external dependencies (uses native Node.js http, https, url, zlib)
 */
import http from "http";
import https from "https";
import { URL } from "url";
import zlib from "zlib";

const USER_AGENT_PROFILES = [
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    secPlatform: '"macOS"',
    isMobile: false,
  },
  {
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    secPlatform: '"iOS"',
    isMobile: true,
  },
  {
    ua: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
    secPlatform: '"Android"',
    isMobile: true,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    secPlatform: '"Windows"',
    isMobile: false,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
    secPlatform: '"Windows"',
    isMobile: false,
  },
];

function singleFetch(targetUrl, profile, timeoutMs = 15000, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error("Too many redirects"));
    }

    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === "https:";
      const client = isHttps ? https : http;

      const headers = {
        "User-Agent": profile.ua,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
      };

      if (profile.secPlatform) {
        headers["Sec-Ch-Ua"] = '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"';
        headers["Sec-Ch-Ua-Mobile"] = profile.isMobile ? "?1" : "?0";
        headers["Sec-Ch-Ua-Platform"] = profile.secPlatform;
        headers["Sec-Fetch-Dest"] = "document";
        headers["Sec-Fetch-Mode"] = "navigate";
        headers["Sec-Fetch-Site"] = "none";
        headers["Sec-Fetch-User"] = "?1";
      }

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        headers,
        timeout: timeoutMs,
      };

      const req = client.get(options, (res) => {
        // Handle Redirects
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
          return singleFetch(redirectUrl, profile, timeoutMs, maxRedirects - 1)
            .then(resolve)
            .catch(reject);
        }

        // Handle Compression
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
          const html = Buffer.concat(chunks).toString("utf-8");
          const isRobot =
            html.includes("Robot Check") ||
            html.includes("Type the characters you see in this image") ||
            html.includes("api-services-support@amazon.com") ||
            html.toLowerCase().includes("automated access to amazon data") ||
            (res.statusCode === 503 && html.length < 5000);

          resolve({
            html,
            finalUrl: targetUrl,
            statusCode: res.statusCode,
            isRobot,
          });
        });
        stream.on("error", (err) => reject(err));
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out"));
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function robustFetchUrl(targetUrl) {
  let lastError = null;

  for (let i = 0; i < USER_AGENT_PROFILES.length; i++) {
    const profile = USER_AGENT_PROFILES[i];
    try {
      const res = await singleFetch(targetUrl, profile);
      if (!res.isRobot && res.html && res.html.length > 5000) {
        return { html: res.html, finalUrl: res.finalUrl };
      }
      lastError = new Error(
        `Amazon returned robot check or restricted page (length: ${res.html?.length || 0})`
      );
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw (
    lastError ||
    new Error("Amazon bot check triggered across all requests. Please try again shortly.")
  );
}

function decodeHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rlm;/gi, "")
    .replace(/&lrm;/gi, "")
    .replace(/[\u200E\u200F]/g, "")
    .replace(/&nbsp;/g, " ")
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

  // 1. Title Extraction
  let title = "";
  const titleMatch =
    html.match(/id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/id=["']title["'][^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/<h1[^>]*id=["']title["'][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  if (titleMatch) {
    title = decodeHtml(titleMatch[1]);
  } else {
    const rawTitleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (rawTitleMatch) {
      title = decodeHtml(rawTitleMatch[1])
        .replace(/: Amazon\.(in|com|co\.uk|de|ca).*$/i, "")
        .replace(/Amazon\.(in|com|co\.uk):.*$/i, "")
        .replace(/^Buy\s+/i, "")
        .trim();
    }
  }

  // 2. Author Extraction
  let author = "";
  const bylineInfo = html.match(/<div[^>]*id=["']bylineInfo["'][^>]*>([\s\S]*?)<\/div>/i);
  if (bylineInfo) {
    const bylineAuthors = [];
    const authorMatches = bylineInfo[1].matchAll(
      /<span[^>]*class=["'][^"']*author[^"']*["'][^>]*>[\s\S]*?<a[^>]*class=["']a-link-normal[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi
    );
    for (const m of authorMatches) {
      const a = decodeHtml(m[1]);
      if (a && !bylineAuthors.includes(a)) bylineAuthors.push(a);
    }
    if (bylineAuthors.length > 0) {
      author = bylineAuthors.join(", ");
    } else {
      const simpleLink = bylineInfo[1].match(/<a[^>]*class=["']a-link-normal[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
      if (simpleLink) author = decodeHtml(simpleLink[1]);
    }
  }

  if (!author) {
    const authorMatch =
      html.match(/<span[^>]*class=["']author\s+notFaded["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
      html.match(/by\s+<a[^>]*class=["'][^"']*contributorNameID[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
    if (authorMatch) {
      author = decodeHtml(authorMatch[1]);
    }
  }

  // 3. Selling Price & MRP
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
    html.match(/M\.R\.P\.:[\s\S]*?<span[^>]*class=["'][^"']*a-offscreen[^"']*["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i) ||
    html.match(/id=["']listPrice["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i);
  if (basisMatch) {
    mrp = parseFloat(basisMatch[1].replace(/,/g, ""));
  }

  if (sellingPrice !== null && mrp === null) {
    mrp = sellingPrice;
  }

  // 4. Specs & Details
  const specs = {};

  const bulletMatches = html.matchAll(
    /<span[^>]*class=["'][^"']*a-list-item[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*a-text-bold[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>/gi
  );
  for (const m of bulletMatches) {
    const key = decodeHtml(m[1]).replace(/[:\u200E\u200F]/g, "").trim();
    const val = decodeHtml(m[2]).trim();
    if (key && val) specs[key] = val;
  }

  const tableMatches = html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi);
  for (const m of tableMatches) {
    const key = decodeHtml(m[1]).replace(/[:\u200E\u200F]/g, "").trim();
    const val = decodeHtml(m[2]).trim();
    if (key && val && !specs[key]) specs[key] = val;
  }

  const rpiMatches = html.matchAll(
    /class=["']rpi-attribute-label["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?class=["']rpi-attribute-value["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/gi
  );
  for (const m of rpiMatches) {
    const key = decodeHtml(m[1]).replace(/[:\u200E\u200F]/g, "").trim();
    const val = decodeHtml(m[2]).trim();
    if (key && val && !specs[key]) specs[key] = val;
  }

  const publisher = specs["Publisher"] || specs["Manufacturer"] || specs["Brand"] || "";
  const publicationDate = specs["Publication date"] || specs["Publication Date"] || specs["Date First Available"] || "";
  let publicationYear = "";
  if (publicationDate) {
    const ym = publicationDate.match(/\b(19\d\d|20\d\d)\b/);
    if (ym) publicationYear = ym[1];
  }
  const itemWeight = specs["Item Weight"] || specs["Weight"] || "";
  const dimensions = specs["Dimensions"] || specs["Product Dimensions"] || specs["Package Dimensions"] || "";
  const language = specs["Language"] || "";

  // 5. Description
  let description = "";
  const bookExpander = html.match(
    /data-a-expander-name=["']book_description_expander["'][\s\S]*?<div[^>]*class=["'][^"']*a-expander-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  );
  if (bookExpander) {
    const descText = decodeHtml(
      bookExpander[1]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
    );
    if (descText && descText.toLowerCase() !== "na") {
      description = descText;
    }
  }

  if (!description) {
    const descMatch =
      html.match(/<div[^>]*id=["']productDescription["'][^>]*>([\s\S]*?)<\/div>/i) ||
      html.match(/<div[^>]*id=["']feature-bullets["'][^>]*>([\s\S]*?)<\/div>/i);
    if (descMatch) {
      description = decodeHtml(
        descMatch[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
      );
    }
  }

  if (!description) {
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDesc) {
      description = decodeHtml(metaDesc[1]);
    }
  }

  // 6. Images
  const rawImages = [];
  const colorImagesMatch = html.match(/'colorImages':\s*\{\s*'initial':\s*(\[[\s\S]*?\])\s*\},/i);
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

  const dynMatch = html.match(/data-a-dynamic-image=["']({[^"']+})["']/i);
  if (dynMatch) {
    try {
      const parsed = JSON.parse(dynMatch[1].replace(/&quot;/g, '"'));
      rawImages.push(...Object.keys(parsed));
    } catch {
      // ignore
    }
  }

  const landingImg =
    html.match(/id=["']landingImage["'][^>]*data-old-hires=["']([^"']+)["']/i) ||
    html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i) ||
    html.match(/id=["']imgBlkFront["'][^>]*data-old-hires=["']([^"']+)["']/i) ||
    html.match(/id=["']imgBlkFront["'][^>]*src=["']([^"']+)["']/i);
  if (landingImg) rawImages.push(landingImg[1]);

  const cleanImages = [
    ...new Set(
      rawImages
        .filter(
          (u) =>
            u &&
            u.startsWith("http") &&
            !u.includes("transparent-pixel") &&
            !u.includes("sprite")
        )
        .map((img) => img.replace(/\._[A-Z0-9_,]+_\./i, "._SL1500_."))
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
    description: description.trim(),
    specs,
    images: cleanImages,
    primaryImage: cleanImages[0] || "",
  };
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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
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
            const { html, finalUrl } = await robustFetchUrl(targetUrl);
            const product = extractAmazonProduct(html, targetUrl, finalUrl);

            if (!product.title || (product.title.startsWith("Amazon Product") && !product.sellingPrice)) {
              throw new Error(
                "Amazon restricted or returned incomplete product data for this URL. Please verify the URL/ASIN."
              );
            }

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
