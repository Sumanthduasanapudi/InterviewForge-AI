import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";


const API_URL =
  "http://127.0.0.1:8000";


function App() {
  const [mode, setMode] =
    useState("knowledge");

  const [backendStatus, setBackendStatus] =
    useState("checking");

  const [modelName, setModelName] =
    useState("llama3.2:3b");

  const [chunkCount, setChunkCount] =
    useState(0);

  const [documents, setDocuments] =
    useState([]);

  const [uploading, setUploading] =
    useState(false);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const fileInputRef =
    useRef(null);


  // ============================================================
  // KNOWLEDGE Q&A
  // ============================================================

  const [messages, setMessages] =
    useState([
      {
        role: "assistant",
        content:
          "Welcome to InterviewForge AI. Ask me questions grounded in your Knowledge Vault.",
        sources: [],
      },
    ]);

  const [question, setQuestion] =
    useState("");

  const [chatLoading, setChatLoading] =
    useState(false);


  // ============================================================
  // MOCK INTERVIEW
  // ============================================================

  const [role, setRole] =
    useState(
      "Generative AI Engineer"
    );

  const [interviewFocus, setInterviewFocus] =
    useState("Python");

  const [interviewType, setInterviewType] =
    useState("Technical");

  const [interviewDifficulty, setInterviewDifficulty] =
    useState("Fresher");

  const [interviewStarted, setInterviewStarted] =
    useState(false);

  const [interviewQuestion, setInterviewQuestion] =
    useState("");

  const [interviewAnswer, setInterviewAnswer] =
    useState("");

  const [interviewNumber, setInterviewNumber] =
    useState(1);

  const [interviewEvaluation, setInterviewEvaluation] =
    useState(null);

  const [nextInterviewQuestion, setNextInterviewQuestion] =
    useState(null);

  const [interviewLoading, setInterviewLoading] =
    useState(false);

  const [interviewScores, setInterviewScores] =
    useState([]);


  // ============================================================
  // PYTHON STUDY
  // ============================================================

  const [studyTopic, setStudyTopic] =
    useState("Python Fundamentals");

  const [studyDifficulty, setStudyDifficulty] =
    useState("Fresher");

  const [studyStarted, setStudyStarted] =
    useState(false);

  const [studyLesson, setStudyLesson] =
    useState("");

  const [studyQuestion, setStudyQuestion] =
    useState("");

  const [studyHint, setStudyHint] =
    useState("");

  const [showHint, setShowHint] =
    useState(false);

  const [studyAnswer, setStudyAnswer] =
    useState("");

  const [studyNumber, setStudyNumber] =
    useState(1);

  const [studyEvaluation, setStudyEvaluation] =
    useState(null);

  const [studyLoading, setStudyLoading] =
    useState(false);

  const [studyScores, setStudyScores] =
    useState([]);


  // ============================================================
  // STARTUP
  // ============================================================

  useEffect(() => {
    refreshSystem();
  }, []);


  const refreshSystem = async () => {
    await Promise.all([
      checkHealth(),
      loadDocuments(),
    ]);
  };


  const checkHealth = async () => {
    try {
      const response = await fetch(
        `${API_URL}/health`
      );

      const data =
        await response.json();

      if (
        response.ok &&
        data.status === "healthy"
      ) {
        setBackendStatus("online");

        setModelName(
          data.model ||
            "llama3.2:3b"
        );

        setChunkCount(
          data.chunks || 0
        );

      } else {
        setBackendStatus("error");
      }

    } catch {
      setBackendStatus("offline");
    }
  };


  const loadDocuments = async () => {
    try {
      const response = await fetch(
        `${API_URL}/documents`
      );

      const data =
        await response.json();

      if (!response.ok) {
        return;
      }

      setDocuments(
        data.documents || []
      );

      setChunkCount(
        data.total_chunks || 0
      );

    } catch {
      // Backend status handles this.
    }
  };


  // ============================================================
  // UPLOAD
  // ============================================================

  const uploadFile = async (file) => {
    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setUploadMessage(
        "Only PDF files are supported."
      );

      return;
    }

    setUploading(true);

    setUploadMessage(
      "Indexing PDF..."
    );

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    try {
      const response =
        await fetch(
          `${API_URL}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Upload failed."
        );
      }

      setUploadMessage(
        `${data.filename} added successfully.`
      );

      await refreshSystem();

    } catch (error) {
      setUploadMessage(
        error.message
      );

    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }
    }
  };


  // ============================================================
  // KNOWLEDGE CHAT
  // ============================================================

  const askQuestion = async () => {
    const value =
      question.trim();

    if (!value || chatLoading) {
      return;
    }

    setMessages(
      (previous) => [
        ...previous,
        {
          role: "user",
          content: value,
          sources: [],
        },
      ]
    );

    setQuestion("");
    setChatLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question: value,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail
        );
      }

      setMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",
            content: data.answer,
            sources:
              data.sources || [],
          },
        ]
      );

    } catch (error) {
      setMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",
            content:
              error.message ||
              "Request failed.",
            sources: [],
          },
        ]
      );

    } finally {
      setChatLoading(false);
    }
  };


  // ============================================================
  // MOCK INTERVIEW
  // ============================================================

  const startInterview = async () => {
    setInterviewLoading(true);
    setInterviewEvaluation(null);
    setInterviewScores([]);

    try {
      const response = await fetch(
        `${API_URL}/interview/start`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            role,
            focus: interviewFocus,
            interview_type:
              interviewType,
            difficulty:
              interviewDifficulty,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail
        );
      }

      setInterviewQuestion(
        data.question
      );

      setInterviewNumber(1);
      setInterviewStarted(true);

    } catch (error) {
      alert(error.message);

    } finally {
      setInterviewLoading(false);
    }
  };


  const submitInterview = async () => {
    if (
      !interviewAnswer.trim()
    ) {
      return;
    }

    setInterviewLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/interview/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            role,
            interview_type:
              interviewType,
            difficulty:
              interviewDifficulty,
            focus:
              interviewFocus,
            question:
              interviewQuestion,
            answer:
              interviewAnswer,
            question_number:
              interviewNumber,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail
        );
      }

      setInterviewEvaluation(
        data.evaluation
      );

      setNextInterviewQuestion(
        data.next_question
      );

      setInterviewScores(
        (previous) => [
          ...previous,
          data.evaluation.overall,
        ]
      );

    } catch (error) {
      alert(error.message);

    } finally {
      setInterviewLoading(false);
    }
  };


  const nextInterview = () => {
    setInterviewQuestion(
      nextInterviewQuestion
    );

    setInterviewNumber(
      (value) => value + 1
    );

    setInterviewAnswer("");
    setInterviewEvaluation(null);
    setNextInterviewQuestion(null);
  };


  // ============================================================
  // PYTHON STUDY
  // ============================================================

  const startStudy = async () => {
    setStudyLoading(true);
    setStudyScores([]);
    setStudyEvaluation(null);

    try {
      const response = await fetch(
        `${API_URL}/study/start`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            topic: studyTopic,
            difficulty:
              studyDifficulty,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail
        );
      }

      setStudyLesson(
        data.lesson
      );

      setStudyQuestion(
        data.question
      );

      setStudyHint(
        data.hint
      );

      setStudyNumber(1);
      setStudyAnswer("");
      setShowHint(false);
      setStudyStarted(true);

    } catch (error) {
      alert(error.message);

    } finally {
      setStudyLoading(false);
    }
  };


  const submitStudyAnswer =
    async () => {
      if (
        !studyAnswer.trim()
      ) {
        return;
      }

      setStudyLoading(true);

      try {
        const response =
          await fetch(
            `${API_URL}/study/evaluate`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                topic: studyTopic,
                difficulty:
                  studyDifficulty,
                question:
                  studyQuestion,
                answer:
                  studyAnswer,
                question_number:
                  studyNumber,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail
          );
        }

        setStudyEvaluation(
          data.evaluation
        );

        setStudyScores(
          (previous) => [
            ...previous,
            data.evaluation.score,
          ]
        );

      } catch (error) {
        alert(error.message);

      } finally {
        setStudyLoading(false);
      }
    };


  const nextStudyQuestion = () => {
    const next =
      studyEvaluation
        ?.next_question;

    if (!next) {
      setStudyStarted(false);
      return;
    }

    setStudyQuestion(next);

    setStudyHint(
      studyEvaluation
        ?.next_hint || ""
    );

    setStudyNumber(
      (value) => value + 1
    );

    setStudyAnswer("");
    setStudyEvaluation(null);
    setShowHint(false);
  };


  const studyAverage =
    studyScores.length
      ? (
          studyScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
          studyScores.length
        ).toFixed(1)
      : "0.0";


  const interviewAverage =
    interviewScores.length
      ? (
          interviewScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
          interviewScores.length
        ).toFixed(1)
      : "0.0";


  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-logo">
            IF
          </div>

          <div>
            <h1>
              InterviewForge
            </h1>

            <p>
              AI Interview Copilot
            </p>
          </div>
        </div>


        <p className="sidebar-label">
          SYSTEM STATUS
        </p>

        <div className="status-card">

          <div className="status-row">
            <span
              className={`status-dot ${backendStatus}`}
            />

            {backendStatus ===
            "online"
              ? "System online"
              : "Backend offline"}
          </div>

          <div className="system-detail">
            <span>Model</span>
            <strong>{modelName}</strong>
          </div>

          <div className="system-detail">
            <span>
              Vault chunks
            </span>

            <strong>
              {chunkCount}
            </strong>
          </div>

          <div className="system-detail">
            <span>
              Documents
            </span>

            <strong>
              {documents.length}
            </strong>
          </div>

        </div>


        <p className="sidebar-label vault-label">
          KNOWLEDGE VAULT
        </p>

        <div
          className="upload-zone"
          onClick={() =>
            fileInputRef.current
              ?.click()
          }
        >
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept=".pdf"
            onChange={(event) =>
              uploadFile(
                event.target
                  .files?.[0]
              )
            }
          />

          <div className="upload-icon">
            ↑
          </div>

          <strong>
            {uploading
              ? "Processing..."
              : "Upload PDF"}
          </strong>

          <span>
            Add to Knowledge Vault
          </span>
        </div>

        {uploadMessage && (
          <div className="upload-message">
            {uploadMessage}
          </div>
        )}


        <div className="document-list">

          {documents.map(
            (document) => (
              <div
                className="document-item"
                key={
                  document.filename
                }
              >
                <span className="pdf-icon">
                  PDF
                </span>

                <div>
                  <strong>
                    {
                      document.filename
                    }
                  </strong>

                  <small>
                    {
                      document.chunks
                    }{" "}
                    chunks
                  </small>
                </div>
              </div>
            )
          )}

        </div>

      </aside>


      <main className="main">

        <header className="topbar">
          <div>
            <p>
              INTERVIEW PREPARATION
            </p>

            <h2>
              Interview Copilot
            </h2>
          </div>

          <div className="connected">
            ● Connected
          </div>
        </header>


        <nav className="tabs">

          <button
            className={
              mode === "knowledge"
                ? "active"
                : ""
            }
            onClick={() =>
              setMode("knowledge")
            }
          >
            Knowledge Q&A
          </button>

          <button
            className={
              mode === "interview"
                ? "active"
                : ""
            }
            onClick={() =>
              setMode("interview")
            }
          >
            Mock Interview
          </button>

          <button
            className={
              mode === "study"
                ? "active"
                : ""
            }
            onClick={() =>
              setMode("study")
            }
          >
            Python Study
          </button>

        </nav>


        {/* KNOWLEDGE */}

        {mode === "knowledge" && (
          <section className="content">

            <div className="chat">

              {messages.map(
                (
                  message,
                  index
                ) => (
                  <div
                    className={`message ${message.role}`}
                    key={index}
                  >
                    <strong>
                      {message.role ===
                      "assistant"
                        ? "InterviewForge AI"
                        : "You"}
                    </strong>

                    <div className="bubble">
                      {
                        message.content
                      }
                    </div>

                    {message.sources?.map(
                      (
                        source,
                        sourceIndex
                      ) => (
                        <details
                          className="source"
                          key={
                            sourceIndex
                          }
                        >
                          <summary>
                            {
                              source.source
                            }
                          </summary>

                          <p>
                            {
                              source.preview
                            }
                          </p>
                        </details>
                      )
                    )}
                  </div>
                )
              )}

            </div>


            <div className="chat-input">

              <textarea
                value={question}
                onChange={(event) =>
                  setQuestion(
                    event.target.value
                  )
                }
                placeholder="Ask an interview question..."
              />

              <button
                onClick={
                  askQuestion
                }
                disabled={
                  chatLoading
                }
              >
                {chatLoading
                  ? "..."
                  : "↑"}
              </button>

            </div>

          </section>
        )}


        {/* MOCK INTERVIEW */}

        {mode === "interview" && (
          <section className="page">

            {!interviewStarted ? (
              <div className="setup">

                <span className="badge">
                  MOCK INTERVIEW
                </span>

                <h1>
                  Practice like a real
                  interview
                </h1>

                <div className="grid">

                  <label>
                    Target role

                    <input
                      value={role}
                      onChange={(
                        event
                      ) =>
                        setRole(
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label>
                    Focus

                    <input
                      value={
                        interviewFocus
                      }
                      onChange={(
                        event
                      ) =>
                        setInterviewFocus(
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label>
                    Type

                    <select
                      value={
                        interviewType
                      }
                      onChange={(
                        event
                      ) =>
                        setInterviewType(
                          event.target
                            .value
                        )
                      }
                    >
                      <option>
                        Technical
                      </option>

                      <option>
                        Project Deep Dive
                      </option>

                      <option>
                        Behavioral
                      </option>

                      <option>
                        Mixed
                      </option>
                    </select>
                  </label>

                  <label>
                    Difficulty

                    <select
                      value={
                        interviewDifficulty
                      }
                      onChange={(
                        event
                      ) =>
                        setInterviewDifficulty(
                          event.target
                            .value
                        )
                      }
                    >
                      <option>
                        Fresher
                      </option>

                      <option>
                        Intermediate
                      </option>

                      <option>
                        Advanced
                      </option>
                    </select>
                  </label>

                </div>

                <button
                  className="primary"
                  onClick={
                    startInterview
                  }
                >
                  {interviewLoading
                    ? "Preparing..."
                    : "Start Interview"}
                </button>

              </div>

            ) : (

              <div className="practice">

                <div className="practice-head">
                  <div>
                    <span>
                      QUESTION{" "}
                      {interviewNumber}
                      /5
                    </span>

                    <h2>
                      {
                        interviewFocus
                      }{" "}
                      Interview
                    </h2>
                  </div>

                  <b>
                    Avg{" "}
                    {
                      interviewAverage
                    }
                    /10
                  </b>
                </div>


                <div className="question-card">
                  <small>
                    INTERVIEWER
                  </small>

                  <p>
                    {
                      interviewQuestion
                    }
                  </p>
                </div>


                {!interviewEvaluation && (
                  <>
                    <textarea
                      className="answer-box"
                      value={
                        interviewAnswer
                      }
                      onChange={(
                        event
                      ) =>
                        setInterviewAnswer(
                          event.target
                            .value
                        )
                      }
                      placeholder="Give your interview answer..."
                    />

                    <button
                      className="primary"
                      onClick={
                        submitInterview
                      }
                    >
                      {interviewLoading
                        ? "Evaluating..."
                        : "Submit Answer"}
                    </button>
                  </>
                )}


                {interviewEvaluation && (
                  <div className="evaluation">

                    <div className="big-score">
                      {
                        interviewEvaluation.overall
                      }
                      /10
                    </div>

                    <h2>
                      Interview Feedback
                    </h2>

                    <p>
                      {
                        interviewEvaluation.feedback
                      }
                    </p>

                    <div className="feedback-columns">

                      <div>
                        <h3>
                          ✓ Good
                        </h3>

                        {interviewEvaluation
                          .strengths
                          .map(
                            (
                              item,
                              index
                            ) => (
                              <p
                                key={
                                  index
                                }
                              >
                                {item}
                              </p>
                            )
                          )}
                      </div>

                      <div>
                        <h3>
                          → Improve
                        </h3>

                        {interviewEvaluation
                          .improvements
                          .map(
                            (
                              item,
                              index
                            ) => (
                              <p
                                key={
                                  index
                                }
                              >
                                {item}
                              </p>
                            )
                          )}
                      </div>

                    </div>

                    <div className="ideal">
                      <small>
                        BETTER ANSWER
                      </small>

                      <p>
                        {
                          interviewEvaluation
                            .improved_answer
                        }
                      </p>
                    </div>

                    {nextInterviewQuestion ? (
                      <button
                        className="primary"
                        onClick={
                          nextInterview
                        }
                      >
                        Next Question →
                      </button>
                    ) : (
                      <h2>
                        Interview complete —
                        Average{" "}
                        {
                          interviewAverage
                        }
                        /10
                      </h2>
                    )}

                  </div>
                )}

              </div>
            )}

          </section>
        )}


        {/* PYTHON STUDY */}

        {mode === "study" && (
          <section className="page">

            {!studyStarted ? (
              <div className="setup">

                <span className="badge">
                  PYTHON STUDY MODE
                </span>

                <h1>
                  Learn Python for
                  interviews
                </h1>

                <p className="description">
                  Learn a concept, answer
                  interview questions, get
                  feedback, and automatically
                  increase difficulty.
                </p>


                <div className="topic-presets">

                  {[
                    "Python Fundamentals",
                    "Data Types",
                    "Lists & Tuples",
                    "Dictionaries & Sets",
                    "Functions",
                    "OOP",
                    "Exception Handling",
                    "Decorators",
                    "Generators",
                    "Async Python",
                  ].map(
                    (topic) => (
                      <button
                        key={topic}
                        className={
                          studyTopic ===
                          topic
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setStudyTopic(
                            topic
                          )
                        }
                      >
                        {topic}
                      </button>
                    )
                  )}

                </div>


                <div className="grid study-grid">

                  <label>
                    Topic

                    <input
                      value={
                        studyTopic
                      }
                      onChange={(
                        event
                      ) =>
                        setStudyTopic(
                          event.target
                            .value
                        )
                      }
                    />
                  </label>


                  <label>
                    Level

                    <select
                      value={
                        studyDifficulty
                      }
                      onChange={(
                        event
                      ) =>
                        setStudyDifficulty(
                          event.target
                            .value
                        )
                      }
                    >
                      <option>
                        Fresher
                      </option>

                      <option>
                        Intermediate
                      </option>

                      <option>
                        Advanced
                      </option>
                    </select>
                  </label>

                </div>


                <button
                  className="primary"
                  onClick={
                    startStudy
                  }
                  disabled={
                    studyLoading
                  }
                >
                  {studyLoading
                    ? "Preparing lesson..."
                    : "Start Python Practice"}
                </button>

              </div>

            ) : (

              <div className="practice">

                <div className="practice-head">

                  <div>
                    <span>
                      PYTHON PRACTICE{" "}
                      {studyNumber}/5
                    </span>

                    <h2>
                      {studyTopic}
                    </h2>
                  </div>

                  <b>
                    Avg{" "}
                    {studyAverage}
                    /10
                  </b>

                </div>


                {studyNumber === 1 &&
                  studyLesson && (
                  <div className="lesson-card">

                    <small>
                      QUICK LESSON
                    </small>

                    <p>
                      {studyLesson}
                    </p>

                  </div>
                )}


                <div className="question-card">

                  <small>
                    PYTHON QUESTION
                  </small>

                  <p>
                    {studyQuestion}
                  </p>

                </div>


                {!studyEvaluation && (
                  <>

                    {showHint && (
                      <div className="hint">
                        Hint:{" "}
                        {studyHint}
                      </div>
                    )}

                    {!showHint &&
                      studyHint && (
                      <button
                        className="hint-button"
                        onClick={() =>
                          setShowHint(
                            true
                          )
                        }
                      >
                        Show hint
                      </button>
                    )}


                    <textarea
                      className="answer-box"
                      value={
                        studyAnswer
                      }
                      onChange={(
                        event
                      ) =>
                        setStudyAnswer(
                          event.target
                            .value
                        )
                      }
                      placeholder="Explain your answer as if an interviewer asked you..."
                    />


                    <button
                      className="primary"
                      onClick={
                        submitStudyAnswer
                      }
                      disabled={
                        studyLoading ||
                        !studyAnswer.trim()
                      }
                    >
                      {studyLoading
                        ? "Checking answer..."
                        : "Check Answer"}
                    </button>

                  </>
                )}


                {studyEvaluation && (
                  <div className="evaluation">

                    <div className="score-header">

                      <div className="big-score">
                        {
                          studyEvaluation.score
                        }
                        /10
                      </div>

                      <div>
                        <small>
                          RESULT
                        </small>

                        <h2>
                          {
                            studyEvaluation.verdict
                          }
                        </h2>
                      </div>

                    </div>


                    <div className="feedback-columns">

                      <div>
                        <h3>
                          ✓ Good
                        </h3>

                        {studyEvaluation
                          .good_points
                          .map(
                            (
                              item,
                              index
                            ) => (
                              <p
                                key={
                                  index
                                }
                              >
                                {item}
                              </p>
                            )
                          )}
                      </div>


                      <div>
                        <h3>
                          → Improve
                        </h3>

                        {studyEvaluation
                          .improvements
                          .map(
                            (
                              item,
                              index
                            ) => (
                              <p
                                key={
                                  index
                                }
                              >
                                {item}
                              </p>
                            )
                          )}
                      </div>

                    </div>


                    <div className="explanation-card">

                      <small>
                        EXPLANATION
                      </small>

                      <p>
                        {
                          studyEvaluation.explanation
                        }
                      </p>

                    </div>


                    <div className="ideal">

                      <small>
                        INTERVIEW-READY ANSWER
                      </small>

                      <p>
                        {
                          studyEvaluation.ideal_answer
                        }
                      </p>

                    </div>


                    <div className="remember">
                      💡{" "}
                      {
                        studyEvaluation.remember
                      }
                    </div>


                    {studyEvaluation
                      .next_question ? (
                      <button
                        className="primary"
                        onClick={
                          nextStudyQuestion
                        }
                      >
                        Next Python Question →
                      </button>
                    ) : (
                      <div className="complete">

                        <h2>
                          Python session complete
                        </h2>

                        <p>
                          Average score:{" "}
                          <strong>
                            {studyAverage}
                            /10
                          </strong>
                        </p>

                        <button
                          className="primary"
                          onClick={() =>
                            setStudyStarted(
                              false
                            )
                          }
                        >
                          Practice Another Topic
                        </button>

                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </section>
        )}

      </main>

    </div>
  );
}


export default App;