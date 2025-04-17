const axios = require("axios");

async function checkNewPosts(type = "Notice") {
    const res = await axios.get(`https://your-api-url/news/${type}`);
    return res.data;
}

module.exports = { checkNewPosts };
