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
          return fetchUrl(redirectUrl, timeoutMs, maxRedirects - 1)
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

        let data = "";
        stream.setEncoding("utf-8");
        stream.on("data", (chunk) => {
          data += chunk;
        });
        stream.on("end", () => resolve({ html: data, finalUrl: targetUrl }));
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

function decodeHtml(html) {
  if (!html) return "";
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rlm;/g, "")
    .replace(/&lrm;/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractAmazonProduct(html, sourceUrl, finalUrl = "") {
  const urlToExamine = finalUrl || sourceUrl;

  // 1. ASIN Extraction (Check URLs first, then HTML fallbacks)
  let asin = "";
  const asinMatch =
    urlToExamine.match(/\/dp\/([A-Z0-9]{10})/i) ||
    urlToExamine.match(/\/gp\/product\/([A-Z0-9]{10})/i) ||
    sourceUrl.match(/\/dp\/([A-Z0-9]{10})/i) ||
    sourceUrl.match(/\/gp\/product\/([A-Z0-9]{10})/i);

  if (asinMatch) {
    asin = asinMatch[1].toUpperCase();
  }

  if (!asin) {
    const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="[^"]*\/dp\/([A-Z0-9]{10})"/i);
    if (canonicalMatch) {
      asin = canonicalMatch[1].toUpperCase();
    }
  }

  if (!asin) {
    const inputAsinMatch =
      html.match(/<input[^>]*id="ASIN"[^>]*value="([A-Z0-9]{10})"/i) ||
      html.match(/<input[^>]*name="ASIN"[^>]*value="([A-Z0-9]{10})"/i) ||
      html.match(/data-asin="([A-Z0-9]{10})"/i);
    if (inputAsinMatch) {
      asin = inputAsinMatch[1].toUpperCase();
    }
  }

  // 2. Title Extraction
  let title = "";
  const titleMatch =
    html.match(/id="productTitle"[^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/id="title"[^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);

  if (titleMatch) {
    title = decodeHtml(titleMatch[1]);
  } else {
    const rawTitleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (rawTitleMatch) {
      title = decodeHtml(rawTitleMatch[1])
        .replace(/: Amazon\.(in|com|co\.uk|de|ca).*$/i, "")
        .replace(/Amazon\.(in|com|co\.uk):.*$/i, "")
        .trim();
    }
  }

  // 3. Selling Price
  let sellingPrice = "";
  const priceWholeMatch = html.match(/<span class="a-price-whole">([\s\S]*?)<\/span>/i);
  const priceFractionMatch = html.match(/<span class="a-price-fraction">([\s\S]*?)<\/span>/i);
  if (priceWholeMatch) {
    const whole = priceWholeMatch[1].replace(/[^\d]/g, "");
    const frac = priceFractionMatch ? priceFractionMatch[1].replace(/[^\d]/g, "") : "00";
    if (whole) {
      sellingPrice = `${whole}.${frac}`;
    }
  }

  if (!sellingPrice) {
    const offscreenPrice =
      html.match(
        /class="a-price\s+aok-align-center[^"]*"[^>]*>[\s\S]*?<span class="a-offscreen">([^<]+)<\/span>/i
      ) ||
      html.match(/<span class="a-price"[^>]*>[\s\S]*?<span class="a-offscreen">([^<]+)<\/span>/i) ||
      html.match(/id="priceblock_ourprice"[^>]*>([^<]+)<\/span>/i) ||
      html.match(/id="priceblock_dealprice"[^>]*>([^<]+)<\/span>/i);

    if (offscreenPrice) {
      const matchNum = offscreenPrice[1].replace(/,/g, "").match(/[\d.]+/);
      if (matchNum) sellingPrice = matchNum[0];
    }
  }

  // 4. MRP (List Price / Strike Price)
  let mrp = "";
  const mrpMatch =
    html.match(
      /class="a-price\s+a-text-price[^"]*"[^>]*>[\s\S]*?<span class="a-offscreen">([^<]+)<\/span>/i
    ) ||
    html.match(/data-a-strike="true"[^>]*><span[^>]*>([^<]+)<\/span>/i) ||
    html.match(/<span class="a-text-strike"[^>]*>([^<]+)<\/span>/i) ||
    html.match(/id="listPrice"[^>]*>([^<]+)<\/span>/i);

  if (mrpMatch) {
    const matchNum = mrpMatch[1].replace(/,/g, "").match(/[\d.]+/);
    if (matchNum) mrp = matchNum[0];
  }

  if (!mrp && sellingPrice) {
    mrp = sellingPrice;
  }

  // 5. Author / Contributor
  let author = "";
  const authorMatch =
    html.match(/<span class="author[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
    html.match(/by\s+<a[^>]*class="[^"]*contributorNameID[^"]*"[^>]*>([^<]+)<\/a>/i) ||
    html.match(/id="bylineInfo"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
  if (authorMatch) {
    author = decodeHtml(authorMatch[1]);
  }

  // 6. Specifications & Details Table
  const specs = {};

  // detailBullets_feature_div
  const bulletsDiv = html.match(/id="detailBullets_feature_div"[^>]*>([\s\S]*?)<\/div>/i);
  if (bulletsDiv) {
    const liMatches = [
      ...bulletsDiv[1].matchAll(
        /<span class="a-text-bold">([^<:]+)\s*:[^<]*<\/span>\s*<span>([\s\S]*?)<\/span>/g
      ),
    ];
    liMatches.forEach((m) => {
      const k = decodeHtml(m[1]).replace(/&rlm;/g, "").replace(/[\r\n\t]/g, "").trim();
      const v = decodeHtml(m[2]).replace(/&rlm;/g, "").replace(/[\r\n\t]/g, "").trim();
      if (k && v) specs[k] = v;
    });
  }

  // Product Details Table
  const prodDetailsTable =
    html.match(/id="productDetails_techSpec_section_1"[\s\S]*?<\/table>/i) ||
    html.match(/id="prodDetails"[\s\S]*?<\/table>/i);
  if (prodDetailsTable) {
    const trMatches = [
      ...prodDetailsTable[0].matchAll(
        /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g
      ),
    ];
    trMatches.forEach((m) => {
      const k = decodeHtml(m[1].replace(/<[^>]+>/g, "")).trim();
      const v = decodeHtml(m[2].replace(/<[^>]+>/g, "")).trim();
      if (k && v && !specs[k]) specs[k] = v;
    });
  }

  // RPI Carousel Specs
  const rpiRegex =
    /<div class="rpi-attribute-label"[^>]*>\s*<span>([\s\S]*?)<\/span>[\s\S]*?<div class="rpi-attribute-value"[^>]*>\s*<span>([\s\S]*?)<\/span>/g;
  let rMatch;
  while ((rMatch = rpiRegex.exec(html)) !== null) {
    const key = decodeHtml(rMatch[1]).trim();
    const val = decodeHtml(rMatch[2]).trim();
    if (key && val && !specs[key]) specs[key] = val;
  }

  // Key spec extraction
  const publisher =
    specs["Publisher"] || specs["Manufacturer"] || specs["Brand"] || "";
  const publicationDate =
    specs["Publication date"] || specs["Publication Date"] || specs["Date First Available"] || "";
  let publicationYear = "";
  if (publicationDate) {
    const yearMatch = publicationDate.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) publicationYear = yearMatch[1];
  }
  const itemWeight = specs["Item Weight"] || specs["Weight"] || "";
  const dimensions =
    specs["Dimensions"] || specs["Product Dimensions"] || specs["Package Dimensions"] || "";
  const language = specs["Language"] || "";

  // 7. Description
  let description = "";
  const bookDescExpander = html.match(
    /data-a-expander-name="book_description_expander"[\s\S]*?<div[^>]*class="[^"]*a-expander-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (bookDescExpander) {
    description = decodeHtml(
      bookDescExpander[1]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
    );
  }

  if (!description) {
    const prodDescMatch = html.match(/<div id="productDescription"[^>]*>([\s\S]*?)<\/div>/i);
    if (prodDescMatch) {
      description = decodeHtml(
        prodDescMatch[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<[^>]+>/g, "")
      );
    }
  }

  if (!description) {
    const fbMatch = html.match(/<div id="feature-bullets"[^>]*>([\s\S]*?)<\/div>/i);
    if (fbMatch) {
      const bullets = [
        ...fbMatch[1].matchAll(/<span class="a-list-item"[^>]*>([\s\S]*?)<\/span>/gi),
      ]
        .map((m) => decodeHtml(m[1].replace(/<[^>]+>/g, "")).trim())
        .filter(Boolean);
      description = bullets.join("\n\n");
    }
  }

  // 8. Image Extraction
  const images = new Set();

  // Color Images JSON
  const colorImagesMatch = html.match(
    /'colorImages':\s*\{\s*'initial':\s*(\[[\s\S]*?\])\s*\},/
  );
  if (colorImagesMatch) {
    try {
      const parsed = JSON.parse(colorImagesMatch[1]);
      parsed.forEach((item) => {
        if (item.hiRes) images.add(item.hiRes);
        else if (item.large) images.add(item.large);
        else if (item.main && Object.keys(item.main).length) {
          const keys = Object.keys(item.main);
          images.add(keys[keys.length - 1]);
        }
      });
    } catch (e) {
      // ignore JSON parse error
    }
  }

  // data-a-dynamic-image
  const dynamicMatches = [...html.matchAll(/data-a-dynamic-image="([^"]+)"/g)];
  dynamicMatches.forEach((m) => {
    try {
      const parsed = JSON.parse(decodeHtml(m[1]));
      Object.keys(parsed).forEach((imgUrl) => {
        if (imgUrl && imgUrl.startsWith("http")) images.add(imgUrl);
      });
    } catch {
      // ignore
    }
  });

  // HiRes & Large regex
  const hiResMatches = [...html.matchAll(/"hiRes"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  hiResMatches.forEach((url) => images.add(url));
  const largeMatches = [...html.matchAll(/"large"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  largeMatches.forEach((url) => images.add(url));

  // Landing image
  const landingImageMatch =
    html.match(/id="landingImage"[^>]*data-old-hires="([^"]+)"/i) ||
    html.match(/id="landingImage"[^>]*src="([^"]+)"/i) ||
    html.match(/id="imgBlkFront"[^>]*data-old-hires="([^"]+)"/i) ||
    html.match(/id="imgBlkFront"[^>]*src="([^"]+)"/i);
  if (landingImageMatch && landingImageMatch[1]) {
    images.add(landingImageMatch[1]);
  }

  // Convert to high-resolution SL1500 images
  const imageList = Array.from(images)
    .filter(
      (u) =>
        u &&
        u.startsWith("http") &&
        !u.includes("sprite") &&
        !u.includes("transparent-pixel") &&
        !u.includes("play-button")
    )
    .map((u) => u.replace(/\._[A-Z0-9_,]+_\./i, "._SL1500_."));

  const uniqueImages = Array.from(new Set(imageList));

  const parsedSellingPrice = sellingPrice ? parseFloat(sellingPrice) : null;
  const parsedMrp = mrp ? parseFloat(mrp) : parsedSellingPrice;

  return {
    asin: asin || "",
    url: urlToExamine || sourceUrl,
    title: title || (asin ? `Amazon Product ${asin}` : "Imported Amazon Product"),
    author,
    publisher,
    publicationDate,
    publicationYear,
    itemWeight,
    dimensions,
    language,
    sellingPrice: parsedSellingPrice,
    mrp: parsedMrp,
    description: description.trim(),
    specs,
    images: uniqueImages,
    primaryImage: uniqueImages[0] || null,
  };
}

function proxyImageRequest(imageUrl, clientRes, req, res, redirectHops = 3) {
  if (redirectHops <= 0) {
    res.statusCode = 502;
    res.end("Too many image redirects");
    return;
  }

  try {
    const parsed = new URL(imageUrl);
    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const clientReq = client.get(
      imageUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.amazon.in/",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      },
      (upstreamRes) => {
        // Handle CDN 301/302 redirects
        if (
          upstreamRes.statusCode &&
          upstreamRes.statusCode >= 300 &&
          upstreamRes.statusCode < 400 &&
          upstreamRes.headers.location
        ) {
          const nextUrl = new URL(upstreamRes.headers.location, imageUrl).toString();
          return proxyImageRequest(nextUrl, clientRes, req, res, redirectHops - 1);
        }

        res.statusCode = upstreamRes.statusCode || 200;
        if (upstreamRes.headers["content-type"]) {
          res.setHeader("Content-Type", upstreamRes.headers["content-type"]);
        }
        if (upstreamRes.headers["content-length"]) {
          res.setHeader("Content-Length", upstreamRes.headers["content-length"]);
        }
        res.setHeader("Cache-Control", "public, max-age=86400, immutable");
        upstreamRes.pipe(res);
      }
    );

    clientReq.on("error", (err) => {
      console.error("Proxy image error:", err);
      if (!res.headersSent) {
        res.statusCode = 502;
        res.end("Error fetching image");
      }
    });
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 400;
      res.end("Bad URL format");
    }
  }
}

export function amazonScraperPlugin() {
  return {
    name: "amazon-scraper-plugin",
    configureServer(server) {
      // POST /api/amazon-extract
      server.middlewares.use("/api/amazon-extract", async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", async () => {
          res.setHeader("Content-Type", "application/json");
          try {
            const parsed = JSON.parse(body || "{}");
            const rawUrls = Array.isArray(parsed.urls)
              ? parsed.urls
              : parsed.url
              ? [parsed.url]
              : [];

            const cleanUrls = rawUrls
              .map((u) => (typeof u === "string" ? u.trim() : ""))
              .filter(Boolean)
              .map((u) => {
                // If user just pasted ASIN like B08SKDMSXZ, convert to amazon.in URL
                if (/^[A-Z0-9]{10}$/i.test(u)) {
                  return `https://www.amazon.in/dp/${u.toUpperCase()}`;
                }
                return u;
              });

            if (cleanUrls.length === 0) {
              res.statusCode = 400;
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
                console.error(`Failed to extract Amazon product ${targetUrl}:`, err);
                errors.push({
                  url: targetUrl,
                  error: err instanceof Error ? err.message : "Failed to fetch Amazon page",
                });
              }
            }

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: results.length > 0,
                products: results,
                errors,
              })
            );
          } catch (e) {
            console.error("Amazon extract error:", e);
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                error: e instanceof Error ? e.message : "Internal Server Error",
              })
            );
          }
        });
      });

      // GET /api/amazon-image-proxy?url=...
      server.middlewares.use("/api/amazon-image-proxy", (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.statusCode = 200;
          res.end();
          return;
        }

        const queryIdx = req.url.indexOf("?");
        if (queryIdx === -1) {
          res.statusCode = 400;
          res.end("Missing image URL");
          return;
        }

        const params = new URLSearchParams(req.url.slice(queryIdx));
        const imageUrl = params.get("url");

        if (!imageUrl || !imageUrl.startsWith("http")) {
          res.statusCode = 400;
          res.end("Invalid image URL");
          return;
        }

        proxyImageRequest(imageUrl, null, req, res);
      });
    },
  };
}
