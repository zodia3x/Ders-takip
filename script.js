
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

    // Üstteki saati tek bir rozet içinde temizce göster
    document.getElementById('datetime-display').innerText = `${dayNames[currentDay]} • ${currentTimeStr}`;

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

        const card = document.createElement('div');
        card.className = isAtSchool ? 'person-card' : 'person-card offline-card';
        
        // Karta tıklandığında pop-up (modal) açma özelliği
        card.onclick = () => showScheduleModal(person);

        let cardInnerHTML = `
            <div class="card-top">
                <span class="person-name">${person.name}</span>
                <span class="click-hint">Programı Gör ›</span>
            </div>
        `;

        if (isAtSchool) {
            cardInnerHTML += `
                <div class="lesson-info">
                    <span style="font-size: 16px;">📖</span> ${currentLesson}
                </div>
            `;
            card.innerHTML = cardInnerHTML;
            atSchoolList.appendChild(card);
        } else {
            card.innerHTML = cardInnerHTML;
            notAtSchoolList.appendChild(card);
        }
    });
}

// Modal (Pop-up) Kontrol Fonksiyonları
const modal = document.getElementById('schedule-modal');
const closeModalBtn = document.getElementById('close-modal');

function showScheduleModal(person) {
    document.getElementById('modal-name').innerText = person.name;
    const scheduleContainer = document.getElementById('modal-schedule-list');
    scheduleContainer.innerHTML = '';

    let hasAnyClass = false;

    // Hafta içi günleri döngüye al (Pazartesi=1, Cuma=5)
    for(let i=1; i<=5; i++) {
        if(person.schedule[i] && person.schedule[i].length > 0) {
            hasAnyClass = true;
            
            // Dersleri başlangıç saatine göre sırala
            const sortedClasses = person.schedule[i].sort((a, b) => a.start.localeCompare(b.start));
            
            let dayHTML = `
                <div class="schedule-day">
                    <div class="day-title">${dayNames[i]}</div>
            `;
            
            sortedClasses.forEach(cls => {
                dayHTML += `
                    <div class="day-class">
                        <span class="class-time">${cls.start} - ${cls.end}</span>
                        <span class="class-name">${cls.lesson}</span>
                    </div>
                `;
            });

            dayHTML += `</div>`;
            scheduleContainer.innerHTML += dayHTML;
        }
    }

    if(!hasAnyClass) {
        scheduleContainer.innerHTML = '<div class="no-class">Sisteme kayıtlı ders bulunamadı.</div>';
    }

    modal.classList.add('active');
}

// Çarpıya veya arka plana tıklayınca modalı kapat
closeModalBtn.onclick = () => modal.classList.remove('active');
window.onclick = (event) => {
    if (event.target == modal) {
        modal.classList.remove('active');
    }
}

fetchScheduleData();
setInterval(fetchScheduleData, 60000);