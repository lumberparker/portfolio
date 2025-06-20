# Rodney Parker - Full Stack Developer Portfolio

A modern, responsive portfolio website built following BEM methodology with pure HTML, CSS, and JavaScript showcasing professional web development skills and projects.

## 🏗️ Project Structure

This project follows BEM (Block Element Modifier) methodology for CSS organization and maintains a clear separation of concerns.

```
portfolio/
├── index.html              # Main HTML file
├── index.css               # Main CSS file (imports all blocks)
├── README.md               # Project documentation
├── blocks/                 # BEM blocks directory
│   ├── header/
│   │   └── header.css      # Header component styles
│   ├── hero/
│   │   └── hero.css        # Hero section styles
│   ├── about/
│   │   └── about.css       # About section styles
│   ├── skills/
│   │   └── skills.css      # Skills section styles
│   ├── projects/
│   │   └── projects.css    # Projects section styles
│   ├── contact/
│   │   └── contact.css     # Contact section styles
│   ├── footer/
│   │   └── footer.css      # Footer component styles
│   └── popup/
│       └── popup.css       # Popup component styles
├── images/                 # Images and visual assets
└── scripts/
    └── index.js            # Main JavaScript file
```

## 🎯 BEM Methodology

This project strictly follows BEM (Block Element Modifier) naming convention:

### Block
Independent component that can be reused anywhere.
```css
.header { }
.hero { }
.projects { }
```

### Element
Part of a block that has no standalone meaning.
```css
.header__nav { }
.header__menu { }
.hero__title { }
.projects__card { }
```

### Modifier
Flags on blocks or elements that change appearance or behavior.
```css
.header--scrolled { }
.hero__btn--primary { }
.popup--active { }
```

## 🚀 Features

- **BEM Methodology**: Clean, maintainable CSS architecture
- **Responsive Design**: Optimized for all devices from mobile to desktop
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Interactive Elements**: Hover effects, smooth scrolling, and dynamic content
- **Performance Optimized**: Fast loading times with efficient code
- **Accessibility**: WCAG compliant with proper semantic HTML
- **Cross-browser Compatible**: Works across all modern browsers

## 📋 Sections

### 🏠 Hero Section (`blocks/hero/`)
- Professional introduction with animated background
- Call-to-action buttons for projects and resume
- Social media links
- Smooth scroll indicator

### 👨‍💻 About Section (`blocks/about/`)
- Professional journey and background
- Education and certifications
- Core values and principles
- Interactive value cards with hover effects

### 🛠️ Skills Section (`blocks/skills/`)
- Technical skills with animated progress bars
- Categorized by Frontend, Backend, and Tools
- Additional technologies showcase
- Visual skill level indicators

### 💼 Projects Section (`blocks/projects/`)
- 6 featured projects with detailed information
- Project images with overlay effects
- Technology stacks and key features
- Live demo and GitHub repository links
- Project statistics and metrics

### 📞 Contact Section (`blocks/contact/`)
- Multiple contact methods
- Working contact form with validation
- Social media links
- Current availability status
- Professional contact information

### 🔗 Footer (`blocks/footer/`)
- Professional branding
- Scroll to top functionality
- Copyright information
- Technology credits

### 🎭 Popup Component (`blocks/popup/`)
- Reusable popup component
- Success and error states
- Accessible with keyboard navigation
- Backdrop and escape key closing

## 🎨 Design Features

- **Color Scheme**: Professional blue and teal gradient theme
- **Typography**: Inter font family for modern readability
- **Animations**: CSS animations and JavaScript interactions
- **Layout**: CSS Grid and Flexbox for responsive layouts
- **Icons**: Inline SVG icons for crisp display
- **Images**: High-quality stock photos from Pexels

## 🔧 Technical Implementation

### HTML
- Semantic HTML5 structure following BEM naming
- Proper accessibility attributes
- SEO optimized meta tags
- Open Graph and Twitter Card support

### CSS (BEM Architecture)
- Modular CSS organization with separate files for each block
- Modern CSS3 features
- CSS Grid and Flexbox layouts
- Custom animations and transitions
- Responsive design with media queries
- CSS custom properties for theming

### JavaScript
- Vanilla JavaScript (no frameworks)
- Smooth scrolling navigation
- Form validation and submission with popup feedback
- Intersection Observer for animations
- Mobile menu functionality
- Performance optimizations

## 📱 Responsive Breakpoints

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px and above

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📈 Performance Features

- Optimized images and assets
- Efficient CSS and JavaScript
- Lazy loading for images
- Debounced scroll events
- Minimal HTTP requests

## 🎯 SEO Optimization

- Semantic HTML structure
- Meta tags and descriptions
- Open Graph protocol
- Twitter Card support
- Proper heading hierarchy
- Alt text for images

## ♿ Accessibility Features

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Focus indicators
- Semantic markup

## 🚀 Getting Started

1. Clone or download the repository
2. Open `index.html` in your web browser
3. No build process required - it's pure HTML, CSS, and JavaScript!

## 🔄 Customization

To customize this portfolio for your own use:

1. **Personal Information**: Update name, title, and contact details in `index.html`
2. **Projects**: Replace project data with your own work
3. **Skills**: Modify skill levels and technologies in `scripts/index.js`
4. **Images**: Replace profile photo and project images in `images/` directory
5. **Colors**: Adjust CSS custom properties in individual block files
6. **Content**: Update all text content to reflect your experience

## 📧 Contact Form

The contact form includes:
- Client-side validation
- Email format validation
- Required field checking
- Loading states and feedback with popup notifications
- Form reset after submission

*Note: The form currently simulates submission. For production use, integrate with a backend service or form handling service.*

## 🎨 Color Palette

- **Primary Blue**: #3b82f6
- **Secondary Teal**: #0891b2
- **Dark Blue**: #1e40af
- **Light Blue**: #dbeafe
- **Gray Scale**: #1f2937 to #f9fafb

## 📱 Mobile Features

- Touch-friendly navigation
- Optimized button sizes
- Readable typography
- Fast loading on mobile networks
- Swipe-friendly interactions

## 🔍 SEO Keywords

Web developer, full stack developer, JavaScript, React, Node.js, portfolio, HTML, CSS, responsive design, modern web development, Rodney Parker

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Feel free to fork this project and customize it for your own portfolio. If you make improvements that could benefit others, pull requests are welcome!

## 📞 Support

For questions or support, please contact:
- Email: rodney@berriesandmango.com
- LinkedIn:[https://www.linkedin.com/in/rodney-p-3a2b73136] (https://www.linkedin.com/in/rodney-p-3a2b73136)
- GitHub: [github.com/lumberparker](https://github.com/lumberparker)

---

**Built with ❤️ using HTML, CSS, and JavaScript following BEM methodology**