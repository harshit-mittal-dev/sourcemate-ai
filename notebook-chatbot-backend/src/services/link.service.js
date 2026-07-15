const dns = require("dns").promises;
const net = require("net");

const ApiError = require("../utils/ApiError");
const { cleanText } = require("./chunk.service");

function isPrivateIp(ip) {
  if (!net.isIP(ip)) return true;

  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("192.168.")) return true;

  const parts = ip.split(".").map(Number);

  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }

  return false;
}

async function validatePublicUrl(rawUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch (error) {
    throw new ApiError(400, "Invalid URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new ApiError(400, "Only HTTP and HTTPS links are allowed.");
  }

  const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0"];

  if (blockedHosts.includes(parsedUrl.hostname.toLowerCase())) {
    throw new ApiError(400, "Local/private links are not allowed.");
  }

  const addresses = await dns.lookup(parsedUrl.hostname, { all: true });

  if (addresses.some((address) => isPrivateIp(address.address))) {
    throw new ApiError(400, "Private network links are not allowed.");
  }

  return parsedUrl.toString();
}

function stripHtmlToText(html) {
  return cleanText(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  );
}

function extractTitleFromHtml(html, fallbackUrl) {
  const titleMatch = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (titleMatch && titleMatch[1]) {
    return cleanText(stripHtmlToText(titleMatch[1])).slice(0, 120);
  }

  return fallbackUrl;
}

async function extractTextFromLink(rawUrl) {
  const safeUrl = await validatePublicUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(safeUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "SourceMateAI/1.0",
        Accept: "text/html,text/plain",
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, "Could not fetch this link.");
    }

    const contentType = response.headers.get("content-type") || "";
    const contentLength = Number(response.headers.get("content-length") || 0);

    if (contentLength > 2 * 1024 * 1024) {
      throw new ApiError(413, "Link content is too large.");
    }

    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain")
    ) {
      throw new ApiError(400, "Only readable web pages are supported for links.");
    }

    const rawBody = await response.text();

    const text = contentType.includes("text/html")
      ? stripHtmlToText(rawBody)
      : cleanText(rawBody);

    if (!text) {
      throw new ApiError(422, "No readable text found from this link.");
    }

    return {
      url: safeUrl,
      title: contentType.includes("text/html")
        ? extractTitleFromHtml(rawBody, safeUrl)
        : safeUrl,
      text,
      pageCount: 1,
      pages: [
        {
          pageNumber: 1,
          text,
        },
      ],
      meta: {
        contentType,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  extractTextFromLink,
};