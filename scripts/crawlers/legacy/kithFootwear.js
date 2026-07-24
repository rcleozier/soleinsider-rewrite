/* eslint-disable */
const axios = require("axios");
const md5 = require("md5");
const querystring = require("querystring");
const { logSaveResult } = require("./logSaveResult");

// Kith's general Footwear collection — broader than kith-monday-program,
// covers every brand they stock (Nike, adidas, New Balance, ASICS, etc.),
// not just Kith-branded drops.
const SOURCE_URL = "https://kith.com/collections/footwear/products.json?limit=20";
const INGEST_URL =
  process.env.SOLEINSIDER_INGEST_URL || "http://localhost:3000/public/ingest/saveRelease";

exports.run = async function () {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const stripQuery = (url = "") => url.split("?")[0].split("#")[0];
  const isWebpImage = (imageUrl = "") =>
    /\.webp(?:$|\?)/i.test(imageUrl) || /[?&]format=webp(?:&|$)/i.test(imageUrl) || /\/f_webp[\/,]/i.test(imageUrl);

  const sendRequest = async (release) => {
    return axios.post(INGEST_URL, querystring.stringify(release), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(process.env.CRAWLER_INGEST_SECRET
          ? { "x-cron-secret": process.env.CRAWLER_INGEST_SECRET }
          : {}),
      },
    });
  };

  try {
    console.log("🚀 Starting Kith Footwear scraper...");
    const response = await axios.get(SOURCE_URL, { timeout: 45000 });
    const productsRaw = Array.isArray(response?.data?.products) ? response.data.products : [];
    const products = productsRaw
      .sort((a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0))
      .slice(0, 25);
    console.log(`🔗 Found ${productsRaw.length} Kith footwear products, processing latest ${products.length}`);

    let posted = 0;
    for (const product of products) {
      const url = `https://kith.com/products/${product.handle}`;
      const firstVariant = Array.isArray(product.variants) ? product.variants[0] : null;
      const image = Array.isArray(product.images) && product.images[0] ? stripQuery(product.images[0].src || "") : "";
      // published_at is when Shopify made the listing live, which lines up
      // with the actual public release/drop date for these products (unlike
      // created_at, which is often the date the listing was staged ahead of
      // release).
      const releaseDate = product.published_at
        ? new Date(product.published_at).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      const release = {
        url,
        color: "",
        price: Number(firstVariant?.price || 0).toFixed(2),
        content: product.body_html || "",
        sku: firstVariant?.sku || "",
        releaseDate,
        hash: md5(url),
        images: image,
        type: "sneakers",
        title: product.title || "",
      };

      if (!release.title) continue;
      if (release.images && isWebpImage(release.images)) {
        console.log(`⏭️ Skipping Kith footwear release with webp image: ${release.url}`);
        continue;
      }

      const response = await sendRequest(release);
      logSaveResult(release.title, response);
      posted += 1;
      await delay(120);
    }

    console.log(`🎉 Kith Footwear scraper completed. Posted: ${posted}`);
  } catch (error) {
    console.error("❌ Kith Footwear scraper failed:", error.message);
    throw error;
  }
};

module.exports = exports;
