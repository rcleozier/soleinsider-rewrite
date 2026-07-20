const axios = require("axios");
const cheerio = require("cheerio");
const vm = require("vm");
const md5 = require("md5");
const querystring = require("querystring");

const SOURCE_URL = "https://supdrops.com/";
const INGEST_URL =
  process.env.SOLEINSIDER_INGEST_URL || "http://localhost:3000/public/ingest/saveRelease";
const MAX_ITEMS = 10;

exports.run = async function () {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const stripQuery = (url = "") => url.split("?")[0].split("#")[0];
  const isWebpImage = (imageUrl = "") =>
    /\.webp(?:$|\?)/i.test(imageUrl) || /[?&]format=webp(?:&|$)/i.test(imageUrl) || /\/f_webp[\/,]/i.test(imageUrl);
  const parsePrice = (value) => {
    if (value === null || value === undefined) return "0.00";
    const n = Number(String(value).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n)) return "0.00";
    return n.toFixed(2);
  };
  const parseYyyymmdd = (yyyymmdd = "") => {
    if (!/^\d{8}$/.test(yyyymmdd)) return new Date().toISOString().slice(0, 10);
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
  };

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
    console.log("🚀 Starting Supdrops scraper...");
    const response = await axios.get(SOURCE_URL, { timeout: 45000 });
    const $ = cheerio.load(response.data);

    const weeks = [];
    $("a[href^='/s/']").each((_, el) => {
      const href = $(el).attr("href");
      const label = $(el).text().replace(/\s+/g, " ").trim();
      if (!href || !label) return;
      if (!/Week\s+\d+/i.test(label)) return;
      const url = `https://supdrops.com${href}?l=us`;

      const datePart = href.match(/\/s\/(\d{8})/);
      const date = datePart ? `${datePart[1].slice(0, 4)}-${datePart[1].slice(4, 6)}-${datePart[1].slice(6, 8)}` : "";

      weeks.push({ url, label, date });
    });

    const uniqueWeeks = Array.from(new Map(weeks.map((w) => [w.url, w])).values()).slice(0, 6);
    console.log(`🔗 Found ${uniqueWeeks.length} Supdrops week links`);

    let posted = 0;
    let reachedCap = false;
    for (const week of uniqueWeeks) {
      if (reachedCap) break;
      try {
        const weekResponse = await axios.get(week.url, { timeout: 45000 });
        const scriptMatch = weekResponse.data.match(/window\.__NUXT__=(.*?);<\/script>/s);
        if (!scriptMatch || !scriptMatch[1]) {
          console.log(`⚠️ Could not parse __NUXT__ payload for ${week.url}`);
          continue;
        }

        const sandbox = { window: {} };
        vm.runInNewContext(`window.__NUXT__=${scriptMatch[1]};`, sandbox, { timeout: 3000 });
        const nuxt = sandbox?.window?.__NUXT__;
        const fetchObj = nuxt?.fetch || {};
        const fetchEntry = Object.values(fetchObj).find(
          (entry) => entry && entry.droplists && Array.isArray(entry.droplists.items)
        );
        const items = fetchEntry?.droplists?.items || [];
        console.log(`🧩 ${week.label}: found ${items.length} product items`);

        for (const item of items) {
          if (posted >= MAX_ITEMS) {
            reachedCap = true;
            console.log(`🛑 Reached Supdrops cap (${MAX_ITEMS} items).`);
            break;
          }
          const baseDate = item.baseReleaseDate || week.date?.replace(/-/g, "") || "";
          const releaseUrl = `https://supdrops.com/s/${baseDate}/${item.itemId}`;
          const imagePath = item.thumbnail || "";
          const imageUrl = imagePath ? stripQuery(`https://supdrops.com${imagePath}`) : "";

          const release = {
            url: releaseUrl,
            color: item.colors || "",
            price: parsePrice(item.price),
            content: `Supdrops ${week.label} - ${item.categoryName || "Supreme"}`,
            sku: item.itemId || "",
            releaseDate: parseYyyymmdd(baseDate),
            hash: md5(releaseUrl),
            images: imageUrl,
            type: "streetwear",
            title: item.name || `Supdrops ${week.label}`,
          };

          if (!release.title || !release.url) continue;
          if (release.images && isWebpImage(release.images)) {
            console.log(`⏭️ Skipping Supdrops release with webp image: ${release.url}`);
            continue;
          }

          console.log("Release payload before POST:", release);
          await sendRequest(release);
          posted += 1;
          await delay(120);
        }
      } catch (error) {
        console.error(`❌ Failed parsing week ${week.url}:`, error.message);
      }
    }

    console.log(`🎉 Supdrops scraper completed. Posted: ${posted}`);
  } catch (error) {
    console.error("❌ Supdrops scraper failed:", error.message);
    throw error;
  }
};

module.exports = exports;
