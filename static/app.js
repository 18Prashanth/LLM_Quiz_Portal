class QuizApp {
  constructor() {
    this.currentPage = "upload";
    this.uploadedFile = null;
    this.quizParams = { numQuestions: 10, difficulty: "medium", timeLimit: 10 };
    this.quiz = null;
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.selectedAnswer = "";
    this.isLoading = false;
    this.results = null;
    this.startTime = null;
    this.endTime = null;
    this.timerInterval = null;
    this.timeRemaining = 0;

    // API configuration - Update this to match your backend URL
    this.API_BASE_URL = "http://localhost:8000";

    this.initEventListeners();
    this.initAnimations();
  }

  // API helper method
  async apiCall(endpoint, method = "GET", data = null) {
    const url = `${this.API_BASE_URL}${endpoint}`;
    const options = {
      method: method,
      headers: {},
    };

    if (data) {
      if (data instanceof FormData) {
        options.body = data;
      } else {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  initEventListeners() {
    // Upload page
    document.getElementById("upload-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("file-input").click();
    });
    document
      .getElementById("file-input")
      .addEventListener("change", this.handleFileUpload.bind(this));
    document
      .getElementById("continue-btn")
      .addEventListener("click", () => this.showPage("config"));

    // Config page
    document
      .getElementById("generate-quiz-btn")
      .addEventListener("click", this.handleGenerateQuiz.bind(this));

    // Number input validation
    const numQuestionsInput = document.getElementById("num-questions");
    numQuestionsInput.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      if (value < 1) e.target.value = 1;
      if (value > 50) e.target.value = 50;
      this.updateTimeLimitDisplay();
    });

    // Time limit change handler
    document
      .getElementById("quiz-time")
      .addEventListener("change", this.updateTimeLimitDisplay.bind(this));

    // Time's up modal and timer overlay
    document.getElementById("time-up-ok-btn").addEventListener("click", () => {
      document.getElementById("time-up-modal").classList.remove("show");
    });

    document
      .getElementById("timer-overlay-close")
      .addEventListener("click", () => {
        document.getElementById("timer-overlay").classList.remove("show");
      });

    // Show full-screen timer on timer click
    document.addEventListener("click", (e) => {
      if (e.target.closest("#timer-display") && this.currentPage === "player") {
        this.showFullScreenTimer();
      }
    });

    // Setup page
    document
      .getElementById("start-quiz-btn")
      .addEventListener("click", this.startQuiz.bind(this));

    // Player page
    document
      .getElementById("next-question-btn")
      .addEventListener("click", this.handleNextQuestion.bind(this));
    document
      .getElementById("end-quiz-btn")
      .addEventListener("click", this.endQuiz.bind(this));

    // Results page
    document
      .getElementById("reset-btn")
      .addEventListener("click", this.resetApp.bind(this));

    // Keyboard navigation
    document.addEventListener("keydown", this.handleKeyPress.bind(this));
  }

  initAnimations() {
    // Add intersection observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    // Observe elements for animation
    document
      .querySelectorAll(".card, .stat-card, .answer-item")
      .forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        observer.observe(el);
      });
  }

  updateTimeLimitDisplay() {
    const timeLimit = parseInt(document.getElementById("quiz-time").value);
    const display = document.getElementById("time-limit-display");

    if (timeLimit === 0) {
      display.textContent = "No Limit";
    } else if (timeLimit >= 60) {
      const hours = Math.floor(timeLimit / 60);
      const minutes = timeLimit % 60;
      display.textContent = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      display.textContent = `${timeLimit} min`;
    }
  }

  formatTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  showFullScreenTimer() {
    if (this.quizParams.timeLimit === 0) return;

    const overlay = document.getElementById("timer-overlay");
    const clock = document.getElementById("timer-overlay-clock");
    const timeDisplay = document.getElementById("timer-overlay-time");
    const message = document.getElementById("timer-overlay-message");

    // Update display
    timeDisplay.textContent = this.formatTimerDisplay(this.timeRemaining);

    // Update styling based on time remaining
    const timeLimit = this.quizParams.timeLimit * 60;
    const percentage = this.timeRemaining / timeLimit;

    clock.classList.remove("warning", "danger");

    if (percentage <= 0.1) {
      clock.classList.add("danger");
      message.textContent = "⚠️ Time Almost Up!";
    } else if (percentage <= 0.25) {
      clock.classList.add("warning");
      message.textContent = "⏰ Running Low on Time";
    } else {
      message.textContent = "⏱️ Time Remaining";
    }

    overlay.classList.add("show");

    // Auto-hide after 3 seconds
    setTimeout(() => {
      overlay.classList.remove("show");
    }, 3000);
  }

  startTimer() {
    const timeLimit = parseInt(document.getElementById("quiz-time").value);
    if (timeLimit === 0) {
      document.getElementById("timer-display").classList.add("hidden");
      return;
    }

    this.timeRemaining = timeLimit * 60; // Convert to seconds
    const timerDisplay = document.getElementById("timer-display");
    const timerText = document.getElementById("timer-text");

    timerDisplay.classList.remove("hidden");
    timerText.textContent = this.formatTimerDisplay(this.timeRemaining);

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      timerText.textContent = this.formatTimerDisplay(this.timeRemaining);

      // Update timer appearance based on time remaining
      const percentage = this.timeRemaining / (timeLimit * 60);

      timerDisplay.classList.remove("warning", "danger");

      if (percentage <= 0.1) {
        // Last 10%
        timerDisplay.classList.add("danger");
      } else if (percentage <= 0.25) {
        // Last 25%
        timerDisplay.classList.add("warning");
      }

      // Show full screen timer at specific intervals
      if (
        this.timeRemaining === 300 || // 5 minutes
        this.timeRemaining === 180 || // 3 minutes
        this.timeRemaining === 60 || // 1 minute
        this.timeRemaining === 30
      ) {
        // 30 seconds
        this.showFullScreenTimer();
      }

      // Time's up
      if (this.timeRemaining <= 0) {
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleTimeUp() {
    this.stopTimer();

    // Show time's up modal
    const modal = document.getElementById("time-up-modal");
    modal.classList.add("show");

    // Auto-submit the quiz
    setTimeout(() => {
      this.endQuiz();
    }, 2000);
  }

  handleKeyPress(event) {
    if (this.currentPage === "player") {
      // Number keys for option selection
      const keyNum = parseInt(event.key);
      if (keyNum >= 1 && keyNum <= 4) {
        const options = document.querySelectorAll('input[name="answer"]');
        if (options[keyNum - 1]) {
          options[keyNum - 1].checked = true;
          this.selectedAnswer = options[keyNum - 1].value;
          document.getElementById("next-question-btn").disabled = false;
        }
      }
      // Enter key for next question
      if (
        event.key === "Enter" &&
        !document.getElementById("next-question-btn").disabled
      ) {
        this.handleNextQuestion();
      }
    }
  }

  showPage(page) {
    // Hide all pages with fade out
    document.querySelectorAll('[id$="-page"]').forEach((el) => {
      el.style.opacity = "0";
      setTimeout(() => {
        el.classList.add("hidden");
      }, 300);
    });

    // Show target page with fade in
    setTimeout(() => {
      const targetPage = document.getElementById(`${page}-page`);
      targetPage.classList.remove("hidden");
      setTimeout(() => {
        targetPage.style.opacity = "1";
      }, 50);
    }, 300);

    this.currentPage = page;
  }

  showError(message, pagePrefix = "") {
    const errorEl = document.getElementById(`${pagePrefix}error-alert`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        this.hideError(pagePrefix);
      }, 5000);
    }
  }

  hideError(pagePrefix = "") {
    const errorEl = document.getElementById(`${pagePrefix}error-alert`);
    if (errorEl) {
      errorEl.classList.add("hidden");
    }
  }

  setLoadingState(elementId, isLoading, loadingText = "Loading...") {
    const element = document.getElementById(elementId);
    const textElement =
      elementId === "upload-btn"
        ? document.getElementById("upload-text")
        : elementId === "generate-quiz-btn"
        ? document.getElementById("generate-text")
        : document.getElementById("next-text");

    if (isLoading) {
      element.disabled = true;
      if (textElement) {
        textElement.innerHTML = `<span class="loading-spinner"></span>${loadingText}`;
      }
    } else {
      element.disabled = false;
      if (textElement) {
        const originalText =
          elementId === "upload-btn"
            ? "Choose File"
            : elementId === "generate-quiz-btn"
            ? "Generate Quiz"
            : "Next Question";
        textElement.textContent = originalText;
      }
    }
  }

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.showError(
        "File size must be less than 10MB. Please choose a smaller file."
      );
      return;
    }

    // Validate file type
    const allowedTypes = [".pdf", ".txt", ".doc", ".docx"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      this.showError("Please upload a PDF, TXT, DOC, or DOCX file.");
      return;
    }

    this.isLoading = true;
    this.hideError();
    this.setLoadingState("upload-btn", true, "Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await this.apiCall("/upload_notes", "POST", formData);
      this.uploadedFile = file;

      // Show success with animation
      const successEl = document.getElementById("upload-success");
      successEl.classList.remove("hidden");
      successEl.style.opacity = "0";
      successEl.style.transform = "translateY(10px)";

      setTimeout(() => {
        successEl.style.opacity = "1";
        successEl.style.transform = "translateY(0)";
      }, 100);
    } catch (err) {
      this.showError(
        "Failed to upload file. Please check your connection and try again."
      );
      console.error("Upload error:", err);
    } finally {
      this.isLoading = false;
      this.setLoadingState("upload-btn", false);
    }
  }

  async handleGenerateQuiz() {
    this.isLoading = true;
    this.hideError("config-");
    this.setLoadingState("generate-quiz-btn", true, "Generating...");

    try {
      this.quizParams.numQuestions = parseInt(
        document.getElementById("num-questions").value
      );
      this.quizParams.difficulty = document.getElementById("difficulty").value;
      this.quizParams.timeLimit = parseInt(
        document.getElementById("quiz-time").value
      );

      await this.apiCall("/set_quiz_params", "POST", {
        numQuestions: this.quizParams.numQuestions,
        difficulty: this.quizParams.difficulty,
        timeLimit: this.quizParams.timeLimit,
      });

      this.quiz = await this.apiCall("/generate_quiz", "POST");

      // Update setup page
      document.getElementById("question-count").textContent =
        this.quiz.questions.length;
      document.getElementById("difficulty-display").textContent =
        this.quizParams.difficulty;
      this.updateTimeLimitDisplay();

      this.showPage("setup");
    } catch (err) {
      this.showError(
        "Failed to generate quiz. Please check your connection and try again.",
        "config-"
      );
      console.error("Quiz generation error:", err);
    } finally {
      this.isLoading = false;
      this.setLoadingState("generate-quiz-btn", false);
    }
  }

  startQuiz() {
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.selectedAnswer = "";
    this.startTime = new Date();
    this.showPage("player");
    this.displayCurrentQuestion();
    this.startTimer();
  }

  displayCurrentQuestion() {
    const question = this.quiz.questions[this.currentQuestionIndex];
    const progress =
      ((this.currentQuestionIndex + 1) / this.quiz.questions.length) * 100;

    // Update progress with animation
    document.getElementById("question-progress").textContent = `Question ${
      this.currentQuestionIndex + 1
    } of ${this.quiz.questions.length}`;

    const progressFill = document.getElementById("progress-fill");
    setTimeout(() => {
      progressFill.style.width = `${progress}%`;
    }, 100);

    // Update question with fade effect
    const questionEl = document.getElementById("current-question");
    questionEl.style.opacity = "0";

    setTimeout(() => {
      questionEl.textContent = question.question;
      questionEl.style.opacity = "1";
    }, 150);

    // Update options with stagger animation
    const optionsContainer = document.getElementById("question-options");
    optionsContainer.innerHTML = "";

    question.options.forEach((option, index) => {
      const label = document.createElement("label");
      label.className = "option-label";
      label.style.opacity = "0";
      label.style.transform = "translateX(-20px)";

      label.innerHTML = `
                        <input type="radio" name="answer" value="${option}" class="option-input">
                        <span>${String.fromCharCode(
                          65 + index
                        )}. ${option}</span>
                    `;

      label.querySelector("input").addEventListener("change", (e) => {
        this.selectedAnswer = e.target.value;
        document.getElementById("next-question-btn").disabled = false;

        // Visual feedback for selection
        document.querySelectorAll(".option-label").forEach((l) => {
          l.style.borderColor = "var(--border-color)";
          l.style.background = "var(--bg-secondary)";
        });
        label.style.borderColor = "var(--primary-color)";
        label.style.background = "rgba(99, 102, 241, 0.05)";
      });

      optionsContainer.appendChild(label);

      // Stagger animation
      setTimeout(() => {
        label.style.opacity = "1";
        label.style.transform = "translateX(0)";
      }, 100 + index * 50);
    });

    // Reset next button
    const nextBtn = document.getElementById("next-question-btn");
    nextBtn.disabled = true;
    nextBtn.textContent =
      this.currentQuestionIndex < this.quiz.questions.length - 1
        ? "Next Question"
        : "Finish Quiz";
  }

  handleNextQuestion() {
    const currentQuestion = this.quiz.questions[this.currentQuestionIndex];

    const answer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      userAnswer: this.selectedAnswer,
    };

    this.userAnswers.push(answer);
    this.selectedAnswer = "";

    if (this.currentQuestionIndex < this.quiz.questions.length - 1) {
      this.currentQuestionIndex++;
      this.displayCurrentQuestion();
    } else {
      this.endQuiz();
    }
  }

  async endQuiz() {
    this.endTime = new Date();
    this.stopTimer();
    this.isLoading = true;
    this.setLoadingState("next-question-btn", true, "Submitting...");

    try {
      this.results = await this.apiCall("/submit_quiz", "POST", {
        answers: this.userAnswers,
        timeLimit: this.quizParams.timeLimit,
        timeUsed: Math.floor((this.endTime - this.startTime) / 1000),
      });

      this.displayResults();
    } catch (err) {
      this.showError("Failed to submit quiz. Please try again.");
      console.error("Quiz submission error:", err);
    } finally {
      this.isLoading = false;
      this.setLoadingState("next-question-btn", false);
    }
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  displayResults() {
    // Calculate time taken
    const timeTaken = this.endTime - this.startTime;
    document.getElementById("time-taken").textContent =
      this.formatTime(timeTaken);

    // Update stats with animation
    document.getElementById("final-score").textContent =
      this.results.score ||
      `${this.results.correctAnswers}/${this.results.totalQuestions}`;

    const percentage = this.results.percentage;
    document.getElementById("final-percentage").textContent = `${percentage}%`;

    const grade =
      this.results.grade ||
      (percentage >= 90
        ? "A"
        : percentage >= 80
        ? "B"
        : percentage >= 70
        ? "C"
        : percentage >= 60
        ? "D"
        : "F");
    document.getElementById("final-grade").textContent = grade;

    // Display detailed answers
    const answerList = document.getElementById("answer-list");
    answerList.innerHTML = "";

    const answersToShow =
      this.results.detailedAnswers || this.results.answers || this.userAnswers;

    answersToShow.forEach((answer, index) => {
      const answerEl = document.createElement("div");
      const question = answer.question || answer.questionText;
      const userAnswer = answer.userAnswer || answer.selectedAnswer;
      const correctAnswer = answer.correctAnswer || answer.correct;
      const isCorrect =
        answer.isCorrect !== undefined
          ? answer.isCorrect
          : answer.correct === userAnswer;
      const explanation = answer.explanation || "";

      answerEl.className = `answer-item ${isCorrect ? "correct" : "incorrect"}`;
      answerEl.style.opacity = "0";
      answerEl.style.transform = "translateY(20px)";

      answerEl.innerHTML = `
                        <p style="font-weight: 600; margin-bottom: 1rem; font-size: 1.1rem;">${question}</p>
                        <div class="answer-details">
                            <div>
                                <span style="color: var(--text-secondary);">Your Answer: </span>
                                <span style="color: ${
                                  isCorrect
                                    ? "var(--secondary-color)"
                                    : "var(--danger-color)"
                                }; font-weight: 600;">
                                    ${userAnswer || "No answer"}
                                </span>
                            </div>
                            <div>
                                <span style="color: var(--text-secondary);">Correct Answer: </span>
                                <span style="color: var(--secondary-color); font-weight: 600;">${correctAnswer}</span>
                            </div>
                        </div>
                        ${
                          explanation
                            ? `<p style="color: var(--text-secondary); font-size: 0.95rem; margin: 1rem 0; padding: 1rem; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid var(--primary-color);">${explanation}</p>`
                            : ""
                        }
                        <span class="badge ${
                          isCorrect ? "badge-correct" : "badge-incorrect"
                        }">
                            ${isCorrect ? "✓ Correct" : "✗ Incorrect"}
                        </span>
                    `;

      answerList.appendChild(answerEl);

      // Stagger animation for answer items
      setTimeout(() => {
        answerEl.style.opacity = "1";
        answerEl.style.transform = "translateY(0)";
      }, index * 100);
    });

    // Add performance analysis if available
    if (this.results.analysis || percentage < 70) {
      const analysisEl = document.createElement("div");
      analysisEl.style.marginTop = "2rem";
      analysisEl.style.padding = "1.5rem";
      analysisEl.style.background =
        "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05))";
      analysisEl.style.borderRadius = "var(--border-radius)";
      analysisEl.style.border = "1px solid var(--border-color)";

      const analysisText =
        this.results.analysis || this.generatePerformanceAnalysis(percentage);

      analysisEl.innerHTML = `
                        <h4 style="font-weight: 700; margin-bottom: 1rem; color: var(--text-primary); font-size: 1.2rem;">📊 Performance Analysis</h4>
                        <p style="color: var(--text-secondary); line-height: 1.6;">${analysisText}</p>
                    `;
      answerList.appendChild(analysisEl);
    }

    this.showPage("results");
  }

  generatePerformanceAnalysis(percentage) {
    if (percentage >= 90) {
      return "Excellent work! You have a strong grasp of the material. Consider exploring more advanced topics in this subject area.";
    } else if (percentage >= 80) {
      return "Good job! You understand most concepts well. Review the questions you missed to strengthen your knowledge.";
    } else if (percentage >= 70) {
      return "Fair performance. You have a basic understanding but should review the material more thoroughly. Focus on the areas where you made mistakes.";
    } else if (percentage >= 60) {
      return "You're getting there! Consider reviewing the material again and taking practice quizzes to improve your understanding.";
    } else {
      return "Don't be discouraged! Learning takes time. Review the material carefully, focus on understanding key concepts, and try again when you feel ready.";
    }
  }

  resetApp() {
    // Reset all properties
    this.currentPage = "upload";
    this.uploadedFile = null;
    this.quiz = null;
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.selectedAnswer = "";
    this.results = null;
    this.isLoading = false;
    this.startTime = null;
    this.endTime = null;
    this.stopTimer();
    this.timeRemaining = 0;

    // Reset form values
    document.getElementById("num-questions").value = 10;
    document.getElementById("difficulty").value = "medium";
    document.getElementById("quiz-time").value = 10;
    this.updateTimeLimitDisplay();

    // Hide success message and modals
    document.getElementById("upload-success").classList.add("hidden");
    document.getElementById("time-up-modal").classList.remove("show");
    document.getElementById("timer-overlay").classList.remove("show");

    // Reset file input
    document.getElementById("file-input").value = "";

    // Clear any errors
    this.hideError();
    this.hideError("config-");

    this.showPage("upload");
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new QuizApp();
});
