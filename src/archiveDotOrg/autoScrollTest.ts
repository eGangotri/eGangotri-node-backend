import puppeteer, {Page} from 'puppeteer';

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const scrollInterval = setInterval(() => {
        const container = document.querySelector('#content'); // Adjust the selector based on the website structure
        if (container) {
          container.scrollTop = container.scrollHeight;
        } else {
          window.scrollBy(0, window.innerHeight);
        }

        const loadMoreButton = document.querySelector('.load-more-button'); // Adjust the selector for the "Load More" button
        if (loadMoreButton) {
          loadMoreButton?.click();
        }

        const lastPage = document.querySelector('.pagination li:last-child a'); // Adjust the selector for the last page link
        if (lastPage && lastPage.textContent === 'Next') {
          clearInterval(scrollInterval);
          resolve();
        }
      }, 100);
    });
  });
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the target URL
  await page.goto('https://archive.org/details/@mumukshu_bhawan');

  // Scroll through pages
  for (let i = 0; i < 10; i++) {
    await autoScroll(page);
    console.log(`Scrolled to page ${i + 1}`);
    await page.waitForTimeout(1000); // Wait for some time to load content (adjust as needed)
  }

  // Capture a screenshot or perform other actions once scrolled to the end

  // Close the browser
 // await browser.close();
})();



