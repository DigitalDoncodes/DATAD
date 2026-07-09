# D² Labs — Product Roadmap

Goal: evolve from a batch utility app into a **Student Operating System** — the platform
MBA students open every day. Modules ship incrementally; nothing existing breaks.

## ✅ Phase 0 — Foundation (done)

- JWT auth (open signup), dark mode, responsive navbar
- Notes (shared, by subject/semester) · Photos (albums, Cloudinary) · Planner (shared tasks)
- Finance (private): expenses, budget, category chart, EMI/SIP/savings calculators
- Resume Builder (private): guided sections → ATS print-to-PDF
- Support page: UPI QR presets + roadmap · Footer with feedback links

## 🔜 Phase 1 — Go live

- Deploy server (Render/Railway) + client (Vercel), custom domain
- Change-password + profile page (avatar, bio, LinkedIn/GitHub links)
- Global toast/skeleton polish, code-split routes

## Phase 2 — Placements & careers

- **Placement Hub**: companies, role, package, eligibility, deadline, rounds;
  per-student status tracker (Applied → Shortlisted → Interview → Offer/Rejected)
- **Internship Board**: company, location, remote/hybrid, apply link, deadline
- Resume: multiple stored resumes, more templates
- Admin role for creating placements & announcements

## Phase 3 — Community

- **Community Feed**: posts, images, questions, polls, likes, comments, bookmarks,
  hashtags, mentions, infinite scroll
- **Student Directory**: searchable profiles — skills, interests, clubs, links
- **Announcements** (pinned, priority) + **Notification Center** (Socket.IO)
- Bookmarks across posts/notes/resources/placements

## Phase 4 — Resources & events

- Notes → **Resource Library**: PDF/Word/Excel/PPT/ZIP/video/links, categorized by
  subject/semester/professor/tags, global search
- **Event Management**: RSVP, attendance, gallery, certificates
- **Group Projects**: kanban tasks, deadlines, files, comments

## Phase 5 — Growth & intelligence

- **AI section**: document summarization, resume review, interview Q&A, flashcards,
  prompt library (needs API budget)
- **Study Tools**: pomodoro, habit tracker, goals, streaks
- **Gamification**: contribution score, badges, leaderboard
- **Marketplace** & **Skill Exchange** (needs critical mass of users)
- **Portfolio Generator**: public shareable profile pages
- **Admin panel** with analytics dashboards

## Principles

- Never break existing functionality; refactor only when a module demands it
- Private-by-default for personal data (finance, resume); shared-by-default for batch content
- Ship small, verify in the browser, commit per feature
