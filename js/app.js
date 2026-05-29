import {
  DOMAINS,
  EXAM_INFO,
  FLASHCARDS,
  getCardsByDomain,
  getQuizByDomain,
  shuffle,
} from "./data.js";
import {
  exportAllData,
  getCustomDecks,
  getProgress,
  getStats,
  importAllData,
  markCard,
  recordExamAttempt,
  recordQuizScore,
  saveCustomDecks,
} from "./storage.js";

const main = document.getElementById("main");

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function parseHash() {
  const hash = location.hash.slice(1) || "/";
  const [path, query] = hash.split("?");
  const params = new URLSearchParams(query || "");
  return { path: path || "/", params };
}

function navigate(path) {
  location.hash = path;
}

function setActiveNav() {
  const { path } = parseHash();
  const segment = path.split("/")[1] || "home";
  document.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === segment || (segment === "" && a.dataset.nav === "home"));
  });
}

function pageHeader(title, subtitle) {
  return `
    <div class="page-header">
      <h1 class="page-title">${title}</h1>
      ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ""}
    </div>`;
}

const DOMAIN_COLORS = {
  I: "#7c3aed",
  II: "#2563eb",
  III: "#06b6d4",
  IV: "#10b981",
  V: "#f59e0b",
};

function initNavToggle() {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;
  toggle.onclick = () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };
  links.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function renderHome() {
  const stats = getStats(FLASHCARDS);
  const customCount = getCustomDecks().reduce((n, d) => n + (d.cards?.length || 0), 0);

  main.innerHTML = `
    <div class="page-home">
      <section class="hero-section">
        <div class="hero-mesh" aria-hidden="true">
          <div class="mesh-orb mesh-orb--purple"></div>
          <div class="mesh-orb mesh-orb--blue"></div>
        </div>
        <div class="hero-grid-overlay" aria-hidden="true"></div>
        <div class="hero-content">
          <div class="hero-eyebrow">
            <span class="eyebrow-dot"></span>
            <span>Exam Preparation</span>
          </div>
          <h1 class="hero-title page-title">
            Study for the <span class="gradient-text">CIPP/US</span> Exam
          </h1>
          <p class="hero-sub page-subtitle">
            Interactive flashcards, quizzes, and exam simulation aligned with the five IAPP Body of Knowledge domains.
            ${EXAM_INFO.questions} questions · ${EXAM_INFO.durationMinutes / 60} hours · passing score ${EXAM_INFO.passingScore}/${EXAM_INFO.maxScore}.
          </p>
          <div class="hero-ctas">
            <a href="#/quiz" class="btn btn-primary btn-lg">Practice Quiz</a>
            <a href="#/flashcards" class="btn btn-ghost btn-lg">Study Flashcards</a>
            <a href="#/exam" class="btn btn-ghost btn-lg hero-cta-exam">Exam Simulation</a>
          </div>
          <div class="home-stats stats-row">
            <div class="stat-card"><div class="stat-card-value value">${stats.known}</div><div class="stat-card-label label">Cards mastered</div></div>
            <div class="stat-card"><div class="stat-card-value value">${stats.learning}</div><div class="stat-card-label label">Still learning</div></div>
            <div class="stat-card"><div class="stat-card-value value">${stats.streak}</div><div class="stat-card-label label">Day streak</div></div>
            <div class="stat-card"><div class="stat-card-value value">${FLASHCARDS.length + customCount}</div><div class="stat-card-label label">Total cards</div></div>
          </div>
        </div>
      </section>

      <div class="container domains-section">
        <div class="section-intro">
          <h2 class="section-title">Exam domains (by blueprint weight)</h2>
          <p class="section-desc">Click a domain to start a focused quiz</p>
        </div>
        <div class="domain-grid domain-cards-grid">
          ${DOMAINS.map(
            (d) => `
          <a href="#/flashcards?domain=${d.id}" class="domain-card" style="--domain-color: ${DOMAIN_COLORS[d.id]}">
            <span class="domain-badge">Domain ${d.id} · ${d.weight}</span>
            <h3 class="domain-card-name">${escapeHtml(d.shortTitle)}</h3>
            <p>${escapeHtml(d.description)}</p>
            <div class="domain-card-progress weight-bar">
              <div class="domain-card-bar-wrap">
                <div class="domain-card-bar weight-fill" style="width:${d.weightNum}%"></div>
              </div>
            </div>
          </a>`
          ).join("")}
        </div>

        <div class="mode-cards">
          <a href="#/flashcards" class="mode-card card">
            <h3>Flashcards</h3>
            <p>Flip cards, mark progress, filter by domain</p>
          </a>
          <a href="#/quiz" class="mode-card card">
            <h3>Practice Quiz</h3>
            <p>Multiple-choice with explanations</p>
          </a>
          <a href="#/exam" class="mode-card card">
            <h3>Exam Simulation</h3>
            <p>Timed practice · ${EXAM_INFO.questions}-question format</p>
          </a>
          <a href="#/progress" class="mode-card card">
            <h3>Progress</h3>
            <p>Track scores and domain mastery</p>
          </a>
        </div>
      </div>
    </div>
  `;
}

let flashcardState = null;

function renderFlashcards() {
  const { params } = parseHash();
  const domain = params.get("domain") || "all";

  if (!flashcardState || flashcardState.domain !== domain) {
    const custom = getCustomDecks().flatMap((d) => d.cards || []);
    const builtIn = getCardsByDomain(domain);
    const customFiltered =
      domain === "all" ? custom : custom.filter((c) => c.domain === domain);
    const cards = shuffle([...builtIn, ...customFiltered]);
    flashcardState = {
      domain,
      cards,
      index: 0,
      flipped: false,
    };
  }

  const { cards, index, flipped } = flashcardState;
  const card = cards[index];
  const progress = getProgress();
  const status = progress.cards[card?.id];

  if (!card || cards.length === 0) {
    main.innerHTML = `
      <p class="empty-state">No cards in this set.
        <a href="#/decks">Add custom cards</a> or choose another domain.
        <a href="#/">Go home</a>
      </p>`;
    flashcardState = null;
    return;
  }

  main.innerHTML = `
    ${pageHeader("Flashcards", "Click the card to flip. Rate yourself to track mastery.")}

    <div class="study-toolbar">
      <select class="filter-select" id="domain-filter">
        <option value="all" ${domain === "all" ? "selected" : ""}>All domains</option>
        ${DOMAINS.map((d) => `<option value="${d.id}" ${domain === d.id ? "selected" : ""}>Domain ${d.id}: ${escapeHtml(d.shortTitle)}</option>`).join("")}
      </select>
      <span>${index + 1} / ${cards.length}</span>
    </div>

    <div class="progress-dots">
      ${cards.slice(0, 30).map((c, i) => {
        const s = progress.cards[c.id];
        let cls = "progress-dot";
        if (i === index) cls += " current";
        if (s === "known") cls += " known";
        if (s === "learning") cls += " learning";
        return `<span class="${cls}" title="Card ${i + 1}"></span>`;
      }).join("")}
      ${cards.length > 30 ? `<span style="color:var(--text-muted);font-size:0.8rem">+${cards.length - 30} more</span>` : ""}
    </div>

    <div class="flashcard-container">
      <div class="flashcard ${flipped ? "flipped" : ""}" id="flashcard" role="button" tabindex="0" aria-label="Flip card">
        <div class="flashcard-face flashcard-front">
          <span class="flashcard-label">Domain ${card.domain} · Question</span>
          <p class="flashcard-text">${escapeHtml(card.front)}</p>
          <span class="flashcard-hint">Click or press Space to reveal answer</span>
        </div>
        <div class="flashcard-face flashcard-back">
          <span class="flashcard-label">Answer</span>
          <p class="flashcard-text">${escapeHtml(card.back)}</p>
        </div>
      </div>
    </div>

    <div class="study-controls">
      <button class="btn btn-secondary" id="btn-prev" ${index === 0 ? "disabled" : ""}>← Previous</button>
      <button class="btn btn-danger" id="btn-learning">Still learning</button>
      <button class="btn btn-success" id="btn-known">Got it ✓</button>
      <button class="btn btn-secondary" id="btn-next">${index === cards.length - 1 ? "Restart" : "Next →"}</button>
    </div>
    <div class="btn-group" style="justify-content:center;margin-top:1.5rem">
      <button class="btn btn-secondary" id="btn-shuffle">Shuffle deck</button>
    </div>
  `;

  document.getElementById("domain-filter").onchange = (e) => {
    flashcardState = null;
    navigate(`/flashcards?domain=${e.target.value}`);
  };

  const flip = () => {
    flashcardState.flipped = !flashcardState.flipped;
    document.getElementById("flashcard").classList.toggle("flipped", flashcardState.flipped);
  };

  document.getElementById("flashcard").onclick = flip;
  document.getElementById("flashcard").onkeydown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flip();
    }
  };

  document.getElementById("btn-prev").onclick = () => {
    if (index > 0) {
      flashcardState.index--;
      flashcardState.flipped = false;
      renderFlashcards();
    }
  };

  document.getElementById("btn-next").onclick = () => {
    if (index < cards.length - 1) {
      flashcardState.index++;
      flashcardState.flipped = false;
      renderFlashcards();
    } else {
      flashcardState.cards = shuffle(flashcardState.cards);
      flashcardState.index = 0;
      flashcardState.flipped = false;
      renderFlashcards();
    }
  };

  document.getElementById("btn-known").onclick = () => {
    markCard(card.id, "known");
    advanceCard();
  };

  document.getElementById("btn-learning").onclick = () => {
    markCard(card.id, "learning");
    advanceCard();
  };

  document.getElementById("btn-shuffle").onclick = () => {
    flashcardState.cards = shuffle(flashcardState.cards);
    flashcardState.index = 0;
    flashcardState.flipped = false;
    renderFlashcards();
  };

  function advanceCard() {
    if (index < cards.length - 1) {
      flashcardState.index++;
      flashcardState.flipped = false;
    }
    renderFlashcards();
  }
}

let quizState = null;

function renderQuiz() {
  const { params } = parseHash();
  const domain = params.get("domain") || "all";
  const count = parseInt(params.get("count") || "10", 10);

  if (!quizState || quizState.sessionId !== `${domain}-${count}-${location.hash}`) {
    quizState = {
      sessionId: `${domain}-${count}-${location.hash}`,
      questions: getQuizByDomain(domain, count),
      index: 0,
      score: 0,
      answered: false,
      domain,
    };
  }

  const { questions, index, score, answered } = quizState;
  const q = questions[index];

  if (!q) {
    main.innerHTML = `<p class="empty-state">No questions available.</p>`;
    return;
  }

  if (index >= questions.length && quizState.finished) {
    recordQuizScore(score, questions.length, domain);
    main.innerHTML = `
      <div class="results-panel">
        <h2 class="page-title">Quiz complete</h2>
        <div class="results-score ${score / questions.length >= 0.7 ? "pass" : "fail"}">${score}/${questions.length}</div>
        <p>${Math.round((score / questions.length) * 100)}% correct</p>
        <p class="page-subtitle" style="margin:1rem auto">Aim for 70%+ consistently before exam day.</p>
        <div class="btn-group" style="justify-content:center">
          <a href="#/quiz" class="btn btn-primary">New quiz</a>
          <a href="#/" class="btn btn-secondary">Home</a>
        </div>
      </div>
    `;
    quizState = null;
    return;
  }

  main.innerHTML = `
    ${pageHeader("Practice Quiz", "Scenario-style multiple choice with explanations — like the real exam.")}

    <div class="study-toolbar">
      <select class="filter-select" id="quiz-domain">
        <option value="all" ${domain === "all" ? "selected" : ""}>All domains</option>
        ${DOMAINS.map((d) => `<option value="${d.id}" ${domain === d.id ? "selected" : ""}>Domain ${d.id}</option>`).join("")}
      </select>
      <select class="filter-select" id="quiz-count">
        ${[5, 10, 15, 25].map((n) => `<option value="${n}" ${count === n ? "selected" : ""}>${n} questions</option>`).join("")}
      </select>
    </div>

    <div class="quiz-card">
      <div class="quiz-meta">
        <span>Question ${index + 1} of ${questions.length}</span>
        <span>Score: ${score}</span>
      </div>
      <p class="quiz-question">${escapeHtml(q.question)}</p>
      <div class="quiz-options" id="quiz-options">
        ${q.options.map((opt, i) => `<button class="quiz-option" data-i="${i}" ${answered ? "disabled" : ""}>${String.fromCharCode(65 + i)}. ${escapeHtml(opt)}</button>`).join("")}
      </div>
      <div id="quiz-feedback"></div>
    </div>
  `;

  document.getElementById("quiz-domain").onchange = () => {
    quizState = null;
    navigate(`/quiz?domain=${document.getElementById("quiz-domain").value}&count=${document.getElementById("quiz-count").value}`);
  };
  document.getElementById("quiz-count").onchange = () => {
    quizState = null;
    navigate(`/quiz?domain=${document.getElementById("quiz-domain").value}&count=${document.getElementById("quiz-count").value}`);
  };

  if (!answered) {
    document.querySelectorAll(".quiz-option").forEach((btn) => {
      btn.onclick = () => {
        const chosen = parseInt(btn.dataset.i, 10);
        quizState.answered = true;
        if (chosen === q.correct) quizState.score++;
        document.querySelectorAll(".quiz-option").forEach((b, i) => {
          b.disabled = true;
          if (i === q.correct) b.classList.add("correct");
          else if (i === chosen) b.classList.add("incorrect");
        });
        document.getElementById("quiz-feedback").innerHTML = `
          <div class="quiz-explanation">
            <strong>${chosen === q.correct ? "Correct!" : "Incorrect."}</strong>
            ${escapeHtml(q.explanation)}
            <div class="btn-group">
              <button class="btn btn-primary" id="quiz-next">${index < questions.length - 1 ? "Next question" : "See results"}</button>
            </div>
          </div>
        `;
        document.getElementById("quiz-next").onclick = () => {
          quizState.index++;
          quizState.answered = false;
          if (quizState.index >= questions.length) quizState.finished = true;
          renderQuiz();
        };
      };
    });
  }
}

let examState = null;
let examTimerId = null;

function renderExam() {
  const { params } = parseHash();
  const phase = params.get("phase") || "intro";

  if (phase === "intro") {
    if (examTimerId) clearInterval(examTimerId);
    examState = null;
    main.innerHTML = `
      ${pageHeader(
        "Exam Simulation",
        `Practice under exam-like conditions: ${EXAM_INFO.questions} questions in ${EXAM_INFO.durationMinutes} minutes. This session uses ${Math.min(25, getQuizByDomain("all", 25).length)} questions for a focused practice run.`
      )}
      <div class="quiz-card" style="max-width:520px">
        <ul style="color:var(--text-muted);padding-left:1.2rem">
          <li>Multiple choice, one best answer</li>
          <li>Timer counts down from ${EXAM_INFO.durationMinutes} minutes</li>
          <li>No going back to previous questions (like the real exam)</li>
          <li>Target: 70%+ (${Math.ceil(25 * 0.7)}+ correct on this practice set)</li>
        </ul>
        <div class="btn-group">
          <a href="#/exam?phase=run" class="btn btn-primary">Start exam</a>
          <a href="#/" class="btn btn-secondary">Cancel</a>
        </div>
      </div>
    `;
    return;
  }

  if (phase === "run") {
    if (!examState) {
      examState = {
        questions: getQuizByDomain("all", 25),
        index: 0,
        score: 0,
        answered: false,
        startTime: Date.now(),
        endTime: Date.now() + EXAM_INFO.durationMinutes * 60 * 1000,
      };
    }

    const remaining = Math.max(0, examState.endTime - Date.now());
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const timerClass = remaining < 600000 ? "quiz-timer warning" : "quiz-timer";

    if (remaining <= 0 && !examState.finished) {
      examState.finished = true;
      finishExam();
      return;
    }

    const { questions, index, score, answered } = examState;
    const q = questions[index];

    if (examState.finished || index >= questions.length) {
      finishExam();
      return;
    }

    main.innerHTML = `
      <div class="study-toolbar">
        <span class="${timerClass}">${mins}:${secs.toString().padStart(2, "0")}</span>
        <span>Question ${index + 1} / ${questions.length}</span>
      </div>
      <div class="quiz-card">
        <p class="quiz-question">${escapeHtml(q.question)}</p>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `<button class="quiz-option" data-i="${i}" ${answered ? "disabled" : ""}>${String.fromCharCode(65 + i)}. ${escapeHtml(opt)}</button>`).join("")}
        </div>
      </div>
    `;

    if (!examTimerId) {
      examTimerId = setInterval(() => {
        if (parseHash().path !== "/exam") {
          clearInterval(examTimerId);
          examTimerId = null;
          return;
        }
        renderExam();
      }, 1000);
    }

    if (!answered) {
      document.querySelectorAll(".quiz-option").forEach((btn) => {
        btn.onclick = () => {
          const chosen = parseInt(btn.dataset.i, 10);
          if (chosen === q.correct) examState.score++;
          examState.index++;
          examState.answered = false;
          renderExam();
        };
      });
    }
    return;
  }

  navigate("/exam");
}

function finishExam() {
  if (examTimerId) {
    clearInterval(examTimerId);
    examTimerId = null;
  }
  const { questions, score, startTime } = examState;
  const durationSeconds = Math.round((Date.now() - startTime) / 1000);
  const pct = Math.round((score / questions.length) * 100);
  recordExamAttempt(score, questions.length, durationSeconds);
  examState = null;

  main.innerHTML = `
    <div class="results-panel">
      <h2 class="page-title">Exam simulation complete</h2>
      <div class="results-score ${pct >= 70 ? "pass" : "fail"}">${score}/${questions.length}</div>
      <p>${pct}% · ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s</p>
      <p class="page-subtitle" style="margin:1rem auto">
        ${pct >= 70 ? "Strong practice score — keep reviewing weak domains." : "Keep studying — focus on Domains I, II, and V (highest weight)."}
      </p>
      <div class="btn-group" style="justify-content:center">
        <a href="#/exam" class="btn btn-primary">Try again</a>
        <a href="#/progress" class="btn btn-secondary">View progress</a>
      </div>
    </div>
  `;
}

function renderProgress() {
  const p = getProgress();
  const stats = getStats(FLASHCARDS);

  const domainProgress = DOMAINS.map((d) => {
    const domainCards = FLASHCARDS.filter((c) => c.domain === d.id);
    const known = domainCards.filter((c) => p.cards[c.id] === "known").length;
    const pct = domainCards.length ? Math.round((known / domainCards.length) * 100) : 0;
    return { ...d, known, total: domainCards.length, pct };
  });

  main.innerHTML = `
    ${pageHeader("Your Progress", "Stored locally in your browser — export to back up or share with study groups.")}

    <div class="stats-row">
      <div class="stat-card"><div class="value">${stats.known}</div><div class="label">Cards mastered</div></div>
      <div class="stat-card"><div class="value">${stats.streak}</div><div class="label">Day streak</div></div>
      <div class="stat-card"><div class="value">${p.quizScores.length}</div><div class="label">Quizzes taken</div></div>
      <div class="stat-card"><div class="value">${p.examAttempts.length}</div><div class="label">Exam sims</div></div>
    </div>

    <h2 class="section-title">Mastery by domain</h2>
    <div class="progress-list">
      ${domainProgress
        .map(
          (d) => `
        <div class="progress-item">
          <div style="min-width:140px">
            <strong>Domain ${d.id}</strong>
            <div style="font-size:0.8rem;color:var(--text-muted)">${d.known}/${d.total} cards</div>
          </div>
          <div class="progress-item-bar"><div class="progress-item-fill" style="width:${d.pct}%"></div></div>
          <span style="font-family:var(--mono);min-width:3rem">${d.pct}%</span>
        </div>`
        )
        .join("")}
    </div>

    <h2 class="section-title">Recent quiz scores</h2>
    ${
      p.quizScores.length
        ? `<div class="progress-list">${p.quizScores
            .slice(-8)
            .reverse()
            .map(
              (s) => `
          <div class="progress-item">
            <span>${new Date(s.date).toLocaleDateString()}</span>
            <span>Domain ${s.domain === "all" ? "All" : s.domain}</span>
            <strong style="margin-left:auto;font-family:var(--mono)">${s.score}/${s.total} (${s.percent}%)</strong>
          </div>`
            )
            .join("")}</div>`
        : `<p class="empty-state">No quizzes yet. <a href="#/quiz">Take a practice quiz</a></p>`
    }

    <h2 class="section-title">Backup & restore</h2>
    <div class="btn-group">
      <button class="btn btn-primary" id="btn-export">Export progress (JSON)</button>
      <label class="btn btn-secondary" style="cursor:pointer">
        Import progress
        <input type="file" id="import-file" accept=".json" hidden />
      </label>
    </div>
  `;

  document.getElementById("btn-export").onclick = () => {
    const blob = new Blob([JSON.stringify(exportAllData(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cippus-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  document.getElementById("import-file").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (importAllData(data)) {
          alert("Progress imported successfully!");
          renderProgress();
        } else alert("Invalid backup file.");
      } catch {
        alert("Could not read file.");
      }
    };
    reader.readAsText(file);
  };
}

function renderDecks() {
  const decks = getCustomDecks();

  main.innerHTML = `
    ${pageHeader("My Decks", "Create custom flashcards for your study group. Cards are saved in your browser.")}

    <form id="add-card-form" class="quiz-card" style="max-width:560px;margin-bottom:2rem">
      <h3 style="margin-top:0">Add a custom card</h3>
      <div class="form-group">
        <label for="card-domain">Domain</label>
        <select id="card-domain" name="domain">
          ${DOMAINS.map((d) => `<option value="${d.id}">Domain ${d.id}: ${escapeHtml(d.shortTitle)}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label for="card-front">Question (front)</label>
        <textarea id="card-front" required placeholder="e.g. What does the FTC Act Section 5 prohibit?"></textarea>
      </div>
      <div class="form-group">
        <label for="card-back">Answer (back)</label>
        <textarea id="card-back" required placeholder="Your answer..."></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Add card</button>
    </form>

    <h2 class="section-title">Your custom cards (${decks.reduce((n, d) => n + d.cards.length, 0)})</h2>
    ${
      decks.length
        ? `<ul class="deck-list">${decks
            .flatMap((deck) =>
              deck.cards.map(
                (c) => `
            <li>
              <span><strong>Domain ${c.domain}</strong> — ${escapeHtml(c.front.slice(0, 60))}${c.front.length > 60 ? "…" : ""}</span>
              <button class="btn btn-danger btn-sm" data-id="${c.id}" style="padding:0.35rem 0.6rem;font-size:0.8rem">Delete</button>
            </li>`
              )
            )
            .join("")}</ul>`
        : `<p class="empty-state">No custom cards yet.</p>`
    }

    <div class="btn-group" style="margin-top:2rem">
      <button class="btn btn-secondary" id="export-deck">Export custom deck</button>
    </div>
  `;

  document.getElementById("add-card-form").onsubmit = (e) => {
    e.preventDefault();
    const domain = document.getElementById("card-domain").value;
    const front = document.getElementById("card-front").value.trim();
    const back = document.getElementById("card-back").value.trim();
    if (!front || !back) return;

    const allDecks = getCustomDecks();
    let deck = allDecks.find((d) => d.id === "custom");
    if (!deck) {
      deck = { id: "custom", name: "My Custom Deck", cards: [] };
      allDecks.push(deck);
    }
    deck.cards.push({
      id: `custom-${Date.now()}`,
      domain,
      front,
      back,
    });
    saveCustomDecks(allDecks);
    renderDecks();
  };

  document.querySelectorAll("[data-id]").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const allDecks = getCustomDecks();
      allDecks.forEach((d) => {
        d.cards = d.cards.filter((c) => c.id !== id);
      });
      saveCustomDecks(allDecks.filter((d) => d.cards.length > 0));
      renderDecks();
    };
  });

  document.getElementById("export-deck")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ customDecks: getCustomDecks() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cippus-custom-deck.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

const routes = {
  "/": renderHome,
  "/flashcards": renderFlashcards,
  "/quiz": renderQuiz,
  "/exam": renderExam,
  "/progress": renderProgress,
  "/decks": renderDecks,
};

function router() {
  setActiveNav();
  const { path } = parseHash();
  const handler = routes[path] || renderHome;
  if (path !== "/flashcards") flashcardState = null;
  if (path !== "/quiz") quizState = null;
  if (path !== "/exam") {
    if (examTimerId) {
      clearInterval(examTimerId);
      examTimerId = null;
    }
  }
  handler();
  main.focus();
}

window.addEventListener("hashchange", router);
window.addEventListener("load", () => {
  initNavToggle();
  router();
});
