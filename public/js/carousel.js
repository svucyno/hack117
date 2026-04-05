document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    let slideInterval;

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % totalSlides;
        slides[currentSlide].classList.add('active');
        updateDots();
    }

    function initSlider() {
        slides[0].classList.add('active');
        slideInterval = setInterval(nextSlide, 5000); // Change image every 5 seconds
        
        // Pause on hover
        const heroWrapper = document.querySelector('.hero-wrapper');
        heroWrapper.addEventListener('mouseenter', () => clearInterval(slideInterval));
        heroWrapper.addEventListener('mouseleave', () => {
            slideInterval = setInterval(nextSlide, 5000);
        });
    }

    // Build dots
    const dotsContainer = document.querySelector('.slider-dots');
    if (dotsContainer) {
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = index === 0 ? 'dot active' : 'dot';
            dot.addEventListener('click', () => {
                slides[currentSlide].classList.remove('active');
                currentSlide = index;
                slides[currentSlide].classList.add('active');
                updateDots();
                clearInterval(slideInterval);
                slideInterval = setInterval(nextSlide, 5000);
            });
            dotsContainer.appendChild(dot);
        });
    }

    function updateDots() {
        if (!dotsContainer) return;
        document.querySelectorAll('.dot').forEach((dot, index) => {
            if (index === currentSlide) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    initSlider();
});
