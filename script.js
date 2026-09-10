const subjects = [
  {
    name: "Polity",
    icon: "⚖️",
    description: "Constitution & governance",
    file: "polity.json",
    color: "#efedff"
  },
  {
    name: "Geography",
    icon: "🌍",
    description: "Explore our planet",
    file: "geo.json",
    color: "#e7f6ed"
  },
  {
    name: "Chemistry",
    icon: "🧪",
    description: "Elements & reactions",
    file: "chemistry.json",
    color: "#f3eaff"
  },
  {
    name: "Biology",
    icon: "🌱",
    description: "The science of life",
    file: "biology.json",
    color: "#edf7e5"
  },
  {
    name: "Physics",
    icon: "⚡",
    description: "Matter, motion & energy",
    file: "phy.json",
    color: "#fff5dc"
  },
  {
    name: "Current Affairs",
    icon: "📰",
    description: "Stay in the know",
    file: "ca.json",
    color: "#e8f1ff"
  },
  {
    name: "History",
    icon: "🏛️",
    description: "Stories from the past",
    file: "history.json",
    color: "#fff0e5"
  },
  {
    name: "Economics",
    icon: "📈",
    description: "Markets, money & more",
    file: "eco.json",
    color: "#e5f5f5"
  }
];

const $ = (id) => document.getElementById(id);

const views = {
  home: $("home-view"),
  quiz: $("quiz-view"),
  results: $("results-view")
};

let currentSubject = null;
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let answered = false;
let loading = false;

function showView(viewName) {
  Object.entries(views).forEach(([name, element]) => {
    element.hidden = name !== viewName;
  });

  window.scrollTo({ top: 0, behavior: "auto" });
}

function focusHeading(id) {
  $(id).focus({ preventScroll: true });
}

function createSubjectCards() {
  const grid = $("subject-grid");

  subjects.forEach((subject) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "subject-card";
    card.style.setProperty("--icon-bg", subject.color);
    card.setAttribute("aria-label", `Start ${subject.name} quiz`);

    const icon = document.createElement("span");
    icon.className = "subject-icon";
    icon.textContent = subject.icon;
    icon.setAttribute("aria-hidden", "true");

    const name = document.createElement("span");
    name.className = "subject-name";
    name.textContent = subject.name;

    const description = document.createElement("span");
    description.className = "subject-description";
    description.textContent = subject.description;

    const link = document.createElement("span");
    link.className = "subject-link";
    link.textContent = "Start practice →";

    card.append(icon, name, description, link);
    card.addEventListener("click", () => loadSubject(subject));

    grid.appendChild(card);
  });
}

function setLoading(isLoading) {
  loading = isLoading;

  $("loading-message").hidden = !isLoading;
  $("subject-grid").setAttribute("aria-busy", String(isLoading));

  document.querySelectorAll(".subject-card").forEach((card) => {
    card.disabled = isLoading;
  });
}

function validateQuestions(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("The JSON file must contain a non-empty array of questions.");
  }

  data.forEach((item, index) => {
    const validQuestion =
      item &&
      typeof item.question === "string" &&
      item.question.trim().length > 0;

    const validOptions =
      item &&
      item.options &&
      typeof item.options === "object" &&
      !Array.isArray(item.options) &&
      Object.keys(item.options).length >= 2 &&
      Object.entries(item.options).every(
        ([key, value]) =>
          key.trim().length > 0 &&
          typeof value === "string" &&
          value.trim().length > 0
      );

    const validAnswer =
      validOptions &&
      typeof item.answer === "string" &&
      Object.prototype.hasOwnProperty.call(item.options, item.answer);

    if (!validQuestion || !validOptions || !validAnswer) {
      throw new Error(
        `Question ${index + 1} has an invalid format. ` +
        `Check its question, options, and answer fields.`
      );
    }
  });

  return data;
}

async function loadSubject(subject) {
  if (loading) return;

  $("error-message").hidden = true;
  $("error-message").textContent = "";
  $("loading-message").textContent = `Loading ${subject.name} questions…`;

  setLoading(true);

  let ready = false;

  try {
    const response = await fetch(subject.file);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `${subject.name} questions aren't available yet. ` +
          `Add "${subject.file}" to the same folder as index.html, then try again.`
        );
      }

      throw new Error(
        `Could not load ${subject.file} (HTTP ${response.status}). Please try again.`
      );
    }

    const data = await response.json();
    const validatedQuestions = validateQuestions(data);

    currentSubject = subject;
    questions = validatedQuestions;
    ready = true;
  } catch (error) {
    let message = error.message;

    if (error instanceof SyntaxError) {
      message =
        `"${subject.file}" is not valid JSON. ` +
        `Check for missing brackets, unfinished questions, or trailing commas.`;
    } else if (error instanceof TypeError) {
      message =
        "Couldn't fetch the questions. Run this website through a local server " +
        "(such as VS Code Live Server), check your connection, and try again.";
    }

    $("error-message").textContent = message;
    $("error-message").hidden = false;
  } finally {
    setLoading(false);
  }

  if (ready) {
    startQuiz();
  }
}

function startQuiz() {
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  answered = false;

  $("quiz-title").textContent = `${currentSubject.name} Quiz`;
  $("subject-badge").textContent = currentSubject.name;

  showView("quiz");
  renderQuestion();
}

function updateProgress() {
  const completed = correctCount + wrongCount;
  const percentage = Math.round((completed / questions.length) * 100);

  $("quiz-progress").value = percentage;
  $("quiz-progress").textContent = `${percentage}%`;
  $("quiz-progress").setAttribute(
    "aria-label",
    `${completed} of ${questions.length} questions answered`
  );

  $("progress-label").textContent = `${percentage}% complete`;

  $("live-correct").textContent = correctCount;
  $("live-wrong").textContent = wrongCount;
}

function renderQuestion() {
  answered = false;

  const question = questions[currentIndex];

  $("question-counter").textContent =
    `${currentIndex + 1} / ${questions.length}`;

  $("question-label").textContent = `QUESTION ${currentIndex + 1}`;
  $("question-text").textContent = question.question;

  $("answer-feedback").textContent = "";
  $("answer-feedback").className = "answer-feedback";

  $("next-button").hidden = true;
  $("next-button").textContent =
    currentIndex === questions.length - 1
      ? "See my results →"
      : "Next question →";

  const container = $("options-container");
  container.replaceChildren();

  Object.entries(question.options).forEach(([key, text]) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "option-button";
    button.dataset.option = key;

    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = key;

    const optionText = document.createElement("span");
    optionText.className = "option-text";
    optionText.textContent = text;

    const indicator = document.createElement("span");
    indicator.className = "option-indicator";
    indicator.setAttribute("aria-hidden", "true");

    button.append(letter, optionText, indicator);
    button.addEventListener("click", () => selectAnswer(key));

    container.appendChild(button);
  });

  updateProgress();
  focusHeading("question-text");
}

function selectAnswer(selectedKey) {
  if (answered) return;

  answered = true;

  const question = questions[currentIndex];
  const correctKey = question.answer;
  const isCorrect = selectedKey === correctKey;

  if (isCorrect) {
    correctCount++;
  } else {
    wrongCount++;
  }

  document.querySelectorAll(".option-button").forEach((button) => {
    const key = button.dataset.option;
    const indicator = button.querySelector(".option-indicator");

    button.disabled = true;

    let accessibleLabel = `${key}: ${question.options[key]}`;

    if (key === selectedKey) {
      accessibleLabel += ". Your selection.";
    }

    if (key === correctKey) {
      button.classList.add("correct");
      indicator.textContent = "✓";
      accessibleLabel += " Correct answer.";
    } else if (key === selectedKey) {
      button.classList.add("wrong");
      indicator.textContent = "✕";
      accessibleLabel += " Incorrect answer.";
    }

    button.setAttribute("aria-label", accessibleLabel);
  });

  const feedback = $("answer-feedback");

  if (isCorrect) {
    feedback.className = "answer-feedback success";
    feedback.textContent = "✓ That's correct! Nice work.";
  } else {
    feedback.className = "answer-feedback error";
    feedback.textContent =
      `✕ Not quite. You selected ${selectedKey}: ` +
      `${question.options[selectedKey]}. ` +
      `The correct answer is ${correctKey}: ${question.options[correctKey]}.`;
  }

  updateProgress();

  $("next-button").hidden = false;
  $("next-button").focus({ preventScroll: true });
}

function nextQuestion() {
  if (!answered) return;

  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  const total = questions.length;
  const percentage = Math.round((correctCount / total) * 100);

  $("score-percentage").textContent = `${percentage}%`;
  $("score-ring").style.setProperty("--score", `${percentage}%`);

  $("score-summary").textContent =
    `You answered ${correctCount} out of ${total} questions correctly.`;

  $("result-total").textContent = total;
  $("result-correct").textContent = correctCount;
  $("result-wrong").textContent = wrongCount;

  let title;
  let message;

  if (correctCount === total) {
    title = "Perfect score!";
    message = `You nailed every question in ${currentSubject.name}. Excellent work!`;
  } else if (percentage >= 80) {
    title = "Excellent work!";
    message = `You've got a strong grip on ${currentSubject.name}. Keep it up!`;
  } else if (percentage >= 50) {
    title = "Good progress!";
    message = "You're building your knowledge. Another round can make it stick.";
  } else {
    title = "Keep growing!";
    message = "Every mistake is a learning opportunity. Give it another try!";
  }

  $("results-title").textContent = title;
  $("result-message").textContent = message;

  showView("results");
  focusHeading("results-title");
}

function goHome() {
  $("error-message").hidden = true;

  showView("home");
  focusHeading("home-heading");
}

$("next-button").addEventListener("click", nextQuestion);

$("quit-button").addEventListener("click", () => {
  const quizInProgress = currentIndex > 0 || answered;

  if (
    quizInProgress &&
    !window.confirm("Leave this quiz? Your current progress will be lost.")
  ) {
    return;
  }

  goHome();
});

$("home-button").addEventListener("click", goHome);
$("retry-button").addEventListener("click", startQuiz);

createSubjectCards();