# CIPP/US Study Hub

An interactive, Quizlet-style study tool for the **IAPP Certified Information Privacy Professional / United States (CIPP/US)** exam. No install required — open in any modern browser.

## Features

- **Flashcards** — 150 cards across all five Body of Knowledge domains; flip, shuffle, mark as “got it” or “still learning”
- **Practice quiz** — Multiple-choice questions with explanations (scenario-style)
- **Exam simulation** — Timed practice run modeled on the 90-question / 2.5-hour format
- **Progress tracking** — Domain mastery, streaks, quiz history (saved in your browser)
- **Custom decks** — Add your own cards; export/import to share with study groups
- **Domain filters** — Study by exam section, weighted per the IAPP Exam Blueprint

## Exam domains covered

| Domain | Topic | Blueprint weight |
|--------|--------|------------------|
| I | Introduction to the U.S. Privacy Environment | 27–35% |
| II | Limits on Private-Sector Collection and Use of Data | 15–25% |
| III | Government and Court Access to Private-Sector Information | 3–7% |
| IV | Workplace Privacy | 3–7% |
| V | State Privacy Laws | 30–40% |

## How to run locally

1. Open the `cippus-study` folder
2. Double-click `index.html`, **or** start a simple local server:

   ```bash
   # Python
   python -m http.server 8080

   # Then visit http://localhost:8080
   ```

> **Note:** ES modules require a local server in some browsers when opening files directly. If flashcards don’t load, use the Python command above.

## Share with others

- **Same computer:** Send the `cippus-study` folder (zip it)
- **Online:** Deploy to [GitHub Pages](https://pages.github.com/), Netlify, or Vercel (static site — no backend needed)
- **Study group:** Use **Progress → Export progress** and share JSON backups

## Official study resources

Verify all topics against the current IAPP materials:

- [IAPP Get Certified – CIPP/US](https://iapp.org/certify/get-certified/)
- Body of Knowledge (BoK) and Exam Blueprint (free PDFs on IAPP site)
- IAPP sample questions and official textbook

This tool is **not affiliated with IAPP**. Content is for study practice only.

## Adding more content

Edit `js/data.js`:

- `FLASHCARDS` — add `{ id, domain, front, back }` objects
- `QUIZ_QUESTIONS` — add questions with `options`, `correct` (0-based index), and `explanation`

Domain IDs: `"I"`, `"II"`, `"III"`, `"IV"`, `"V"`.
