# OP-1 Official Color System for Hub Interface

**Date:** 2026-08-18  
**Source:** op1-glitter THEME_CREATION.md (verified on real machine)  
**Status:** Implementation Guide

---

## 🎨 Official Palette

All colors verified on real OP-1 machine by op1-glitter community tool.

### Encoders (Color-Coded)
```
🟢 GREEN    #00ed95    Encoder 1 - Primary action
🔴 RED      #ff3a5d    Encoder 4 - Danger/Delete
🔵 BLUE     #698eff    Encoder 2 - Secondary action
⚪ WHITE    #dfd9ff    Encoder 3 - Highlights/Accents
```

### Neutrals
```
⚪ WHITE       #ffffff     Light backgrounds
🔤 TEXT        #aeb1dc     Interface text
🟣 BACKGROUND  #9256d7     Screen backgrounds
🔵 ALT BLUE    #4d9eff     Alternative blue
⚫ DARK        #383572     Dark violet (borders, dark mode)
```

---

## 📋 CSS Token Mapping

See `/src/styles/op1-palette.css` for complete implementation.

```css
/* Root variables */
--op1-encoder-green: #00ed95;
--op1-encoder-red: #ff3a5d;
--op1-encoder-blue: #698eff;
--op1-encoder-white: #dfd9ff;

/* Derived UI tokens */
--op1-primary: var(--op1-encoder-green);      /* Main buttons */
--op1-secondary: var(--op1-encoder-blue);     /* Secondary actions */
--op1-danger: var(--op1-encoder-red);         /* Delete/warning */
--op1-text-primary: var(--op1-dark);          /* Main text */
--op1-text-secondary: var(--op1-text);        /* Muted text */
--op1-bg-light: var(--op1-encoder-white);     /* Light BG */
--op1-bg-dark: var(--op1-dark);               /* Dark BG */
```

---

## 🔄 Replacement Guide

### Old → New Colors

| Component | Old | New | Token |
|-----------|-----|-----|-------|
| Primary Button | #ff5a1f (orange) | #00ed95 | --op1-primary |
| Secondary | #698eff | #698eff ✓ | --op1-secondary |
| Danger/Delete | #ff5a5d | #ff3a5d | --op1-danger |
| Light BG | #ebece6 | #dfd9ff | --op1-bg-light |
| Dark BG | #111 | #383572 | --op1-bg-dark |
| Accent | #d9ff43 | #00ed95 | --op1-primary |
| Text | #111 | #aeb1dc | --op1-text-primary |
| Muted | #666 | #9256d7 | --op1-text-secondary |
| Border | #111 | #383572 | --op1-border |

---

## ✅ Implementation Checklist

- [ ] Import `op1-palette.css` in main app
- [ ] Audit all inline styles in components
- [ ] Replace hardcoded colors with CSS variables
- [ ] Update all buttons (primary/secondary/danger)
- [ ] Update all text colors
- [ ] Update all backgrounds
- [ ] Update all borders
- [ ] Test visual appearance
- [ ] Verify on real OP-1 machine if possible

---

## 📐 Color Usage Rules

1. **Primary Actions** (buttons, highlights)
   - Use `#00ed95` (green encoder)

2. **Secondary Actions** (alternate buttons)
   - Use `#698eff` (blue encoder)

3. **Danger/Delete** (warnings, delete buttons)
   - Use `#ff3a5d` (red encoder)

4. **Text** (labels, body text)
   - Primary: `#383572` (dark violet)
   - Secondary/muted: `#aeb1dc` (text color)

5. **Backgrounds**
   - Light: `#dfd9ff` (white encoder)
   - Dark: `#383572` (dark violet)
   - Alt: `#9256d7` (background purple)

6. **Borders**
   - Always: `#383572` (dark violet)

---

## 🎯 Design Principles

1. **Machine Authenticity**
   - Use ONLY colors from official OP-1 palette
   - Never use generic web colors (#111, #999, #eee)

2. **Color Meaning**
   - Green = affirmative/primary
   - Red = destructive/warning
   - Blue = secondary/alternative
   - White = highlights/special

3. **Consistency**
   - All components follow same color scheme
   - No exceptions for "design reasons"
   - CSS variables enforce consistency

4. **Accessibility**
   - High contrast maintained
   - Text color vs background always readable
   - No pure black on pure white (use machine colors)

---

## 📝 References

- op1-glitter THEME_CREATION.md
- FIRMWARE_MOD_RESOURCES.md
- OP1_IMAGE_BIBLE.md
- Machine verified: colors tested on real OP-1 device

---

## 🚀 Next Steps

1. Implement CSS variables in Hub
2. Audit and update all component colors
3. Create color swatches page for reference
4. Test on real OP-1 if available
5. Document any deviations with justification

---

**Status:** Color system defined. Ready for implementation in Hub components.
