// DOM Elements
const header = document.getElementById('header');
const headerToggle = document.getElementById('headerToggle');
const headerMenu = document.getElementById('headerMenu');
const menuLinks = document.querySelectorAll('.header__menu-link');
const hamburgers = document.querySelectorAll('.header__hamburger');
const contactForm = document.getElementById('contactForm');
const submitBtn = document.querySelector('.contact__submit-btn');
const skillBars = document.querySelectorAll('.skills__progress');
const fadeElements = document.querySelectorAll('.fade-in');
const scrollTopBtn = document.querySelector('.footer__scroll-top');
const scrollIndicator = document.querySelector('.hero__scroll-indicator');

// Header scroll effect
window.addEventListener('scroll', () => {
    const logo = document.querySelector('.header__brand-logo');
    if (window.scrollY > 50) {
        header.classList.add('header--scrolled');
        if (logo) logo.classList.add('scrolled');
    } else {
        header.classList.remove('header--scrolled');
        if (logo) logo.classList.remove('scrolled');
    }
});

// Mobile navigation toggle
if (headerToggle && headerMenu) {
    headerToggle.addEventListener('click', () => {
        headerMenu.classList.toggle('header__menu--active');
        headerToggle.classList.toggle('header__toggle--active');
    });
}

// Close mobile menu when clicking on a link
menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        headerMenu.classList.remove('header__menu--active');
        headerToggle.classList.remove('header__toggle--active');
    });
});

// Smooth scrolling for navigation links
function scrollToSection(targetId) {
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
        const headerHeight = header.offsetHeight;
        const targetPosition = targetElement.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Add click event listeners to navigation links
menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        scrollToSection(targetId);
    });
});

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add click event to scroll indicators
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection('#about');
    });
}

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToTop();
    });
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in--visible');
            
            // Animate skill bars when skills section is visible
            if (entry.target.id === 'skills') {
                animateSkillBars();
            }
        }
    });
}, observerOptions);

// Observe fade-in elements
fadeElements.forEach(element => {
    observer.observe(element);
});

// Observe sections for skill bar animation
const skillsSection = document.getElementById('skills');
if (skillsSection) {
    observer.observe(skillsSection);
}

// Animate skill bars
function animateSkillBars() {
    skillBars.forEach((bar, index) => {
        const level = bar.getAttribute('data-level');
        setTimeout(() => {
            bar.style.width = level + '%';
        }, index * 100);
    });
}

// Popup functionality
function showPopup(title, message, type = 'default') {
    // Remove existing popup
    const existingPopup = document.querySelector('.popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = `popup popup--${type}`;
    popup.innerHTML = `
        <div class="popup__container">
            <div class="popup__header">
                <h3 class="popup__title">${title}</h3>
                <button class="popup__close" aria-label="Close popup">×</button>
            </div>
            <div class="popup__content">
                <p>${message}</p>
            </div>
            <div class="popup__actions">
                <button class="popup__btn popup__btn--primary">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Show popup
    setTimeout(() => {
        popup.classList.add('popup--active');
    }, 10);
    
    // Close popup functionality
    const closeBtn = popup.querySelector('.popup__close');
    const okBtn = popup.querySelector('.popup__btn--primary');
    
    function closePopup() {
        popup.classList.remove('popup--active');
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
    
    closeBtn.addEventListener('click', closePopup);
    okBtn.addEventListener('click', closePopup);
    
    // Close on backdrop click
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closePopup();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Add hover effects to project cards
document.querySelectorAll('.projects__card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Add click effects to buttons (ripple effect)
document.querySelectorAll('.hero__btn, .contact__social-btn, .projects__link, .projects__view-more-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape' && headerMenu.classList.contains('header__menu--active')) {
        headerMenu.classList.remove('header__menu--active');
        headerToggle.classList.remove('header__toggle--active');
    }
    
    // Enter key on navigation links
    if (e.key === 'Enter' && e.target.classList.contains('header__menu-link')) {
        e.target.click();
    }
});

// Lazy loading for images
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
        }
    });
});

images.forEach(img => imageObserver.observe(img));

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced scroll handler for better performance
const debouncedScrollHandler = debounce(() => {
    // Additional scroll-based animations can be added here
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Initialize animations on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add initial fade-in class to elements
    fadeElements.forEach((element, index) => {
        element.style.transitionDelay = `${index * 0.1}s`;
    });
    
    // Set skill bar data attributes
    const skillData = [
        { selector: '[data-skill="html"]', level: 95 },
        { selector: '[data-skill="css"]', level: 90 },
        { selector: '[data-skill="javascript"]', level: 92 },
        { selector: '[data-skill="typescript"]', level: 88 },
        { selector: '[data-skill="react"]', level: 93 },
        { selector: '[data-skill="vue"]', level: 82 },
        { selector: '[data-skill="nodejs"]', level: 90 },
        { selector: '[data-skill="express"]', level: 88 },
        { selector: '[data-skill="python"]', level: 85 },
        { selector: '[data-skill="postgresql"]', level: 87 },
        { selector: '[data-skill="mongodb"]', level: 83 },
        { selector: '[data-skill="graphql"]', level: 80 },
        { selector: '[data-skill="git"]', level: 95 },
        { selector: '[data-skill="docker"]', level: 82 },
        { selector: '[data-skill="aws"]', level: 78 },
        { selector: '[data-skill="webpack"]', level: 85 },
        { selector: '[data-skill="testing"]', level: 88 },
        { selector: '[data-skill="figma"]', level: 80 },
        { selector: '[data-skill="illustrator"]', level: 100 },
        { selector: '[data-skill="photoshop"]', level: 100 },
        { selector: '[data-skill="branding"]', level: 100 }
    ];
    
    skillData.forEach(skill => {
        const element = document.querySelector(skill.selector);
        if (element) {
            element.setAttribute('data-level', skill.level);
        }
    });
});

// Error handling for external links
document.querySelectorAll('a[href^="http"]').forEach(link => {
    link.addEventListener('click', (e) => {
        // Add target="_blank" and security attributes for external links
        if (!link.hasAttribute('target')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
});

window.addEventListener('scroll', function() {
    const logo = document.querySelector('.header__brand-logo');
    if (window.scrollY > 50) {
      logo.classList.add('scrolled');
    } else {
      logo.classList.remove('scrolled');
    }
  });

// Console message for developers
console.log(`
🚀 Welcome to Rodney Parker's Portfolio!
📧 Contact: rodney.parker@example.com
💼 LinkedIn: https://linkedin.com/in/rodneyparker
🐙 GitHub: https://github.com/rodneyparker

Built with vanilla HTML, CSS, and JavaScript following BEM methodology
Optimized for performance and accessibility
`);