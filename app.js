const API_BASE_URL = window.LINDA_API_URL || window.location.origin;
const FORMSPREE_ENDPOINT = window.LINDA_FORMSPREE_ENDPOINT || '';
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
menuToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

async function sendForm(form, statusEl, endpoint, successMessage) {
  statusEl.className = 'form-status';
  statusEl.textContent = 'Sending…';
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.join(' ') || 'Please review the form and try again.');
    statusEl.className = 'form-status success';
    statusEl.textContent = data.message || successMessage;
    form.reset();
  } catch (error) {
    statusEl.className = 'form-status error';
    statusEl.textContent = error.message || 'Something went wrong. Please call 862-251-5847.';
  } finally { if (button) button.disabled = false; }
}

async function sendBookingToFormspree(form, statusEl) {
  if (!FORMSPREE_ENDPOINT) {
    statusEl.className = 'form-status error';
    statusEl.textContent = 'Booking email is not connected yet. Please call 862-251-5847.';
    return;
  }
  statusEl.className = 'form-status';
  statusEl.textContent = 'Sending your booking request…';
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  try {
    const formData = new FormData(form);
    formData.set('_subject', `Appointment request — ${formData.get('name')} — ${formData.get('service')}`);
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.map(error => error.message).join(' ') || 'Please review the form and try again.');
    statusEl.className = 'form-status success';
    statusEl.textContent = 'Thank you! Your booking request was sent to Linda Spa. We will contact you by email to confirm your appointment.';
    form.reset();
  } catch (error) {
    statusEl.className = 'form-status error';
    statusEl.textContent = error.message || 'We could not send your request. Please call 862-251-5847.';
  } finally { if (button) button.disabled = false; }
}

document.querySelector('#booking-form')?.addEventListener('submit', event => {
  event.preventDefault();
  sendBookingToFormspree(event.currentTarget, document.querySelector('#form-status'));
});
document.querySelector('#contact-form')?.addEventListener('submit', event => {
  event.preventDefault();
  sendForm(event.currentTarget, document.querySelector('#contact-status'), '/api/contact', 'Thank you! Your message has been sent. Our team will reply through email.');
});

const panel = document.querySelector('#chat-panel');
const messages = document.querySelector('#chat-messages');
const chatInput = document.querySelector('#chat-input');
const responses = {
  services: 'We offer Swedish Massage, Deep Tissue Therapy, Hot Stone & Hot Tub Sessions, Relaxing Body Treatments, Recovery Massage, and Customized Treatments.',
  prices: 'Our rates are $150 for 30 minutes, $250 for 1 hour, $300 for 2 hours, $400 for 3 hours, and $700 for an extended session.',
  booking: 'You can request an appointment using our short booking form. Choose your service, duration, preferred date and time, then click Submit. Your request will be sent automatically to Linda Spa.',
  contact: 'You can call or text Linda Spa at 862-251-5847, or send a message through the Contact section. We reply through email.',
  payment: 'Payment options are discussed after your booking request is reviewed. We do not collect payment credentials through this website.',
  unknown: 'I’d be happy to help you with that. Please send your message through our contact form and our team will review it and reply through email.'
};
function addMessage(text, type) { const bubble = document.createElement('div'); bubble.className = `chat-bubble ${type}`; bubble.textContent = text; messages.appendChild(bubble); messages.scrollTop = messages.scrollHeight; }
function answer(question) { const lower = question.toLowerCase(); if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) return responses.prices; if (lower.includes('service') || lower.includes('massage')) return responses.services; if (lower.includes('book') || lower.includes('appointment')) return responses.booking; if (lower.includes('pay')) return responses.payment; if (lower.includes('contact') || lower.includes('phone') || lower.includes('call')) return responses.contact; return responses.unknown; }
document.querySelector('#chat-launcher')?.addEventListener('click', () => { panel.classList.toggle('open'); if (panel.classList.contains('open')) chatInput.focus(); });
document.querySelector('#chat-close')?.addEventListener('click', () => panel.classList.remove('open'));
document.querySelectorAll('.chat-quick button').forEach(button => button.addEventListener('click', () => { const question = button.dataset.question; addMessage(button.textContent, 'user'); setTimeout(() => addMessage(responses[question], 'assistant'), 250); }));
document.querySelector('#chat-form')?.addEventListener('submit', event => { event.preventDefault(); const text = chatInput.value.trim(); if (!text) return; addMessage(text, 'user'); chatInput.value = ''; setTimeout(() => addMessage(answer(text), 'assistant'), 250); });
