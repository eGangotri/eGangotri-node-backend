import puppeteer, { Page } from 'puppeteer';
import { utils, writeFile } from 'xlsx';

interface LinkData {
  link: string;
  title: string;
}

const extractLinkData = async (page: Page): Promise<LinkData[]> => {
  return page.$$eval('a', (links) => {
    return links
      .map((link) => {
        const ttlElement = link.querySelector('.ttl');
        const textContent = ttlElement?.textContent?.trim() || ''
        if (textContent && textContent.length > 0) {
          return {
            link: link.href,
            title: textContent
          };
        }
      })
      .filter(Boolean) as LinkData[];
  });
}

async function scrapeLinks(url: string): Promise<LinkData[]> {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url);

  const links = await extractLinkData(page);
  await browser.close();

  return links;
}

const archiveAcctName = () => {
  const parts = MAIN_URL.split('@');
  const portionAfterAt = parts[1];
  return portionAfterAt;
}

async function setArchiveItemCountAndScrollablePageCount() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(MAIN_URL);
  const resCountDivVal = await page.$eval('.results_count', element => element.textContent);
  archiveItemCount = parseInt(resCountDivVal?.trim().split(/\s.*/g)[0].replace(",", "")) || 0;
  await browser.close();
  console.log(`resCount ${archiveItemCount}`);
  setScrollablePageCount();
  return archiveItemCount;
}

async function generateExcel(links: LinkData[]): Promise<string> {
  const worksheet = utils.json_to_sheet(links.map(link => (
    { 'Link': link.link, 'Title': link.title })),
    { header: ["Link", "Title"] });

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Links");
  const excelFileName = `${archiveAcctName()}(${archiveItemCount})`;
  const excelPath = `C:\\Users\\chetan\\Downloads\\${excelFileName}.xlsx`
  console.log(`Writing to ${excelPath}`);
  await writeFile(workbook, excelPath);
  return excelPath;
}

export const scrapeArchive = async (archiveUrl: string): Promise<any> => {
  MAIN_URL = archiveUrl;
  await setArchiveItemCountAndScrollablePageCount();

  const links: LinkData[] = []
  for (let i = 0; i < scrollablePageCount; i++) {
    const _link = await scrapeLinks(`${MAIN_URL}?&sort=-publicdate&page=${i + 1}`);
    links.push(..._link);
  }
  const excelPath = await generateExcel(links);
  return {
    excelPath,
    archiveItemCount,
    scrollablePageCount,
    links
  }
}

const setScrollablePageCount = () => {
  scrollablePageCount = Math.ceil(archiveItemCount / 100);
  console.log(`pageCount ${scrollablePageCount}`);
  return scrollablePageCount;
}


let archiveItemCount = 0;
let scrollablePageCount = 0;
let MAIN_URL = "";

(async () => {
  scrapeArchive("https://archive.org/details/@egangotri_books");
})();


//yarn run scraper
