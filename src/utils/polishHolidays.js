
// Polskie święta i dni wolne
export function getPolishHolidays(year) {
  const holidays = [];

  // Stałe święta
  const fixed = [
    { month: 1,  day: 1,  name: "Nowy Rok" },
    { month: 1,  day: 6,  name: "Trzech Króli" },
    { month: 5,  day: 1,  name: "Święto Pracy" },
    { month: 5,  day: 3,  name: "Święto Konstytucji 3 Maja" },
    { month: 8,  day: 15, name: "Wniebowzięcie NMP" },
    { month: 11, day: 1,  name: "Wszystkich Świętych" },
    { month: 11, day: 11, name: "Święto Niepodległości" },
    { month: 12, day: 25, name: "Boże Narodzenie" },
    { month: 12, day: 26, name: "Drugi dzień Bożego Narodzenia" },
  ];

  fixed.forEach(h => {
    holidays.push({
      date: `${year}-${String(h.month).padStart(2,"0")}-${String(h.day).padStart(2,"0")}`,
      name: h.name,
      type: "holiday"
    });
  });

  // Wielkanoc (algorytm Meeusa/Jonesa/Butchera)
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }

  const easterDate = easter(year);
  const easterStr = easterDate.toISOString().substring(0, 10);

  // Poniedziałek Wielkanocny (+1)
  const easterMonday = new Date(easterDate); easterMonday.setDate(easterMonday.getDate() + 1);
  const easterMondayStr = easterMonday.toISOString().substring(0, 10);

  // Wniebowstąpienie (+39)
  const ascension = new Date(easterDate); ascension.setDate(ascension.getDate() + 39);

  // Zielone Świątki (+49)
  const pentecost = new Date(easterDate); pentecost.setDate(pentecost.getDate() + 49);

  // Boże Ciało (+60)
  const corpusChristi = new Date(easterDate); corpusChristi.setDate(corpusChristi.getDate() + 60);

  [
    { date: easterStr,                              name: "Wielka Niedziela" },
    { date: easterMondayStr,                        name: "Poniedziałek Wielkanocny" },
    { date: ascension.toISOString().substring(0,10), name: "Wniebowstąpienie Pańskie" },
    { date: pentecost.toISOString().substring(0,10), name: "Zielone Świątki" },
    { date: corpusChristi.toISOString().substring(0,10), name: "Boże Ciało" },
  ].forEach(h => holidays.push({ ...h, type: "holiday" }));

  return holidays;
}
