require("dotenv").config();
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const keepAlive = require("./server.js");
const path = require("path");
const { checkNewPosts } = require("./crawler/newsChecker");
const { request } = require("http");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.data) client.commands.set(command.data.name, command);
}

let lastNoticeId = null;
let lastUpdateId = null;

// 📢 공지사항 체크
async function checkNotice(channel) {
    const notice = await checkNewPosts("Notice");
    if (!notice || notice.id === lastNoticeId) return;

    lastNoticeId = notice.id;

    const contentText = notice.text && notice.text.length <= 2000
        ? `📢 **${notice.title}**\n\n${notice.text}\n\n🔗 ${notice.link}`
        : `📢 **${notice.title}**\n\n🔗 ${notice.link}`;

    await channel.send(contentText);
}

// 🛠️ 업데이트 체크
async function checkUpdate(channel) {
    const update = await checkNewPosts("Update");
    if (!update || update.id === lastUpdateId) return;

    lastUpdateId = update.id;

    const contentText = `🛠️ **${update.title}**\n\n🔗 ${update.link}`;
    await channel.send(contentText);
}

// 봇 초기화 및 반복 체크
client.once("ready", () => {
    console.log(`✅ 봇이 로그인되었습니다! (${client.user.tag})`);

    const noticeChannel = client.channels.cache.get(process.env.NOTICE_CHANNEL_ID);
    const updateChannel = client.channels.cache.get(process.env.UPDATE_CHANNEL_ID);

    if (noticeChannel) {
        checkNotice(noticeChannel);
        setInterval(() => checkNotice(noticeChannel), 1000 * 60 * 5);
    }

    if (updateChannel) {
        checkUpdate(updateChannel);
        setInterval(() => checkUpdate(updateChannel), 1000 * 60 * 5);
    }
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: "⚠️ 명령어 실행 중 오류가 발생했어요.",
            ephemeral: true
        });
    }
});

keepAlive();
client.login(process.env.DISCORD_TOKEN);
