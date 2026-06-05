# Implementation Plan: Public Website Enhancement

## Overview

This implementation plan transforms the existing minimal public website into a comprehensive DepEd-compliant platform. We'll enhance 3 existing pages and create 2 new pages, all with static content for MVP.

**Estimated Total:** ~700 LOC across 13 tasks  
**Timeline:** 4-5 hours  
**Approach:** Sequential execution with testing phases

---

## Tasks

- [ ] 1. **Enhance Home Page** - Improve hero section and add school highlights (~50 LOC)
  - **File:** `frontend/src/pages/Home.jsx`
  - **Priority:** High
  - **Depends On:** None
  - **Description:** Enhance existing Home page hero section with better typography and spacing. Add "Quick Stats" section (optional). Improve feature cards with better content about Academic Excellence, Digital Learning, Community, and Values. Ensure all CTAs are prominent and functional. Verify mobile responsiveness.
  - **Acceptance:** Hero section visually engaging | 3 CTAs functional (Enter Portal, Apply for Enrollment, Learn More) | Feature cards showcase school strengths | Enrollment CTA section prominent | Mobile responsive single column | Zero diagnostics

- [ ] 2. **Create Content Constants** - Centralize all school content in reusable constants file (~80 LOC)
  - **File:** `frontend/src/data/schoolContent.js` (NEW)
  - **Priority:** High
  - **Depends On:** None
  - **Description:** Create centralized constants file for all school content including mission statement (1-2 paragraphs), vision statement (1-2 paragraphs), core values array (4-6 values with descriptions), faculty list array (principal + 3-5 staff with name/position), SHS strands array (STEM, ABM, HUMSS, GAS with descriptions), JHS program description, news items array (5-7 sample items), and events array (3-5 sample items). All content must be professional and appropriate for DepEd school.
  - **Acceptance:** Mission and vision statements present | Core values array properly structured | Faculty list with principal + staff | SHS strands include STEM, ABM, HUMSS, GAS | News items have title, date, category, excerpt | Events have title, date, location, description | All exports functional | Zero diagnostics

- [ ] 3. **Enhance About Page** - Add Mission, Vision, Core Values, History, and Faculty sections (~100 LOC)
  - **File:** `frontend/src/pages/About.jsx`
  - **Priority:** High
  - **Depends On:** Task 2
  - **Description:** Transform About page into comprehensive school information hub. Add Mission section with card container. Add Vision section with card container. Add Core Values section with grid layout (4-6 values). Add brief School History section (optional). Add Faculty & Staff section with grid/list layout showing principal + 3-5 staff with name and position. Import content from schoolContent.js. Maintain existing About intro. Ensure mobile responsive layout.
  - **Acceptance:** Mission displayed in prominent card | Vision displayed in prominent card | Core values displayed as grid (4-6 values) | Faculty list shows principal + 3-5 staff | All sections have clear headings | Mobile responsive single column | Professional typography and spacing | Zero diagnostics

- [ ] 4. **Create Academics Page** - New page showcasing JHS and SHS programs with all strands (~120 LOC)
  - **File:** `frontend/src/pages/Academics.jsx` (NEW)
  - **Priority:** High
  - **Depends On:** Task 2
  - **Description:** Create new Academics page with header showing title "Academic Programs" and subtitle. Add JHS section describing G7-10 curriculum with DepEd K-12 alignment and MATATAG mention. Add SHS section describing G11-12 track-based learning. Add SHS Tracks & Strands grid displaying all available strands (STEM, ABM, HUMSS, GAS minimum) with name and description for each. Add Curriculum Overview section explaining K-12 structure. Import strands from schoolContent.js. Use Card component for each strand. Ensure mobile responsive grid (1 col mobile, 2-3 cols desktop).
  - **Acceptance:** Page header with title "Academic Programs" | JHS section describes G7-10 curriculum | SHS section describes G11-12 track-based learning | All SHS strands displayed (STEM, ABM, HUMSS, GAS minimum) | Strands organized by track (Academic, TVL if applicable) | Curriculum overview explains K-12 structure | MATATAG curriculum mentioned | Mobile responsive grid | Zero diagnostics

- [ ] 5. **Create News & Events Page** - New page displaying school news and upcoming events (~100 LOC)
  - **File:** `frontend/src/pages/News.jsx` (NEW)
  - **Priority:** Medium
  - **Depends On:** Task 2
  - **Description:** Create new News & Events page with header showing title "News & Events" and subtitle. Add "Latest News" section with news cards displaying 5-7 items in card format. Each news item shows title, date, category badge, and excerpt. Add "Upcoming Events" section with event cards displaying 3-5 items. Each event shows title, date, location, and description. Import news and events from schoolContent.js. Add category badges with colors (purple for Achievement, blue for Event). Format dates consistently (e.g., "June 5, 2026"). Ensure mobile responsive layout (single column on mobile).
  - **Acceptance:** Page header with title "News & Events" | News section displays 5-7 items in card format | Each news item shows title, date, category badge, excerpt | Events section displays 3-5 items | Each event shows title, date, location, description | Dates formatted consistently | Category badges visually distinct | Mobile responsive single column | Placeholder content realistic | Zero diagnostics

- [ ] 6. **Enhance Contact Page** - Improve with comprehensive information and office hours (~80 LOC)
  - **File:** `frontend/src/pages/Contact.jsx`
  - **Priority:** Medium
  - **Depends On:** None
  - **Description:** Improve Contact page with comprehensive information. Enhance existing contact information card with complete address, email, and phone number (placeholder OK). Add office hours section showing Mon-Fri 8:00 AM - 5:00 PM. Add optional directions/landmarks section. Maintain professional card layout. Ensure mobile responsive. Contact form can be Phase 2 (UI-only placeholder acceptable for MVP).
  - **Acceptance:** Complete address displayed | Email address displayed | Phone number displayed (or note to contact registrar) | Office hours listed (Mon-Fri 8:00 AM - 5:00 PM) | Optional directions or landmarks section | Professional card layout | Mobile responsive | Zero diagnostics

- [ ] 7. **Update Navigation** - Add Academics and News links to PublicLayout navigation (~40 LOC)
  - **File:** `frontend/src/components/layout/PublicLayout.jsx`
  - **Priority:** High
  - **Depends On:** Task 4, Task 5
  - **Description:** Update PublicLayout navigation to include new Academics and News pages. Add "Academics" link between About and Contact. Add "News & Events" link between Academics and Contact. Verify mobile navigation works with new links. Ensure navigation order matches Blueprint Section 4 (Home | About | Academics | Contact | Portal Login). Update footer with optional quick links. Maintain existing styling. Test mobile menu behavior.
  - **Acceptance:** Navigation order: Home | About | Academics | Contact | Portal Login | "News & Events" link routes to /news | "Academics" link routes to /academics | All links functional in desktop and mobile nav | Mobile hamburger menu includes new links | Portal Login button remains prominent | Zero diagnostics

- [ ] 8. **Update App Routing** - Add routes for Academics and News pages (~10 LOC)
  - **File:** `frontend/src/App.jsx`
  - **Priority:** High
  - **Depends On:** Task 4, Task 5
  - **Description:** Add routes for new Academics and News pages. Import Academics and News components. Add /academics route under PublicLayout. Add /news route under PublicLayout. Verify routes are accessible via navigation.
  - **Acceptance:** /academics route renders Academics page | /news route renders News page | Routes use PublicLayout | Routes accessible via navigation | Zero diagnostics

- [ ] 9. **Mobile Responsiveness Testing & Refinement** - Test all pages on mobile, tablet, desktop and fix issues (~20 LOC)
  - **Files:** All enhanced/new pages
  - **Priority:** High
  - **Depends On:** Task 1, Task 3, Task 4, Task 5, Task 6
  - **Description:** Test all pages on 320px (mobile), 768px (tablet), and 1024px+ (desktop) breakpoints. Verify all text is readable without zooming (16px base minimum). Verify all buttons are tap-friendly (44x44px min). Verify no horizontal scrolling on any screen size. Verify grid layouts adapt properly (1 col mobile → 2-3 cols tablet/desktop). Fix any spacing or layout issues discovered during testing.
  - **Acceptance:** All pages functional on 320px+ screens | Text readable (16px base minimum) | Buttons and links touch-friendly (44x44px min) | Grids adapt properly | Navigation menu works on mobile | No horizontal scrolling on any screen size | Images/cards scale appropriately | Zero diagnostics
  - **Testing Checklist:** Home mobile | About mobile | Academics mobile | News mobile | Contact mobile | Navigation mobile menu | All pages tablet view | All pages desktop view

- [ ] 10. **Accessibility Audit & Fixes** - Audit all pages for accessibility and implement fixes (~20 LOC)
  - **Files:** All enhanced/new pages
  - **Priority:** Medium
  - **Depends On:** Task 1, Task 3, Task 4, Task 5, Task 6
  - **Description:** Audit all pages for WCAG 2.1 Level AA compliance. Verify semantic HTML structure (header, nav, main, section, footer). Check heading hierarchy (no skipped levels). Add alt text to images (if any). Verify color contrast ratios (≥ 4.5:1 for text). Test keyboard navigation and ensure all interactive elements are keyboard accessible. Verify focus indicators are visible on tab navigation. Add ARIA labels where semantic HTML is insufficient.
  - **Acceptance:** All pages use semantic HTML | Heading hierarchy correct (h1 → h2 → h3, no skipping) | All images have alt text | Color contrast ≥ 4.5:1 for text | All interactive elements keyboard accessible | Focus indicators visible on tab navigation | ARIA labels added where needed | Zero diagnostics
  - **Testing Checklist:** Keyboard navigation only (no mouse) | Tab order logical | Focus indicators visible | Heading structure in each page | Screen reader test (optional but recommended)

- [ ] 11. **SEO Meta Tags** - Add SEO meta tags to all public pages (~30 LOC)
  - **Files:** All enhanced/new pages (or index.html / Helmet setup)
  - **Priority:** Low
  - **Depends On:** None
  - **Description:** Add SEO meta tags to all public pages for better discoverability. Add unique page titles for each page (under 60 characters). Add meta descriptions for each page (50-160 characters). Verify Open Graph tags (optional). Ensure proper HTML structure with viewport meta tag.
  - **Acceptance:** Home title "Home - KNHS | Kiwalan National High School" | About title "About - KNHS | Mission, Vision, Faculty" | Academics title "Academic Programs - KNHS | JHS & SHS" | News title "News & Events - KNHS" | Contact title "Contact Us - KNHS" | Meta descriptions present (50-160 characters each) | Viewport meta tag present | Zero diagnostics

- [ ] 12. **Final Quality Assurance** - Comprehensive QA pass on all pages (testing only, 0 LOC)
  - **Files:** All enhanced/new pages
  - **Priority:** High
  - **Depends On:** All previous tasks
  - **Description:** Comprehensive QA pass on all pages to ensure quality and compliance. Verify all requirements from requirements.md satisfied. Check all acceptance criteria from all tasks. Test all navigation links. Verify DepEd branding consistency (#5E2A84 purple). Check for typos and grammar errors. Verify zero diagnostics across all files. Test performance (load times <2s). Verify Blueprint Section 4 compliance.
  - **Acceptance:** All requirements from requirements.md satisfied | All task acceptance criteria met | Zero diagnostics (no errors, no warnings) | All navigation links functional | DepEd purple branding consistent | 4px spacing system followed throughout | All pages load in <2s | No console errors | Mobile responsive verified | Content professional and error-free
  - **Testing Checklist:** Navigate through all pages manually | Click all CTAs and verify routing | Check mobile menu functionality | Verify enrollment CTAs route correctly | Check Portal Login button | Test on Chrome, Firefox, Safari (if available) | Check browser console for errors | Run diagnostics on all files | Verify content accuracy | Check spelling and grammar

- [ ] 13. **Documentation & Git Commit** - Document feature completion and commit to git (~50 LOC)
  - **Files:** New documentation file + MVP tracker update
  - **Priority:** High
  - **Depends On:** Task 12
  - **Description:** Create PUBLIC_WEBSITE_COMPLETE.md documentation file summarizing all enhancements made, listing all files created/modified, and documenting content that can be customized. Update MVP_PROGRESS_TRACKER.md to mark feature complete (12/12 features, 100% complete). Stage all changes. Create commit with descriptive message (e.g., "feat: enhance public website with Academics, News, Mission/Vision"). Push to git successfully.
  - **Acceptance:** Documentation file created with comprehensive summary | All files created/modified listed | Content customization points documented | MVP_PROGRESS_TRACKER updated (12/12 features, 100% complete) | All changes staged | Commit message descriptive | Changes pushed to git successfully | Zero diagnostics

---

## Task Dependency Graph.

```json
{
  "waves": {
    "wave1": {
      "tasks": [1, 2, 6],
      "description": "Initial development - Content foundation and independent enhancements"
    },
    "wave2": {
      "tasks": [3, 4, 5],
      "description": "Content-dependent pages - About, Academics, News",
      "dependsOn": ["wave1"]
    },
    "wave3": {
      "tasks": [7, 8],
      "description": "Navigation and routing updates",
      "dependsOn": ["wave2"]
    },
    "wave4": {
      "tasks": [9, 10, 11],
      "description": "Testing, accessibility, and SEO",
      "dependsOn": ["wave3"]
    },
    "wave5": {
      "tasks": [12],
      "description": "Final QA",
      "dependsOn": ["wave4"]
    },
    "wave6": {
      "tasks": [13],
      "description": "Documentation and commit",
      "dependsOn": ["wave5"]
    }
  }
}
```

---

## Notes

**Execution Strategy:**

Recommended execution order for optimal efficiency:
1. Task 2 (Content Constants) - Foundation
2. Task 1 (Home Enhancement) - Quick win
3. Task 3 (About Page) - Depends on Task 2
4. Task 4 (Academics Page) - Depends on Task 2
5. Task 5 (News Page) - Depends on Task 2
6. Task 6 (Contact Page) - Independent
7. Task 7 (Navigation) - Depends on Tasks 4, 5
8. Task 8 (Routing) - Depends on Tasks 4, 5
9. Task 9 (Mobile Testing) - After all pages done
10. Task 10 (Accessibility) - After Task 9
11. Task 11 (SEO) - Can be parallel with 9/10
12. Task 12 (QA) - After all development
13. Task 13 (Documentation) - Final step

**Key Considerations:**
- All content is static for MVP (CMS in Phase 2)
- Placeholder data acceptable for faculty and news
- Use existing Card and Button components
- Follow 4px spacing system throughout
- Maintain DepEd purple branding (#5E2A84)
- Zero diagnostics policy enforced

**Estimated Timeline:**
- Tasks 1-8: 2-3 hours (core development)
- Tasks 9-11: 1 hour (testing & refinement)
- Tasks 12-13: 30 minutes (QA & documentation)
- **Total: 3.5-4.5 hours**

**Success Criteria:**
Upon completion, this feature will:
- Complete the 12th and final MVP feature
- Achieve 100% Phase 1 delivery
- Make the portal ready for production launch
