const API_BASE_URL = window.LINDA_API_URL || window.location.origin;
const FORMSPREE_ENDPOINT = window.LINDA_FORMSPREE_ENDPOINT || '';

// Automatically set the current year in the footer
const year = document.querySelector('#year');
if (year) {
  year.textContent = new Date().getFullYear();
}

// Mobile Navigation Toggle
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

mainNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

/**
 * General Form Submission Handler
 */
async function sendForm(form, statusEl, endpoint, successMessage) {
  statusEl.className = 'form-status';
  statusEl.textContent = 'Sending…';
  
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.errors?.join(' ') || 'Please review the form and try again.');
    }
    
    statusEl.className = 'form-status success';
    statusEl.textContent = data.message || successMessage;
    form.reset();
  } catch (error) {
    statusEl.className = 'form-status error';
    statusEl.textContent = error.message || 'Something went wrong. Please call 862-251-5847.';
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

/**
 * Formspree Booking Submission Handler
 */
async function sendBookingToFormspree(form, statusEl) {
  if (!FORMSPREE_ENDPOINT) {
    statusEl.className = 'form-status error';
    statusEl.textContent = 'Booking email is not connected yet. Please call 862-251-5847.';
    return;
  }

  statusEl.className = 'form-status';
  statusEl.textContent = 'Sending your booking request…';
  
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const formData = new FormData(form);
    formData.set('_subject', `Appointment request — ${formData.get('name')} — ${formData.get('service')}`);
    
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' }
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.errors?.map(err => err.message).join(' ') || 'Please review the form and try again.');
    }
    
    statusEl.className = 'form-status success';
    statusEl.textContent = 'Thank you! Your booking request was sent to Linda Spa. We will contact you by email to confirm your appointment.';
    form.reset();
  } catch (error) {
    statusEl.className = 'form-status error';
    statusEl.textContent = error.message || 'We could not send your request. Please call 862-251-5847.';
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

// Form Event Listeners
document.querySelector('#booking-form')?.addEventListener('submit', event => {
  event.preventDefault();
  sendBookingToFormspree(event.currentTarget, document.querySelector('#form-status'));
});

document.querySelector('#contact-form')?.addEventListener('submit', event => {
  event.preventDefault();
  sendForm(
    event.currentTarget, 
    document.querySelector('#contact-status'), 
    '/api/contact', 
    'Thank you! Your message has been sent. Our team will reply through email.'
  );
});

// Chat Assistant Widget Configuration & Logic
const chatPanel = document.querySelector('#chat-panel');
const chatMessages = document.querySelector('#chat-messages');
const chatInput = document.querySelector('#chat-input');

const chatResponses = {
  services: 'We offer Swedish Massage, Deep Tissue Therapy, Hot Stone & Hot Tub Sessions, Relaxing Body Treatments, Recovery Massage, and Customized Treatments.',
  prices: 'Our rates are $150 for 30 minutes, $250 for 1 hour, $300 for 2 hours, $400 for 3 hours, and $700 for an extended session.',
  booking: 'You can request an appointment using our short booking form. Choose your service, duration, preferred date and time, then click Submit. Your request will be sent automatically to Linda Spa.',
  contact: 'You can call or text Linda Spa at +1 (902) 277-4507, or send a message through the Contact section. We reply through email.',
  payment: 'Payment options are discussed after your booking request is reviewed. We do not collect payment credentials through this website.',
  unknown: 'I’d be happy to help you with that. Please send your message through our contact form and our team will review it and reply through email.'
};

function addChatMessage(text, type) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${type}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getChatAnswer(question) {
  const lower = question.toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) return chatResponses.prices;
  if (lower.includes('service') || lower.includes('massage')) return chatResponses.services;
  if (lower.includes('book') || lower.includes('appointment')) return chatResponses.booking;
  if (lower.includes('pay')) return chatResponses.payment;
  if (lower.includes('contact') || lower.includes('phone') || lower.includes('call')) return chatResponses.contact;
  return chatResponses.unknown;
}

// Chat UI Event Listeners
document.querySelector('#chat-launcher')?.addEventListener('click', () => {
  chatPanel.classList.toggle('open');
  if (chatPanel.classList.contains('open')) chatInput.focus();
});

document.querySelector('#chat-close')?.addEventListener('click', () => {
  chatPanel.classList.remove('open');
});

document.querySelectorAll('.chat-quick button').forEach(button => {
  button.addEventListener('click', () => {
    const questionKey = button.dataset.question;
    addChatMessage(button.textContent, 'user');
    setTimeout(() => addChatMessage(chatResponses[questionKey], 'assistant'), 250);
  });
});

document.querySelector('#chat-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  
  addChatMessage(text, 'user');
  chatInput.value = '';
  setTimeout(() => addChatMessage(getChatAnswer(text), 'assistant'), 250);
});

