/* eslint-disable */
const cheerio = require("cheerio");
const axios = require("axios");
const md5 = require("md5");
const querystring = require("querystring");
const { launchBrowser } = require("./browser");
const { logSaveResult } = require("./logSaveResult");

// Test mode flag - set to true to log payloads without sending to server
const TEST_MODE = false; // Change to true for dry-run logging only

exports.run = function () {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    const grab = async () => {
    try {
      console.log("🚀 Starting Nice Kicks scraper with pagination...");
      // Single-URL dry run support via env var
      if (process.env.NICEKICKS_SINGLE_URL) {
        const singleUrl = process.env.NICEKICKS_SINGLE_URL;
        console.log(`🧪 Dry run for single URL: ${singleUrl}`);
        const browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        const release = await getReleaseDetails(singleUrl, '', page);
        if (release) {
          await sendRequest(release);
        } else {
          console.log('❌ Could not extract release for single URL');
        }
        await browser.close();
        return;
      }
      
      const BASE_URL = "https://www.nicekicks.com/sneaker-release-dates";
      const QUERY_PARAMS = "?nk=upcoming";
      let totalProcessedCount = 0;
      const MAX_PAGES = 5;
      
      // Launch Puppeteer once and reuse the page
      const browser = await launchBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      await page.setExtraHTTPHeaders({
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Upgrade-Insecure-Requests": "1",
        "Connection": "keep-alive"
      });
      
      for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        // Construct pagination URL directly
        let currentUrl;
        if (pageNum === 1) {
          currentUrl = `${BASE_URL}/${QUERY_PARAMS}`;
        } else {
          currentUrl = `${BASE_URL}/page/${pageNum}/${QUERY_PARAMS}`;
        }
        
        console.log(`\n📄 === PAGE ${pageNum}/${MAX_PAGES} ===`);
        console.log(`📡 Fetching: ${currentUrl}`);
        
        try {
          await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 45000 });
          await delay(1200);
          const listingHtml = await page.content();
          const $ = cheerio.load(listingHtml);
        console.log(`📄 Page ${pageNum} loaded successfully`);
        
        // Find sneaker links on current page
          const sneakerLinks = await findSneakerLinks($, currentUrl);
        
        if (sneakerLinks.length === 0) {
          console.log(`❌ No sneaker links found on page ${pageNum}. Stopping pagination.`);
          break;
        }
        
        console.log(`👟 Found ${sneakerLinks.length} sneaker links on page ${pageNum}`);
        
          // Process sneakers on current page (reuse browser)
          const pageProcessedCount = await processSneakers(sneakerLinks, pageNum, browser);
        totalProcessedCount += pageProcessedCount;
        
          // Check if there's actually content on this page (if we got 0 links, stop)
          if (pageProcessedCount === 0 && sneakerLinks.length === 0) {
            console.log(`📄 No content found on page ${pageNum}. Stopping pagination.`);
          break;
        }
        
          // Delay between pages
          if (pageNum < MAX_PAGES) {
          console.log(`⏭️  Moving to page ${pageNum + 1}...`);
            await delay(3000);
          }
        } catch (error) {
          console.error(`❌ Error loading page ${pageNum}:`, error.message);
          // If we can't load a page, stop pagination
          break;
        }
      }

      // Close browser
      await browser.close();

      console.log(`\n🎉 Nice Kicks scraper completed!`);
      console.log(`📊 Total sneakers processed across all pages: ${totalProcessedCount}`);
      
    } catch (error) {
      console.error("❌ Error in main grab function:", error.message);
    }
  };

  const findSneakerLinks = async ($, listingUrl) => {
    // Scope to main content area to avoid nav/footer links
    const $root = $('main, .site-main, #main, .content-area, .site-content, .entry-content').first();
    
    const isPostUrl = (href) => {
      if (!href) return false;
      // Exclude: tags, categories, anchors, external links (nike.com, adidas.com, etc.), pagination, home
      if (href.includes('/tag/') || href.includes('/category/') || href.includes('#') || 
          href.includes('/page/') || href === '/' || href === '/sneaker-release-dates' ||
          href.match(/^https?:\/\/(?!www\.nicekicks\.com)/)) return false;
      
      // Must be internal Nice Kicks URL
      if (!(href.startsWith('/') || href.startsWith('https://www.nicekicks.com'))) return false;
      
      const path = href.replace('https://www.nicekicks.com', '').split('?')[0].split('#')[0];
      
      // Allow article URLs that contain 'release-dates' but are actual articles (not listing pages)
      // Pattern: /sneaker-release-dates/article-slug/ 
      if (path.includes('/sneaker-release-dates/') && 
          path !== '/sneaker-release-dates' && 
          path !== '/sneaker-release-dates/' && 
          !path.includes('/sneaker-release-dates/page/') &&
          path.match(/\/sneaker-release-dates\/[^\/]+\/?$/)) {
        return true;
      }
      
      // Also allow other article patterns (without release-dates in path)
      // Pattern: /article-slug/ or /category/article-slug/
      const hasStyle = /-[A-Z]{1,3}[0-9]{3,6}-[0-9]{2,4}\/?.*$/i.test(path) || /-\d{6}-\d{3}\/?.*$/i.test(path);
      const looksLikePost = /^\/[^\/]+\/?$/.test(path) || /^\/[^\/]+\/[^\/]+\/?$/.test(path);
      
      // Exclude if it's clearly a listing or category page. NiceKicks has a
      // "*-release-dates" listing for every brand/model (sneaker-, jordan-,
      // nike-kobe-, nike-dunk-, ...) — match the pattern generally rather than
      // enumerating each one, since a missed slug gets scraped as a fake
      // "product" (title = the listing's own H1, no date/price/image).
      if (path.match(/^\/[a-z0-9-]*release-dates(\/page\/|\/)?$/)) {
        return false;
      }
      
      return hasStyle || looksLikePost;
    };

    // Extract release date from card text - ONLY from the "Release Date:" label value
    const extractReleaseDateFromCard = ($card) => {
      // Get all text nodes and look for "Release Date:" followed by a date
      const cardText = $card.text();
      // Match "Release Date:" followed by optional colon/space and then "Month Day, Year"
      const match = cardText.match(/Release\s*Date\s*:?\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
      if (match && match[1]) {
        return match[1].trim();
      }
      return '';
    };

    const sneakerLinks = [];
    
    // Strategy: Find all article links first, then find their parent cards
    // Also check if headings are links or contain links
    const allLinks = $root.find('a');
    console.log(`📊 Total links found in root: ${allLinks.length}`);
    
    const allArticleLinks = allLinks.filter((i, a) => {
      const href = $(a).attr('href');
      if (!href) return false;
      const isValid = isPostUrl(href);
      if (isValid) {
        console.log(`  ✅ Valid article link: ${href.substring(0, 80)}`);
      }
      return isValid;
    });

    console.log(`📊 Found ${allArticleLinks.length} potential article links`);
    
    // If no article links found, try a different approach - look for cards with release info
    if (allArticleLinks.length === 0) {
      console.log(`⚠️  No article links found with current pattern. Trying alternative approach...`);
      // Look for any cards that have release date info and might contain article links
      const cardsWithDates = $root.find('article, .card, .post, .entry, section, div').filter((i, el) => {
        const $el = $(el);
        return /Release\s*Date|Style\s*#|Dec\d+|Jan\d+|Feb\d+|Mar\d+|Apr\d+|May\d+|Jun\d+|Jul\d+|Aug\d+|Sep\d+|Oct\d+|Nov\d+/i.test($el.text());
      });
      console.log(`📊 Found ${cardsWithDates.length} cards with date/release info`);
      
      // Log all links in these cards for debugging
      cardsWithDates.each((i, card) => {
        const $card = $(card);
        const links = $card.find('a');
        console.log(`  Card ${i + 1} has ${links.length} links:`);
        links.each((j, link) => {
          const href = $(link).attr('href');
          console.log(`    ${j + 1}. ${href ? href.substring(0, 100) : 'NO HREF'}`);
        });
      });
    }

    // For each article link, find its card container
    allArticleLinks.each((i, linkEl) => {
      const $link = $(linkEl);
      const href = $link.attr('href');
      if (!href) return;
      
      // Find the card container - look for parent that has release date info
      let $card = $link.parent();
      let foundCard = false;
      
      // Walk up the DOM to find a container with release date info
      for (let depth = 0; depth < 5 && $card.length > 0; depth++) {
        const cardText = $card.text();
        // Check if this container has release date info
        if (/Release\s*Date/i.test(cardText) || /Style\s*#/i.test(cardText) || /\$\d+/i.test(cardText)) {
          foundCard = true;
          break;
        }
        $card = $card.parent();
      }
      
      // If we didn't find a good container, use the link's immediate parent
      if (!foundCard) {
        $card = $link.parent();
      }

      const fullUrl = href.startsWith('http') ? href : `https://www.nicekicks.com${href}`;
          
      // Get title from heading in card or link text
      let title = $card.find('h1, h2, h3, h4, .entry-title').first().text().trim();
      if (!title || title.length < 6) {
        title = $link.text().trim();
      }
      // Also try to get title from nearby text
      if (!title || title.length < 6) {
        const cardText = $card.text();
        const lines = cardText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
        for (const line of lines) {
          // Skip if it's a date, price, or style code
          if (!/Release\s*Date|Style\s*#|Price|\$\d+|Dec\d+|Jan\d+|Feb\d+|Mar\d+|Apr\d+|May\d+|Jun\d+|Jul\d+|Aug\d+|Sep\d+|Oct\d+|Nov\d+/i.test(line)) {
            title = line;
            break;
          }
        }
      }
      if (!title || title.length < 6) return;

      // Extract release date ONLY from this card's text using the precise label
      const listingReleaseDate = extractReleaseDateFromCard($card);
      
      if (listingReleaseDate) {
        console.log(`  ✅ Link ${i + 1}: "${title.substring(0, 40)}..." → Release Date: ${listingReleaseDate}`);
      } else {
        console.log(`  ⚠️  Link ${i + 1}: "${title.substring(0, 40)}..." → No Release Date found in card`);
        }
        
        sneakerLinks.push({
        href: fullUrl,
          text: title.substring(0, 50),
        fullText: title.replace(/\s+/g, ' ').trim(),
        hasImage: $card.find('img').length > 0,
        releaseDate: listingReleaseDate
        });
    });

    // Deduplicate by href while preserving order
    const seen = new Set();
    const unique = sneakerLinks.filter(x => {
      if (seen.has(x.href)) return false;
      seen.add(x.href);
      return true;
    });
    
    console.log(`📊 Final unique links: ${unique.length}`);
    unique.forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link.fullText.substring(0, 50)}... → ${link.releaseDate || 'NO DATE'}`);
    });
    
    return unique;
  };

  const processSneakers = async (sneakerLinks, pageNum, browser) => {
    let processedCount = 0;
    const MAX_PROCESSING_PER_PAGE = Math.min(sneakerLinks.length, 15);

    console.log(`\n🔄 Processing up to ${MAX_PROCESSING_PER_PAGE} sneakers on page ${pageNum}...\n`);

    // Create and reuse a single detail page
    const detailPage = await browser.newPage();
    await detailPage.setViewport({ width: 1280, height: 800 });
    await detailPage.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await detailPage.setExtraHTTPHeaders({
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Upgrade-Insecure-Requests": "1",
      "Connection": "keep-alive"
    });

    for (let i = 0; i < MAX_PROCESSING_PER_PAGE; i++) {
      try {
        const sneakerLink = sneakerLinks[i];
        const title = sneakerLink.fullText;
        const href = sneakerLink.href;
        
        // Make sure we have a full URL
        const fullUrl = href.startsWith("http") ? href : `https://www.nicekicks.com${href}`;
        
        console.log(`\n📝 [Page ${pageNum}] Processing ${i + 1}/${MAX_PROCESSING_PER_PAGE}: ${title.substring(0, 50)}...`);
        // Get detailed release information from individual page
        const releaseInfo = await getReleaseDetails(fullUrl, title, detailPage, sneakerLink);

        if (releaseInfo && releaseInfo.title) {
          // Send to SoleInsider
          try {
            const saveResponse = await sendRequest(releaseInfo);
            logSaveResult(releaseInfo.title, saveResponse, {
              testMode: saveResponse?.statusText === "OK (TEST MODE)",
            });

            processedCount++;
          } catch (error) {
            // sendRequest already logged a one-liner for this failure.
          }
        } else {
          console.log(`⚠️  Skipping: Could not extract release info`);
        }

        await delay(2000); // Respectful delay between requests
        
      } catch (error) {
        console.error(`❌ Error processing sneaker ${i + 1} on page ${pageNum}:`, error.message);
        continue;
      }
    }

    await detailPage.close();
    console.log(`📊 Page ${pageNum} completed: ${processedCount} sneakers processed`);
    return processedCount;
  };

  // Extract a clean SKU token from arbitrary text
  const extractSkuFromText = (text) => {
    if (!text) return "";
    const upper = String(text).toUpperCase();
    // Prefer pattern with hyphen followed by 2–4 digits (e.g., IB2267-001, HV9923-700)
    const m1 = upper.match(/[A-Z]{1,3}\d{3,6}-\d{2,4}/);
    if (m1) return m1[0];
    // Otherwise fall back to alphanumeric token 5–15 chars containing a digit (e.g., U9060NVP)
    const m2 = upper.match(/\b(?=[A-Z0-9-]*\d)[A-Z0-9-]{5,15}\b/);
    return m2 ? m2[0] : "";
  };

  const getReleaseDetails = async (url, fallbackTitle = "", page, listingData = {}) => {
    try {
      console.log(`  🔍 Fetching details from: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      await delay(1000);
      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract release information
      const release = {
        url: url,
        color: "",
        price: "",
        content: "",
        sku: "",
        releaseDate: "",
        hash: "",
        images: "",
        type: "sneakers",
        title: ""
      };

             // Use the title we already captured from the main listing page
       let rawTitle = fallbackTitle;
      
      if (rawTitle) {
        // Clean up the title
        rawTitle = rawTitle.replace(/^(?:Release|Sneaker|Shoe)\s*[:|-]?\s*/i, '');
        rawTitle = rawTitle.replace(/\s+/g, ' ').trim();
        
        // Remove common suffixes
        rawTitle = rawTitle.replace(/\s*[-|]\s*(?:Release|Date|Info|Details|Nice Kicks).*$/i, '');
        
        // Truncate if too long
        if (rawTitle.length > 80) {
          rawTitle = rawTitle.substring(0, 80).replace(/\s+\w*$/, '') + '...';
        }
      }
      
      release.title = rawTitle;

      // Get release date - ONLY use listing card date, never overwrite it
      let releaseDate = listingData.releaseDate || "";
      
      // ONLY try to extract from detail page if we don't have a date from the listing card
      if (!releaseDate) {
        console.log(`  ⚠️  No listing date found, attempting to extract from detail page...`);
        
        // Method 1: Look for "Release Date:" label in strong/bold text
         $("strong, b").each((i, el) => {
           const text = $(el).text().trim();
           if (text.toLowerCase().includes("release date")) {
             const parent = $(el).parent();
            const parentText = parent.text().replace(/\s+/g, ' ');
            const m = parentText.match(/release date:?\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
            if (m) {
              releaseDate = m[1];
             return false; // break
            }
           }
         });
      
        // Fallback: search for labeled "Release Date:" anywhere on page
      if (!releaseDate) {
          const bodyText = $("body").text().replace(/\s+/g, ' ');
          const labeled = bodyText.match(/release date:?\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
          if (labeled) releaseDate = labeled[1];
        }
      } else {
        console.log(`  ✅ Using release date from listing card: ${releaseDate}`);
      }
      
      release.releaseDate = releaseDate;

      // Get price - try multiple approaches
      let price = "";
      const priceSelectors = [
        ".price", ".msrp", "[class*='price']", ".cost", ".retail", ".product-price"
      ];
      
      for (const selector of priceSelectors) {
        const priceElement = $(selector);
        if (priceElement.length > 0) {
          const priceText = priceElement.first().text().trim();
          const priceMatch = priceText.match(/\$[\d,]+(?:\.\d{2})?/);
          if (priceMatch) {
            price = priceMatch[0].replace("$", "").replace(",", "");
            break;
          }
        }
      }
      
      // Try to find price in content if not found
      if (!price) {
        const bodyText = $("body").text();
        const pricePattern = /(?:MSRP|Price|Retail)[\s:]*\$(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/i;
        const priceMatch = bodyText.match(pricePattern);
        if (priceMatch) {
          price = priceMatch[1].replace(",", "");
        }
      }
      
      // Normalize price to two decimals if numeric
      if (price) {
        const priceNum = parseFloat(price);
        if (!isNaN(priceNum)) {
          price = priceNum.toFixed(2);
        }
      }
      release.price = price;

      // Get SKU/style code
      const skuSelectors = [
        ".sku", ".style-code", "[class*='sku']", "[class*='code']", ".model", ".product-code"
      ];
      
      for (const selector of skuSelectors) {
        const skuElement = $(selector);
        if (skuElement.length > 0) {
          const raw = skuElement.first().text().trim();
          const cleaned = extractSkuFromText(raw);
          if (cleaned) release.sku = cleaned;
          break;
        }
      }
      
             // Nice Kicks specific: Look for "Style #:" in strong/bold text
       if (!release.sku) {
         $("strong, b").each((i, el) => {
           const text = $(el).text().trim();
           if (text.toLowerCase().includes("style")) {
             const parent = $(el).parent();
            const raw = parent.text();
            const m = raw.match(/style\s*#?:?\s*([A-Z0-9-]{5,15})/i);
            if (m) {
              const cleaned = extractSkuFromText(m[1]);
              if (cleaned) release.sku = cleaned;
            }
             return false; // break
           }
         });
       }
       
       // Try to find SKU in content
       if (!release.sku) {
         const bodyText = $("body").text();
        const skuPattern = /(?:SKU|Style Code|Model)[\s:]*([A-Z0-9-]{5,15})/i;
         const skuMatch = bodyText.match(skuPattern);
         if (skuMatch) {
          const cleaned = extractSkuFromText(skuMatch[1]);
          if (cleaned) release.sku = cleaned;
        } else {
          const cleaned = extractSkuFromText(bodyText);
          if (cleaned) release.sku = cleaned;
         }
       }

             // Get color information - Nice Kicks specific
      // Leave color empty as requested
      release.color = "";

             // Skip content/description extraction - not working correctly
       release.content = "";

      // Get images - focus on product images
      const imageElements = $("img");
      let images = "";
      let imageCount = 0;
      
      imageElements.each((index, element) => {
        let src = $(element).attr("src");
        if (src && 
            !src.includes("avatar") && 
            !src.includes("logo") && 
            !src.includes("icon") &&
            !src.includes("placeholder") &&
            (src.includes("nicekicks") || src.includes("wp-content") || src.includes("uploads") || src.startsWith("http")) &&
            imageCount < 3) { // Limit to 3 images
          // Clean WordPress-sized image URLs (remove -800x600 suffixes) and query params
          src = cleanNiceKicksImageUrl(src);
          if (images) images += ",";
          images += src;
          imageCount++;
        }
      });
      
      release.images = images;

      // Generate hash for deduplication
      release.hash = md5(url);

      // Validate required fields
      if (!release.title) {
        console.log(`    ❌ No title found`);
        return null;
      }

      return release;

    } catch (error) {
      console.error(`    ❌ Error getting release details:`, error.message);
      return null;
    }
  };

  const sendRequest = async (release) => {
    try {
      // Build KicksOnFire-compatible payload only
      const payload = {
        title: release.title,
        url: release.url,
        color: release.color,
        price: release.price,
        content: release.content,
        sku: release.sku,
        releaseDate: release.releaseDate,
        hash: release.hash,
        images: release.images,
        type: release.type
      };

      if (TEST_MODE || process.env.NK_TEST_MODE === '1') {
        return { status: 200, statusText: 'OK (TEST MODE)' };
      }

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(process.env.CRAWLER_INGEST_SECRET
          ? { "x-cron-secret": process.env.CRAWLER_INGEST_SECRET }
          : {}),
      },
      timeout: 30000
    };

      const postUrl =
        process.env.SOLEINSIDER_INGEST_URL || "http://localhost:3000/public/ingest/saveRelease";
      const formBody = querystring.stringify(payload);

      return await axios.post(postUrl, formBody, config);
    } catch (err) {
      console.log(`❌ ${release.title} — request failed: ${err.message}`);
      throw err;
    }
  };

  // Clean NiceKicks image URLs (remove size suffixes and query/hash)
  const cleanNiceKicksImageUrl = (imageUrl) => {
    try {
      let clean = imageUrl.split('?')[0].split('#')[0];
      // Remove WordPress size suffixes like -768x512 before the extension
      clean = clean.replace(/-\d+x\d+(?=\.[a-zA-Z]{3,4}$)/, '');
      return clean;
    } catch (_) {
      return imageUrl;
    }
  };

  grab();
};

module.exports = exports;
