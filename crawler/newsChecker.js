const axios = require("axios");
const cheerio = require("cheerio");

async function checkNewPosts(type = "Notice") {
    const listUrl = `https://mabinogimobile.nexon.com/News/${type}`;
    const { data: html } = await axios.get(listUrl);
    const $ = cheerio.load(html);

    const firstItem = $("li.item").first();
    const title = firstItem.find("a[data-boardactionpath] span").text().trim();
    const onclick = firstItem.find("a").attr("onclick") || "";
    const id = (onclick.match(/link\((\d+)\)/) || [])[1];

    if (!id) return null;

    const detailUrl = `https://mabinogimobile.nexon.com/News/${type}/${id}`;
    const { data: detailHtml } = await axios.get(detailUrl);
    const $$ = cheerio.load(detailHtml);

    const text = [];
    $$(".content_area .content span").each((_, el) => {
        const t = $$(el).text().trim();
        if (t && !text.includes(t)) text.push(t);
    });

    return {
        title,
        id,
        link: detailUrl,
        text: text.join("\n")
    };
}

module.exports = { checkNewPosts };
