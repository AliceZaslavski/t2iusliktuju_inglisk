const moodsData = {
  "Grateful": "#ffffcc",
  "Lonely": "#e6ffff",
  "Confused": "#ecc6d9",
  "Inspired": "#ccffcc",
  "Anxious": "#f2ccff",
  "Calm": "#ffcccc",
  "Angry": "#ff0000",
  "Sad": "#ccf2ff",
  "Happy": "#ffe6f9",
  "Meh": "#ffcc99"
};

let selectedDate = null;
let userMoods = { ...moodsData };
let selectedCell = null;

// --- eesti -> inglise nimede kaardistus (migratsiooniks) ---
const etToEn = {
  "Tänulik": "Grateful",
  "Üksildane": "Lonely",
  "Segaduses": "Confused",
  "Innustunud": "Inspired",
  "Ärev": "Anxious",
  "Rahulik": "Calm",
  "Vihane": "Angry",
  "Kurb": "Sad",
  "Rõõmus": "Happy",
  "Mäh": "Meh"
};
const MIGRATION_FLAG = "moodWidget:migratedToEN";

// --- MIGRATSIOON: tõlgib salvestatud tujunimed ja päevade kirjed inglise keelde ---
function migrateStorageToEnglish() {
  if (localStorage.getItem(MIGRATION_FLAG) === "1") return;

  // 1) Tõlgi tujulist
  const storedMoodsRaw = localStorage.getItem("userMoods");
  if (storedMoodsRaw) {
    try {
      const storedMoods = JSON.parse(storedMoodsRaw) || {};
      const migrated = {};
      Object.keys(storedMoods).forEach(name => {
        const en = etToEn[name] || name;
        // väldi ülekirjutamist: kui mõlemad eksisteerivad, eelista olemasoleva värvi loogikat
        if (!(en in migrated)) migrated[en] = storedMoods[name];
      });
      localStorage.setItem("userMoods", JSON.stringify(migrated));
    } catch (_) {}
  }

  // 2) Tõlgi kõigi päevade sisu (võtmed stiilis 1/1/2025 või 1/1)
  const dateKeyRegex = /^\d{1,2}\/\d{1,2}(?:\/\d{4})?$/;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (!dateKeyRegex.test(key)) continue;
    try {
      const dayArr = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(dayArr)) {
        const migratedDay = dayArr.map(item => {
          if (item && typeof item === "object") {
            const en = etToEn[item.mood] || item.mood;
            return { ...item, mood: en };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(migratedDay));
      }
    } catch (_) {}
  }

  localStorage.setItem(MIGRATION_FLAG, "1");
}

// --- laadimine / salvestamine ---
function loadUserMoods() {
  const stored = localStorage.getItem("userMoods");
  if (stored) {
    try {
      userMoods = JSON.parse(stored);
      return;
    } catch (e) {
      console.warn("userMoods parse ebaõnnestus, lähtestan vaikimisi.");
    }
  }
  userMoods = { ...moodsData };
  localStorage.setItem("userMoods", JSON.stringify(userMoods));
}

function persistUserMoods() {
  localStorage.setItem("userMoods", JSON.stringify(userMoods));
}

// ✅ Popup (toimib nii Notionis kui brauseris)
function openMoodPopup() {
  document.getElementById("newMoodPopup").style.display = "block";
}
function closeMoodPopup() {
  document.getElementById("newMoodPopup").style.display = "none";
}

function addNewMood() {
  const inputEl = document.getElementById('newMoodInput');
  const colorEl = document.getElementById('newMoodColor');

  const newMoodName = (inputEl.value || "").trim();
  if (!newMoodName) return;

  // väldi duplikaate (case-insensitive)
  const exists = Object.keys(userMoods).some(m => m.toLowerCase() === newMoodName.toLowerCase());
  if (exists) {
    alert("This mood already exists.");
    return;
  }

  const newMoodColor = colorEl.value || "#cccccc";
  userMoods[newMoodName] = newMoodColor;

  persistUserMoods();
  generateMoodButtons();

  // puhasta sisendid
  inputEl.value = "";
  colorEl.value = "#cccccc";

  closeMoodPopup();
}

function generateMoodButtons() {
  const container = document.getElementById('mood-buttons');
  container.innerHTML = "";

  Object.keys(userMoods).forEach(mood => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('mood-wrapper');

    const button = document.createElement('button');
    button.classList.add('mood-button');
    button.textContent = mood;
    button.style.backgroundColor = userMoods[mood];

    const select = document.createElement('select');
    for (let i = 0; i <= 100; i += 10) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i}%`;
      select.appendChild(option);
    }

    const colorPicker = document.createElement('input');
    colorPicker.type = "color";
    colorPicker.value = userMoods[mood];

    // värvi muutus salvestub kohe
    colorPicker.addEventListener("input", () => {
      const val = colorPicker.value;
      button.style.backgroundColor = val;
      userMoods[mood] = val;
      persistUserMoods();
    });

    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-mood');
    removeBtn.textContent = "❌";
    removeBtn.title = "Remove mood";
    removeBtn.addEventListener("click", () => {
      delete userMoods[mood];
      persistUserMoods();
      generateMoodButtons();
    });

    wrapper.appendChild(button);
    wrapper.appendChild(select);
    wrapper.appendChild(colorPicker);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);
  });
}

function saveMood() {
  if (!selectedDate) {
    alert("Please select a date in the calendar!");
    return;
  }

  const selectedMoods = [];
  document.querySelectorAll('.mood-wrapper').forEach(wrapper => {
    const mood = wrapper.querySelector('button').textContent; // juba EN pärast migratsiooni
    const percentage = parseInt(wrapper.querySelector('select').value, 10);
    const color = wrapper.querySelector('input[type="color"]').value;

    if (percentage > 0) {
      selectedMoods.push({ mood, percentage, color });
    }
  });

  localStorage.setItem(selectedDate, JSON.stringify(selectedMoods));
  renderCalendar();
}

function renderCalendar() {
  const yearEl = document.getElementById("year");
  const year = yearEl && yearEl.value ? yearEl.value : new Date().getFullYear();

  const header = document.getElementById('days-header');
  const body = document.getElementById('calendar-body');
  header.innerHTML = '<th class="fixed-cell"></th>';
  body.innerHTML = '';

  for (let i = 1; i <= 31; i++) {
    const th = document.createElement("th");
    th.textContent = i;
    header.appendChild(th);
  }

  const months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];

  months.forEach((month, monthIndex) => {
    const row = document.createElement("tr");
    const monthCell = document.createElement("td");
    monthCell.textContent = month;
    monthCell.classList.add("month-label");
    row.appendChild(monthCell);

    for (let i = 1; i <= 31; i++) {
      const dayCell = document.createElement("td");
      dayCell.classList.add("day");
      dayCell.dataset.date = `${i}/${monthIndex + 1}/${year}`;
      dayCell.style.border = dayCell === selectedCell ? "2px solid black" : "1px solid #ccc";

      dayCell.addEventListener("click", () => selectDate(dayCell));

      dayCell.addEventListener("mouseenter", () => {
        dayCell.style.border = "2px solid black";
      });
      dayCell.addEventListener("mouseleave", () => {
        if (dayCell !== selectedCell) dayCell.style.border = "1px solid #ccc";
      });

      const moods = JSON.parse(localStorage.getItem(dayCell.dataset.date)) || [];
      if (moods.length > 0) {
        dayCell.style.background = createGradientBackground(moods);
      }

      row.appendChild(dayCell);
    }

    body.appendChild(row);
  });
}

// ✅ Kuupäeva valik
function selectDate(dayCell) {
  if (selectedCell) selectedCell.style.border = "1px solid #ccc";
  selectedDate = dayCell.dataset.date;
  selectedCell = dayCell;
  selectedCell.style.border = "2px solid black";
}

/**
 * 🎨 1–5 värvi gradient protsentide alusel
 */
function createGradientBackground(moods) {
  if (moods.length === 1 && moods[0].percentage === 100) {
    return moods[0].color;
  }
  moods.sort((a, b) => b.percentage - a.percentage);
  if (moods.length > 5) moods = moods.slice(0, 5);

  let gradientStops = [];
  let totalPercentage = 0;

  moods.forEach((mood) => {
    totalPercentage += mood.percentage;
    if (totalPercentage > 100) totalPercentage = 100;
    gradientStops.push(`${mood.color} ${totalPercentage}%`);
  });

  return `linear-gradient(to bottom right, ${gradientStops.join(', ')})`;
}

// --- käivitus ---
document.addEventListener("DOMContentLoaded", () => {
  migrateStorageToEnglish();   // ⬅️ tee ühekordne tõlge EN-iks
  loadUserMoods();             // ⬅️ nüüd lae juba ingliskeelne loend
  generateMoodButtons();
  renderCalendar();

  document.getElementById("add-mood").addEventListener("click", openMoodPopup);
  document.getElementById("confirm-add-mood").addEventListener("click", addNewMood);
  document.getElementById("cancel-add-mood").addEventListener("click", closeMoodPopup);
  document.getElementById("save-btn").addEventListener("click", saveMood);

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.addEventListener("input", renderCalendar);
});
