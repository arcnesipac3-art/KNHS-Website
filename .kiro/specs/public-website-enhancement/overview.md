# Public Website Enhancement

**Feature ID:** `public-website-enhancement`  
**Type:** Enhancement  
**Priority:** Medium  
**Estimated Effort:** 400 LOC across 3-4 pages  
**Status:** Requirements Phase  
**Created:** June 5, 2026

---

## Overview

Enhance the existing public-facing website to meet DepEd professional standards and provide comprehensive school information. This is the **final MVP feature** (12/12) needed to complete Phase 1.

**Current State:**
- ✅ Basic shell exists: Home, About, Contact pages with minimal content
- ✅ PublicLayout with DepEdHeader component
- ✅ Enrollment pages (Application + Tracking) already complete
- ❌ About page lacks Mission, Vision, Faculty information
- ❌ Academics page doesn't exist
- ❌ News & Events section doesn't exist
- ❌ Content needs DepEd professional enhancement

**Goal State:**
- Professional public website matching DepEd standards
- Comprehensive school information (Mission, Vision, Faculty)
- Academic programs showcase (JHS + SHS strands)
- News and events section
- Mobile-responsive, accessible, and SEO-friendly
- Consistent purple branding (#5E2A84)

---

## Blueprint Alignment

**Section 4: Information Architecture - Public Website Navigation**
```
Home | About (Mission, Vision, Faculty) | Academics (K-12, Senior High) | 
Admissions (Enroll, Track Status) | News & Events | Contact | Portal Login
```

**Section 7: UI/UX Strategy**
- DepEd purple branding (#5E2A84 primary, #7C3AED light, #0038A8 blue)
- Gold accent (#FCD116) for highlights
- Official header strip: "Republika ng Pilipinas · Kagawaran ng Edukasyon · Lalawigan ng Lanao del Norte"
- Mobile-first responsive design
- 4px base spacing system

---

## Success Criteria

1. **Content Completeness:** All required sections present with accurate information
2. **DepEd Compliance:** Professional styling matching government standards
3. **Mobile Responsive:** All pages functional on mobile, tablet, desktop
4. **Navigation:** Max 2 clicks to any public page
5. **Performance:** All pages load <2s
6. **Accessibility:** Semantic HTML, proper heading hierarchy
7. **Zero Diagnostics:** No errors or warnings in any file

---

## Pages to Enhance/Create

### 1. Home Page Enhancement (existing)
- **Current:** Basic hero, 3 feature cards, enrollment CTA
- **Needs:** Better hero content, school highlights, upcoming events preview

### 2. About Page Enhancement (existing)
- **Current:** Single card with 2 paragraphs
- **Needs:** Mission, Vision, Core Values, History, Faculty/Staff list

### 3. Academics Page (new)
- **Purpose:** Showcase K-12 programs, SHS strands, curriculum
- **Sections:** JHS Programs (G7-10), SHS Tracks, Curriculum Overview

### 4. News & Events Page (new)
- **Purpose:** School announcements, news, upcoming events
- **Sections:** Latest news, upcoming events, school calendar
- **Note:** Static content for MVP (dynamic CMS in Phase 2)

### 5. Contact Page Enhancement (existing)
- **Current:** Basic contact info in single card
- **Needs:** Contact form, office hours, map/directions, social media

---

## Out of Scope (Phase 2)

- CMS for dynamic content editing
- Blog functionality
- Photo gallery
- Alumni portal
- Parent resources section
- Downloadable forms library
- Live chat/chatbot
- Multi-language support (English/Filipino)

---

## Dependencies

- ✅ PublicLayout component (exists)
- ✅ DepEdHeader component (exists)
- ✅ Design tokens with school info (exists)
- ✅ Card, Button UI components (exist)
- ❌ Faculty data source (will use static data for MVP)
- ❌ News content (will use placeholder data for MVP)

---

## Technical Constraints

- Frontend only (no backend API changes needed)
- Use existing UI components (Card, Button)
- Follow Tailwind CSS v4 conventions
- Maintain 4px spacing system
- React Router navigation (no page reloads)
- Image assets: Use placeholder or school logo only

---

## Related Documentation

- Blueprint: `KNHSPortalBlueprint.md` Section 4 (Information Architecture)
- Blueprint: `KNHSPortalBlueprint.md` Section 7 (UI/UX Strategy)
- Progress: `MVP_PROGRESS_TRACKER.md` (shows 11/12 features complete)
- Existing Code: `frontend/src/pages/Home.jsx`, `About.jsx`, `Contact.jsx`
- Layout: `frontend/src/components/layout/PublicLayout.jsx`
