/**
 * Browser-based autoresearch for Alba
 * Scrapes top URLs from search results for deeper context
 */

const puppeteer = require('puppeteer');

class BrowserResearch {
  constructor() {
    this.timeout = 10000; // 10 seconds per page
  }

  /**
   * Research URLs by scraping their content
   * @param {string} query - Original search query
   * @param {Array<string>} urls - URLs to scrape
   * @returns {Promise<Array>} Scraped content
   */
  async research(query, urls) {
    if (!urls || urls.length === 0) {
      return [];
    }

    console.log(`[BrowserResearch] Scraping ${urls.length} URLs for: "${query}"`);
    
    let browser;
    const results = [];

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Scrape top 3 URLs max
      for (const url of urls.slice(0, 3)) {
        try {
          const content = await this.scrapePage(browser, url);
          results.push({
            url,
            content,
            length: content.length,
            timestamp: Date.now()
          });
          console.log(`[BrowserResearch] ✓ ${url} (${content.length} chars)`);
        } catch (err) {
          console.warn(`[BrowserResearch] ✗ ${url}: ${err.message}`);
        }
      }

      await browser.close();
    } catch (err) {
      console.error('[BrowserResearch] Error:', err.message);
      if (browser) {
        await browser.close().catch(() => {});
      }
    }

    return results;
  }

  /**
   * Scrape a single page
   * @private
   */
  async scrapePage(browser, url) {
    const page = await browser.newPage();
    
    try {
      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      );

      // Navigate with timeout
      await page.goto(url, {
        timeout: this.timeout,
        waitUntil: 'domcontentloaded'
      });

      // Extract main content
      const content = await page.evaluate(() => {
        // Try common content selectors
        const selectors = [
          'article',
          'main',
          '[role="main"]',
          '.content',
          '.post-content',
          '.article-content'
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            return element.innerText;
          }
        }

        // Fallback: body text
        return document.body.innerText;
      });

      await page.close();

      // Limit to 2000 chars
      return content.slice(0, 2000);
    } catch (err) {
      await page.close().catch(() => {});
      throw err;
    }
  }
}

module.exports = { BrowserResearch };
