const puppeteer = require('puppeteer');
import fs from 'fs';

(async event => {
    const link = 'https://203.88.139.46/ihg/tree_1/brwhtm/';

    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 100,
        devtools: true,
        ignoreHTTPSErrors: true
    });

    try {
        const page = await browser.newPage();

        await page.setViewport({ width: 1199, height: 900 });

        await page.goto(link);


        const hrefs: string[] = await getHrefs(page);

        for (let i = 0; i < hrefs.length; i++) {
            if (hrefs[i].startsWith(link) && !hrefs[i].includes("?")) {
                let href = hrefs[i];
                console.log(`href[${i}]: ${href}`);
                await page.goto(href);
                const subHrefs: string[] = await getHrefs(page);
                for(let j = 0; j < subHrefs.length; j++) {
                    if (subHrefs[j].startsWith(href) && !subHrefs[j].includes("?")) {
                        let subHref = subHrefs[j];
                        console.log(`subHref[${j}]: ${subHref}`);
                        if(subHref.endsWith('.txt')){
                            const splitArray =  subHref.split("/")
                            const folderName = splitArray[splitArray.length-2];
                            const fileName = splitArray[splitArray.length-1];
                            console.log(`folderName fileName ${folderName} ${fileName}`);
                            await page.goto(subHref);
                            const _content = await page.$eval('pre', el => el.innerText);
                            console.log(`_content ${_content}`)
                            fs.writeFile(`./downloads/${folderName}_${fileName}`, _content, 'utf8', function (err) {
                                if (err) return console.log(err);
                            });
                        }
                        else if(subHref.endsWith('.htm')){
                            const splitArray =  subHref.split("/")
                            const folderName = splitArray[splitArray.length-2];
                            const fileName = splitArray[splitArray.length-1];
                            console.log(`folderName fileName ${folderName} ${fileName}`);
                            await page.goto(subHref);
                            const _content = await page.content();
                            console.log(`_content ${_content}`)
                            fs.writeFile(`./downloads/${folderName}_${fileName}`, _content, 'utf8' ,function (err) {
                                if (err) return console.log(err);
                            });
                        }
                    }
                }
            }
        }

        await page.goto(hrefs[1], { waitUntil: 'domcontentloaded' });

        await page.screenshot({
            fullPage: true,
            path: 'new_image.png'
        });
        const screenshotPath = process.cwd() + '/new_image.png';

        console.log('URL of the page:', hrefs[1]);
        console.log('Location of the screenshot:', screenshotPath);

        await page.close();
        await browser.close();
    } catch (error) {
        console.log(error);
        await browser.close();
    }
})();

async function getHrefs(page: any) {
    return await page.$$eval('a', links => links.map(a => a.href));
}
