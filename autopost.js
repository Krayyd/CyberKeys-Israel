/**
 * CyberKeys Israel — Автопостер в стиле KSP для Telegram-канала @CyberKeys_IL
 *
 * Исключает уже опубликованные вручную игры (GTA V, Resident Evil Village, EA Sports FC 24)
 * и ведёт лог опубликованных постов в posted-log.json.
 *
 * Использование:
 *   1) Опубликовать 1 следующий пост прямо сейчас:
 *      $env:BOT_TOKEN="123456:ABC..."; node autopost.js --once
 *
 *   2) Запустить автопостинг по расписанию (каждые N часов, по умолчанию 4 часа):
 *      $env:BOT_TOKEN="123456:ABC..."; node autopost.js --interval=4
 */

const fs = require("fs");
const path = require("path");

const CHANNEL_ID = process.env.CHANNEL_ID || "@CyberKeys_IL";
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const SITE_URL = process.env.SITE_URL || "https://cyberkeys-israel.netlify.app/";

const GAMES_FILE = path.join(__dirname, "games.json");
const LOG_FILE = path.join(__dirname, "posted-log.json");

// Игры, которые уже выложены в канал вручную
const ALREADY_POSTED_TITLES = [
  "Grand Theft Auto V",
  "Resident Evil Village",
  "EA Sports FC 24",
];

const CATEGORY_EMOJI = {
  Action: "🔥",
  RPG: "⚔️",
  Horror: "🧟‍♂️",
  Sports: "⚽",
  Shooter: "🎯",
  Survival: "🏕️",
  Adventure: "🗺️",
  Simulation: "🚜",
  Strategy: "👑",
  Racing: "🏎️",
};

const CATEGORY_PITCH_HE = {
  Action: "אקשן סוחף, קרבות אינטנסיביים וחוויית גיימינג בלתי נשכחת במחשב האישי!",
  RPG: "עולם עשיר, עלילה עמוקה ועשרות שעות של הרפתקה בגרסת ה-PC המלאה!",
  Horror: "מתח, הישרדות ואווירה מצמררת בגרסת המחשב הרשמית!",
  Sports: "חוויית הספורט המובילה בעולם למחשב האישי כולל כל המצבים הרשמיים!",
  Shooter: "יריות בקצב גבוה, אקשן טקטי וגרפיקה חדה במחשב האישי!",
  Survival: "בנייה, הישרדות וחקר עולם פתוח לבד או עם חברים באונליין!",
  Adventure: "סיפור מרגש, עולם מרהיב והרפתקה סוחפת בגרסת המחשב המלאה!",
  Simulation: "סימולציה מציאותית, שליטה מלאה ומאות שעות של תוכן ב-PC!",
  Strategy: "טקטיקה, ניהול אימפריה וקרבות ענק בגרסת המחשב הרשמית!",
  Racing: "מהירות קיצונית, רכבים רשמיים ומסלולים מרהיבים ב-PC!",
};

function loadPostedLog() {
  if (!fs.existsSync(LOG_FILE)) {
    const initial = { postedTitles: [...ALREADY_POSTED_TITLES], history: [] };
    fs.writeFileSync(LOG_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
    const set = new Set([...ALREADY_POSTED_TITLES, ...(parsed.postedTitles || [])]);
    return { postedTitles: [...set], history: parsed.history || [] };
  } catch {
    return { postedTitles: [...ALREADY_POSTED_TITLES], history: [] };
  }
}

function savePostedLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), "utf8");
}

function getHorizontalBanner(game) {
  const match = String(game.cover || "").match(/\/steam\/apps\/(\d+)\//);
  if (match) {
    return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${match[1]}/header.jpg`;
  }
  return game.cover;
}

function buildKspCaptionHTML(game) {
  const emoji = CATEGORY_EMOJI[game.category] || "🎮";
  const pitch = CATEGORY_PITCH_HE[game.category] || "המהדורה המלאה והרשמית למחשב האישי במחיר שובר שוק!";
  const saved = Math.round(game.officialPrice - game.cyberkeysPrice);
  const discountPct = Math.round((saved / game.officialPrice) * 100);
  const directOrderUrl = `https://t.me/Zero_IDD?text=${encodeURIComponent(
    `היי, אני רוצה לקנות את המשחק ${game.title} ב-${game.cyberkeysPrice}₪`
  )}`;

  const siteLine = SITE_URL
    ? `\n🌐 <a href="${SITE_URL}">לקטלוג המלא באתר CyberKeys Israel »</a>`
    : "";

  return [
    `${emoji} <b>המשחק ${game.title} למחשב — רק ב-${game.cyberkeysPrice}₪ במקום <s>${game.officialPrice}₪</s>! (חיסכון של ${saved}₪!)</b>`,
    `${pitch}`,
    ``,
    `לרכישה מהירה בהודעה ישירה »`,
    `<a href="${directOrderUrl}">לחצו כאן להזמנת ${game.title} ב-${game.cyberkeysPrice}₪ »</a>`,
    `👉 או שלחו הודעה ל-@Zero_IDD${siteLine}`,
    `⚡ אספקה דיגיטלית מיידית בצ'אט`,
    `💳 תשלום נוח ב-Bit או PayBox`,
    ``,
    `<b>למה לקנות ב-CyberKeys Israel?</b>`,
    `✅ מפתח רשמי ומקורי להפעלה ב-${game.platform} (מותאם 100% לישראל ללא VPN)`,
    `✅ חיסכון של ${discountPct}% מהמחיר הרשמי בחנות (${game.officialPrice}₪)`,
    `✅ תמיכה מלאה בעברית וליווי עד שהמשחק פועל אצלכם`,
    ``,
    `*בתוקף עד גמר המלאי | מינימום 10 מפתחות במלאי במחיר המבצע`,
  ].join("\n");
}

async function sendTelegramPhoto(photoUrl, captionHtml) {
  if (!BOT_TOKEN) {
    throw new Error("Не задан BOT_TOKEN. Передайте $env:BOT_TOKEN='ваш_токен_от_BotFather'");
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      photo: photoUrl,
      caption: captionHtml,
      parse_mode: "HTML",
    }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || JSON.stringify(data)}`);
  }
  return data.result;
}

async function postNextGame() {
  const games = JSON.parse(fs.readFileSync(GAMES_FILE, "utf8"));
  const log = loadPostedLog();
  const postedSet = new Set(log.postedTitles);

  const nextGame = games.find((g) => !postedSet.has(g.title));
  if (!nextGame) {
    console.log("Все 100 игр уже опубликованы!");
    return false;
  }

  const photoUrl = getHorizontalBanner(nextGame);
  const captionHtml = buildKspCaptionHTML(nextGame);

  if (!BOT_TOKEN) {
    console.log("=== ПРЕДПРОСМОТР СЛЕДУЮЩЕГО ПОСТА (BOT_TOKEN не задан) ===");
    console.log("Игра:", nextGame.title);
    console.log("Картинка:", photoUrl);
    console.log("--- Текст поста ---");
    console.log(captionHtml.replace(/<[^>]+>/g, ""));
    return false;
  }

  const msg = await sendTelegramPhoto(photoUrl, captionHtml);
  log.postedTitles.push(nextGame.title);
  log.history.push({
    title: nextGame.title,
    messageId: msg.message_id,
    postedAt: new Date().toISOString(),
  });
  savePostedLog(log);
  console.log(`[OK] Опубликован пост: ${nextGame.title} (message_id: ${msg.message_id}). Осталось игр: ${games.length - log.postedTitles.length}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const isOnce = args.includes("--once") || !args.some((a) => a.startsWith("--interval"));
  const delayFirst = args.includes("--delay-first");
  const intervalArg = args.find((a) => a.startsWith("--interval="));
  const hours = intervalArg ? Math.max(0.5, Number(intervalArg.split("=")[1]) || 4) : 4;

  if (isOnce) {
    await postNextGame();
    return;
  }

  console.log(`Запущен автопостер CyberKeys Israel. Интервал: каждые ${hours} ч. Канал: ${CHANNEL_ID}`);
  if (!delayFirst) {
    await postNextGame();
  }
  setInterval(() => {
    postNextGame().catch((err) => console.error("[Ошибка автопостинга]:", err.message));
  }, hours * 3600 * 1000);
}

main().catch((err) => {
  console.error("Ошибка:", err.message);
  process.exit(1);
});
