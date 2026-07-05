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

**Mobile width (narrow the window to ~380px)**
- [ ] Header nav, HUD chips and tab bar wrap/scroll sensibly; the two
      circular buttons bottom-right don't overlap content.

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
