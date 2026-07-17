# Screenshot Index

All screenshots are full-page PNGs, captured after `networkidle` + 600ms settle. Stored outside the repo (binary audit artifacts, not committed) at:
`/private/tmp/claude-501/-Users-aaruraanat-Downloads-DATAD/5e5b1ca0-6ae8-4949-bf70-5214363d4ddc/scratchpad/audit/screenshots/<filename>`

Every row below reflects a real, successful page load under a real session unless noted.

| Route | Account | Label | Status | Screenshot file |
|---|---|---|---|---|
| `/briefing` | user | Dashboard / Daily Briefing | 🟡 LOADED (see CONSOLE/NETWORK_ERRORS.md) | briefing__user.png |
| `/study` | user | Study Hub | 🟢 OK | study__user.png |
| `/study/notes` | user | Notes List | 🟢 OK | study_notes__user.png |
| `/study/notes/new` | user | Note Editor (new) | 🟢 OK | study_notes_new__user.png |
| `/study/work` | user | Work (Assignments/Projects) | 🟡 LOADED (see CONSOLE/NETWORK_ERRORS.md) | study_work__user.png |
| `/study/subject` | user | Subject | 🟢 OK | study_subject__user.png |
| `/study/resources` | user | Resources | 🟢 OK | study_resources__user.png |
| `/study/focus` | user | Focus / Study Tools | 🟢 OK | study_focus__user.png |
| `/career` | user | Career Hub | 🟢 OK | career__user.png |
| `/career/resume` | user | Resume Builder | 🟡 LOADED (see CONSOLE/NETWORK_ERRORS.md) | career_resume__user.png |
| `/career/resume/preview` | user | Resume Preview | 🟢 OK | career_resume_preview__user.png |
| `/career/companies` | user | Companies List | 🟢 OK | career_companies__user.png |
| `/career/companies/tcs` | user | Company Detail (tcs) | 🟢 OK | career_companies_tcs__user.png |
| `/career/opportunities` | user | Opportunities | 🟢 OK | career_opportunities__user.png |
| `/career/questions` | user | Interview Questions | 🟡 LOADED (see CONSOLE/NETWORK_ERRORS.md) | career_questions__user.png |
| `/career/pivot` | user | Career Pivot | 🟢 OK | career_pivot__user.png |
| `/career/stories` | user | STAR Stories | 🟢 OK | career_stories__user.png |
| `/community` | user | Community Hub | 🟢 OK | community__user.png |
| `/community/announcements` | user | Announcements | 🟢 OK | community_announcements__user.png |
| `/community/feed` | user | Feed / Stream | 🟢 OK | community_feed__user.png |
| `/community/memories` | user | Memories | 🟢 OK | community_memories__user.png |
| `/community/archive/cartoons/shin-chan` | user | Archive Detail (shin-chan) | 🟢 OK | community_archive_cartoons_shin-chan__user.png |
| `/community/directory` | user | Directory | 🟢 OK | community_directory__user.png |
| `/community/events` | user | Events | 🟢 OK | community_events__user.png |
| `/community/marketplace` | user | Marketplace | 🟢 OK | community_marketplace__user.png |
| `/community/skills` | user | Skill Exchange | 🟢 OK | community_skills__user.png |
| `/me` | user | Life Hub | 🟢 OK | me__user.png |
| `/me/planner` | user | Planner | 🟡 LOADED (see CONSOLE/NETWORK_ERRORS.md) | me_planner__user.png |
| `/me/settings` | user | Settings | 🟢 OK | me_settings__user.png |
| `/me/journal` | user | Journal | 🟢 OK | me_journal__user.png |
| `/me/reflection` | user | Reflection | 🟢 OK | me_reflection__user.png |
| `/me/finance` | user | Finance Hub | 🟢 OK | me_finance__user.png |
| `/me/finance/tracker` | user | Finance Tracker | 🟢 OK | me_finance_tracker__user.png |
| `/me/finance/calculator` | user | Finance Calculator | 🟢 OK | me_finance_calculator__user.png |
| `/me/finance/learn` | user | Finance Learn | 🟢 OK | me_finance_learn__user.png |
| `/me/finance/roi` | user | Finance ROI | 🟢 OK | me_finance_roi__user.png |
| `/me/wellbeing` | user | Wellbeing Hub | 🟢 OK | me_wellbeing__user.png |
| `/me/wellbeing/study` | user | Wellbeing Study | 🟢 OK | me_wellbeing_study__user.png |
| `/me/wellbeing/memory` | user | Wellbeing Memory | 🟢 OK | me_wellbeing_memory__user.png |
| `/me/wellbeing/routines` | user | Wellbeing Routines | 🟢 OK | me_wellbeing_routines__user.png |
| `/me/wellbeing/support` | user | Wellbeing Support | 🟢 OK | me_wellbeing_support__user.png |
| `/search` | user | Search | 🟢 OK | search__user.png |
| `/subscribe` | user | Subscribe | 🟢 OK | subscribe__user.png |
| `/support` | user | Support | 🟢 OK | support__user.png |
| `/admin` | admin | Admin Home | 🟢 OK | admin__admin.png |
| `/admin/students` | admin | Admin Students | 🟢 OK | admin_students__admin.png |
| `/admin/studio` | admin | Admin Studio | 🟢 OK | admin_studio__admin.png |
| `/admin/announcements` | admin | Admin Announcements | 🟢 OK | admin_announcements__admin.png |
| `/admin/logs` | admin | Admin Logs | 🟢 OK | admin_logs__admin.png |
| `/admin/referrals` | admin | Admin Referrals | 🟢 OK | admin_referrals__admin.png |
| `/admin/archive` | admin | Admin Archive | 🟢 OK | admin_archive__admin.png |
| `/admin/companies` | admin | Admin Companies | 🟢 OK | admin_companies__admin.png |
| `/admin/cases` | admin | Admin Cases | 🟢 OK | admin_cases__admin.png |
| `/admin/automation` | admin | Admin Automation | 🟢 OK | admin_automation__admin.png |
| `/admin/ai-center` | admin | Admin AI Center | 🟢 OK | admin_ai-center__admin.png |
| `/admin/ai-runtime` | admin | Admin AI Runtime (observability) | 🟢 OK | admin_ai-runtime__admin.png |
| `/admin/subscriptions` | admin | Admin Subscriptions | 🟢 OK | admin_subscriptions__admin.png |

## Not audited

| Route pattern | Label | Reason |
|---|---|---|
| `/study/notes/:id` | Note Detail | No Note documents exist in this dev database (confirmed via countDocuments) — no real id to visit. |
| `/study/notes/:id/edit` | Note Editor (edit) | Same — depends on a real note id. |
| `/admin/studio/:id` | Admin Studio Review | Depends on a specific content-item id; not enumerated for this pass. |
