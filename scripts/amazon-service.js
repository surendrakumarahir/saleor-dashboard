import http from "http";
import https from "https";
import { URL } from "url";
import { extractAmazonProduct } from "./amazonScraperPlugin.js";

const PORT = 9005;

function fetchUrl(targetUrl, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
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
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
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
          if (!redirectUrl.startsWith("http")) {
            redirectUrl = `${parsed.protocol}//${parsed.hostname}${redirectUrl}`;
          }
          return fetchUrl(redirectUrl, timeoutMs).then(resolve).catch(reject);
        }

        let data = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
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

  // POST /api/amazon-extract
  if (req.url === "/api/amazon-extract" && req.method === "POST") {
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
            const html = await fetchUrl(targetUrl);
            const product = extractAmazonProduct(html, targetUrl);
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
            success: true,
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
    return;
  }

  // GET /api/amazon-image-proxy?url=...
  if (req.url.startsWith("/api/amazon-image-proxy") && req.method === "GET") {
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
          },
        },
        (clientRes) => {
          res.statusCode = clientRes.statusCode || 200;
          if (clientRes.headers["content-type"]) {
            res.setHeader("Content-Type", clientRes.headers["content-type"]);
          }
          if (clientRes.headers["content-length"]) {
            res.setHeader("Content-Length", clientRes.headers["content-length"]);
          }
          clientRes.pipe(res);
        }
      );

      clientReq.on("error", (err) => {
        console.error("Proxy image error:", err);
        res.statusCode = 502;
        res.end("Error fetching image");
      });
    } catch (err) {
      res.statusCode = 400;
      res.end("Bad URL format");
    }
    return;
  }

  res.statusCode = 404;
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Amazon scraper service running at http://localhost:${PORT}`);
});
