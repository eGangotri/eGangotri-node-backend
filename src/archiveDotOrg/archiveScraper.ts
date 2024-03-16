import puppeteer, { Page } from 'puppeteer';
import { utils, writeFile } from 'xlsx';
import os from 'os';

export const ARCHIVE_EXCEL_PATH = `${os.homedir()}\\Downloads`;
const ARCHIVE_DOT_ORG = "https://archive.org";
interface LinkData {
  link: string;
  title: string;
  acct?: string;
}

const extractLinkData = async (page: Page): Promise<LinkData[]> => {
  // >>> is piercing of ShadowRoot
  const hrefs = await page.$$eval(
    ">>> #container a[href]",
    els => els.map(e => {
      return {
        link: e.getAttribute("href"),
        title: e.getAttribute("aria-label"),
      }
    })
  );

  console.log(`hrefs ${JSON.stringify(hrefs)}`);
  return hrefs

}

async function scrapeLinks(url: string): Promise<LinkData[]> {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle0"
  });

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
  try {
    const browser = await puppeteer.launch({
      headless: "new"
    });

    const page = await browser.newPage();

    await page.goto(MAIN_URL, {
      waitUntil: "networkidle0"
    });

    console.log(`MAIN_URL page.goto ${MAIN_URL}`);
    //Shadow-root issue
    //https://stackoverflow.com/questions/68525115/puppeteer-not-giving-accurate-html-code-for-page-with-shadow-roots
    const resultsCount = await page.$$eval(
      ">>> span#big-results-count",
      els => els.map(e => e.textContent.trim())
    );

    console.log(`resultsCount ${resultsCount}`);

    archiveItemCount = (resultsCount && resultsCount.length > 0) ? (parseInt(resultsCount[0]?.trim().split(/\s.*/g)[0].replace(",", "")) || 0) : 0;
    await browser.close();
    console.log(`resCount ${archiveItemCount}`);
    setScrollablePageCount();
    return archiveItemCount;
  }
  catch (err) {
    console.log(`Error in setArchiveItemCountAndScrollablePageCount ${err}`);
    return 0;
  }

}

async function generateExcel(links: LinkData[], excelFileName: string): Promise<string> {
  const _archiveAcctName = archiveAcctName();
  const worksheet = utils.json_to_sheet(links.map((link, index) => (
    { "Serial No.": index, 'Link': `${ARCHIVE_DOT_ORG}${link.link}`, 'Title': link.title, 'Acct': _archiveAcctName })),
    { header: ["Serial No.", "Link", "Title", "Acct"] });

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Links");
  const excelPath = `${ARCHIVE_EXCEL_PATH}\\${excelFileName}.xlsx`
  console.log(`Writing to ${excelPath}`);
  await writeFile(workbook, excelPath);
  return excelPath;
}

export const scrapeArchive = async (archiveUrl: string, onlyLinks: boolean = false): Promise<any> => {
  MAIN_URL = archiveUrl;
  console.log(`MAIN_URL ${MAIN_URL}`);
  console.log(`archiveUrl ${archiveUrl}`);
  await setArchiveItemCountAndScrollablePageCount();

  const links: LinkData[] = []
  for (let i = 0; i < scrollablePageCount; i++) {
    const _link = await scrapeLinks(`${MAIN_URL}?&sort=-publicdate&page=${i + 1}`);
    links.push(..._link);
  }

  const excelFileName = `${archiveAcctName()}(${archiveItemCount})`;
  if (onlyLinks) {
    return {
      archiveItemCount,
      scrollablePageCount,
      links,
      excelFileName
    }
  }
  else {
    const excelPath = `${ARCHIVE_EXCEL_PATH}\\${excelFileName}.xlsx`

    //not using await so that the response is sent back immediately
    await generateExcel(links, excelFileName);
    return {
      excelPath,
      excelFileName,
      archiveItemCount,
      scrollablePageCount,
      links
    }
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

// (async () => {
//   scrapeArchive("https://archive.org/details/@drnaithani");
// })();


//yarn run scraper
