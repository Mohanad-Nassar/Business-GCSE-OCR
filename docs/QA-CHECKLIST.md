# 15-minute browser QA pass

Run this after any big change, in a real browser (hard-refresh with
**Ctrl+F5** first — `netlify dev` and browsers cache the shared JS).
Automated logic tests exist too: `python tools/logic_test.py`.

## Student flow (log in as a test student — incognito window)

**Login page**
- [ ] Show/Hide toggles the password field; a wrong password gives the
      "check for typos… ask your teacher" message, not a dead end.

**Home page (index.html)**
- [ ] Hero shows the HUD (level, XP bar, 🎯 daily goal, 🔥 streak, 🏅 badges)
      and a gold **▶ Continue where you left off** card.
- [ ] Topic cards show progress footers (⚡ XP for untouched, % bar for
      started, 🏆 Complete for finished ones).
- [ ] First visit on a fresh browser: the onboarding tour auto-shows (dim
      overlay + gold spotlight ring, 5 steps: HUD → 🔔 bell → topics →
      example task card → Manage Account); reload the page — it does NOT
      reopen. Click **❓ Take the tour** next to My Progress — it replays.
- [ ] 🔔 bell appears in the account bar; after a teacher assigns/marks a
      task (see Task Manager below) it shows a badge count and the dropdown
      lists it with a working **Open →** link; ✕ dismisses and the count
      drops (persists after reload — same `task_notification_reads` row the
      dashboard's own notification list uses).

**Topic page (pick any 1.x topic)**
- [ ] HUD at the top; tab bar shows a ring/✓ per activity.
- [ ] Focus mode: ONE card/question at a time with `‹ Back · n / N · Next ›`.
- [ ] Answering too fast (within reading time) bounces with the
      "🐢 Slow down" toast; the Next button counts "📖 Read carefully… Ns"
      then "⏳ Next in Ns" after answering.
- [ ] Correct answer: +10 XP toast + sound. Wrong answer: buzz, **no** XP.
- [ ] Finish an activity: completion toast + **▶ Next up:** chip appears in
      the HUD (it stays hidden while mid-activity), URL gains `#mcq` etc.
- [ ] Get one MCQ wrong then finish the quiz: the "So close! Redo n wrong"
      banner + 🔁 REDO button appear; redo clears only the wrong ones.
- [ ] Finish everything on a topic: confetti "Topic Complete! +200 XP" with
      a Next-topic button; HUD chip flips to "▶ Next lesson: …".
- [ ] Share test: open `…topic.html#matching` in a new tab — lands on
      Matching directly.

**Student dashboard (dashboard.html)**
- [ ] Continue card at top; tasks table (if any) shows due-soon dates in
      red/amber; "Topics to Review" rows link to topic pages ("Revise →").
- [ ] 🔔 bell shows in the account bar (top of header); dismissing a
      notification here also removes it from the bell dropdown (and vice
      versa) without a page reload needed on the second page.

**Daily Revise (daily-revise.html)**
- [ ] Every question shows the 4-segment mastery bar at the top: a brand-new
      question is all grey; answer it right and a segment lights (red →
      +orange → +yellow → green = mastered); get ANY question wrong — even
      a mastered one with "Don't ask mastered" off — and the bar snaps back
      to a single red segment.
- [ ] 🔍 Filters: the three toggles (Smart mode / Don't ask mastered /
      Incorrect only) + Update re-query the queue; choices persist across a
      reload; toggles stay usable even when the class is Teacher controlled
      (only the topic ticks are locked). "Incorrect only" with nothing wrong
      shows the friendly "No questions you last got wrong" state.

**Manage Account (manage-account.html)**
- [ ] Reachable from the account bar/site nav on index.html, a topic page,
      and dashboard.html. Account tab shows username, "Student", member-since
      date, and your class(es) with the correct teacher name.
- [ ] Password tab: mismatched passwords and passwords under 8 characters
      are rejected with a message, not silently. A valid change succeeds;
      log out and log back in with the NEW password to confirm it stuck.
- [ ] A teacher visiting `manage-account.html` directly is redirected to
      `teacher-dashboard.html` (this page is student-only).

**Mobile width (narrow the window to ~380px)**
- [ ] Header nav, HUD chips and tab bar wrap/scroll sensibly; the two
      circular buttons bottom-right don't overlap content.
- [ ] Bell dropdown becomes a full-width bottom sheet rather than clipping
      off-screen; on task.html the fixed bottom-right bell doesn't overlap
      the sticky header/timer pill.

## Teacher flow

**Teacher dashboard**
- [ ] "👋 Getting started" guide shows correct ticks; "Needs you today"
      strip appears when there are unmarked answers / pending requests.
- [ ] Class cards show 👥 count and gold alerts (✍️ to mark / 🙋 requests).
- [ ] Opening a class with no students lands on the guided logins step;
      generate 1 login, download the CSV, copy the login link.
- [ ] 🔒 Topic Access: three steps render; in "🎯 I choose" mode,
      **Hide all** then ticking one unit's box flips its counter to n/n and
      leaves the rest 0/…
- [ ] Change Step 3 to "All at once" → a student topic page (after reload)
      shows the whole list, no timers. Change back.
      (Requires `supabase/class-flow-settings.sql` to have been run.)
- [ ] Class Progress tab shows the "🎯 Daily Revise" strip (attempts /
      mastered / accuracy) once a student has practised; its "Full Daily
      Revise analytics →" link opens `teacher-analytics.html` for that class.
      (Requires `supabase/daily-revise-analytics.sql`; the strip hides
      itself if that hasn't been run.)

**Daily Revise Analytics (teacher-analytics.html)**
- [ ] All four tabs load: Usage (sort + All/7/30-day windows), Student
      overview (stacked mastery bars + accuracy), Question analysis (least/
      most-understood cards with per-option answer bars; FIB questions show
      a correct/incorrect split instead), Class matrix (heat-tinted student ×
      topic grid with a Mastered % column, horizontally scrollable).
- [ ] "⬇ Download data" in Question analysis saves a CSV of every question,
      not just the top-10s.

**Task Manager**
- [ ] "How tasks work" strip shows; build a 2-question task through the
      3 steps and publish; student sees it on their dashboard, the Submit
      button shows "(n/N answered)" while sitting it.
- [ ] With `GEMINI_API_KEY` set and an unmarked written answer in a task's
      Marking queue, click **✨ Suggest marks** — a suggestion card (marks,
      feedback, reasoning, confidence) appears; **Use this** fills the mark
      + feedback boxes but does NOT save (Save mark is still required, and
      the answer stays in the queue until you press it). Without
      `GEMINI_API_KEY` set, the button shows the "Add GEMINI_API_KEY in
      Netlify" message instead of erroring silently.

## Pacing enforcement (student, class set to "In order")
- [ ] Tabs after the first unfinished activity show 🔒 and bounce with
      "Finish 📚 Key Learning first"; a shared link to a locked activity
      bounces the same way.
