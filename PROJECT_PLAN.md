# Semester Swap: College Marketplace Project Plan

## 🚀 The Vision
To create a sustainable, student-driven marketplace where college equipment (textbooks, drafters, calculators, lab coats) can be reused across semesters, saving students money and reducing waste.

---

## 🛠 Features (The Core + Innovation)

### 1. The Marketplace (Your Plan)
- **Item Listings:** Students can post items with photos, descriptions, price, and contact info.
- **Buyer Browsing:** New students search and find used items at a fraction of the cost.
- **Direct Exchange:** Localized handovers within the campus (Cash/UPI on Pickup).

### 2. My Added Innovations
- **🎓 Verified College Community:** Locked to one specific college domain for safety.
- **📦 "Wanted" Board:** If a student can't find a specific book, they can post a "Wanted" request.
- **📂 Departmental Sorting:** Group items by Engineering branch or Semester for hyper-relevant searching.
- **✨ Sleek & Minimalist UI:** A premium SaaS-like aesthetic using a dark/glassmorphic theme.
- **� Real-time Database (Supabase):** Using Supabase for Auth, Storage (images), and Real-time updates.

---

## 🗺 Implementation Roadmap

### Phase 1: The Foundation (MVP)
*Goal: Get the basic loop working.*
- [ ] **Tech Stack Setup:** Next.js (Frontend/Backend), Supabase (Database), TailindCSS (Styling).
- [ ] **Authentication:** Login/Signup restricted to college email domains.
- [ ] **Listing Engine:** Upload images, set price, add category (Textbook, Tool, Stationery).
- [ ] **Search & Filter:** Find items by name, price range, or department.

### Phase 2: Engagement & Trust
*Goal: Build the community layer.*
- [ ] **User Profiles:** History of items sold/bought and active listings.
- [ ] **Real-time Chat:** Internal messaging to negotiate price (keeping personal phone numbers private if desired).
- [ ] **"Wanted" Requests:** Simple form to request items.
- [ ] **Rating System:** Simple stars and "Verified Student" badges.

### Phase 3: Scaling & Analytics
*Goal: Optimize and prove value.*
- [ ] **Dashboard:** Stats on items swapped and money saved.
- [ ] **Push Notifications:** Alerts when a "Wanted" item or a new item in your department is posted.
- [ ] **Admin Panel:** For college moderators to flag inappropriate content.

---

## ✅ Progress Checklist (For our Daily Work)

- **Initialization**
  - [ ] Initialize Next.js project
  - [ ] Connect Supabase/Database
- **Core App**
  - [ ] Implement Auth
  - [ ] Build Listing Form
  - [ ] Build Marketplace Feed
  - [ ] Build Item Detail Page
- **Polish**
  - [ ] Responsive UI (Mobile First)
  - [ ] Dark Mode support
- **Launch**
  - [ ] Deployment to Vercel
  - [ ] Beta testing with 5 students

---

## 🛠 Technical Decisions
1. **Framework:** Next.js (App Router)
2. **Database & Auth:** Supabase (Postgres + Supabase Auth)
3. **Storage:** Supabase Storage (for item images)
4. **Styling:** Tailwind CSS with a "Premium Dark" aesthetic.
5. **Deployment:** Vercel

---
*Once you approve this plan, I will start by initializing the project structure.*
