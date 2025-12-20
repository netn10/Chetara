# Chess Magic Website

A beautiful, responsive website for the Chess Magic cube - where Magic: The Gathering meets Chess!

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Navigation**: Smooth scrolling between sections
- **Hero Section**: Eye-catching introduction with chess board pattern
- **About Section**: Explains what makes Chess Magic unique
- **Rules Section**: Step-by-step guide on how to play
- **Archetypes**: All 10 color pair strategies with hover effects
- **Card Gallery**: Ready-to-use structure for displaying your 180 cards (placeholder included)
- **Contact Section**: Call for artists and playtesters
- **Animated Elements**: Fade-in animations and hover effects throughout

## Quick Start

1. Open `index.html` in any modern web browser
2. No server or build process required - it's pure HTML, CSS, and JavaScript!

## File Structure

```
Website/
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── script.js           # Interactive features
└── README.md           # This file
```

## Customization

### Adding Your Card Images

To add your actual cards to the gallery:

1. Open `script.js`
2. Find the `sampleCards` array (around line 65)
3. Add your card data following this format:

```javascript
{
    name: "Card Name",
    cost: "2G",
    type: "Artifact Creature",
    power: 2,
    toughness: 4,
    text: "Card text here...",
    color: "green", // or "white", "blue", "black", "red", "multicolor", "artifact", "land"
    rarity: "rare" // or "common", "uncommon", "mythic"
}
```

4. Uncomment the `loadCards();` line at the bottom of the card data section

### Color Scheme

The website uses Magic: The Gathering's color palette defined in `styles.css`:

```css
--color-white: #F0E6D2;
--color-blue: #0E68AB;
--color-black: #150B00;
--color-red: #D3202A;
--color-green: #00733E;
--color-gold: #CFB53B;
```

### Adding Card Images

If you have card images, you can:

1. Create an `images/cards/` folder
2. Add your card images
3. Modify the `createCardElement` function in `script.js` to include:

```javascript
<img src="images/cards/${card.name.toLowerCase().replace(/\s/g, '-')}.jpg" alt="${card.name}">
```

## Sections Overview

### Navigation
- Fixed top navigation bar with smooth scroll
- Links to all major sections

### Hero
- Large title with gradient effect
- Call-to-action buttons
- Animated chess board pattern background

### About
- 4 key features in card format
- Story section explaining the project's origins

### Rules
- 6 numbered rule cards explaining gameplay
- Featured example: Emerald Bishop card

### Archetypes
- 10 color pair strategies
- Each card has hover effects
- Color-coded borders

### Card Gallery
- Filter buttons for all card types and colors
- Placeholder ready to be replaced with actual cards
- Grid layout that adapts to screen size

### Contact
- Artist recruitment
- Playtesting call
- Feedback invitation

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Future Enhancements

Ideas for expanding the website:

1. **Card Database**: Full searchable card list with filters
2. **Deck Builder**: Let users build and save decks online
3. **Play Online**: Integrate with a chess board API for online play
4. **Gallery**: Add community-submitted art
5. **Forum/Discord**: Community discussion integration
6. **Draft Simulator**: Practice drafting the cube
7. **Rules Details**: Expandable rules with examples
8. **Print Proxy**: Generate printable card sheets

## Hosting Options

To make your website public, you can use:

- **GitHub Pages**: Free hosting (recommended)
- **Netlify**: Free with continuous deployment
- **Vercel**: Free hosting with great performance
- **Neocities**: Free, retro-style hosting

### GitHub Pages Quick Setup:

1. Create a GitHub repository
2. Upload these files
3. Go to Settings > Pages
4. Select your main branch
5. Your site will be live at `yourusername.github.io/chess-magic`

## Credits

- **Concept**: Original Chess Magic cube design
- **Website**: Built with HTML5, CSS3, and vanilla JavaScript
- **Fonts**: Google Fonts (Cinzel & Lato)
- **Icons**: Unicode chess symbols

## License

This is a fan project for Magic: The Gathering. Magic: The Gathering is © Wizards of the Coast.

## Support

For questions, suggestions, or contributions, reach out through the contact section on the website!

---

**Thank you for checking out Chess Magic!** ♔♟✨
