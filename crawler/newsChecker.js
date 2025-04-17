const puppeteer = require("puppeteer");

async function checkNewPosts(type = "Notice") {
    const url = `https://mabinogimobile.nexon.com/News/${type}`;
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    const data = await page.evaluate(() => {
        const firstItem = document.querySelector("li.item");
        if (!firstItem) return null;

        const titleSpan = firstItem.querySelector("a[data-boardactionpath] span");
        const title = titleSpan?.innerText.trim();

        const href = firstItem.querySelector("a")?.getAttribute("onclick") || "";
        const match = href.match(/link\((\d+)/);
        const id = match ? match[1] : null;

        return { title, id };
    });

    if (!data || !data.id) {
        await browser.close();
        return null;
    }

    const postUrl = `https://mabinogimobile.nexon.com/News/${type}/${data.id}`;
    await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 0 });

    const text = await page.evaluate(() => {
        const nodes = document.querySelectorAll(
            ".news.board_view.container .view_body_wrap .content_area .content p > span > span > span"
        );

        const results = [];
        const seen = new Set();

        nodes.forEach(node => {
            let current = node;
            let style = "";

            while (current && current.nodeName === "SPAN") {
                style += current.getAttribute("style") || "";
                current = current.parentElement;
            }

            let content = node.textContent.replace(/\s+/g, " ").trim();
            if (!content || seen.has(content)) return;
            seen.add(content);

            if (style.includes("font-size:18px")) {
                content = `\n\n▶__**${content}**__`;
            }

            if (/^[■◼✔]/.test(content)) {
                content = `\n${content}`;
            }

            results.push(content);
        });

        return results.join("\n");
    });

    return {
        title: data.title,
        id: data.id,
        link: postUrl,
        text: text || "내용 없음"
    };
}

module.exports = { checkNewPosts };
