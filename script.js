// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.background = 'rgba(26, 26, 26, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.5)';
    } else {
        navbar.style.background = 'rgba(26, 26, 26, 0.95)';
        navbar.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// Filter functionality for card gallery
const filterButtons = document.querySelectorAll('.filter-btn');
const cardGallery = document.getElementById('cardGallery');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        const filter = button.getAttribute('data-filter');

        // Here you would filter the cards based on the selected filter
        // For now, we'll just show a message
        console.log(`Filtering by: ${filter}`);

        // Example of how you might filter cards when you have card data:
        // const cards = document.querySelectorAll('.card-item');
        // cards.forEach(card => {
        //     if (filter === 'all' || card.dataset.color === filter) {
        //         card.style.display = 'block';
        //     } else {
        //         card.style.display = 'none';
        //     }
        // });
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll(
        '.about-card, .rule-card, .archetype-card, .contact-card'
    );

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Card data structure example (you can expand this)
const sampleCards = [
    {
        name: "Emerald Bishop",
        cost: "2G",
        type: "Artifact Creature",
        power: 2,
        toughness: 4,
        text: "When Emerald Bishop enters the battlefield, designate a Bishop you control. When one leaves the battlefield or board, the other does as well. When this creature deals combat damage to an opponent, you may move the designated Bishop.",
        color: "green",
        rarity: "rare"
    }
    // Add more cards here as you create them
];

// Function to create card HTML
function createCardElement(card) {
    return `
        <div class="card-item" data-color="${card.color}" data-rarity="${card.rarity}">
            <div class="card-inner">
                <div class="card-header">
                    <h3 class="card-name">${card.name}</h3>
                    <span class="card-cost">${card.cost}</span>
                </div>
                <div class="card-image-placeholder">
                    <span class="card-type">${card.type}</span>
                </div>
                <div class="card-text">${card.text}</div>
                ${card.power !== undefined ? `
                    <div class="card-stats">${card.power}/${card.toughness}</div>
                ` : ''}
                <div class="card-rarity">${card.rarity.toUpperCase()}</div>
            </div>
        </div>
    `;
}

// Function to load cards into the gallery
function loadCards(cards = sampleCards) {
    if (cards.length === 0) return;

    cardGallery.innerHTML = cards.map(card => createCardElement(card)).join('');
}

// Uncomment this when you have card data to display
// loadCards();

// Mobile menu toggle (if needed in future)
const createMobileMenu = () => {
    const nav = document.querySelector('.nav-links');
    const menuBtn = document.createElement('button');
    menuBtn.classList.add('mobile-menu-btn');
    menuBtn.innerHTML = '☰';
    menuBtn.style.display = 'none';

    if (window.innerWidth <= 768) {
        menuBtn.style.display = 'block';
        document.querySelector('.nav-container').prepend(menuBtn);

        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
};

// Add parallax effect to hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroPattern = document.querySelector('.hero-chess-pattern');

    if (heroPattern) {
        heroPattern.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Easter egg: Konami code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode.splice(-konamiSequence.length - 1, konamiCode.length - konamiSequence.length);

    if (konamiCode.join('').includes(konamiSequence.join(''))) {
        document.body.style.animation = 'rainbow 2s infinite';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
    }
});

// Add dynamic card hover effects
document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.archetype-card, .about-card');

    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        } else {
            card.style.transform = '';
        }
    });
});

// Log a welcome message
console.log('%c♔ Welcome to Chess Magic! ♟', 'font-size: 20px; font-weight: bold; color: #CFB53B;');
console.log('%cWhere Strategy Meets Sorcery', 'font-size: 14px; color: #a0a0a0;');
