# Hub Interface - Color Implementation Plan

**Date:** 2026-08-18  
**Objective:** Replace ALL colors with official OP-1 palette

---

## 🎯 Quick Replacements

### Top-Level Changes (CSS + Root)

```css
/* Import palette */
@import './op1-palette.css';

/* HTML/Body */
body {
  background-color: var(--op1-bg-dark);      /* #383572 instead of white */
  color: var(--op1-text-primary);            /* #383572 instead of #111 */
}

/* Links */
a {
  color: var(--op1-primary);                 /* #00ed95 */
}

/* Selection */
::selection {
  background-color: var(--op1-primary);      /* #00ed95 */
  color: white;
}
```

---

## 📋 Component Audit Checklist

### [ ] TopBar Component
- [ ] Background: `#383572` (dark)
- [ ] Text: `#aeb1dc` (muted)
- [ ] Buttons: `#00ed95` (green primary)
- [ ] Hover: lighten to `#4d9eff` (blue alt)

### [ ] Navigation
- [ ] Active tab: `#00ed95` (green)
- [ ] Inactive: `#aeb1dc` (muted)
- [ ] Background: `#383572` (dark)

### [ ] Buttons (Global)
- [ ] Primary: `#00ed95` (green)
- [ ] Secondary: `#698eff` (blue)
- [ ] Danger: `#ff3a5d` (red)
- [ ] Ghost: `#dfd9ff` (light) + `#383572` (dark text)

### [ ] Cards/Panels
- [ ] Background: `#dfd9ff` (light)
- [ ] Border: `#383572` (dark)
- [ ] Text: `#383572` (dark)

### [ ] Input Fields
- [ ] Background: `#ffffff` (white)
- [ ] Border: `#383572` (dark)
- [ ] Focus: `#00ed95` (green border)
- [ ] Text: `#383572` (dark)

### [ ] Alerts/Notices
- [ ] Success: `#00ed95` (green)
- [ ] Warning: `#ff3a5d` (red)
- [ ] Info: `#698eff` (blue)
- [ ] Background: `#dfd9ff` (light)

### [ ] Gallery/Grid
- [ ] Selected: `#00ed95` (green background)
- [ ] Hover: `#4d9eff` (blue)
- [ ] Border: `#383572` (dark)

### [ ] Text Colors
- [ ] Primary text: `#383572` (dark)
- [ ] Secondary: `#aeb1dc` (muted)
- [ ] Disabled: `#9256d7` (background)

---

## 🔧 Implementation Strategy

### Phase A: CSS Foundation (30 min)
1. Create `/src/styles/op1-theme.css` (global overrides)
2. Import in main app
3. Test color variables work

### Phase B: Component Audit (2 hours)
1. ImageEditorOP1.tsx
2. FirmwareGallery.tsx
3. Landing.tsx
4. ToolsHub.tsx
5. Documentation pages

### Phase C: Replacements (3-4 hours)
Search & replace all inline styles:

```javascript
// FROM:
background: "#ff5a1f"
color: "#111"
borderColor: "#ebece6"

// TO:
background: "var(--op1-primary)"
color: "var(--op1-text-primary)"
borderColor: "var(--op1-border)"
```

### Phase D: Testing (1 hour)
1. Visual inspection
2. Color contrast check
3. Cross-component consistency
4. Screenshot comparison

---

## 🎨 Color Swatches for Reference

Create a **ColorReference** component:

```tsx
export function ColorReference() {
  const colors = [
    { name: "Primary (Green)", hex: "#00ed95", var: "--op1-primary" },
    { name: "Secondary (Blue)", hex: "#698eff", var: "--op1-secondary" },
    { name: "Danger (Red)", hex: "#ff3a5d", var: "--op1-danger" },
    { name: "Accent (White)", hex: "#dfd9ff", var: "--op1-accent" },
    { name: "Dark (Violet)", hex: "#383572", var: "--op1-dark" },
    { name: "Text", hex: "#aeb1dc", var: "--op1-text" },
    { name: "Background", hex: "#9256d7", var: "--op1-background" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
      {colors.map(c => (
        <div key={c.hex} style={{ background: c.hex, padding: "20px", textAlign: "center" }}>
          <strong>{c.name}</strong>
          <div>{c.hex}</div>
          <div style={{ fontSize: "11px" }}>{c.var}</div>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] All buttons are green/blue/red (not orange/gray)
- [ ] All text is dark violet or muted (not black)
- [ ] All backgrounds are light white or dark violet (not gray)
- [ ] All borders are dark violet (not black)
- [ ] Hover states use blue alt or encoder colors
- [ ] No generic web colors (#111, #999, #eee, etc.)
- [ ] CSS variables used everywhere (no hardcoded hex)
- [ ] Visual consistency across all pages
- [ ] Contrast ratios are accessible

---

## 📊 Color Distribution (Target)

After implementation:
- **Primary Green** (#00ed95): 10-15% (main actions)
- **Secondary Blue** (#698eff): 5-10% (alt actions)
- **Danger Red** (#ff3a5d): <5% (destructive only)
- **Accent White** (#dfd9ff): 20-30% (backgrounds)
- **Dark Violet** (#383572): 20-30% (text, borders)
- **Muted Text** (#aeb1dc): 10-15% (secondary text)

---

## 🎯 Success Criteria

1. ✅ No hardcoded colors (all use CSS variables)
2. ✅ 100% OP-1 palette compliance
3. ✅ Visually indistinguishable from real machine
4. ✅ All pages consistent
5. ✅ Accessible contrast ratios maintained

---

## 📝 Time Estimate

- CSS Setup: 30 min
- Audit: 1.5 hours
- Implementation: 3-4 hours
- Testing: 1 hour
- **Total: ~6-7 hours**

---

**Status:** Ready to implement. Awaiting go-ahead for systematic color replacement.
