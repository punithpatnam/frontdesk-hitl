# Frontdesk Supervisor UI - Design System

## 🎨 Black & White Color System

### Design Philosophy

This design system embraces a sophisticated black and white aesthetic that prioritizes:

- **Clarity**: High contrast between black and white ensures excellent readability
- **Timelessness**: Black and white designs never go out of style
- **Accessibility**: Maximum contrast ratios for better accessibility
- **Professionalism**: Clean, minimalist appearance suitable for business applications
- **Focus**: Eliminates color distractions, allowing users to focus on content

### Key Design Principles

1. **Pure Contrast**: Use pure black (#000000) and pure white (#ffffff) as primary colors
2. **Subtle Grays**: Use carefully selected gray tones for secondary elements
3. **Typography First**: Let typography and spacing create visual hierarchy
4. **Minimal Shadows**: Use subtle shadows to create depth without color
5. **Bold Accents**: Use black borders and backgrounds for emphasis

### CSS Variables Reference

```css
/* Primary Brand Colors - Black & White Theme */
--primary-600: #000000;  /* Main brand color - Pure black */
--primary-700: #000000;  /* Hover states - Pure black */
--primary-800: #000000;  /* Dark accent - Pure black */

/* Neutral Grays - Black & White Scale */
--gray-50: #ffffff;   /* Pure white */
--gray-100: #f8f8f8;  /* Very light gray */
--gray-200: #e8e8e8;  /* Light gray borders */
--gray-300: #d0d0d0;  /* Medium gray borders */
--gray-400: #a0a0a0;  /* Disabled text */
--gray-500: #808080;  /* Tertiary text */
--gray-600: #606060;  /* Secondary text */
--gray-700: #404040;  /* Dark secondary */
--gray-800: #202020;  /* Near black */
--gray-900: #000000;  /* Primary text - Pure black */

/* Success - Black & White Theme */
--success-50: #f0f0f0;   /* Light background */
--success-500: #404040; /* Standard */
--success-600: #202020; /* Main success color */
--success-700: #000000; /* Dark success */

/* Error - Black & White Theme */
--error-50: #f0f0f0;    /* Light background */
--error-500: #404040;   /* Standard */
--error-600: #202020;   /* Main error color */
--error-700: #000000;   /* Dark error */

/* Warning - Black & White Theme */
--warning-50: #f0f0f0;  /* Light background */
--warning-500: #404040; /* Standard */
--warning-600: #202020; /* Main warning */

/* Info - Black & White Theme */
--info-50: #f0f0f0;     /* Light background */
--info-500: #404040;    /* Standard */
--info-600: #202020;    /* Main info */
```

---

## 🎯 Semantic Colors

### Backgrounds
```css
--bg-primary: #ffffff;     /* Main content background - Pure white */
--bg-secondary: #f8f8f8;   /* Subtle sections - Very light gray */
--bg-tertiary: #f0f0f0;    /* Hover states - Light gray */
```

### Borders
```css
--border-light: #e8e8e8;  /* Default borders - Light gray */
--border-medium: #d0d0d0; /* Hover borders - Medium gray */
```

### Text Colors
```css
--text-primary: #000000;     /* Main text - Pure black */
--text-secondary: #606060;   /* Supporting text - Medium gray */
--text-tertiary: #808080;     /* De-emphasized text - Light gray */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.08);
--shadow-md: 0 2px 4px 0 rgb(0 0 0 / 0.12);
--shadow-lg: 0 4px 8px 0 rgb(0 0 0 / 0.16);
```

---

## 📐 Spacing Scale

Use multiples of 4px for consistent spacing:

| Value | Usage |
|-------|-------|
| 4px | Tight gaps (label-to-input) |
| 6px | Small inner spacing |
| 8px | Small gaps between related items |
| 12px | Medium gaps (cards, form fields) |
| 16px | Large gaps (sections) |
| 20px | Card padding |

---

## 🔤 Typography

### Font Family
```css
font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 
             Roboto, Ubuntu, Cantarell, sans-serif;
```

### Font Sizes
| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| h2 | 24px | 600 | Page titles |
| h3 | 18px | 600 | Section headers |
| Body | 14px | 400 | Default text |
| .label | 14px | 600 | Form labels |
| .small | 13px | 400 | Secondary info |
| .mono | 13px | 400 | Code/IDs |

### Line Heights
- **Headings**: 1.2
- **Body**: 1.5
- **Small text**: 1.4

---

## 🎭 Components

### Button Classes

#### Primary Button
```tsx
<button className="btn btn-primary">
  Primary Action
</button>
```
- Background: `#000000` (Pure black)
- Hover: `#404040` (Dark gray with elevation)
- Color: White
- Padding: 10px 16px
- Font Weight: 600

#### Secondary Button
```tsx
<button className="btn">
  Secondary Action
</button>
```
- Background: White
- Border: `#e8e8e8` (Light gray)
- Hover: `#f0f0f0` (Light gray)
- Padding: 10px 16px

#### Disabled State
```tsx
<button className="btn btn-primary" disabled>
  Disabled
</button>
```
- Opacity: 0.5
- Cursor: not-allowed
- Background (primary): `#a0a0a0` (Medium gray)

---

### Badge Classes

#### Status Badges
```tsx
<span className="badge badge-pending">pending</span>
<span className="badge badge-resolved">resolved</span>
<span className="badge badge-unresolved">unresolved</span>
```

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| pending | #f0f0f0 | #404040 | #d0d0d0 (dashed) |
| resolved | #000000 | #ffffff | #000000 |
| unresolved | #ffffff | #000000 | #000000 (2px) |

#### Generic Badge
```tsx
<span className="badge">Default</span>
```
- Background: `var(--gray-100)`
- Text: `var(--text-secondary)`
- Border-radius: 9999px (pill shape)

---

### Form Controls

#### Input
```tsx
<input className="input" type="text" placeholder="Enter text..." />
```

#### Textarea
```tsx
<textarea className="input" rows={4}></textarea>
```

#### Select
```tsx
<select className="input">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

**Features:**
- Custom dropdown arrow (SVG)
- Border radius: 8px
- Padding: 10px 12px
- Focus ring: 3px primary-600 with 10% opacity

#### Label
```tsx
<label className="label">
  Field Name
  <input className="input" type="text" />
</label>
```

---

### Card Component

```tsx
<div className="card">
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</div>
```

**Styles:**
- Padding: 20px
- Border-radius: 12px
- Border: 1px solid `var(--border-light)`
- Shadow: `var(--shadow-sm)`
- Hover shadow: `var(--shadow-md)`

---

### Layout Classes

#### Row
```tsx
<div className="row">
  <span>Item 1</span>
  <span>Item 2</span>
</div>
```
- Display: flex
- Gap: 12px
- Align-items: center
- Flex-wrap: wrap

#### Container
```tsx
<div className="container">
  <!-- Page content -->
</div>
```
- Max-width: 1200px
- Margin: 0 auto
- Padding: 20px

---

## 🎨 Utility Classes

### Text Colors
```tsx
<span className="text-success">Success message</span>
<span className="text-error">Error message</span>
<span className="text-warning">Warning message</span>
<span className="text-info">Info message</span>
```

### Background Colors
```tsx
<div className="bg-success">Success background</div>
<div className="bg-error">Error background</div>
<div className="bg-warning">Warning background</div>
<div className="bg-info">Info background</div>
```

### Typography
```tsx
<span className="small">Small text</span>
<code className="mono">Monospace text</code>
```

---

## 🎬 Animations

### Available Keyframes

#### Slide In (Toast)
```css
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

#### Pulse (Loading indicators)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### Spin (Loading spinner)
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## ♿ Accessibility Guidelines

### Focus States
- All interactive elements have visible focus rings
- Focus ring: 3px solid with 10% opacity of primary color
- Never remove outline without replacement

### Color Contrast
- Text on white: Minimum AA contrast (4.5:1)
- Primary text: `#111827` on `#ffffff` = 16.8:1 ✅
- Secondary text: `#4b5563` on `#ffffff` = 7.7:1 ✅

### Interactive Sizing
- Minimum touch target: 44x44px
- Button padding ensures comfortable interaction
- Checkbox size: 16x16px

### Semantic HTML
```tsx
// Use proper semantic elements
<button> for actions
<a> for navigation
<label> for form fields
<h1-h6> for headings
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  .container { padding: 12px; }
  .card { padding: 16px; }
  h2 { font-size: 20px; }
}
```

---

## 🎯 Usage Examples

### Page Header
```tsx
<div style={{ marginTop: 16, display: "grid", gap: 16 }}>
  <h2>Page Title</h2>
  
  <div className="row" style={{ justifyContent: "space-between" }}>
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="small" style={{ fontWeight: 600 }}>Filter</span>
      <select>
        <option value="all">All Items</option>
      </select>
    </label>
    {loading && <div className="small" style={{ color: "var(--info-600)" }}>Loading...</div>}
  </div>
</div>
```

### Card List
```tsx
<div style={{ display: "grid", gap: 12 }}>
  {items?.map(item => (
    <div key={item.id} className="card">
      <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: 6 }}>
        {item.title}
      </div>
      <div className="small">{item.description}</div>
    </div>
  ))}
</div>
```

### Status Badge
```tsx
<span className={`badge badge-${status}`}>
  {status}
</span>
```

### Form with Validation
```tsx
<form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
  <label>
    <div className="label">Email Address</div>
    <input 
      className="input" 
      type="email" 
      required
      style={{ marginTop: 4 }}
    />
  </label>
  
  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
    <button type="button" className="btn">Cancel</button>
    <button type="submit" className="btn btn-primary">Submit</button>
  </div>
</form>
```

---

## 🔄 Migration Guide

### Replacing Hardcoded Colors

**Before:**
```tsx
<button style={{ background: "#10B981", color: "#fff" }}>
  Submit
</button>
```

**After:**
```tsx
<button className="btn btn-primary">
  Submit
</button>
```

### Replacing Inline Styles

**Before:**
```tsx
<div style={{ 
  padding: "16px", 
  borderRadius: "8px", 
  border: "1px solid #e5e7eb" 
}}>
  Content
</div>
```

**After:**
```tsx
<div className="card">
  Content
</div>
```

---

## 📊 Design Tokens Summary

| Category | Count | Examples |
|----------|-------|----------|
| Colors | 40+ | Primary, Gray scale, Semantic |
| Spacing | 6 | 4px, 8px, 12px, 16px, 20px, 24px |
| Typography | 7 | h2, h3, body, label, small, mono |
| Shadows | 3 | sm, md, lg |
| Border Radius | 3 | 8px, 12px, 9999px (pill) |
| Transitions | 2 | 0.15s, 0.2s |

---

## ✅ Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Use semantic classes** (.btn-primary, .badge-success)
3. **Follow spacing grid** (multiples of 4px)
4. **Include hover/focus states** for all interactive elements
5. **Test with keyboard navigation** (Tab, Enter, Space)
6. **Verify color contrast** for accessibility
7. **Use optional chaining** for array operations (`items?.map`)
8. **Provide loading states** for async operations
9. **Add tooltips** for icon-only buttons
10. **Test on mobile** (< 768px width)

---

**Version**: 1.0  
**Last Updated**: October 20, 2025  
**Status**: ✅ Production Ready
