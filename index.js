const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

// ====== SOZLAMALAR ======
// Token kodga YOZILMAYDI. FadeHost panelida BOT_TOKEN nomli o'zgaruvchi qiling.
const TOKEN = process.env.8867504574:AAGd_cKhOmt7uzfb02NdkUUFO0YKHY0HKaw;
const REQUIRED = "@ShunchakiMusiqaUz"; // majburiy obuna kanali
// ========================

if (!TOKEN) {
  console.error("BOT_TOKEN topilmadi! Panelda environment variable qo'shing.");
  process.exit(1);
}

const DB = "channels.json";
const bot = new TelegramBot(TOKEN, { polling: true });

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch {
    return {};
  }
}

function save(data) {
  fs.writeFileSync(DB, JSON.stringify(data));
}

async function checkSub(msg) {
  const chatId = msg.chat.id;
  try {
    const m = await bot.getChatMember(REQUIRED, msg.from.id);
    if (["member", "administrator", "creator"].includes(m.status)) return true;
  } catch (e) {}
  await bot.sendMessage(
    chatId,
    "Avval kanalga obuna bo'ling, keyin /start yuboring.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Kanalga obuna bo'lish", url: `https://t.me/${REQUIRED.slice(1)}` }],
        ],
      },
    }
  );
  return false;
}

bot.onText(/^\/start/, async (msg) => {
  if (!(await checkSub(msg))) return;
  bot.sendMessage(
    msg.chat.id,
    "Salom! Foydalanish:\n" +
      "1. Botni o'z kanalingizga admin qiling (Xabar yuborish ruxsati bilan)\n" +
      "2. Kanal username'ini yuboring (masalan: @kanalim)\n" +
      "3. Menga musiqa yuboring, men kanalingizga joylayman"
  );
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  if (!(await checkSub(msg))) return;

  const chatId = msg.chat.id;
  const ch = msg.text.trim();

  if (!ch.startsWith("@")) {
    return bot.sendMessage(chatId, "Kanal username'i @ bilan boshlanishi kerak.");
  }

  let userM, botM;
  try {
    const me = await bot.getMe();
    userM = await bot.getChatMember(ch, msg.from.id);
    botM = await bot.getChatMember(ch, me.id);
  } catch (e) {
    return bot.sendMessage(chatId, "Kanal topilmadi yoki bot u yerda admin emas.");
  }

  if (!["administrator", "creator"].includes(userM.status)) {
    return bot.sendMessage(chatId, "Siz bu kanalda admin emassiz.");
  }
  if (botM.status !== "administrator") {
    return bot.sendMessage(chatId, "Avval botni kanalga admin qiling.");
  }

  const data = load();
  data[String(msg.from.id)] = ch;
  save(data);
  bot.sendMessage(chatId, `Kanal saqlandi: ${ch} ✅\nEndi musiqa yuboring.`);
});

bot.on("audio", async (msg) => {
  if (!(await checkSub(msg))) return;

  const chatId = msg.chat.id;
  const ch = load()[String(msg.from.id)];
  if (!ch) {
    return bot.sendMessage(chatId, "Avval kanal username'ini yuboring.");
  }

  try {
    await bot.sendAudio(ch, msg.audio.file_id, { caption: msg.caption || "" });
    bot.sendMessage(chatId, "Kanalga joylandi ✅");
  } catch (e) {
    bot.sendMessage(chatId, "Joylab bo'lmadi. Bot kanalda admin ekanini tekshiring.");
  }
});

bot.on("polling_error", (e) => console.error("Polling xato:", e.message));
console.log("Bot ishga tushdi ✅");
