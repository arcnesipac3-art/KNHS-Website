# Requirements Document

## Introduction

This document details the requirements for the Public Website Enhancement feature - the final MVP feature (12/12) for the KNHS Portal.

**Last Updated:** June 5, 2026  
**Status:** Draft  
**Stakeholders:** School Administrator, Principal, Public Visitors, Prospective Students

**Purpose:** Transform the existing minimal public website into a comprehensive, professional platform that meets DepEd standards and provides complete school information to prospective students, parents, and the community.

**Scope:** Enhancement of 3 existing pages (Home, About, Contact) and creation of 2 new pages (Academics, News & Events). All changes are frontend-only with static content for MVP.

---

## Requirements

### 1. Business Requirements

### BR-1: School Identity & Branding
**Priority:** MUST HAVE  
**Description:** Public website must clearly communicate KNHS identity, mission, and values to prospective students, parents, and the community.

**Acceptance Criteria:**
- School name, location, and tagline prominently displayed
- DepEd purple branding (#5E2A84) used consistently
- Official DepEd header strip present on all pages
- School logo/emblem visible in header
- Professional typography matching government standards

**Rationale:** First impression for prospective students and parents; establishes credibility and official status.

---

### BR-2: Academic Information Accessibility
**Priority:** MUST HAVE  
**Description:** Visitors must be able to easily understand what programs KNHS offers (JHS and SHS) and what tracks/strands are available.

**Acceptance Criteria:**
- Dedicated Academics page accessible from main navigation
- Clear distinction between JHS (G7-10) and SHS (G11-12) programs
- All SHS strands listed with descriptions
- Curriculum approach explained
- K-12 MATATAG alignment mentioned

**Rationale:** Prospective students and parents need this information to make enrollment decisions.

---

### BR-3: School Values Communication
**Priority:** MUST HAVE  
**Description:** The school's mission, vision, and core values must be clearly communicated to align stakeholders and set expectations.

**Acceptance Criteria:**
- Mission statement displayed prominently on About page
- Vision statement displayed prominently on About page
- Core values listed with brief explanations
- Alignment with DepEd goals mentioned

**Rationale:** Sets expectations for school culture and educational philosophy; required for DepEd compliance.

---

### BR-4: Faculty & Staff Transparency
**Priority:** SHOULD HAVE  
**Description:** Visitors should be able to see key faculty and staff members to build trust and credibility.

**Acceptance Criteria:**
- Principal and key administrators listed
- Department heads or coordinators listed (if applicable)
- Optional: Teacher names by department/subject
- Positions and roles clearly labeled
- Professional presentation without personal contact info

**Rationale:** Builds trust with parents; demonstrates school has qualified staff.

---

### BR-5: School News & Events Visibility
**Priority:** SHOULD HAVE  
**Description:** Website should showcase school activities, achievements, and upcoming events to engage the community.

**Acceptance Criteria:**
- Dedicated News & Events page
- At least 3-5 sample news items or events (can be placeholder)
- Date stamps on all items
- Category labels (e.g., "School Event", "Achievement", "Announcement")
- Visual hierarchy showing newest items first

**Rationale:** Demonstrates active school community; keeps stakeholders informed; builds school pride.

---

### BR-6: Contact Information Accessibility
**Priority:** MUST HAVE  
**Description:** Visitors must be able to easily contact the school for inquiries, concerns, or visits.

**Acceptance Criteria:**
- School address displayed
- Email address displayed (info@kiwalan-nhs.edu.ph or generic)
- Phone number displayed (if available)
- Office hours listed
- Optional: Embedded map or directions
- Optional: Contact form

**Rationale:** Essential for prospective students, parents, and community members to reach the school.

---

### BR-7: Enrollment Pathway Clarity
**Priority:** MUST HAVE  
**Description:** Visitors must be able to easily find and access enrollment application and tracking.

**Acceptance Criteria:**
- "Apply for Enrollment" CTA visible on Home page
- "Track Application" link visible on Home page
- Navigation includes clear path to enrollment
- Enrollment status explained briefly

**Status:** ✅ ALREADY SATISFIED (EnrollmentApplication and EnrollmentTracking pages exist)

**Rationale:** Primary conversion goal for public website; drives school enrollment numbers.

---

### 2. Functional Requirements

### FR-1: Enhanced Home Page
**Priority:** MUST HAVE  
**Depends On:** BR-1, BR-7

**Description:** Improve Home page to serve as compelling landing page with clear calls-to-action.

**Requirements:**
1. **Hero Section**
   - School name, tagline, location
   - Eye-catching gradient background
   - 3 CTAs: "Enter Portal", "Apply for Enrollment", "Learn More"

2. **School Highlights Section**
   - 3-4 feature cards showcasing key strengths
   - Suggested topics: Academic Excellence, Digital Learning, Community, Values

3. **Enrollment CTA Section**
   - Prominent purple gradient background
   - Clear enrollment message
   - CTAs: "Apply Now" and "Track Application"

4. **Quick Stats or Highlights** (optional)
   - Years of service, student count, programs offered
   - Displayed as badge/pill elements

**Acceptance Criteria:**
- Page is visually engaging with proper spacing
- All CTAs are functional and route correctly
- Mobile responsive (single column on mobile)
- Loads in <2s

---

### FR-2: Enhanced About Page
**Priority:** MUST HAVE  
**Depends On:** BR-1, BR-3, BR-4

**Description:** Transform About page into comprehensive school information hub.

**Requirements:**
1. **Mission Section**
   - Heading: "Our Mission"
   - 1-2 paragraph mission statement
   - Card or highlighted container

2. **Vision Section**
   - Heading: "Our Vision"
   - 1-2 paragraph vision statement
   - Card or highlighted container

3. **Core Values Section**
   - Heading: "Core Values"
   - List of 4-6 core values with brief descriptions
   - Visual list or grid layout

4. **School History Section** (optional)
   - Brief paragraph about school founding/history
   - Can be placeholder text for MVP

5. **Faculty & Staff Section**
   - Heading: "Our Leadership" or "Faculty & Staff"
   - List of principal, administrators, coordinators
   - Name + Position displayed
   - Grid or list layout
   - Note: Use placeholder data for MVP

**Acceptance Criteria:**
- All sections clearly separated with headings
- Professional typography and spacing
- Mobile responsive layout
- Content is readable and well-formatted

---

### FR-3: New Academics Page
**Priority:** MUST HAVE  
**Depends On:** BR-2

**Description:** Create dedicated page showcasing academic programs and curriculum.

**Requirements:**
1. **Page Header**
   - Title: "Academic Programs"
   - Subtitle: Brief description of K-12 curriculum

2. **Junior High School Section**
   - Heading: "Junior High School (Grades 7-10)"
   - Description: General curriculum, core subjects
   - DepEd K-12 alignment mentioned
   - MATATAG curriculum mention (G7 onwards)

3. **Senior High School Section**
   - Heading: "Senior High School (Grades 11-12)"
   - Description: Track-based learning

4. **SHS Tracks & Strands Grid**
   - Display all available strands:
     - **Academic Track:**
       - STEM (Science, Technology, Engineering, Mathematics)
       - ABM (Accountancy, Business, Management)
       - HUMSS (Humanities and Social Sciences)
       - GAS (General Academic Strand)
     - **TVL Track:** (if applicable)
       - ICT, Home Economics, etc.
   - Each strand: Name, description (2-3 sentences), icon/badge

5. **Curriculum Overview Section**
   - Brief explanation of DepEd K-12 structure
   - Mention of core subjects + specialized subjects
   - Learning delivery modalities (face-to-face, blended if applicable)

**Acceptance Criteria:**
- All SHS strands listed with descriptions
- Clear distinction between JHS and SHS
- Visually organized with cards or sections
- Mobile responsive grid layout
- Accessible from main navigation

---

### FR-4: New News & Events Page
**Priority:** SHOULD HAVE  
**Depends On:** BR-5

**Description:** Create page displaying school news, achievements, and upcoming events.

**Requirements:**
1. **Page Header**
   - Title: "News & Events"
   - Subtitle: "Stay updated with KNHS activities and announcements"

2. **News Section**
   - Heading: "Latest News"
   - Display 5-7 news items in card format
   - Each item: Title, date, category badge, excerpt (2-3 sentences)
   - Sample categories: "School Event", "Achievement", "Announcement", "Academic"

3. **Upcoming Events Section**
   - Heading: "Upcoming Events"
   - Display 3-5 upcoming events
   - Each event: Title, date, location (if applicable), brief description

4. **Placeholder Content**
   - Use realistic placeholder news items for MVP
   - Sample topics: Recognition day, sports fest, enrollment period, teacher training, etc.
   - Note: Phase 2 will add CMS for dynamic content

**Acceptance Criteria:**
- Sample content is realistic and appropriate
- Cards/items are visually distinct
- Dates are formatted consistently (e.g., "June 5, 2026")
- Mobile responsive layout
- Accessible from main navigation

---

### FR-5: Enhanced Contact Page
**Priority:** SHOULD HAVE  
**Depends On:** BR-6

**Description:** Improve Contact page with more comprehensive information.

**Requirements:**
1. **Contact Information Card**
   - School name
   - Complete address
   - Email address
   - Phone number (if available)
   - Fax number (if applicable - common in DepEd)

2. **Office Hours Section**
   - Regular office hours (Mon-Fri timing)
   - Note about holidays/school breaks

3. **Contact Form** (optional for MVP)
   - Name, email, subject, message fields
   - "Send Message" button
   - Note: Can be Phase 2 feature; just UI for MVP

4. **Directions Section** (optional)
   - Text directions or landmarks
   - Optional: Embedded Google Maps iframe
   - Transportation notes (jeepney routes, etc.)

**Acceptance Criteria:**
- All contact info is accurate
- Professional presentation
- Mobile responsive
- Form is functional (if included) or clearly marked as placeholder

---

### FR-6: Navigation Enhancement
**Priority:** MUST HAVE  
**Depends On:** All page enhancements

**Description:** Ensure public navigation matches Blueprint Section 4 requirements.

**Requirements:**
1. **Main Navigation Links** (in order):
   - Home
   - About
   - Academics (NEW)
   - Admissions (dropdown or section):
     - Apply for Enrollment
     - Track Application
   - News & Events (NEW)
   - Contact
   - Portal Login (prominent button)

2. **Mobile Navigation**
   - Hamburger menu on small screens
   - Same links, stacked vertically
   - Easy to close

3. **Footer Enhancement**
   - School name, location, copyright
   - Optional: Quick links to all pages
   - Optional: Social media icons (placeholder)

**Acceptance Criteria:**
- Navigation matches Blueprint specification
- All links functional
- Portal Login button stands out
- Mobile menu works smoothly
- Footer present on all public pages

---

### 3. Non-Functional Requirements

### NFR-1: Performance
**Priority:** MUST HAVE

**Requirements:**
- All pages load in <2 seconds on 3G connection
- Images optimized (WebP format preferred)
- No unnecessary JavaScript bundles
- Lazy load images below fold

---

### NFR-2: Mobile Responsiveness
**Priority:** MUST HAVE

**Requirements:**
- All pages functional on mobile (320px+), tablet (768px+), desktop (1024px+)
- Touch-friendly buttons and links (min 44x44px)
- Readable text without zooming (min 16px base)
- Proper viewport meta tag
- Test on: Chrome mobile, Safari iOS

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: 1024px+

---

### NFR-3: Accessibility
**Priority:** MUST HAVE

**Requirements:**
- Semantic HTML5 elements (header, nav, main, section, footer)
- Proper heading hierarchy (h1 → h2 → h3, no skipping)
- Alt text for all images
- ARIA labels where needed
- Keyboard navigable
- Color contrast ratio ≥ 4.5:1 for text
- Focus indicators visible

**Target:** WCAG 2.1 Level AA compliance

---

### NFR-4: SEO & Discoverability
**Priority:** SHOULD HAVE

**Requirements:**
- Unique page titles (e.g., "About - KNHS | Kiwalan National High School")
- Meta descriptions for each page
- Semantic HTML structure
- Proper heading hierarchy
- Mobile-friendly (Google mobile-first indexing)

---

### NFR-5: Browser Compatibility
**Priority:** MUST HAVE

**Requirements:**
- Support modern browsers:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- Graceful degradation for older browsers
- No console errors in supported browsers

---

### NFR-6: Maintainability
**Priority:** MUST HAVE

**Requirements:**
- Follow existing codebase conventions
- Use existing UI components (Card, Button)
- Extract repeated content into constants/design-tokens
- Comment complex sections
- Zero diagnostics (no errors, no warnings)

---

### 4. User Stories

### US-1: Prospective Student Visits Website
**As a** prospective student  
**I want to** learn about KNHS programs and enrollment  
**So that** I can decide if I want to apply

**Acceptance Criteria:**
- Can find academic programs from home page in ≤2 clicks
- Can see available SHS strands clearly
- Can start enrollment application easily
- Understands school mission and values

---

### US-2: Parent Researches School
**As a** parent  
**I want to** understand KNHS mission, faculty, and contact info  
**So that** I can evaluate if it's right for my child

**Acceptance Criteria:**
- Can read mission and vision on About page
- Can see faculty/staff list
- Can find contact information easily
- Can see recent school news/achievements

---

### US-3: Community Member Checks News
**As a** community member  
**I want to** see recent school news and events  
**So that** I can stay informed about local education activities

**Acceptance Criteria:**
- Can access News & Events page from navigation
- Can see recent news items with dates
- Can see upcoming events
- Content is up-to-date (or marked as placeholder)

---

### US-4: Current Student Accesses Portal
**As a** current student  
**I want to** quickly navigate to the portal login  
**So that** I can access my classes and assignments

**Acceptance Criteria:**
- Portal Login button is prominent in navigation
- Can reach login from any public page in 1 click
- Button is visually distinct from other nav items

---

### US-5: Mobile User Browses Website
**As a** mobile phone user  
**I want to** browse the KNHS website on my phone  
**So that** I can access information on-the-go

**Acceptance Criteria:**
- All pages are readable and functional on mobile
- Navigation menu works on small screens
- Buttons and links are easy to tap
- Images scale appropriately
- No horizontal scrolling required

---

### 5. Data Requirements

### Static Content Needed

**School Identity:**
- School name: ✅ (exists in design-tokens.js)
- Tagline: ✅ (exists)
- Location: ✅ (exists)
- Logo/emblem: ⚠️ (using initials "KN" for MVP)

**Mission & Vision:**
- Mission statement (1-2 paragraphs)
- Vision statement (1-2 paragraphs)
- Core values (4-6 values with descriptions)

**Academic Programs:**
- JHS program description
- SHS strands list with descriptions:
  - STEM, ABM, HUMSS, GAS (Academic Track)
  - Optional: TVL strands if offered
- Curriculum approach description

**Faculty & Staff:** (Placeholder for MVP)
- Principal: Name + title
- 3-5 department heads/coordinators: Name + position

**News & Events:** (Placeholder for MVP)
- 5-7 sample news items: Title, date, category, excerpt
- 3-5 sample events: Title, date, description

**Contact Information:**
- Address: ✅ (exists)
- Email: info@kiwalan-nhs.edu.ph (placeholder)
- Phone: (Placeholder - can be "See registrar office")
- Office hours: Mon-Fri 8:00 AM - 5:00 PM (standard)

---

### 6. Constraints & Assumptions

### Constraints
1. **No Backend Changes:** This is frontend-only work
2. **Static Content:** All content hardcoded for MVP (CMS in Phase 2)
3. **Existing UI Components:** Must use Card, Button from component library
4. **Design System:** Must follow existing Tailwind + 4px spacing
5. **No External APIs:** No maps API, no CMS API for MVP

### Assumptions
1. School logo/emblem will use "KN" initials for MVP
2. Placeholder content is acceptable for faculty and news
3. Mission/vision statements can be generic but professional
4. Images can be omitted or use simple gradients/colors
5. Contact form can be UI-only (no backend) for MVP
6. User will provide actual school content in Phase 2

---

### 7. Acceptance Checklist

**Content:**
- [ ] All required sections present on each page
- [ ] Mission and vision statements written
- [ ] Core values listed (4-6 values)
- [ ] All SHS strands described
- [ ] Faculty list includes principal + 3-5 staff (placeholder OK)
- [ ] News section has 5-7 sample items
- [ ] Events section has 3-5 sample items
- [ ] Contact information complete

**Functionality:**
- [ ] All navigation links work
- [ ] Portal Login button routes to /login
- [ ] Enrollment CTAs route to /enrollment/apply
- [ ] Mobile menu opens/closes properly
- [ ] All pages accessible from navigation

**Quality:**
- [ ] Zero diagnostics (no errors, no warnings)
- [ ] Mobile responsive (tested on 320px, 768px, 1024px)
- [ ] Semantic HTML used throughout
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Alt text on images
- [ ] DepEd purple branding consistent
- [ ] 4px spacing system followed

**Performance:**
- [ ] All pages load in <2s
- [ ] No console errors
- [ ] No unnecessary re-renders

**Blueprint Compliance:**
- [ ] Navigation matches Section 4 specification
- [ ] DepEd styling matches Section 7
- [ ] Max 2 clicks to any page

---

### 8. Future Enhancements (Phase 2)

- CMS for dynamic content editing
- Faculty photo upload
- News article detail pages
- Event calendar with RSVP
- Photo gallery (school events, facilities)
- Downloadable forms (enrollment, clearance, etc.)
- Live chat or FAQ chatbot
- Multi-language support (English/Filipino toggle)
- Social media feed integration
- Alumni portal section
- Parent resources section
- Student achievements showcase
- School map/facilities tour

---

## Glossary

**DepEd** - Department of Education (Philippines)  
**JHS** - Junior High School (Grades 7-10)  
**SHS** - Senior High School (Grades 11-12)  
**STEM** - Science, Technology, Engineering, Mathematics track  
**ABM** - Accountancy, Business, Management track  
**HUMSS** - Humanities and Social Sciences track  
**GAS** - General Academic Strand  
**TVL** - Technical-Vocational-Livelihood track  
**MATATAG** - New K-12 curriculum (2024+)  
**CTA** - Call To Action (button or link)  
**MVP** - Minimum Viable Product  
**LOC** - Lines of Code  
**CMS** - Content Management System  
**SEO** - Search Engine Optimization  
**WCAG** - Web Content Accessibility Guidelines

---

**Next Steps:**
1. Review and approve requirements
2. Create design mockups (optional)
3. Break down into implementation tasks
4. Begin development

**Estimated Timeline:**
- Requirements: ✅ Complete
- Design: 30 minutes
- Implementation: 2-3 hours
- Testing & refinement: 30 minutes
- **Total:** ~4 hours
