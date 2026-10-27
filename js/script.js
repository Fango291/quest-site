"use strict";

/* ============================================================
   Стан гри (змінні ті самі, що й у початковому коді)
   ============================================================ */
let alive = true;
let key = false;
let shield = false;
let potion = false;
let treasure = false;
let inteligent = false;

let heroName = "";
let heroClass = "";
let heroClassLabel = "";

/* ============================================================
   Інтерфейс: замість alert і prompt
   say()  — показує повідомлення в журналі (замість alert)
   ask()  — показує питання і поле вводу (замість prompt)
   ============================================================ */
const logEl = document.getElementById("log");
const form = document.getElementById("answer-form");
const input = document.getElementById("answer");
const optionsEl = document.getElementById("options");
const restartBtn = document.getElementById("restart");
const nameEl = document.getElementById("hero-name");
const classEl = document.getElementById("hero-class");

let resolveAnswer = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Приводить відповідь до єдиного вигляду: маленькі літери, один тип апострофа
const norm = (text) => text.trim().toLowerCase().replace(/[’ʼ`]/g, "'");

function updateInventory() {
  const state = { shield, potion, treasure, key };
  document.querySelectorAll("[data-item]").forEach((el) => {
    el.classList.toggle("has", state[el.dataset.item] === true);
  });
  nameEl.textContent = heroName || "—";
  classEl.textContent = heroClassLabel || "—";
}

function addLine(text, className = "") {
  const p = document.createElement("p");
  p.className = ("line " + className).trim();
  p.textContent = text;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

// tone: "", "good", "bad", "ending"
async function say(text, tone = "") {
  updateInventory();
  addLine(text, tone);
  await sleep(Math.min(450 + text.length * 14, 1600));
  updateInventory();
}

function ask(question, options = [], placeholder = "Введи відповідь") {
  updateInventory();
  addLine(question, "question");

  optionsEl.replaceChildren();
  options.forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = option;
    btn.addEventListener("click", () => finishAnswer(option));
    optionsEl.appendChild(btn);
  });

  input.placeholder = placeholder;
  input.value = "";
  form.hidden = false;
  input.focus();

  return new Promise((resolve) => {
    resolveAnswer = resolve;
  });
}

function finishAnswer(raw) {
  const text = raw.trim();
  if (!resolveAnswer || text === "") return;
  addLine("› " + text, "answer");
  form.hidden = true;
  const resolve = resolveAnswer;
  resolveAnswer = null;
  resolve(text);
}

// Те саме, що ask(), але відповідь одразу в нижньому регістрі
async function choose(question, options, placeholder) {
  return norm(await ask(question, options, placeholder));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  finishAnswer(input.value);
});

restartBtn.addEventListener("click", () => location.reload());

/* ============================================================
   Гра
   ============================================================ */
async function playGame() {
  updateInventory();

  heroName = await ask("Ваше ім'я?", [], "Ім'я героя");
  updateInventory();

  // Пояснення сюжета
  await say(`${heroName} опиняється на пошкодженій космічній станції. Його головна ціль: втекти.`);

  // Вибір класу
  heroClass = await choose(
    `${heroName}, обери спеціалізацію.`,
    ["Космодесантник", "Інженер", "Кібернетик"],
    "Спеціалізація"
  );

  if (heroClass === "космодесантник") {
    potion = true;
    heroClassLabel = "Космодесантник";
    await say("Твої предмети: аптечка.");
  } else if (heroClass === "інженер") {
    shield = true;
    heroClassLabel = "Інженер";
    await say("Твої предмети: енергетичний щит.");
  } else if (heroClass === "кібернетик") {
    inteligent = true;
    heroClassLabel = "Кібернетик";
    await say("Твої предмети: немає, але в тебе є розум.");
  } else {
    heroClassLabel = "Без спеціалізації";
    await say("Такої спеціалізації нема. Ти без предметів.");
  }

  /* ---------- Частина 2: розвилка ---------- */
  await say(`Дорога перед ${heroName} розходиться. Ліворуч: темний технічний тунель. Прямо: коридор із лазерною пасткою. Праворуч: житловий модуль, де є робот-провідник.`);
  const direction = await choose("Куди підеш?", ["Ліворуч", "Прямо", "Праворуч"], "Напрямок");

  if (direction === "ліворуч") {
    await say("Спереду темний технічний тунель.");
  } else if (direction === "прямо") {
    await say(`Перед ${heroName} пастка. Кинь монетку.`);
    const coin = await choose("Орел чи решка?", ["Орел", "Решка"], "Орел або решка");

    if (coin === "орел") {
      await say("Пастка спрацювала!", "bad");
      if (shield) {
        shield = false;
        await say(`Щит спрацював і врятував ${heroName}.`, "good");
      } else if (potion) {
        potion = false;
        await say(`${heroName} використав аптечку і залишився живий.`, "good");
      } else {
        alive = false;
        await say(`${heroName} не пережив пастку.`, "bad");
      }
    } else if (coin === "решка") {
      treasure = true;
      await say(`Пастка не спрацювала. ${heroName} знайшов цінний вантаж!`, "good");
    } else {
      alive = false;
      await say(`Монетка закотилася, пастка спрацювала. ${heroName} помер.`, "bad");
    }
  } else if (direction === "праворуч") {
    await say("У житловому модулі безпечно, але робот-провідник просить плату.");
    if (potion) {
      potion = false;
      await say("Провідник забрав аптечку як плату.", "bad");
    } else {
      await say("Провідник проводить тебе безкоштовно.");
    }
  } else {
    alive = false;
    await say(`Такого шляху немає. ${heroName} загубився і програв.`, "bad");
  }

  if (!alive) return finale();

  /* ---------- Частина 3: бойовий робот (тільки ліворуч) ---------- */
  if (direction === "ліворуч") {
    await say(`${heroName} зустрічає бойового робота в темному тунелі.`);
    const action = await choose("Що робитиме герой?", ["Бій", "Втеча", "Переговори"], "Дія");

    if (action === "бій") {
      if (heroClass === "космодесантник") {
        treasure = true;
        await say(`Перемога! ${heroName} переміг робота і знайшов цінний вантаж!`, "good");
      } else if (shield) {
        shield = false;
        await say(`Щит витримує удар! ${heroName} виживає.`, "good");
      } else {
        alive = false;
        await say(`На жаль, робот сильніший. ${heroName} помирає.`, "bad");
      }
    } else if (action === "втеча") {
      await say(`${heroName} пробує втекти!`);
      if (shield) {
        shield = false;
        await say(`Робот атакував, але щит врятував ${heroName}!`, "good");
      } else if (potion) {
        potion = false;
        await say(`${heroName} втікає пораненим! Він використав аптечку і залишився живий.`, "good");
      } else {
        alive = false;
        await say(`${heroName} гине, не змігши втекти.`, "bad");
      }
    } else if (action === "переговори") {
      await say(`${heroName} пробує домовитися з роботом.`);
      if (inteligent) {
        treasure = true;
        await say(`${heroName} зламав систему робота і знайшов цінний вантаж!`, "good");
      } else {
        await say("Робот сміється, але пропускає героя.");
      }
    } else {
      await say(`${heroName} розгубився.`);
      if (treasure) {
        treasure = false;
        await say("Робот забрав цінний вантаж і пропустив героя.", "bad");
      } else {
        await say("Робот сміється з героя і пропускає його.");
      }
    }
  }

  if (!alive) return finale();

  /* ---------- Частина 4: три контейнери ---------- */
  await say(`${heroName} йде далі.`);
  await say("Біля лабораторії стоять три контейнери: золотий, срібний і дерев'яний.");
  const chest = await choose("Який вибереш?", ["Золота", "Срібна", "Дерев'яна"], "Скриня");

  if (chest === "золота") {
    await say("Золота скриня замінована!", "bad");
    if (inteligent) {
      treasure = true;
      await say(`${heroName} розміновує скриню і отримує цінний вантаж!`, "good");
    } else {
      await say("Кинь монетку, щоб мати шанс вижити.");
      const mineCoin = await choose("Орел чи решка?", ["Орел", "Решка"], "Орел або решка");
      if (mineCoin === "орел") {
        await say("Міна не спрацювала.", "good");
      } else {
        await say("Міна вибухнула!", "bad");
        if (shield) {
          shield = false;
          await say(`Щит розбивається, але рятує ${heroName}!`, "good");
        } else {
          alive = false;
          await say(`${heroName} помер.`, "bad");
        }
      }
    }
  } else if (chest === "срібна") {
    key = true;
    await say(`${heroName} знаходить карту доступу!`, "good");
  } else if (chest === "дерев'яна" || chest === "деревяна") {
    potion = true;
    await say(`${heroName} знаходить запаси і отримує аптечку.`, "good");
  } else {
    await say(`${heroName} не наважився відкрити контейнери і пішов далі.`);
  }

  if (!alive) return finale();

  /* ---------- Частина 5: сейф із загадкою ---------- */
  const answer = "клавіатура";
  await say("Дорогу перегороджує комп'ютерний сейф. Щоб його відкрити, треба розгадати загадку: що має багато клавіш, але не відчиняє жодних дверей? Є 3 спроби.");

  let solved = false;
  for (let attempt = 1; attempt <= 3 && !solved; attempt++) {
    const reply = await choose(`Твоя відповідь? Спроба ${attempt}/3`, [], "Відповідь на загадку");
    if (reply === answer) {
      solved = true;
      shield = true;
      await say(`Правильно! Сейф відкрито, і ${heroName} отримує щит!`, "good");
    } else if (attempt < 3) {
      await say(`${heroName} не вгадав!`, "bad");
    }
  }

  if (!solved) {
    key = false;
    await say(`${heroName} не зміг вгадати! Спрацьовує сигналізація, і ключ блокується!`, "bad");
  }

  /* ---------- Частина 6: три шлюзи ---------- */
  await say(`${heroName} потрапляє до коридору з трьома шлюзами: червоний, зелений і синій.`);
  const gate = await choose("Який вибереш?", ["Червоний", "Зелений", "Синій"], "Колір шлюзу");

  if (gate === "червоний") {
    await say("Попереду лазерна пастка!", "bad");
    if (shield) {
      shield = false;
      await say(`Щит врятував ${heroName}!`, "good");
    } else if (potion) {
      potion = false;
      await say(`Аптечка врятувала ${heroName}!`, "good");
    } else {
      alive = false;
      await say(`${heroName} помирає.`, "bad");
    }
  } else if (gate === "зелений") {
    await say("Довгий, але безпечний шлях.");
  } else if (gate === "синій") {
    await say("Попереду невідомість. Кинь монетку.");
    const gateCoin = await choose("Орел чи решка?", ["Орел", "Решка"], "Орел або решка");
    if (gateCoin === "орел") {
      treasure = true;
      await say(`Попереду темний коридор. ${heroName} знаходить цінний вантаж!`, "good");
    } else if (gateCoin === "решка") {
      treasure = false;
      await say(`${heroName} заблукав і втратив цінний вантаж!`, "bad");
    } else {
      await say("Монетка закотилася, нічого не відбулося.");
    }
  } else {
    await say(`${heroName} блукає, але нічого не знаходить.`);
  }

  if (!alive) return finale();

  await say(`${heroName} доходить до рятувального корабля.`);
  return finale();
}

/* ---------- Частина 7: фінал ---------- */
async function finale() {
  if (alive) {
    if (key) {
      if (treasure) {
        await say("Фінал: Легенда галактики. Добрався до кінця з ключем і цінним вантажем.", "ending");
      } else {
        await say("Фінал: Рятівник. Добрався до кінця з ключем, але без цінного вантажу.", "ending");
      }
    } else if (treasure) {
      await say("Фінал: Космічний багатий. Добрався до кінця без ключа, але з цінним вантажем.", "ending");
    } else {
      await say("Фінал: Останній рейс. Добрався до кінця без нічого.", "ending");
    }
  } else {
    await say("Фінал: Загублений у космосі. Не вижив.", "ending");
  }

  if (inteligent) {
    await say("Непогано, ти розумний!", "good");
  }

  restartBtn.hidden = false;
  restartBtn.focus();
}

playGame();