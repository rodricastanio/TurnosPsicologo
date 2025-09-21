// Navegación responsive
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Navegación suave al hacer clic en los enlaces
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      // Cerrar menú móvil si está abierto
      navLinks.classList.remove('active');
      
      // Scroll suave al elemento
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth'
      });
      
      // Actualizar clase activa en navegación
      document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
      });
      this.classList.add('active');
    }
  });
});

// Calendario de disponibilidad
const currentMonthElement = document.getElementById('currentMonth');
const calendarGrid = document.getElementById('calendarGrid');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const selectedDateElement = document.getElementById('selectedDate');
const slotsContainer = document.getElementById('slotsContainer');
const requestBtn = document.getElementById('requestBtn');

let currentDate = new Date();
let selectedDate = null;
let selectedTime = null;

// Días de la semana para el encabezado del calendario
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Generar encabezados de días de la semana
function generateCalendarHeaders() {
  weekDays.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-header');
    dayElement.textContent = day;
    calendarGrid.appendChild(dayElement);
  });
}

// Función para generar el calendario
function generateCalendar() {
  // Limpiar días existentes (excepto encabezados)
  while (calendarGrid.children.length > 7) {
    calendarGrid.removeChild(calendarGrid.lastChild);
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Actualizar texto del mes actual
  currentMonthElement.textContent = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  // Primer y último día del mes
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysInMonth = lastDay.getDate();
  const firstDayIndex = firstDay.getDay(); // 0=Dom

  // Completar huecos antes del día 1
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.classList.add('calendar-day', 'empty');
    calendarGrid.appendChild(emptyDay);
  }

  const today = new Date();

  for (let i = 1; i <= daysInMonth; i++) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day');
    dayElement.textContent = i;

    const dayDate = new Date(year, month, i);
    const dayOfWeek = dayDate.getDay(); // 0=Dom 6=Sab

    // Fines de semana no disponibles
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayElement.classList.add('unavailable');
    } else {
      // Disponible si coincide con el patrón de trabajo (sin lunes)
      if (isWorkingDayForDate(dayDate)) {
        dayElement.classList.add('available');
        dayElement.addEventListener('click', () => selectDate(dayDate, dayElement));
      } else {
        dayElement.classList.add('unavailable');
      }
    }

    // Resaltar el día actual
    if (dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getFullYear() === today.getFullYear()) {
      dayElement.style.fontWeight = 'bold';
      dayElement.style.border = '2px solid var(--primary)';
    }

    calendarGrid.appendChild(dayElement);
  }
}

function selectDate(date, element) {
  // Quitar selección anterior
  document.querySelectorAll('.calendar-day.selected').forEach(day => {
    day.classList.remove('selected');
  });
  
  // Marcar como seleccionado
  element.classList.add('selected');
  selectedDate = date;
  
  // Actualizar texto de fecha seleccionada
  selectedDateElement.textContent = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generar horarios disponibles
  generateTimeSlots();
  updateRequestButton();
}

// Función para generar horarios disponibles

// ---- Disponibilidad: solo remoto, sin lunes, y semanas alternadas ----
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  return weekNo;
}

function isWorkingDayForDate(date) {
  const day = date.getDay(); // 0=Dom .. 6=Sab
  if (day === 1) return false; // lunes no
  const week = getISOWeek(date);
  const allowed = (week % 2 === 0) ? [2,4] : [3,5]; // par: mar/jue | impar: mié/vie
  return allowed.includes(day);
}

function generateTimeSlots() {
  // Limpiar contenedor de horarios
  slotsContainer.innerHTML = '';
  if (!selectedDate) return;

  // Si la fecha no es un día trabajado, mostrar aviso y salir
  if (!isWorkingDayForDate(selectedDate)) {
    const p = document.createElement('p');
    p.textContent = 'No hay horarios disponibles para esta fecha. Agenda disponible en días habilitados.';
    p.style.color = 'var(--gray)';
    slotsContainer.appendChild(p);
    updateRequestButton();
    return;
  }

  // Horarios fijos (solo remoto)
  const morningSlots = ['09:00', '10:00', '11:00', '12:00'];
  const afternoonSlots = ['14:00', '15:00', '16:00', '17:00', '18:00'];
  const allSlots = [...morningSlots, ...afternoonSlots];

  for (const time of allSlots) {
    const timeSlot = document.createElement('div');
    timeSlot.classList.add('time-slot');
    timeSlot.textContent = time;

    timeSlot.addEventListener('click', function() {
      // Quitar selección anterior
      document.querySelectorAll('.time-slot.selected').forEach(slot => slot.classList.remove('selected'));
      this.classList.add('selected');

      // Guardar hora
      selectedTime = time;
      updateRequestButton();
    });

    slotsContainer.appendChild(timeSlot);
  }
}

// Navegación del calendario
prevMonthButton.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  generateCalendar();
  resetSelection();
});

nextMonthButton.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  generateCalendar();
  resetSelection();
});

// Función para resetear la selección al cambiar de mes
function resetSelection() {
  selectedDate = null;
  selectedTime = null;
  selectedDateElement.textContent = '';
  slotsContainer.innerHTML = '<p>Selecciona una fecha para ver los horarios disponibles.</p>';
  updateRequestButton();
}

// Inicializar calendario
generateCalendarHeaders();
generateCalendar();

// Efecto de aparición suave al hacer scroll
function initScrollReveal() {
  const elements = document.querySelectorAll('.service-card, .importance-card, .contact-card, .psychologist-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  
  elements.forEach(element => {
    element.style.opacity = 0;
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(element);
  });
}

// Iniciar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
  initScrollReveal();
});

// --- Solicitar (WhatsApp/Email) modal flow ---
const WHATSAPP_NUMBER = '5491154736494'; // E.164: 549 + área sin 0 + número sin 15

const requestModal = document.getElementById('requestModal');
const modalClose = document.getElementById('modalClose');
const summaryDateEl = document.getElementById('summaryDate');
const summaryTimeEl = document.getElementById('summaryTime');
const inputName = document.getElementById('inputName');
const inputNotes = document.getElementById('inputNotes');
const sendWhatsApp = document.getElementById('sendWhatsApp');
const sendEmail = document.getElementById('sendEmail');

function updateRequestButton() {
  const ready = (selectedDate && selectedTime);
  if (requestBtn) requestBtn.disabled = !ready;
}

function buildMessage() {
  const name = (inputName && inputName.value || '').trim();
  const mode = 'Remoto';
  const notes = (inputNotes && inputNotes.value || '').trim();
  const dateText = selectedDateElement.textContent || '';
  const timeText = selectedTime || '';
  const base = `Hola Nicolás, quiero solicitar un turno.\nFecha: ${dateText}\nHora: ${timeText}\nModalidad: ${mode}\nNombre: ${name}`;
  return notes ? base + `\nObservaciones: ${notes}` : base;
}

function refreshLinks() {
  const msg = buildMessage();
  if (sendWhatsApp) {
    sendWhatsApp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }
  if (sendEmail) {
    const subject = 'Solicitud de turno psicológico';
    // Crear enlace para Gmail web
    const gmailWebLink = `https://mail.google.com/mail/?view=cm&fs=1&to=nfrancioli93@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
    sendEmail.href = gmailWebLink;
    
    // También agregar funcionalidad de copiado al portapapeles
    sendEmail.setAttribute('data-clipboard-text', msg);
  }
}

if (requestBtn) {
  requestBtn.addEventListener('click', () => {
    // Prefill
    if (inputName) inputName.value = localStorage.getItem('req_name') || inputName.value || '';
    if (summaryDateEl) summaryDateEl.textContent = selectedDateElement.textContent || '';
    if (summaryTimeEl) summaryTimeEl.textContent = selectedTime || '';
    refreshLinks();
    if (requestModal) {
      requestModal.classList.remove('hidden');
      requestModal.classList.add('open');
    }
  });
}

[inputName, inputNotes].forEach(el => {
  if (!el) return;
  el.addEventListener('input', () => {
    if (el === inputName) localStorage.setItem('req_name', inputName.value.trim());
    refreshLinks();
  });
});

function closeModal() {
  if (!requestModal) return;
  requestModal.classList.remove('open');
  requestModal.classList.add('hidden');
}
if (modalClose) modalClose.addEventListener('click', closeModal);
if (requestModal) {
  requestModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && requestModal && requestModal.classList.contains('open')) closeModal();
});

// Delegate clicks in slots container to capture the chosen time
const slotsContainerEl = document.getElementById('slotsContainer');
if (slotsContainerEl) {
  slotsContainerEl.addEventListener('click', (e) => {
    const slot = e.target.closest('.time-slot');
    if (!slot) return;
    selectedTime = (slot.textContent || '').trim();
    if (summaryTimeEl) summaryTimeEl.textContent = selectedTime;
    updateRequestButton();
    refreshLinks();
  });
}

// When a calendar day is picked, update summary date
if (calendarGrid) {
  calendarGrid.addEventListener('click', (e) => {
    const day = e.target.closest('.calendar-day');
    if (!day || day.classList.contains('empty')) return;
    setTimeout(() => {
      if (summaryDateEl) summaryDateEl.textContent = selectedDateElement.textContent || '';
      updateRequestButton();
      refreshLinks();
    }, 0);
  });
}

// Funcionalidad para copiar al portapapeles
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Mostrar notificación de copiado
    const notification = document.createElement('div');
    notification.textContent = 'Información copiada al portapapeles';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }).catch(err => {
    console.error('Error al copiar: ', err);
  });
}

// Agregar evento para copiar al hacer clic prolongado en el botón de email
if (sendEmail) {
  let pressTimer;
  
  sendEmail.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => {
      copyToClipboard(buildMessage());
    }, 500); // 500ms de espera para clic prolongado
  });
  
  sendEmail.addEventListener('mouseup', () => {
    clearTimeout(pressTimer);
  });
  
  sendEmail.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
      copyToClipboard(buildMessage());
    }, 500);
  });
  
  sendEmail.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
  });
}