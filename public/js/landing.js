// ===== HERO SLIDER =====
const slides = document.querySelectorAll('.hero-slide');
if (slides.length > 0) {
  let currentSlide = 0;
  slides[currentSlide].classList.add('active');

  setInterval(() => {
    slides[currentSlide].classList.remove('active');
    slides[currentSlide].classList.add('exit');

    const oldSlide = currentSlide;
    setTimeout(() => {
      slides[oldSlide].classList.remove('exit');
    }, 1200);

    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 3000); // Wait 3 seconds before sliding again
}

// ===== CURSOR =====
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; });
function animRing() { rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(animRing); }
animRing();
document.querySelectorAll('a,button,.faq-q,.pillar,.outcome-card,.feat,.case').forEach(el => {
  el.addEventListener('mouseenter', () => { cursor.style.width = '20px'; cursor.style.height = '20px'; ring.style.width = '52px'; ring.style.height = '52px'; });
  el.addEventListener('mouseleave', () => { cursor.style.width = '12px'; cursor.style.height = '12px'; ring.style.width = '36px'; ring.style.height = '36px'; });
});

// ===== PARTICLES =====
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.5 - 0.1,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.4 + 0.05,
    char: ['🌾', '•', '·', '✦', '○'][Math.floor(Math.random() * 5)]
  }));
  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.globalAlpha = p.opacity;
      if (p.char === '•' || p.char === '·') {
        ctx.fillStyle = '#7AB648';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (p.char === '✦') {
        ctx.fillStyle = '#B8E04A'; ctx.font = `${p.size * 5}px serif`;
        ctx.fillText(p.char, p.x, p.y);
      } else {
        ctx.fillStyle = '#4A7C2F'; ctx.font = `${p.size * 6}px serif`;
        ctx.fillText(p.char, p.x, p.y);
      }
      p.x += p.vx; p.y += p.vy;
      if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
      if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawParticles);
  }
  drawParticles();
}

// ===== NAVBAR =====
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }
});

// ===== SCROLL REVEAL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), 5000);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.step,.outcome-card,.feat,.case,.testi').forEach((el, i) => {
  el.dataset.delay = (i % 4) * 120;
  observer.observe(el);
});

// ===== FAQ =====
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ===== FORM =====
async function handleSubmit(btn) {
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const phoneInput = document.getElementById('contact-phone');
  const sizeInput = document.getElementById('contact-farmsize');
  const msgInput = document.getElementById('contact-message');

  const payload = {
    name: nameInput ? nameInput.value.trim() : 'Guest',
    email: emailInput ? emailInput.value.trim() : 'unknown@example.com',
    phone: phoneInput ? phoneInput.value.trim() : '',
    farmSize: sizeInput ? sizeInput.value.trim() : '',
    message: msgInput ? msgInput.value.trim() : 'No message provided'
  };

  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      btn.textContent = '✅ Sent! We\'ll be in touch within 4 hours.';
      btn.style.background = '#166534';
      btn.style.color = 'white';

      // Clear form
      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (sizeInput) sizeInput.value = '';
      if (msgInput) msgInput.value = '';
    } else {
      btn.textContent = '❌ Failed to send';
      btn.style.background = '#DC2626';
      btn.style.color = 'white';
    }
  } catch (e) {
    btn.textContent = '❌ Network Error';
    btn.style.background = '#DC2626';
    btn.style.color = 'white';
  }

  // Restore button state after 4 seconds
  setTimeout(() => {
    btn.textContent = '🌱 Send Message & Get Demo';
    btn.style.background = '';
    btn.style.color = '';
    btn.disabled = false;
  }, 4000);
}

// ===== COUNTER ANIMATION =====
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const text = el.textContent;
    const num = parseFloat(text.replace(/[^0-9.]/g, ''));
    const prefix = text.match(/^[^0-9]*/)[0];
    const suffix = text.match(/[^0-9.]*$/)[0];
    let start = 0; const dur = 1800; const t0 = performance.now();
    function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (num < 10 ? (num * ease).toFixed(1) : Math.round(num * ease)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
const heroObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) { animateCounters(); heroObserver.disconnect(); }
}, { threshold: 0.5 });

const heroEl = document.getElementById('hero');
if (heroEl) heroObserver.observe(heroEl);
