import { Bot, InlineKeyboard } from "grammy";

const TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.TOKEN;
const CHANNEL = "@ShunchakiMusiqaUz";
const CHANNEL_URL = "https://t.me/ShunchakiMusiqaUz";

if (!TOKEN) {
  throw new Error("BOT_TOKEN sozlamasi topilmadi!");
}

const bot = new Bot(TOKEN);

function subscriptionKeyboard() {
  return new InlineKeyboard()
    .url("📢 Kanalga obuna bo'lish", CHANNEL_URL)
    .row()
    .text("✅ Obuna bo'ldim", "check_subscription");
}

async function isSubscribed(userId) {
  try {
    const member = await bot.api.getChatMember(CHANNEL, userId);
    return ["member", "administrator", "creator"].includes(member.status);
  } catch (error) {
    console.error("Obuna tekshirish xatosi:", error.message);
    return false;
  }
}

bot.command("start", async (ctx) => {
  await ctx.reply(
    "🎧 Assalomu alaykum!\n\n" +
      "🎵 Menga musiqa yuboring, uni kanalimga joylayman.\n\n" +
      "📢 Avval kanalga obuna bo'ling!",
    { reply_markup: subscriptionKeyboard() }
  );
});

bot.callbackQuery("check_subscription", async (ctx) => {
  const subscribed = await isSubscribed(ctx.from.id);

  if (subscribed) {
    await ctx.answerCallbackQuery({ text: "✅ Obuna tasdiqlandi!" });
    await ctx.reply("🎵 Ajoyib! Endi menga musiqa yuborishingiz mumkin.");
  } else {
    await ctx.answerCallbackQuery({
      text: "❌ Avval kanalga obuna bo'ling!",
      show_alert: true,
    });
  }
});

bot.on("message:audio", async (ctx) => {
  const subscribed = await isSubscribed(ctx.from.id);

  if (!subscribed) {
    await ctx.reply(
      "📢 Musiqa yuborishdan oldin kanalga obuna bo'ling!",
      { reply_markup: subscriptionKeyboard() }
    );
    return;
  }

  const audio = ctx.message.audio;
  const title = audio.title || "Noma'lum qo'shiq";
  const artist = audio.performer || "Noma'lum ijrochi";

  const caption = [
    "━━━━━━━━━━━━━━━━━━",
    "🎧 SHUNCHAKI MUSIQA UZ",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `🎵 Nomi: ${title}`,
    `🎤 Ijrochi: ${artist}`,
    "",
    "🎶 Musiqadan zavqlaning!",
    "",
    "📢 @ShunchakiMusiqaUz",
  ].join("\n");

  try {
    await ctx.api.sendAudio(CHANNEL, audio.file_id, {
      caption,
      reply_markup: new InlineKeyboard().
