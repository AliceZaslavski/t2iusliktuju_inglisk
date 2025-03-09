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

document.addEventListener("DOMContentLoaded", function () {
    generateMoodButtons();
    renderCalendar();
    document.getElementById("add-mood").addEventListener("click", openMoodPopup);
    document.getElementById("confirm-add-mood").addEventListener("click", addNewMood);
    document.getElementById("cancel-add-mood").addEventListener("click", closeMoodPopup);
    document.getElementById("save-btn").addEventListener("click", saveMood);
    document.getElementById("year").addEventListener("input", renderCalendar);
});

// ✅ **Popup opening for both Notion and Browser**
function openMoodPopup() {
    document.getElementById("newMoodPopup").style.display = "block";
}

function closeMoodPopup() {
    document.getElementById("newMoodPopup").style.display = "none";
}

function addNewMood() {
    const newMoodName = document.getElementById('newMoodInput').value.trim();
    if (!newMoodName || userMoods[newMoodName]) return;

    const newMoodColor = document.getElementById('newMoodColor').value;
    userMoods[newMoodName] = newMoodColor;

    generateMoodButtons();
    localStorage.setItem("userMoods", JSON.stringify(userMoods)); // ✅ Saves moods to local storage
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

        colorPicker.addEventListener("input", () => {
            button.style.backgroundColor = colorPicker.value;
            userMoods[mood] = colorPicker.value;
        });

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-mood');
        removeBtn.textContent = "❌";
        removeBtn.addEventListener("click", () => {
            delete userMoods[mood];
            localStorage.setItem("userMoods", JSON.stringify(userMoods)); // ✅ Saves changes
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
        const mood = wrapper.querySelector('button').textContent;
        const percentage = wrapper.querySelector('select').value;
        const color = wrapper.querySelector('input').value;

        if (parseInt(percentage) > 0) {
            selectedMoods.push({ mood, percentage: parseInt(percentage), color });
        }
    });

    localStorage.setItem(selectedDate, JSON.stringify(selectedMoods));
    renderCalendar();
}

function renderCalendar() {
    const year = document.getElementById("year").value;
    const header = document.getElementById('days-header');
    const body = document.getElementById('calendar-body');
    header.innerHTML = '<th class="fixed-cell"></th>';
    body.innerHTML = '';

    for (let i = 1; i <= 31; i++) {
        const th = document.createElement("th");
        th.textContent = i;
        header.appendChild(th);
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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
            dayCell.addEventListener("click", () => selectDate(dayCell));

            // ✅ Hover effect added (changes border)
            dayCell.addEventListener("mouseenter", () => {
                dayCell.style.border = "2px solid black";
            });

            dayCell.addEventListener("mouseleave", () => {
                if (dayCell !== selectedCell) {
                    dayCell.style.border = "1px solid #ccc";
                }
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

// ✅ **Function to select a date and highlight it**
function selectDate(dayCell) {
    if (selectedCell) {
        selectedCell.style.border = "1px solid #ccc"; // ✅ Removes bold border from the previous cell
    }

    selectedDate = dayCell.dataset.date;
    selectedCell = dayCell;
    selectedCell.style.border = "2px solid black"; // ✅ Adds bold border to the new cell
}

/**
 * 🎨 **Supports 1-5 color gradients based on percentages!**
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

document.addEventListener("DOMContentLoaded", () => {
    generateMoodButtons();
    renderCalendar();
    document.getElementById('add-mood').addEventListener("click", openMoodPopup);
    document.getElementById('confirm-add-mood').addEventListener("click", addNewMood);
    document.getElementById('cancel-add-mood').addEventListener("click", closeMoodPopup);
    document.getElementById('save-btn').addEventListener("click", saveMood);
});
