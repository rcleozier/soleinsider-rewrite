/* eslint-disable */
const cheerio = require("cheerio");
const axios = require("axios");
const md5 = require("md5");
const querystring = require("querystring");
const { launchBrowser } = require("./browser");
const { logSaveResult } = require("./logSaveResult");

exports.run = function (url) {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const BASE_URL = "https://www.kicksonfire.com";

  const extractInitialState = (html) => {
    const match = html.match(/window\.INITIAL_STATE\s*=\s*([\s\S]*?);\s*<\/script>/i);
    if (!match || !match[1]) return null;
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      return null;
    }
  };

  const firstNumber = (...values) => {
    for (const value of values) {
      if (value === null || value === undefined || value === "") continue;
      const num = Number(value);
      if (!Number.isNaN(num) && Number.isFinite(num)) return num;
    }
    return null;
  };

  const grab = async () => {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
      "Upgrade-Insecure-Requests": "1",
      Connection: "keep-alive",
    };

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders(headers);
    await page.goto(url, { waitUntil: "networkidle2", ignoreHTTPSErrors: true });

    const content = await page.content();
    let $ = cheerio.load(content);
    const initialState = extractInitialState(content);
    let releaseUrls = [];

    if (initialState?.releases?.items?.length) {
      releaseUrls = initialState.releases.items
        .map((item) => item?.slug)
        .filter(Boolean)
        .map((slug) => `${BASE_URL}/${slug}`);
    }

    if (releaseUrls.length === 0) {
      releaseUrls = $(".release-item")
        .map((_, el) => {
          const href = $(el).attr("href");
          return href ? `${BASE_URL}${href}` : null;
        })
        .get()
        .filter(Boolean);
    }

    let releaseInformation;

    console.log(`Found ${releaseUrls.length} release URLs`);

    for (let i = 0; i < releaseUrls.length; i++) {
      const releaseUrl = releaseUrls[i];
      if (!releaseUrl) {
        continue;
      }

      try {
        releaseInformation = await getReleaseInformation(releaseUrl, page);
      } catch (e) {
        console.log("Error", e);
        continue;
      }

      if (releaseInformation.price == 0) {
        releaseInformation.price = parseFloat(releaseInformation.price).toFixed(
          2
        );
      }

      try {
        if (
          releaseInformation.images.length > 0 &&
          releaseInformation.releaseDate.length > 6 &&
          !isNaN(releaseInformation.price)
        ) {
          const saveResponse = await sendRequest(releaseInformation);
          logSaveResult(releaseInformation.title, saveResponse);
        }
      } catch (error) {
        console.log(`❌ ${releaseInformation?.title || releaseUrl} — request failed: ${error.message}`);
      }

      await delay(500);
    }

    await browser.close();
  };

  const getReleaseInformation = async (url, page) => {
    const release = {
      url: "",
      color: "",
      price: "",
      content: "",
      sku: "",
      releaseDate: "",
      hash: "",
      images: [],
      type: "sneakers",
    };

    let images = "";
    let content = "";

    await page.goto(url, { waitUntil: "networkidle2", ignoreHTTPSErrors: true });

    content = await page.content();
    const $ = cheerio.load(content);
    const initialState = extractInitialState(content);
    const itemRoot = initialState?.release?.item || {};
    const item = itemRoot?.release || itemRoot;

    const currentSlug = (item.slug || url.split("/").pop() || "").toLowerCase();
    const primaryImages = [];
    const secondaryImages = [];
    const seenImages = new Set();

    const maybeAddImage = (src) => {
      if (!src || typeof src !== "string") return;
      if (src.includes("gravatar") || src.includes("blank&")) return;
      if (seenImages.has(src)) return;
      seenImages.add(src);

      if (currentSlug && src.toLowerCase().includes(currentSlug)) {
        primaryImages.push(src);
      } else {
        secondaryImages.push(src);
      }
    };

    if (item.image) maybeAddImage(item.image);
    if (item.master_image) maybeAddImage(item.master_image);
    if (item.thumb_image) maybeAddImage(item.thumb_image);
    if (Array.isArray(item.images)) {
      item.images.forEach((img) => {
        maybeAddImage(img?.ipad || img?.iphone || img?.url || img?.src);
      });
    }

    const imageElements = $(".image-gallery-image, .kof-release-gallery img");
    imageElements.each((index, element) => {
      maybeAddImage(element.attribs?.src);
      maybeAddImage(element.attribs?.["data-src"]);
    });

    const selectorDescription = $(".description, .kof-pdp-description, .release-description").first().html();
    content = selectorDescription || item.description || item.meta_description || "";

    const parsedPrice = firstNumber(
      item?.prices?.retail_price,
      item?.price,
      item?.product_prices?.retail_price,
      itemRoot?.price,
      itemRoot?.prices?.retail_price,
      itemRoot?.release?.price
    );
    const fallbackPriceText = $(".release-attr-value").eq(5).text();
    const fallbackPrice = fallbackPriceText ? firstNumber(fallbackPriceText.replace("$", "")) : null;

    release.color = item.style || $(".release-attr-value").eq(1).text();
    release.sku = item.style_code || $(".release-attr-value").eq(3).text();
    release.hash = md5(url);
    release.title = item.title || $(".product-wrapper h1, .kof-pdp-buy__title, h1").first().text().trim();
    release.releaseDate = item.event_date || $(".release-attr-value").eq(2).text();
    release.price =
      parsedPrice !== null
        ? Number(parsedPrice).toFixed(2)
        : fallbackPrice !== null
        ? Number(fallbackPrice).toFixed(2)
        : 0;

    // Keep payload small: prioritize this SKU's own images and cap total count.
    images = [...primaryImages, ...secondaryImages].slice(0, 4).join(",");
    release.images = images;
    release.url = url;
    release.content = content;

    return release;
  };

  const sendRequest = async (release) => {
    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(process.env.CRAWLER_INGEST_SECRET
          ? { "x-cron-secret": process.env.CRAWLER_INGEST_SECRET }
          : {}),
      },
    };

    return axios.post(
      process.env.SOLEINSIDER_INGEST_URL || "http://localhost:3000/public/ingest/saveRelease",
      querystring.stringify(release),
      config
    );
  };

  grab();
};

module.exports = exports;
