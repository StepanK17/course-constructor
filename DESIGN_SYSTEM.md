# LLM Course Builder - Design System Documentation

## Overview
A minimalist, learning-focused web application for creating and consuming AI-generated courses. Inspired by Stepik's interface structure with a clean, product-like aesthetic.

---

## 1. Information Architecture

### App Sections
```
├─ Course Library (Home)
│  ├─ Course Cards
│  ├─ Search & Filters
│  └─ Create Course CTA
│
├─ Course Creation Wizard
│  ├─ Topic Input
│  ├─ Learning Goals
│  ├─ Configuration (level, duration, language)
│  └─ Source Preferences
│
├─ Lesson View (Main Learning Interface)
│  ├─ Left Sidebar: Module/Lesson Navigation
│  ├─ Top Bar: Progress & Actions
│  ├─ Main Content: Theory/Practice/Quiz/Sources
│  └─ Bottom Navigation: Previous/Next
│
└─ Settings (Future)
   ├─ Course Preferences
   ├─ Learning Pace
   └─ Notifications
```

---

## 2. Key User Flows

### A) Course Creation Flow
1. **Entry**: Click "Create Course" button in library
2. **Form**: Enter topic, learning goal, configure parameters
3. **Generation**: AI processes request (loading state)
4. **Result**: Navigate to course library with new course added

### B) Lesson Learning Flow
1. **Entry**: Select course from library
2. **Start**: Auto-navigate to first incomplete lesson
3. **Learn**: Read theory → Complete practice → Take quiz → Review sources
4. **Progress**: Mark complete → Auto-advance to next lesson
5. **Exit**: Return to library (progress saved)

### C) Task/Quiz Completion Flow
- **Practice**: Write solution → Submit → Receive AI feedback → Review
- **Quiz**: Answer questions → Submit → See explanation → Next question → View results

---

## 3. Wireframe Descriptions

### Course Library (Desktop)
```
┌─────────────────────────────────────────────────────────┐
│ Header                                                  │
│ ┌─────────────────────┐         ┌─────────────────┐   │
│ │ My Courses          │         │ + Create Course │   │
│ │ Subtitle            │         └─────────────────┘   │
│ └─────────────────────┘                               │
│                                                         │
│ ┌─────────────┬───────────┬───────────┐              │
│ │ Search...   │ Status ▾  │ Level ▾   │              │
│ └─────────────┴───────────┴───────────┘              │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Course Grid (3 columns)                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                  │
│ │ Course  │ │ Course  │ │ Course  │                  │
│ │ Card    │ │ Card    │ │ Card    │                  │
│ │ [45%]   │ │         │ │ ✓ Done  │                  │
│ └─────────┘ └─────────┘ └─────────┘                  │
└─────────────────────────────────────────────────────────┘
```

### Lesson View (Desktop)
```
┌──────────────────────────────────────────────────────────────┐
│ Top Bar                                                      │
│ ← Course Title [Progress 45%]     👁 ⟳ ⚙ [Continue →]      │
└──────────────────────────────────────────────────────────────┘
┌─────────┬────────────────────────────────────────────────────┐
│ Sidebar │ Main Content Area                                  │
│         │                                                     │
│ Search  │ Lesson Title                                       │
│ ──────  │ 15 min • Lesson 3 of 24                           │
│         │                                                     │
│ ▾ Mod 1 │ ┌──────────────────────────────────┐             │
│  ○ L1   │ │ [Theory] [Practice] [Quiz] [Src] │ ← Tabs      │
│  ✓ L2   │ └──────────────────────────────────┘             │
│  ● L3   │                                                     │
│  ○ L4   │ # Heading                                          │
│         │ Paragraph text with good line spacing...          │
│ ▾ Mod 2 │                                                     │
│  ○ L5   │ ```code block```                                   │
│  ○ L6   │                                                     │
│         │ More content...                                    │
└─────────┴────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Bottom Nav                                                   │
│ [← Previous]              [Mark Complete]      [Next →]     │
└──────────────────────────────────────────────────────────────┘
```

### Mobile/Tablet Behavior
- Sidebar becomes drawer (hamburger menu)
- Top bar actions collapse to menu
- Course grid: 1-2 columns
- Tabs become full-width scrollable

---

## 4. UI Kit

### Color Tokens

#### Background Layers
```css
--bg-0: #ffffff           /* Primary background */
--bg-1: #f8f8f9           /* Subtle background variation */
```

#### Surface Layers
```css
--surface-0: #ffffff      /* Cards, panels */
--surface-1: #f3f4f6      /* Secondary surfaces */
```

#### Text Hierarchy
```css
--text-primary: #1a1a1a    /* Headings, primary content */
--text-secondary: #525252  /* Body text, labels */
--text-tertiary: #737373   /* Hints, metadata */
```

#### Borders
```css
--border-default: #e5e5e5  /* Standard borders */
--border-strong: #d4d4d4   /* Emphasized borders */
```

#### Orange Accent System (Primary Actions)
```css
--accent-orange: #f97316         /* Primary buttons, progress */
--accent-orange-hover: #ea580c   /* Hover state */
--accent-orange-active: #c2410c  /* Active/pressed state */
--accent-orange-light: #fed7aa   /* Light accents */
--accent-orange-bg: #fff7ed      /* Background tints */
```

#### Semantic Colors
```css
--success: #16a34a        /* Completed, correct answers */
--success-bg: #f0fdf4     /* Success backgrounds */
--warning: #f59e0b        /* Warnings, needs attention */
--warning-bg: #fffbeb
--error: #dc2626          /* Errors, incorrect answers */
--error-bg: #fef2f2
```

### Typography Scale

**Font Stack**: Inter, system fonts
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-mono: ui-monospace, 'SF Mono', Monaco, monospace
```

**Type Scale** (optimized for readability):
```
H1: 1.5rem (24px), weight 500, line-height 1.5
H2: 1.25rem (20px), weight 500, line-height 1.5
H3: 1.125rem (18px), weight 500, line-height 1.5
H4: 1rem (16px), weight 500, line-height 1.5
Body: 1rem (16px), weight 400, line-height 1.625
Small: 0.875rem (14px), weight 400, line-height 1.5
XSmall: 0.75rem (12px), weight 400, line-height 1.5
```

### Spacing System (8pt Grid)
```
--space-1: 0.5rem (8px)
--space-2: 1rem (16px)
--space-3: 1.5rem (24px)
--space-4: 2rem (32px)
--space-6: 3rem (48px)
--space-8: 4rem (64px)
```

### Core Components

#### Buttons
- **Primary**: Orange background, white text (main actions)
- **Secondary**: Gray background, dark text (secondary actions)
- **Ghost**: Transparent, hover background (tertiary actions)
- States: default, hover (opacity 0.9), active, disabled (gray)

#### Progress Bar
- Height: 2px (sm), 8px (md)
- Fill: Orange gradient
- Background: surface-1
- Animated transitions

#### Chips/Tags
- Rounded, border
- Types: Theory (book icon), Practice (code icon), Quiz (check icon)
- Size: sm (12px text), md (14px text)

#### Cards
- Border: border-default
- Hover: shadow-md transition
- Padding: 24px
- Radius: 8px

#### Code Blocks
- Background: surface-1
- Font: monospace
- Copy button on hover
- Language label

#### Quiz Options
- Radio-style selection
- Visual feedback: selected (orange), correct (green), incorrect (red)
- Letter labels (A, B, C, D)

#### Task Feedback Panel
- Strengths: green accent
- Improvements: warning accent
- Score: Large percentage display

---

## 5. Deep Dive: Lesson View Screen

### Sidebar Structure
- **Fixed width**: 320px (desktop)
- **Sections**:
  - Search input (sticky)
  - Collapsible modules
  - Lesson items with:
    - Status icon (○ not started, ● in progress, ✓ completed)
    - Title
    - Type chip (Theory/Practice/Quiz)
    - Duration
- **Active lesson**: Orange left border, highlighted background

### Top Bar
- **Left**: Back button + Course title + Overall progress bar
- **Right**: Focus mode toggle, Refresh, Settings, Continue button
- **Height**: 64px
- **Sticky**: Yes

### Main Content Tabs
- Theory: Markdown-rendered content
- Practice: Instructions + Code editor + Rubric + Feedback
- Quiz: Question-by-question flow + Results
- Sources: Citation cards with external links

### Bottom Navigation
- Previous/Next buttons (disabled when unavailable)
- Mark Complete button (center, only if incomplete)
- Sticky to bottom

---

## 6. Interactions and States

### Hover States
- Cards: subtle shadow lift
- Buttons: opacity 0.9 or background darken
- Sidebar items: light background overlay
- Links: underline

### Focus States
- 2px orange outline (--ring color)
- Keyboard navigation support

### Loading States
- Skeleton screens for content
- Spinner for generation
- Progress bars for multi-step processes

### Empty States
- Centered message
- Helpful icon
- CTA button where appropriate

### Error States
- Red border + background tint
- Error icon + message
- Retry action

---

## 7. Implementation Notes

### Layout Approach
- **CSS Grid** for page-level layouts
- **Flexbox** for component-level alignment
- **Sticky positioning** for sidebar, top bar, bottom nav

### UI State Model
```typescript
{
  currentScreen: 'library' | 'create' | 'lesson'
  selectedCourseId: string | null
  selectedLessonId: string | null
  courses: Course[]
  modules: Module[]
  lessons: Lesson[]
}
```

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 8. Accessibility

- WCAG 2.1 AA contrast ratios
- Keyboard navigation for all interactions
- Focus indicators on all interactive elements
- Semantic HTML (headings, lists, buttons)
- ARIA labels where needed
- Skip links for main content

---

## 9. Microcopy Examples

### Buttons
- "Create Course"
- "Generate Course"
- "Continue"
- "Mark as Complete"
- "Submit for Review"
- "Next Question"

### Section Titles
- "My Courses"
- "Course Creation"
- "Learning Goal"
- "Evaluation Rubric"
- "Sources & References"

### Status Messages
- "Course created successfully!"
- "Lesson completed!"
- "Great work! Here's detailed feedback."
- "Keep practicing!"

---

## Design Principles

1. **Readability First**: Generous spacing, readable type, clear hierarchy
2. **Low Cognitive Load**: One primary action per screen, progressive disclosure
3. **Trust & Transparency**: Always show sources, clear attribution
4. **Calm & Focused**: Minimal decoration, purposeful color use
5. **Familiar Patterns**: Leverage Stepik-like structure users know

---

## Future Enhancements

- Dark mode support
- Collaborative features (comments, sharing)
- Spaced repetition system
- Certificate generation
- Mobile apps
