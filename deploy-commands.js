require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");

const commands = [];
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && typeof command.data.toJSON === "function") {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ ${file}은(는) Slash 명령어가 아니거나 형식이 잘못됨. 건너뜀.`);
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("📡 슬래시 명령어 등록 중...");

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("✅ 등록 완료!");
  } catch (error) {
    console.error("❌ 등록 실패:", error);
  }
})();
