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

async function getResultsCount() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(MAIN_URL);
  const resCountDivVal = await page.$eval('.results_count', element => element.textContent);
  resCount = parseInt(resCountDivVal?.trim().split(/\s.*/g)[0].replace(",", "")) || 0;
  await browser.close();
  console.log(`resCount ${resCount}`);
  return resCount;
}

async function generateExcel(links: LinkData[]): Promise<void> {
  const worksheet = utils.json_to_sheet(links.map(link => ({ 'Link': link.link, 'Title': link.title })), { header: ["Link", "Title"] });
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Links");
  const excelFileName = `${archiveAcctName()}(${resCount})`;
  const excelPath = `C:\\Users\\chetan\\Downloads\\${excelFileName}.xlsx`
  console.log(`Writing to ${excelPath}`);
  writeFile(workbook, excelPath);
}

async function execute(): Promise<void> {
  const links: LinkData[] = []
  //https://archive.org/details/@mumukshu_bhawan?&sort=-publicdate&page=3
  for (let i = 0; i < pageCount; i++) {
    const _link = await scrapeLinks(`${MAIN_URL}?&sort=-publicdate&page=${i + 1}`);
    links.push(..._link);
  }
  await generateExcel(links);
  console.log('Done');
}

const getPageCount = () => {
  pageCount = Math.ceil(resCount / 100);
  console.log(`pageCount ${pageCount}`);
  return pageCount;
}

(async () => {
  await getResultsCount();
  getPageCount();
  execute();
})();

let resCount = 0;
let pageCount = 0;
const MAIN_URL = 'https://archive.org/details/@mumukshu_bhawan';

//yarn run scraper
