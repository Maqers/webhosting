/**
 * Built-in gifting calendar for the admin portal (/admin → Calendar).
 *
 * Three kinds of entries:
 *   FIXED_DAYS   — same calendar date every year
 *   RULE_DAYS    — "2nd Sunday of May" style, computed for any year
 *   LUNAR_DAYS   — Hindu/Islamic lunar festivals that move every year; dates
 *                  are looked up per year and flagged `approx` so the team
 *                  confirms them against a panchang closer to the day.
 *                  Add a new year's block here when it's announced.
 *
 * `lead` = days before the event we should start promoting it.
 */

export const EVENT_TYPES = {
  festival:     { label: "Festivals",          color: "#c2410c", bg: "#fff1e6" },
  relationship: { label: "Relationship days",  color: "#be185d", bg: "#fdecf3" },
  appreciation: { label: "Appreciation days",  color: "#6d28d9", bg: "#f1ebfd" },
  national:     { label: "National days",      color: "#15803d", bg: "#e8f6ec" },
  craft:        { label: "Craft & earth",      color: "#a16207", bg: "#fbf3df" },
  shopping:     { label: "Shopping moments",   color: "#1d4ed8", bg: "#e8effd" },
  custom:       { label: "Added by us",        color: "#1a1a18", bg: "#efe9dd" },
};

const FIXED_DAYS = [
  { m: 1,  d: 1,  name: "New Year's Day", emoji: "🎉", type: "festival", lead: 21, note: "New-year desk décor, planners, fresh-start gifts." },
  { m: 1,  d: 13, name: "Lohri", emoji: "🔥", type: "festival", lead: 10, note: "Punjabi harvest festival; first-Lohri gifts for newborns and newlyweds." },
  { m: 1,  d: 14, name: "Makar Sankranti / Pongal", emoji: "🪁", type: "festival", lead: 10, approx: true, note: "Harvest festival across India; sweets hampers and festive décor." },
  { m: 1,  d: 26, name: "Republic Day", emoji: "🇮🇳", type: "national", lead: 7, note: "Made-in-India and artisan stories." },
  { m: 2,  d: 7,  name: "Rose Day", emoji: "🌹", type: "relationship", lead: 7, note: "Valentine's week day 1." },
  { m: 2,  d: 8,  name: "Propose Day", emoji: "💍", type: "relationship", lead: 7 },
  { m: 2,  d: 9,  name: "Chocolate Day", emoji: "🍫", type: "relationship", lead: 7 },
  { m: 2,  d: 10, name: "Teddy Day", emoji: "🧸", type: "relationship", lead: 7 },
  { m: 2,  d: 11, name: "Promise Day", emoji: "🤞", type: "relationship", lead: 7 },
  { m: 2,  d: 12, name: "Hug Day", emoji: "🤗", type: "relationship", lead: 7 },
  { m: 2,  d: 13, name: "Kiss Day", emoji: "💋", type: "relationship", lead: 7 },
  { m: 2,  d: 14, name: "Valentine's Day", emoji: "❤️", type: "relationship", lead: 21, note: "Biggest couples moment of the year: personalised gifts for gf/bf, husband, wife." },
  { m: 3,  d: 8,  name: "International Women's Day", emoji: "💐", type: "appreciation", lead: 14, note: "Women-led makers; gifts for mom, sister, colleagues." },
  { m: 4,  d: 10, name: "Siblings Day", emoji: "👫", type: "relationship", lead: 10, note: "Brother/sister gifts outside Rakhi season." },
  { m: 4,  d: 14, name: "Baisakhi", emoji: "🌾", type: "festival", lead: 10, note: "Punjabi new year and harvest festival." },
  { m: 4,  d: 22, name: "Earth Day", emoji: "🌍", type: "craft", lead: 7, note: "Sustainable, handmade, low-waste angle." },
  { m: 5,  d: 12, name: "International Nurses Day", emoji: "🩺", type: "appreciation", lead: 7 },
  { m: 5,  d: 24, name: "Brothers' Day", emoji: "🤜", type: "relationship", lead: 7 },
  { m: 6,  d: 1,  name: "Global Day of Parents", emoji: "👨‍👩‍👧", type: "relationship", lead: 7 },
  { m: 6,  d: 5,  name: "World Environment Day", emoji: "🌱", type: "craft", lead: 7 },
  { m: 6,  d: 8,  name: "Best Friends Day", emoji: "🫶", type: "relationship", lead: 7 },
  { m: 6,  d: 10, name: "World Crafts Day", emoji: "🧶", type: "craft", lead: 10, note: "Celebrate our makers: behind-the-scenes content." },
  { m: 7,  d: 1,  name: "National Doctors' Day & CA Day", emoji: "🩺", type: "appreciation", lead: 10, note: "Thank-you gifts for doctors and chartered accountants." },
  { m: 7,  d: 7,  name: "World Chocolate Day", emoji: "🍫", type: "shopping", lead: 5 },
  { m: 8,  d: 1,  name: "Girlfriend Day", emoji: "💕", type: "relationship", lead: 10 },
  { m: 8,  d: 7,  name: "National Handloom Day", emoji: "🧵", type: "craft", lead: 10, note: "Big one for handmade: textiles, weaves, artisan stories." },
  { m: 8,  d: 15, name: "Independence Day", emoji: "🇮🇳", type: "national", lead: 7, note: "Vocal for local, made-in-India collections." },
  { m: 8,  d: 26, name: "International Dog Day", emoji: "🐶", type: "shopping", lead: 5, note: "Pet portraits and pet-parent gifts." },
  { m: 9,  d: 5,  name: "Teachers' Day", emoji: "🍎", type: "appreciation", lead: 14, note: "Bulk orders from parents and students." },
  { m: 9,  d: 15, name: "Engineers' Day", emoji: "⚙️", type: "appreciation", lead: 5 },
  { m: 10, d: 1,  name: "International Coffee Day", emoji: "☕", type: "shopping", lead: 5, note: "Mugs, coasters, coffee-corner décor." },
  { m: 10, d: 2,  name: "Gandhi Jayanti", emoji: "🕊️", type: "national", lead: 5, note: "Khadi and handmade heritage." },
  { m: 10, d: 3,  name: "Boyfriend Day", emoji: "💙", type: "relationship", lead: 10 },
  { m: 10, d: 11, name: "International Day of the Girl Child", emoji: "👧", type: "appreciation", lead: 5 },
  { m: 10, d: 16, name: "Boss's Day", emoji: "💼", type: "appreciation", lead: 7 },
  { m: 10, d: 31, name: "Halloween", emoji: "🎃", type: "shopping", lead: 10 },
  { m: 11, d: 11, name: "Singles' Day (11.11)", emoji: "🛍️", type: "shopping", lead: 7, note: "Sale moment." },
  { m: 11, d: 13, name: "World Kindness Day", emoji: "💛", type: "appreciation", lead: 5 },
  { m: 11, d: 14, name: "Children's Day", emoji: "🧸", type: "appreciation", lead: 10, note: "Kids' gifts and return gifts." },
  { m: 11, d: 19, name: "International Men's Day", emoji: "👔", type: "appreciation", lead: 7 },
  { m: 12, d: 1,  name: "Secret Santa & corporate gifting season", emoji: "🎁", type: "shopping", lead: 14, note: "Office exchanges and year-end client gifts." },
  { m: 12, d: 8,  name: "All India Handicrafts Week begins", emoji: "🏺", type: "craft", lead: 7, note: "Runs 8–14 December." },
  { m: 12, d: 25, name: "Christmas", emoji: "🎄", type: "festival", lead: 30, note: "Ornaments, hampers, Secret Santa." },
  { m: 12, d: 31, name: "New Year's Eve", emoji: "🥂", type: "festival", lead: 14, note: "Party décor, hosting gifts." },
];

// weekday: 0 = Sunday … 6 = Saturday. n = 1..5 (nth occurrence in the month)
const RULE_DAYS = [
  { rule: { m: 4,  weekday: 6, n: 3 }, name: "Husband Appreciation Day", emoji: "🤵", type: "relationship", lead: 10 },
  { rule: { m: 5,  weekday: 0, n: 2 }, name: "Mother's Day", emoji: "💐", type: "relationship", lead: 21, note: "One of the biggest gifting days: personalised, keepsake, self-care." },
  { rule: { m: 6,  weekday: 0, n: 3 }, name: "Father's Day", emoji: "👔", type: "relationship", lead: 21, note: "Desk accessories, wallets, personalised keepsakes." },
  { rule: { m: 8,  weekday: 0, n: 1 }, name: "Friendship Day", emoji: "🤝", type: "relationship", lead: 14, note: "India celebrates on the first Sunday of August." },
  { rule: { m: 8,  weekday: 0, n: 1 }, name: "Sisters' Day", emoji: "👭", type: "relationship", lead: 10 },
  { rule: { m: 9,  weekday: 0, n: 2 }, name: "Grandparents' Day", emoji: "👵", type: "relationship", lead: 10 },
  { rule: { m: 9,  weekday: 0, n: 3 }, name: "Wife Appreciation Day", emoji: "👰", type: "relationship", lead: 10 },
  { rule: { m: 9,  weekday: 0, n: 4 }, name: "Daughters' Day", emoji: "👧", type: "relationship", lead: 10 },
  { rule: { m: 10, weekday: 0, n: 4 }, name: "Mother-in-Law Day", emoji: "👩", type: "relationship", lead: 7 },
  { rule: { m: 11, weekday: 4, n: 4, offset: 1 }, name: "Black Friday", emoji: "🏷️", type: "shopping", lead: 14 },
  { rule: { m: 11, weekday: 4, n: 4, offset: 4 }, name: "Cyber Monday", emoji: "💻", type: "shopping", lead: 7 },
  { rule: { easter: -2 }, name: "Good Friday", emoji: "✝️", type: "festival", lead: 7 },
  { rule: { easter: 0 },  name: "Easter", emoji: "🐣", type: "festival", lead: 14, note: "Easter hampers and spring décor." },
];

// Lunar festivals. Source: published 2026/2027 Indian holiday calendars.
// Islamic dates depend on moon sighting and can shift by a day.
const LUNAR_DAYS = {
  2026: [
    ["01-23", "Vasant Panchami", "🌼", 7],
    ["02-15", "Maha Shivratri", "🔱", 7],
    ["03-04", "Holi", "🎨", 21, "Colours, gujiya hampers, festive décor."],
    ["03-19", "Gudi Padwa / Ugadi", "🌸", 10],
    ["03-21", "Eid al-Fitr", "🌙", 21, "Eid hampers and home décor."],
    ["03-26", "Ram Navami", "🏹", 5],
    ["04-20", "Akshaya Tritiya", "🪙", 14, "Auspicious buying day: gold, jewellery, new beginnings."],
    ["05-27", "Eid al-Adha (Bakrid)", "🌙", 14],
    ["08-26", "Onam", "🌺", 14, "Kerala harvest festival: sadhya, pookalam, kasavu."],
    ["08-28", "Raksha Bandhan", "🪢", 30, "Rakhi + gift combos for brothers and sisters, ship-to-sibling orders."],
    ["09-04", "Janmashtami", "🪈", 10],
    ["09-14", "Ganesh Chaturthi", "🐘", 21, "Decor, pooja essentials, eco-friendly idols."],
    ["10-11", "Navratri begins", "🪔", 21, "Nine nights: garba, pooja décor, festive wear."],
    ["10-20", "Dussehra", "🏹", 14],
    ["10-29", "Karwa Chauth", "🌕", 21, "Gifts for wives, sargi hampers, couple gifts."],
    ["11-06", "Dhanteras", "🪙", 21],
    ["11-08", "Diwali", "🪔", 45, "Biggest season: corporate gifting, hampers, diyas, décor. Lock bulk orders early."],
    ["11-11", "Bhai Dooj", "👫", 21, "Brother/sister gifts."],
    ["11-15", "Chhath Puja", "🌅", 10],
    ["11-24", "Guru Nanak Jayanti", "🙏", 7],
  ],
  2027: [
    ["02-11", "Vasant Panchami", "🌼", 7],
    ["03-06", "Maha Shivratri", "🔱", 7],
    ["03-10", "Eid al-Fitr", "🌙", 21, "Eid hampers and home décor."],
    ["03-22", "Holi", "🎨", 21, "Colours, gujiya hampers, festive décor."],
    ["04-07", "Gudi Padwa / Ugadi", "🌸", 10],
    ["04-15", "Ram Navami", "🏹", 5],
    ["05-09", "Akshaya Tritiya", "🪙", 14, "Auspicious buying day: gold, jewellery, new beginnings."],
    ["05-17", "Eid al-Adha (Bakrid)", "🌙", 14],
    ["08-17", "Raksha Bandhan", "🪢", 30, "Rakhi + gift combos for brothers and sisters, ship-to-sibling orders."],
    ["08-25", "Janmashtami", "🪈", 10],
    ["09-04", "Ganesh Chaturthi", "🐘", 21, "Decor, pooja essentials, eco-friendly idols."],
    ["09-12", "Onam", "🌺", 14, "Kerala harvest festival: sadhya, pookalam, kasavu."],
    ["09-30", "Navratri begins", "🪔", 21, "Nine nights: garba, pooja décor, festive wear."],
    ["10-09", "Dussehra", "🏹", 14],
    ["10-18", "Karwa Chauth", "🌕", 21, "Gifts for wives, sargi hampers, couple gifts."],
    ["10-27", "Dhanteras", "🪙", 21],
    ["10-29", "Diwali", "🪔", 45, "Biggest season: corporate gifting, hampers, diyas, décor. Lock bulk orders early."],
    ["10-31", "Bhai Dooj", "👫", 21, "Brother/sister gifts."],
    ["11-04", "Chhath Puja", "🌅", 10],
    ["11-14", "Guru Nanak Jayanti", "🙏", 7],
  ],
};

export const LUNAR_YEARS = Object.keys(LUNAR_DAYS).map(Number);

// ─── date helpers (all local-time, keyed as "YYYY-MM-DD") ────────────────────

const pad = (n) => String(n).padStart(2, "0");
export const toKey = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
export const dateToKey = (dt) => toKey(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
export const keyToDate = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); };

function nthWeekday(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1).getDay();
  return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
}

// Anonymous Gregorian computus
function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function ruleToDate(year, rule) {
  if (rule.easter !== undefined) {
    const dt = easterSunday(year);
    dt.setDate(dt.getDate() + rule.easter);
    return dt;
  }
  const dt = new Date(year, rule.m - 1, nthWeekday(year, rule.m, rule.weekday, rule.n));
  if (rule.offset) dt.setDate(dt.getDate() + rule.offset);
  return dt;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** All built-in events for one year, sorted by date. */
export function getBuiltInEvents(year) {
  const events = [];
  for (const e of FIXED_DAYS) {
    events.push({ ...e, id: `bi-${slug(e.name)}-${year}`, date: toKey(year, e.m, e.d), builtIn: true });
  }
  for (const e of RULE_DAYS) {
    events.push({ ...e, id: `bi-${slug(e.name)}-${year}`, date: dateToKey(ruleToDate(year, e.rule)), builtIn: true });
  }
  for (const [md, name, emoji, lead, note] of LUNAR_DAYS[year] || []) {
    events.push({ id: `bi-${slug(name)}-${year}`, date: `${year}-${md}`, name, emoji, type: "festival", lead, note, approx: true, builtIn: true });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/** Expand custom (team-added) events into concrete dates for one year. */
export function getCustomEvents(customList, year) {
  const out = [];
  for (const e of customList || []) {
    if (e.repeat === "yearly") {
      const [, m, d] = e.date.split("-");
      out.push({ ...e, date: `${year}-${m}-${d}` });
    } else if (e.date.startsWith(`${year}-`)) {
      out.push(e);
    }
  }
  return out;
}
