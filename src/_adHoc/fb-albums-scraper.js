const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // important for login
        userDataDir: "./fb-session", // saves login session
        defaultViewport: null
    });

    const page = await browser.newPage();

    // Step 1: Open Facebook albums page
    await page.goto(
        "https://www.facebook.com/eGangotrigranthanaam/photos_albums",
        { waitUntil: "networkidle2" }
    );

    console.log("👉 If not logged in, log in manually...");

    // Give time to login manually
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Step 2: Scroll to load all albums
    let previousHeight;
    while (true) {
        try {
            previousHeight = await page.evaluate("document.body.scrollHeight");
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
            await new Promise(resolve => setTimeout(resolve, 3000));

            const newHeight = await page.evaluate("document.body.scrollHeight");
            if (newHeight === previousHeight) break;
        } catch (e) {
            console.log("Navigation happened, waiting to retry scroll...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    // Step 3: Extract albums
    const albums = await page.evaluate(() => {
        const results = [];

        // Facebook uses role="link" divs instead of plain anchors
        const nodes = document.querySelectorAll('a[href*="/media/set/"], a[href*="/albums/"]');

        nodes.forEach(node => {
            let link = node.href;

            // Try multiple ways to get title
            let title =
                node.innerText ||
                node.querySelector("img")?.alt ||
                "";

            title = title.split('\n')[0].trim();

            if (title && (link.includes("/albums/") || link.includes("/media/set/"))) {
                // Normalize URL to prevent duplicates due to tracking params
                if (link.includes("/media/set/")) {
                    try {
                        const url = new URL(link);
                        const setId = url.searchParams.get("set");
                        if (setId) {
                            link = `https://www.facebook.com/media/set/?set=${setId}&type=3`;
                        }
                    } catch (e) {
                        // ignore invalid urls
                    }
                } else {
                    link = link.split("?")[0];
                }
                
                results.push({ title, link });
            }
        });

        // Remove duplicates
        const unique = {};
        results.forEach(a => {
            unique[a.link] = a.title;
        });

        return Object.entries(unique).map(([link, title]) => ({
            title,
            link
        }));
    });

    console.log(`✅ Found ${albums.length} albums`);

    // Step 4: Convert to CSV
    const csv = ["Title,Link"]
        .concat(albums.map(a => `"${a.title}","${a.link}"`))
        .join("\n");

    const outputPath = require("path").resolve("fb_albums.csv");
    fs.writeFileSync(outputPath, csv);

    console.log(`📁 CSV saved at ${outputPath}`);

    await browser.close();
})();