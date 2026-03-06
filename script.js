
const sheetCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ15L7k0B1pgvq_XWBMvvIBd8Qz-Y-4BY9pQDtCpGtdeqzZ_m-vX7m3_38WL6S5aKO6t0DRVCZXOtdK/pub?output=csv";

let people = [];
const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

async function fetchScheduleData() {
    try {
        const response = await fetch(sheetCSVUrl);
        const data = await response.text();
        parseCSV(data);
        updateStatus();
    } catch (error) {
        console.error("Veri çekilirken hata oluştu:", error);
    }
}

function parseCSV(csvText) {
    people = []; 
    const rows = csvText.split('\n').slice(1); 
    
    const dayMap = {
        "Pazar": 0, "Pazartesi": 1, "Salı": 2, "Çarşamba": 3, "Perşembe": 4, "Cuma": 5, "Cumartesi": 6
    };

    const peopleObj = {};

    rows.forEach(row => {
        if (!row.trim()) return;
        
        const cols = row.split(','); 
        if (cols.length >= 5) {
            const name = cols[0].trim();
            const dayText = cols[1].trim();
            const start = cols[2].trim().substring(0, 5); 
            const end = cols[3].trim().substring(0, 5);
            const lesson = cols[4].trim();
            
            const dayNum = dayMap[dayText];

            if (dayNum !== undefined) {
                if (!peopleObj[name]) {
                    peopleObj[name] = { name: name, schedule: {} };
                }
                if (!peopleObj[name].schedule[dayNum]) {
                    peopleObj[name].schedule[dayNum] = [];
                }
                peopleObj[name].schedule[dayNum].push({start: start, end: end, lesson: lesson});
            }
        }
    });
    
    people = Object.values(peopleObj);
}

function updateStatus() {
    const now = new Date();
    const currentDay = now.getDay();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    document.getElementById('current-day').innerText = `${dayNames[currentDay]}`;
    document.getElementById('current-time').innerText = `${currentTimeStr}`;

    const atSchoolList = document.getElementById('at-school-list');
    const notAtSchoolList = document.getElementById('not-at-school-list');

    atSchoolList.innerHTML = '';
    notAtSchoolList.innerHTML = '';

    people.forEach(person => {
        let isAtSchool = false;
        let currentLesson = "";
        const todaySchedule = person.schedule[currentDay];

        if (todaySchedule) {
            for (let slot of todaySchedule) {
                if (currentTimeStr >= slot.start && currentTimeStr < slot.end) {
                    isAtSchool = true;
                    currentLesson = slot.lesson;
                    break;
                }
            }
        }

        const li = document.createElement('li');

        if (isAtSchool) {
            // Aktif, derste olan kişi tasarımı
            li.className = 'person-card';
            li.innerHTML = `
                <div class="person-header">
                    <span class="person-name">${person.name}</span>
                </div>
                <div class="lesson-info">
                    <span>📚</span> <span><strong>Ders:</strong> ${currentLesson}</span>
                </div>
            `;
            atSchoolList.appendChild(li);
        } else {
            // Pasif, okulda olmayan kişi tasarımı
            li.className = 'person-card offline-card';
            li.innerHTML = `
                <div class="person-header">
                    <span class="person-name">${person.name}</span>
                </div>
            `;
            notAtSchoolList.appendChild(li);
        }
    });
}

fetchScheduleData();
setInterval(fetchScheduleData, 60000);