const STORAGE_KEY = 'birthdays';
const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
const monthEmojis = ['❄️', '💝', '🌸', '🌷', '☀️', '🌻', '🎆', '🎈', '🍂', '🎃', '🍁', '🎄'];

let birthdays = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const form = document.getElementById('birthdayForm');
const nameInput = document.getElementById('name');
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const monthNameDisplay = document.getElementById('monthName');
const editIdInput = document.getElementById('editId');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const searchInput = document.getElementById('searchInput');
const monthFilter = document.getElementById('monthFilter');
const listContainer = document.getElementById('birthdayList');
const emptyState = document.getElementById('emptyState');
const statsContainer = document.getElementById('stats');

form.addEventListener('submit', handleSubmit);
searchInput.addEventListener('input', renderList);
monthFilter.addEventListener('change', renderList);
monthSelect.addEventListener('input', updateMonthName);

function updateMonthName() {
  const val = parseInt(monthSelect.value);
  if (val >= 1 && val <= 12) {
    monthNameDisplay.textContent = monthNames[val - 1];
  } else {
    monthNameDisplay.textContent = '';
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0].substring(0, 2);
}

function parseDate(dateStr) {
  const [d, m] = dateStr.split('/').map(Number);
  return { day: d, month: m };
}

function formatDate(dateStr) {
  const { day, month } = parseDate(dateStr);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

function formatDateArabic(dateStr) {
  const { day, month } = parseDate(dateStr);
  return `${day} ${monthNames[month - 1]}`;
}

function isToday(dateStr) {
  const today = new Date();
  const { day, month } = parseDate(dateStr);
  return today.getMonth() === month - 1 && today.getDate() === day;
}

function getNextBirthday(dateStr) {
  const today = new Date();
  const { day, month } = parseDate(dateStr);
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  const diff = thisYear - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function handleSubmit(e) {
  e.preventDefault();
  const name = nameInput.value.trim();
  const day = daySelect.value;
  const month = monthSelect.value;

  if (!name || !day || !month) return;

  const date = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  const editId = editIdInput.value;

  if (editId) {
    const idx = birthdays.findIndex(b => b.id === editId);
    if (idx !== -1) {
      birthdays[idx] = { ...birthdays[idx], name, date };
    }
    cancelEdit();
  } else {
    birthdays.push({ id: generateId(), name, date });
  }

  save();
  renderList();
  form.reset();
}

function cancelEdit() {
  editIdInput.value = '';
  submitBtn.textContent = 'إضافة';
  formTitle.textContent = 'إضافة عيد ميلاد جديد';
  cancelBtn.style.display = 'none';
  form.reset();
  monthNameDisplay.textContent = '';
}

function editBirthday(id) {
  const b = birthdays.find(x => x.id === id);
  if (!b) return;
  nameInput.value = b.name;
  const { day, month } = parseDate(b.date);
  daySelect.value = day;
  monthSelect.value = month;
  updateMonthName();
  editIdInput.value = b.id;
  submitBtn.textContent = 'تحديث';
  formTitle.textContent = 'تعديل عيد الميلاد';
  cancelBtn.style.display = 'inline-block';
  nameInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteBirthday(id) {
  if (!confirm('هل أنت متأكد من الحذف؟')) return;
  birthdays = birthdays.filter(b => b.id !== id);
  save();
  renderList();
}

function deleteAll() {
  if (!confirm('هل أنت متأكد من حذف جميع أعياد الميلاد؟')) return;
  birthdays = [];
  save();
  renderList();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(birthdays));
}

function exportData() {
  const dataStr = JSON.stringify(birthdays, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'birthdays.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        birthdays = data;
        save();
        renderList();
        alert('تم الاستيراد بنجاح!');
      } else {
        alert('الملف غير صالح');
      }
    } catch {
      alert('خطأ في قراءة الملف');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function getFilteredBirthdays() {
  const query = searchInput.value.trim().toLowerCase();
  const filterMonth = parseInt(monthFilter.value);

  return birthdays.filter(b => {
    const matchesName = b.name.toLowerCase().includes(query);
    const { month } = parseDate(b.date);
    const matchesMonth = filterMonth === 0 || month === filterMonth;
    return matchesName && matchesMonth;
  });
}

function renderList() {
  let filtered = getFilteredBirthdays();

  filtered.sort((a, b) => {
    const pa = parseDate(a.date);
    const pb = parseDate(b.date);
    return (pa.month - pb.month) || (pa.day - pb.day);
  });

  listContainer.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    statsContainer.textContent = '';
    return;
  }

  emptyState.style.display = 'none';
  const todayCount = filtered.filter(b => isToday(b.date)).length;
  statsContainer.textContent = `إجمالي الأعياد: ${filtered.length}${todayCount > 0 ? ` | أعياد اليوم: ${todayCount}` : ''}`;

  const groups = {};
  filtered.forEach(b => {
    const { month } = parseDate(b.date);
    if (!groups[month]) groups[month] = [];
    groups[month].push(b);
  });

  Object.keys(groups).sort((a, b) => a - b).forEach(month => {
    const m = parseInt(month);
    const group = document.createElement('div');
    group.className = 'month-group';

    const header = document.createElement('div');
    header.className = `month-header month-${m}`;
    header.innerHTML = `<span class="emoji">${monthEmojis[m - 1]}</span> ${monthNames[m - 1]} (${groups[m].length})`;
    group.appendChild(header);

    groups[m].forEach(b => {
      const today = isToday(b.date);
      const card = document.createElement('div');
      card.className = `birthday-card${today ? ' today' : ''}`;
      const nextDays = getNextBirthday(b.date);

      card.innerHTML = `
        <div class="birthday-info">
          <span class="birthday-name">${b.name} ${today ? '🎉' : ''}</span>
          <span class="birthday-date">
            <span>${formatDate(b.date)}</span>
            ${nextDays === 0 ? '<span>✨</span>' : `<span class="days-sep">–</span><span class="days-count" dir="rtl">${nextDays} يوم</span>`}
          </span>
        </div>
        <div class="birthday-actions">
          <button class="btn-edit" onclick="editBirthday('${b.id}')">✏️</button>
          <button class="btn-delete" onclick="deleteBirthday('${b.id}')">🗑️</button>
        </div>
      `;
      group.appendChild(card);
    });

    listContainer.appendChild(group);
  });
}

function saveAsPDF() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const dateStr = `${day}/${month}/${year} ${hours}:${minutes}`;
  document.getElementById('pdfDate').textContent = `Created: ${dateStr}`;
  document.body.classList.add('pdf-mode');
  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove('pdf-mode'), 500);
  }, 100);
}

function createConfetti() {
  const container = document.getElementById('confetti');
  const colors = ['#e74c3c', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#4caf50', '#ff9800', '#f44336'];
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 3 + 's';
    piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    container.appendChild(piece);
  }
}

createConfetti();
renderList();
