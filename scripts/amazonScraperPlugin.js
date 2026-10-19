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

export function extractAmazonProduct(html, sourceUrl, finalUrl = "") {
  const urlToExamine = finalUrl || sourceUrl;

  // 1. ASIN Extraction
  let asin = "";
  const asinMatch =
    urlToExamine.match(/(?:\/dp\/|\/gp\/product\/|\/asin\/|ASIN=|\/d\/)([A-Z0-9]{10})/i) ||
    sourceUrl.match(/(?:\/dp\/|\/gp\/product\/|\/asin\/|ASIN=|\/d\/)([A-Z0-9]{10})/i);

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
      html.match(/id=["']ASIN["'][^>]*value=["']([A-Z0-9]{10})["']/i) ||
      html.match(/name=["']ASIN["'][^>]*value=["']([A-Z0-9]{10})["']/i) ||
      html.match(/data-asin=["']([A-Z0-9]{10})["']/i);
    if (inputAsinMatch) {
      asin = inputAsinMatch[1].toUpperCase();
    }
  }

  // 2. Title Extraction
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

  // 3. Selling Price
  let sellingPrice = null;
  const priceWholeMatch = html.match(/<span[^>]*class=["'][^"']*a-price-whole[^"']*["'][^>]*>([\d,]+)/i);
  const priceFractionMatch = html.match(/<span[^>]*class=["'][^"']*a-price-fraction[^"']*["'][^>]*>(\d+)/i);
  if (priceWholeMatch) {
    const whole = priceWholeMatch[1].replace(/,/g, "");
    const frac = priceFractionMatch ? priceFractionMatch[1] : "00";
    sellingPrice = parseFloat(`${whole}.${frac}`);
  }

  if (sellingPrice === null) {
    const offscreenPrice =
      html.match(
        /class=["'][^"']*a-price\s+aok-align-center[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["']a-offscreen["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i
      ) ||
      html.match(/<span[^>]*class=["'][^"']*a-price[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["']a-offscreen["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i) ||
      html.match(/id=["']priceblock_ourprice["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i) ||
      html.match(/id=["']priceblock_dealprice["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i);

    if (offscreenPrice) {
      sellingPrice = parseFloat(offscreenPrice[1].replace(/,/g, ""));
    }
  }

  // 4. MRP (List Price / Strike Price)
  let mrp = null;
  const mrpMatch =
    html.match(
      /class=["'][^"']*a-price\s+a-text-price[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["']a-offscreen["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i
    ) ||
    html.match(/M\.R\.P\.:[\s\S]*?<span[^>]*class=["']a-offscreen["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i) ||
    html.match(/id=["']listPrice["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i) ||
    html.match(/<span[^>]*class=["'][^"']*a-text-strike[^"']*["'][^>]*>₹?\s*([\d,]+(?:\.\d+)?)/i);

  if (mrpMatch) {
    mrp = parseFloat(mrpMatch[1].replace(/,/g, ""));
  }

  if (sellingPrice !== null && mrp === null) {
    mrp = sellingPrice;
  }

  // 5. Author / Contributor
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

  // 6. Specifications & Details
  const specs = {};

  // detailBullets_feature_div (Books details)
  const bulletsDiv = html.match(/id=["']detailBullets_feature_div["'][^>]*>([\s\S]*?)<\/div>/i);
  if (bulletsDiv) {
    const liMatches = bulletsDiv[1].matchAll(
      /<span[^>]*class=["'][^"']*a-text-bold[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>/gi
    );
    for (const m of liMatches) {
      const k = decodeHtml(m[1]).replace(/[:\u200E\u200F]/g, "").trim();
      const v = decodeHtml(m[2]).trim();
      if (k && v) specs[k] = v;
    }
  }

  // Product Details Table
  const prodDetailsTable =
    html.match(/id=["']productDetails_techSpec_section_1["'][\s\S]*?<\/table>/i) ||
    html.match(/id=["']prodDetails["'][\s\S]*?<\/table>/i);
  if (prodDetailsTable) {
    const trMatches = prodDetailsTable[0].matchAll(
      /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi
    );
    for (const m of trMatches) {
      const k = decodeHtml(m[1]).replace(/[:\u200E\u200F]/g, "").trim();
      const v = decodeHtml(m[2]).trim();
      if (k && v && !specs[k]) specs[k] = v;
    }
  }

  // RPI Carousel Specs (ISBN, Publisher, Language, etc.)
  const rpiMatches = html.matchAll(
    /class=["']rpi-attribute-label["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?class=["']rpi-attribute-value["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/gi
  );
  for (const m of rpiMatches) {
    const k = decodeHtml(m[1]).replace(/[:\u200E\u200F]/g, "").trim();
    const v = decodeHtml(m[2]).trim();
    if (k && v && !specs[k]) specs[k] = v;
  }

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
    /data-a-expander-name=["']book_description_expander["'][\s\S]*?<div[^>]*class=["'][^"']*a-expander-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  );
  if (bookDescExpander) {
    const descText = decodeHtml(
      bookDescExpander[1]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
    );
    if (descText && descText.toLowerCase() !== "na") {
      description = descText;
    }
  }

  if (!description) {
    const prodDescMatch = html.match(/<div[^>]*id=["']productDescription["'][^>]*>([\s\S]*?)<\/div>/i);
    if (prodDescMatch) {
      description = decodeHtml(
        prodDescMatch[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
      );
    }
  }

  if (!description) {
    const fbMatch = html.match(/<div[^>]*id=["']feature-bullets["'][^>]*>([\s\S]*?)<\/div>/i);
    if (fbMatch) {
      const bullets = [
        ...fbMatch[1].matchAll(/<span[^>]*class=["']a-list-item["'][^>]*>([\s\S]*?)<\/span>/gi),
      ]
        .map((m) => decodeHtml(m[1]))
        .filter(Boolean);
      if (bullets.length > 0) {
        description = bullets.join("\n\n");
      }
    }
  }

  if (!description) {
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDesc) {
      description = decodeHtml(metaDesc[1]);
    }
  }

  // 8. Images
  const rawImages = [];

  const colorImagesMatch = html.match(
    /'colorImages':\s*\{\s*'initial':\s*(\[[\s\S]*?\])\s*\},/i
  );
  if (colorImagesMatch) {
    try {
      const parsed = JSON.parse(colorImagesMatch[1].replace(/'/g, '"'));
      for (const item of parsed) {
        if (item.hiRes) rawImages.push(item.hiRes);
        else if (item.large) rawImages.push(item.large);
        else if (item.main && Object.keys(item.main).length) {
          const keys = Object.keys(item.main);
          rawImages.push(keys[keys.length - 1]);
        }
      }
    } catch {
      // ignore
    }
  }

  const dynamicMatches = [...html.matchAll(/data-a-dynamic-image=["']({[^"']+})["']/gi)];
  dynamicMatches.forEach((m) => {
    try {
      const parsed = JSON.parse(m[1].replace(/&quot;/g, '"'));
      Object.keys(parsed).forEach((imgUrl) => {
        if (imgUrl && imgUrl.startsWith("http")) rawImages.push(imgUrl);
      });
    } catch {
      // ignore
    }
  });

  const hiResMatches = [...html.matchAll(/"hiRes"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  hiResMatches.forEach((url) => rawImages.push(url));
  const largeMatches = [...html.matchAll(/"large"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  largeMatches.forEach((url) => rawImages.push(url));

  const landingImageMatch =
    html.match(/id=["']landingImage["'][^>]*data-old-hires=["']([^"']+)["']/i) ||
    html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i) ||
    html.match(/id=["']imgBlkFront["'][^>]*data-old-hires=["']([^"']+)["']/i) ||
    html.match(/id=["']imgBlkFront["'][^>]*src=["']([^"']+)["']/i);
  if (landingImageMatch && landingImageMatch[1]) {
    rawImages.push(landingImageMatch[1]);
  }

  const cleanImages = [
    ...new Set(
      rawImages
        .filter(
          (u) =>
            u &&
            u.startsWith("http") &&
            !u.includes("sprite") &&
            !u.includes("transparent-pixel") &&
            !u.includes("play-button")
        )
        .map((u) => u.replace(/\._[A-Z0-9_,]+_\./i, "._SL1500_."))
    ),
  ];

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
    sellingPrice,
    mrp,
    description: description.trim(),
    specs,
    images: cleanImages,
    primaryImage: cleanImages[0] || null,
  };
}

function proxyImageRequest(imageUrl, clientRes, req, res, redirectHops = 5) {
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
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://www.amazon.in/",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      },
      (upstreamRes) => {
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
                const { html, finalUrl } = await robustFetchUrl(targetUrl);
                const product = extractAmazonProduct(html, targetUrl, finalUrl);

                // Validation: ensure we didn't get an empty dummy product
                if (!product.title || (product.title.startsWith("Amazon Product") && !product.sellingPrice)) {
                  throw new Error(
                    "Amazon restricted or returned incomplete product data for this URL. Please verify the URL/ASIN."
                  );
                }

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
