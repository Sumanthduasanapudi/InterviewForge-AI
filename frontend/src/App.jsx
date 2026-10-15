import { useEffect, useRef, useState } from "react"

import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  Code2,
  Database,
  FileText,
  Gauge,
  GraduationCap,
  Loader2,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trophy,
  Upload,
  X,
  Zap,
} from "lucide-react"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"


const API_URL = "http://127.0.0.1:8000"


// ============================================================
// APP
// ============================================================

function App() {
  const [activePage, setActivePage] = useState("rag")

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)


  // ------------------------------------------------------------
  // RAG
  // ------------------------------------------------------------

  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [asking, setAsking] = useState(false)


  // ------------------------------------------------------------
  // KNOWLEDGE VAULT
  // ------------------------------------------------------------

  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(true)

  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")

  const [selectedDocument, setSelectedDocument] = useState("")
  const [summary, setSummary] = useState("")
  const [summarizing, setSummarizing] = useState(false)

  const fileInputRef = useRef(null)


  // ------------------------------------------------------------
  // CODING GYM
  // ------------------------------------------------------------

  const [codingExercises, setCodingExercises] = useState([])
  const [codingLoading, setCodingLoading] = useState(true)

  const [selectedExercise, setSelectedExercise] = useState(null)
  const [code, setCode] = useState("")

  const [submittingCode, setSubmittingCode] = useState(false)
  const [codingResult, setCodingResult] = useState(null)


  // ------------------------------------------------------------
  // INTERVIEW LAB
  // ------------------------------------------------------------

  const [interviewTopics, setInterviewTopics] = useState([])
  const [interviewDifficulties, setInterviewDifficulties] = useState([])

  const [interviewTopic, setInterviewTopic] = useState("RAG")
  const [interviewDifficulty, setInterviewDifficulty] = useState("Beginner")

  const [interviewQuestion, setInterviewQuestion] = useState("")
  const [interviewAnswer, setInterviewAnswer] = useState("")

  const [previousInterviewQuestions, setPreviousInterviewQuestions] =
    useState([])

  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false)

  const [interviewResult, setInterviewResult] = useState(null)


  // ------------------------------------------------------------
  // PROGRESS
  // ------------------------------------------------------------

  const [progressData, setProgressData] = useState(null)
  const [progressLoading, setProgressLoading] = useState(true)
  const [progressError, setProgressError] = useState("")


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadDocuments()
    loadCodingExercises()
    loadInterviewOptions()
    loadProgress()
  }, [])


  // ============================================================
  // PAGE NAVIGATION
  // ============================================================

  function changePage(page) {
    setActivePage(page)
    setMobileSidebar(false)

    if (page === "progress") {
      loadProgress()
    }
  }


  // ============================================================
  // PROGRESS
  // ============================================================

  async function loadProgress() {
    setProgressLoading(true)
    setProgressError("")

    try {
      const response = await fetch(
        `${API_URL}/progress/dashboard`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Could not load dashboard."
        )
      }

      setProgressData(data)

    } catch (error) {
      setProgressError(
        error.message
      )

    } finally {
      setProgressLoading(false)
    }
  }


  // ============================================================
  // DOCUMENTS
  // ============================================================

  async function loadDocuments() {
    setDocumentsLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/documents`
      )

      if (!response.ok) {
        throw new Error(
          "Could not load Knowledge Vault."
        )
      }

      const data = await response.json()

      const items = data.documents || []

      setDocuments(items)

      if (
        items.length > 0 &&
        !selectedDocument
      ) {
        setSelectedDocument(
          items[0].source
        )
      }

    } catch (error) {
      console.error(error)

    } finally {
      setDocumentsLoading(false)
    }
  }


  async function uploadFile(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploading(true)
    setUploadMessage("")

    const formData = new FormData()

    formData.append(
      "file",
      file
    )

    try {
      const response = await fetch(
        `${API_URL}/upload`,
        {
          method: "POST",
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Upload failed."
        )
      }

      setUploadMessage(
        `${data.filename} added successfully`
      )

      await loadDocuments()

      setSelectedDocument(
        data.filename
      )

    } catch (error) {
      setUploadMessage(
        error.message
      )

    } finally {
      setUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }


  async function summarizeDocument() {
    if (
      !selectedDocument ||
      summarizing
    ) {
      return
    }

    setSummary("")
    setSummarizing(true)

    try {
      const response = await fetch(
        `${API_URL}/summarize`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            source:
              selectedDocument,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Summarization failed."
        )
      }

      setSummary(
        data.summary
      )

    } catch (error) {
      setSummary(
        `Error: ${error.message}`
      )

    } finally {
      setSummarizing(false)
    }
  }


  // ============================================================
  // CODING
  // ============================================================

  async function loadCodingExercises() {
    setCodingLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/coding/exercises`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          "Could not load Coding Gym."
        )
      }

      const exercises =
        data.exercises || []

      setCodingExercises(
        exercises
      )

      if (exercises.length > 0) {
        setSelectedExercise(
          exercises[0]
        )

        setCode(
          exercises[0].starter_code
        )
      }

    } catch (error) {
      console.error(error)

    } finally {
      setCodingLoading(false)
    }
  }


  function selectExercise(exercise) {
    setSelectedExercise(
      exercise
    )

    setCode(
      exercise.starter_code
    )

    setCodingResult(null)
  }


  function resetCode() {
    if (!selectedExercise) {
      return
    }

    setCode(
      selectedExercise.starter_code
    )

    setCodingResult(null)
  }


  async function submitCode() {
    if (
      !selectedExercise ||
      !code.trim() ||
      submittingCode
    ) {
      return
    }

    setSubmittingCode(true)
    setCodingResult(null)

    try {
      const response = await fetch(
        `${API_URL}/coding/submit`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            exercise_id:
              selectedExercise.id,

            code:
              code,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Evaluation failed."
        )
      }

      setCodingResult(
        data
      )

      await loadProgress()

    } catch (error) {
      setCodingResult({
        passed: false,
        score: 0,
        feedback: error.message,
        tests: [],
      })

    } finally {
      setSubmittingCode(false)
    }
  }


  // ============================================================
  // INTERVIEW
  // ============================================================

  async function loadInterviewOptions() {
    try {
      const response = await fetch(
        `${API_URL}/interview/options`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          "Could not load interview options."
        )
      }

      setInterviewTopics(
        data.topics || []
      )

      setInterviewDifficulties(
        data.difficulties || []
      )

      if (data.topics?.length) {
        setInterviewTopic(
          data.topics[0]
        )
      }

      if (data.difficulties?.length) {
        setInterviewDifficulty(
          data.difficulties[0]
        )
      }

    } catch (error) {
      console.error(error)
    }
  }


  async function getInterviewQuestion() {
    if (
      !interviewTopic ||
      !interviewDifficulty ||
      loadingQuestion
    ) {
      return
    }

    setLoadingQuestion(true)
    setInterviewResult(null)
    setInterviewAnswer("")

    try {
      const response = await fetch(
        `${API_URL}/interview/question`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            topic:
              interviewTopic,

            difficulty:
              interviewDifficulty,

            previous_questions:
              previousInterviewQuestions,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Could not load question."
        )
      }

      setInterviewQuestion(
        data.question
      )

      setPreviousInterviewQuestions(
        (previous) => [
          ...previous,
          data.question,
        ]
      )

    } catch (error) {
      setInterviewQuestion(
        `Error: ${error.message}`
      )

    } finally {
      setLoadingQuestion(false)
    }
  }


  async function evaluateInterviewAnswer() {
    if (
      !interviewQuestion ||
      !interviewAnswer.trim() ||
      evaluatingAnswer
    ) {
      return
    }

    setEvaluatingAnswer(true)
    setInterviewResult(null)

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
            topic:
              interviewTopic,

            difficulty:
              interviewDifficulty,

            question:
              interviewQuestion,

            answer:
              interviewAnswer,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Interview evaluation failed."
        )
      }

      setInterviewResult(
        data
      )

      await loadProgress()

    } catch (error) {
      setInterviewResult({
        error:
          error.message,
      })

    } finally {
      setEvaluatingAnswer(false)
    }
  }


  function resetInterview() {
    setInterviewQuestion("")
    setInterviewAnswer("")
    setInterviewResult(null)
    setPreviousInterviewQuestions([])
  }


  // ============================================================
  // RAG
  // ============================================================

  async function askQuestion() {
    const cleanQuestion =
      question.trim()

    if (
      !cleanQuestion ||
      asking
    ) {
      return
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: cleanQuestion,
      },
    ])

    setQuestion("")
    setAsking(true)

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
            question:
              cleanQuestion,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "RAG request failed."
        )
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer,
          sources:
            data.sources || [],
          retrieval:
            data.retrieval || {},
        },
      ])

    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: error.message,
          error: true,
        },
      ])

    } finally {
      setAsking(false)
    }
  }


  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()
      askQuestion()
    }
  }


  // ============================================================
  // NAV
  // ============================================================

  const navigation = [
    {
      id: "rag",
      label: "RAG Assistant",
      description: "Ask your knowledge",
      icon: MessageSquareText,
    },
    {
      id: "vault",
      label: "Knowledge Vault",
      description: "Manage documents",
      icon: Database,
    },
    {
      id: "coding",
      label: "Coding Gym",
      description: "Practice Python",
      icon: Code2,
    },
    {
      id: "interview",
      label: "Interview Lab",
      description: "Mock interviews",
      icon: GraduationCap,
    },
    {
      id: "progress",
      label: "Progress",
      description: "Track improvement",
      icon: BarChart3,
    },
  ]


  // ============================================================
  // APP
  // ============================================================

  return (
    <div className="min-h-screen bg-[#06070a] text-zinc-100">

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute left-[20%] top-[-180px] h-[420px] w-[420px] rounded-full bg-violet-700/10 blur-[120px]" />

        <div className="absolute bottom-[-180px] right-[5%] h-[500px] w-[500px] rounded-full bg-cyan-600/5 blur-[140px]" />

      </div>


      {/* MOBILE HEADER */}

      <div className="relative z-40 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#090a0f]/90 px-4 backdrop-blur-xl lg:hidden">

        <Brand compact />

        <button
          onClick={() =>
            setMobileSidebar(true)
          }
          className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5 text-zinc-400"
        >
          <Menu size={20} />
        </button>

      </div>


      {/* MOBILE OVERLAY */}

      {mobileSidebar && (

        <div className="fixed inset-0 z-50 lg:hidden">

          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() =>
              setMobileSidebar(false)
            }
          />

          <div className="relative h-full w-[290px] border-r border-white/[0.07] bg-[#090a0f]">

            <div className="flex items-center justify-between border-b border-white/[0.06] p-5">

              <Brand />

              <button
                onClick={() =>
                  setMobileSidebar(false)
                }
                className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.05]"
              >
                <X size={18} />
              </button>

            </div>

            <Navigation
              items={navigation}
              activePage={activePage}
              changePage={changePage}
            />

          </div>

        </div>

      )}


      <div className="relative z-10 flex min-h-screen">


        {/* DESKTOP SIDEBAR */}

        <aside
          className={`hidden shrink-0 border-r border-white/[0.06] bg-[#090a0f]/95 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col ${
            sidebarCollapsed
              ? "w-[86px]"
              : "w-[270px]"
          }`}
        >

          <div className="flex h-[82px] items-center border-b border-white/[0.06] px-5">

            {!sidebarCollapsed ? (

              <Brand />

            ) : (

              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-700/20">
                <Sparkles size={19} />
              </div>

            )}

          </div>


          <Navigation
            items={navigation}
            activePage={activePage}
            changePage={changePage}
            collapsed={sidebarCollapsed}
          />


          <div className="mt-auto p-4">

            {!sidebarCollapsed && (

              <div className="mb-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">

                <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">

                  <span className="relative flex h-2.5 w-2.5">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />

                  </span>

                  Local AI online

                </div>

                <p className="mt-2 text-xs leading-5 text-zinc-600">
                  Ollama • ChromaDB • SQLite
                </p>

              </div>

            )}


            <button
              onClick={() =>
                setSidebarCollapsed(
                  !sidebarCollapsed
                )
              }
              className="flex w-full items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] py-2.5 text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300"
            >

              {sidebarCollapsed ? (
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}

            </button>

          </div>

        </aside>


        {/* CONTENT */}

        <main className="flex min-w-0 flex-1 flex-col">

          {activePage === "rag" && (

            <RagPage
              question={question}
              setQuestion={setQuestion}
              messages={messages}
              asking={asking}
              askQuestion={askQuestion}
              handleKeyDown={handleKeyDown}
              documents={documents}
              openVault={() =>
                changePage("vault")
              }
            />

          )}


          {activePage === "vault" && (

            <VaultPage
              documents={documents}
              documentsLoading={
                documentsLoading
              }
              selectedDocument={
                selectedDocument
              }
              setSelectedDocument={
                setSelectedDocument
              }
              summary={summary}
              setSummary={setSummary}
              summarizing={
                summarizing
              }
              summarizeDocument={
                summarizeDocument
              }
              uploading={uploading}
              uploadMessage={
                uploadMessage
              }
              uploadFile={uploadFile}
              fileInputRef={
                fileInputRef
              }
            />

          )}


          {activePage === "coding" && (

            <CodingGymPage
              exercises={codingExercises}
              loading={codingLoading}
              selectedExercise={
                selectedExercise
              }
              selectExercise={
                selectExercise
              }
              code={code}
              setCode={setCode}
              resetCode={resetCode}
              submitCode={submitCode}
              submitting={
                submittingCode
              }
              result={codingResult}
            />

          )}


          {activePage === "interview" && (

            <InterviewLabPage
              topics={interviewTopics}
              difficulties={
                interviewDifficulties
              }
              topic={interviewTopic}
              setTopic={
                setInterviewTopic
              }
              difficulty={
                interviewDifficulty
              }
              setDifficulty={
                setInterviewDifficulty
              }
              question={
                interviewQuestion
              }
              answer={
                interviewAnswer
              }
              setAnswer={
                setInterviewAnswer
              }
              getQuestion={
                getInterviewQuestion
              }
              loadingQuestion={
                loadingQuestion
              }
              evaluateAnswer={
                evaluateInterviewAnswer
              }
              evaluatingAnswer={
                evaluatingAnswer
              }
              result={
                interviewResult
              }
              resetInterview={
                resetInterview
              }
            />

          )}


          {activePage === "progress" && (

            <ProgressDashboard
              data={progressData}
              loading={progressLoading}
              error={progressError}
              refresh={loadProgress}
            />

          )}

        </main>

      </div>

    </div>
  )
}


// ============================================================
// BRAND
// ============================================================

function Brand({
  compact = false
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-700/20">

        <Sparkles size={19} />

      </div>

      {!compact && (

        <div>

          <p className="text-sm font-semibold tracking-tight text-zinc-100">
            InterviewForge
          </p>

          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
            Local AI Coach
          </p>

        </div>

      )}

    </div>
  )
}


// ============================================================
// NAVIGATION
// ============================================================

function Navigation({
  items,
  activePage,
  changePage,
  collapsed = false
}) {
  return (
    <nav className="flex-1 space-y-1.5 p-3">

      {!collapsed && (

        <p className="mb-3 px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          Workspace
        </p>

      )}

      {items.map((item) => {

        const Icon = item.icon

        const active =
          item.id === activePage

        return (

          <button
            key={item.id}
            onClick={() =>
              changePage(item.id)
            }
            title={
              collapsed
                ? item.label
                : undefined
            }
            className={`group flex w-full items-center rounded-xl border transition ${
              active
                ? "border-violet-500/10 bg-violet-500/[0.08] text-violet-200"
                : "border-transparent text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300"
            } ${
              collapsed
                ? "justify-center p-3"
                : "gap-3 px-3 py-2.5"
            }`}
          >

            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                active
                  ? "bg-violet-500/10 text-violet-300"
                  : "bg-white/[0.025] text-zinc-600 group-hover:text-zinc-400"
              }`}
            >
              <Icon size={17} />
            </div>


            {!collapsed && (

              <>
                <div className="min-w-0 flex-1 text-left">

                  <p className="truncate text-sm font-medium">
                    {item.label}
                  </p>

                  <p className="truncate text-[11px] text-zinc-700">
                    {item.description}
                  </p>

                </div>

                <ChevronRight
                  size={14}
                  className={
                    active
                      ? "text-violet-400"
                      : "text-zinc-800"
                  }
                />
              </>

            )}

          </button>

        )
      })}

    </nav>
  )
}


// ============================================================
// PAGE HEADER
// ============================================================

function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  action
}) {
  return (
    <header className="border-b border-white/[0.06] bg-[#08090d]/80 px-5 py-5 backdrop-blur-xl md:px-7">

      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">

        <div className="flex items-center gap-4">

          <div className="hidden h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-violet-300 sm:flex">
            <Icon size={19} />
          </div>

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400/80">
              {eyebrow}
            </p>

            <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-100">
              {title}
            </h1>

            <p className="mt-1 text-sm text-zinc-600">
              {description}
            </p>

          </div>

        </div>

        {action}

      </div>

    </header>
  )
}


// ============================================================
// RAG PAGE
// ============================================================

function RagPage({
  question,
  setQuestion,
  messages,
  asking,
  askQuestion,
  handleKeyDown,
  documents,
  openVault
}) {
  return (
    <>

      <PageHeader
        icon={BrainCircuit}
        eyebrow="Advanced Retrieval"
        title="RAG Assistant"
        description="Hybrid search, reranking and grounded local answers."
        action={

          <button
            onClick={openVault}
            className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200 sm:flex"
          >
            <Database size={16} />

            {documents.length} documents
          </button>

        }
      />


      <section className="flex flex-1 justify-center overflow-y-auto px-4 py-8 md:px-8">

        <div className="flex w-full max-w-5xl flex-col">

          {messages.length === 0 ? (

            <RagEmptyState
              setQuestion={
                setQuestion
              }
              documents={
                documents
              }
              openVault={
                openVault
              }
            />

          ) : (

            <div className="space-y-7 pb-6">

              {messages.map(
                (message, index) => (

                  <ChatMessage
                    key={index}
                    message={message}
                  />

                )
              )}


              {asking && (

                <div className="flex gap-3">

                  <AvatarIcon>
                    <Sparkles size={17} />
                  </AvatarIcon>

                  <div className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-white/[0.025] px-5 py-4">

                    <div className="flex items-center gap-3 text-sm text-zinc-500">

                      <Loader2
                        size={16}
                        className="animate-spin text-violet-400"
                      />

                      Searching, fusing and reranking context...

                    </div>

                  </div>

                </div>

              )}

            </div>

          )}

        </div>

      </section>


      <div className="border-t border-white/[0.06] bg-[#08090d]/90 px-4 py-4 backdrop-blur-xl">

        <div className="mx-auto max-w-5xl">

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2 shadow-2xl shadow-black/20 transition focus-within:border-violet-500/30">

            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              rows="2"
              placeholder="Ask anything grounded in your Knowledge Vault..."
              className="max-h-36 min-h-[52px] w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-700"
            />


            <div className="flex items-center justify-between gap-4 border-t border-white/[0.05] px-2 pt-2">

              <div className="flex items-center gap-2 text-[11px] text-zinc-700">

                <Zap size={13} />

                Local inference

                <span>
                  •
                </span>

                Enter to send

              </div>


              <button
                onClick={
                  askQuestion
                }
                disabled={
                  asking ||
                  !question.trim()
                }
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-950/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {asking ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={16} />
                )}

                Send
              </button>

            </div>

          </div>


          <p className="mt-2 text-center text-[11px] text-zinc-800">
            Verify important answers against the retrieved source passages.
          </p>

        </div>

      </div>

    </>
  )
}


// ============================================================
// RAG EMPTY
// ============================================================

function RagEmptyState({
  setQuestion,
  documents,
  openVault
}) {

  const prompts = [
    "What AI projects are mentioned in my documents?",
    "Explain my RAG experience for an interview.",
    "What Python skills are shown in my notes?",
    "What technologies should I revise first?",
  ]

  return (
    <div className="m-auto w-full max-w-3xl py-10 text-center md:py-20">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 text-violet-300 shadow-2xl shadow-violet-900/10">
        <BrainCircuit size={28} />
      </div>


      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-400/70">
        Advanced local RAG
      </p>


      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-zinc-100 md:text-4xl">
        Ask your own knowledge.
      </h2>


      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-600">
        InterviewForge combines semantic retrieval, BM25, reciprocal rank fusion and cross-encoder reranking before sending context to Ollama.
      </p>


      <div className="mt-8 grid gap-3 sm:grid-cols-2">

        {prompts.map(
          (prompt) => (

            <button
              key={prompt}
              onClick={() =>
                setQuestion(prompt)
              }
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition hover:border-violet-500/20 hover:bg-violet-500/[0.035]"
            >

              <div className="flex items-start gap-3">

                <Sparkles
                  size={16}
                  className="mt-0.5 shrink-0 text-zinc-700 transition group-hover:text-violet-400"
                />

                <p className="text-sm leading-6 text-zinc-500 transition group-hover:text-zinc-300">
                  {prompt}
                </p>

              </div>

            </button>

          )
        )}

      </div>


      {documents.length === 0 && (

        <button
          onClick={openVault}
          className="mt-6 inline-flex items-center gap-2 text-sm text-violet-400"
        >
          <Upload size={15} />

          Add your first document
        </button>

      )}

    </div>
  )
}


// ============================================================
// CHAT MESSAGE
// ============================================================

function ChatMessage({
  message
}) {

  if (message.role === "user") {

    return (
      <div className="flex justify-end">

        <div className="max-w-[86%] rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-indigo-600 px-5 py-3.5 text-sm leading-6 text-white shadow-xl shadow-violet-950/10 md:max-w-[70%]">
          {message.text}
        </div>

      </div>
    )
  }


  return (
    <div className="flex gap-3">

      <AvatarIcon>
        <Sparkles size={17} />
      </AvatarIcon>


      <div className="min-w-0 flex-1">

        <div
          className={`rounded-2xl rounded-tl-md border p-5 ${
            message.error
              ? "border-red-500/15 bg-red-500/[0.035]"
              : "border-white/[0.06] bg-white/[0.022]"
          }`}
        >

          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
            {message.text}
          </p>


          {message.retrieval?.method && (

            <div className="mt-5 flex flex-wrap gap-2">

              <Tag>
                <BrainCircuit size={12} />

                Hybrid RAG
              </Tag>

              <Tag>
                {
                  message.retrieval
                    .candidates_used
                }{" "}
                contexts
              </Tag>

              {message.retrieval
                .best_reranker_score !==
                undefined && (

                <Tag>
                  Rerank{" "}
                  {
                    message.retrieval
                      .best_reranker_score
                  }
                </Tag>

              )}

            </div>

          )}

        </div>


        {message.sources?.length > 0 && (

          <div className="mt-3">

            <div className="mb-2 flex items-center gap-2 px-1">

              <BookOpen
                size={13}
                className="text-zinc-700"
              />

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                Supporting sources
              </p>

            </div>


            <div className="space-y-2">

              {message.sources.map(
                (source, index) => (

                  <details
                    key={index}
                    className="group rounded-xl border border-white/[0.055] bg-white/[0.015]"
                  >

                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">

                      <FileText
                        size={15}
                        className="shrink-0 text-zinc-700"
                      />

                      <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">
                        {source.source}
                      </span>

                      <span className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-700">
                        chunk {source.chunk}
                      </span>

                      <ChevronRight
                        size={14}
                        className="text-zinc-700 transition group-open:rotate-90"
                      />

                    </summary>


                    <div className="border-t border-white/[0.05] px-4 py-4">

                      <p className="whitespace-pre-wrap text-xs leading-6 text-zinc-600">
                        {source.passage}
                      </p>

                    </div>

                  </details>

                )
              )}

            </div>

          </div>

        )}

      </div>

    </div>
  )
}


// ============================================================
// VAULT
// ============================================================

function VaultPage({
  documents,
  documentsLoading,
  selectedDocument,
  setSelectedDocument,
  summary,
  setSummary,
  summarizing,
  summarizeDocument,
  uploading,
  uploadMessage,
  uploadFile,
  fileInputRef,
}) {

  const chunkCount =
    documents.reduce(
      (total, document) =>
        total +
        document.chunks,
      0
    )

  return (
    <>

      <PageHeader
        icon={Database}
        eyebrow="Knowledge Base"
        title="Knowledge Vault"
        description="Upload, inspect and summarize your local documents."
        action={

          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-950/20 transition hover:brightness-110">

            {uploading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Plus size={16} />
            )}

            <span className="hidden sm:inline">
              {uploading
                ? "Uploading..."
                : "Add document"
              }
            </span>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,.py"
              onChange={
                uploadFile
              }
              disabled={
                uploading
              }
            />

          </label>

        }
      />


      <div className="flex-1 overflow-y-auto p-4 md:p-7">

        <div className="mx-auto max-w-[1500px]">


          <div className="grid gap-3 sm:grid-cols-3">

            <MetricCard
              icon={FileText}
              label="Documents"
              value={documents.length}
              hint="Indexed files"
            />

            <MetricCard
              icon={Database}
              label="Chunks"
              value={chunkCount}
              hint="Vectorized passages"
            />

            <MetricCard
              icon={BrainCircuit}
              label="Retrieval"
              value="Hybrid"
              hint="Dense + BM25"
            />

          </div>


          {uploadMessage && (

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.035] px-4 py-3 text-sm text-emerald-300">

              <Check size={16} />

              {uploadMessage}

            </div>

          )}


          <div className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">


            {/* FILE LIST */}

            <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.018]">

              <div className="border-b border-white/[0.06] px-5 py-4">

                <p className="text-sm font-medium text-zinc-300">
                  Documents
                </p>

                <p className="mt-1 text-xs text-zinc-700">
                  Select a file to inspect or summarize.
                </p>

              </div>


              <div className="max-h-[650px] space-y-1.5 overflow-y-auto p-2.5">

                {documentsLoading ? (

                  <SkeletonList />

                ) : documents.length === 0 ? (

                  <EmptyBox
                    icon={FileText}
                    title="No documents yet"
                    description="Upload a PDF, TXT, Markdown or Python file."
                  />

                ) : (

                  documents.map(
                    (document) => {

                      const active =
                        selectedDocument ===
                        document.source

                      return (

                        <button
                          key={
                            document.source
                          }
                          onClick={() => {
                            setSelectedDocument(
                              document.source
                            )

                            setSummary("")
                          }}
                          className={`group flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                            active
                              ? "border-violet-500/15 bg-violet-500/[0.07]"
                              : "border-transparent hover:bg-white/[0.03]"
                          }`}
                        >

                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              active
                                ? "bg-violet-500/10 text-violet-300"
                                : "bg-white/[0.03] text-zinc-700"
                            }`}
                          >
                            <FileText size={18} />
                          </div>


                          <div className="min-w-0 flex-1">

                            <p
                              className={`truncate text-sm ${
                                active
                                  ? "font-medium text-zinc-200"
                                  : "text-zinc-500"
                              }`}
                            >
                              {
                                document.source
                              }
                            </p>

                            <p className="mt-1 text-[11px] text-zinc-700">
                              {
                                document.chunks
                              }{" "}
                              chunks
                            </p>

                          </div>


                          <ChevronRight
                            size={15}
                            className={
                              active
                                ? "text-violet-400"
                                : "text-zinc-800"
                            }
                          />

                        </button>

                      )
                    }
                  )

                )}

              </div>

            </section>


            {/* DOCUMENT WORKSPACE */}

            <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.018]">

              <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">

                <div className="min-w-0">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                    Selected document
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-zinc-300">
                    {selectedDocument ||
                    "No document selected"}
                  </p>

                </div>


                <button
                  onClick={
                    summarizeDocument
                  }
                  disabled={
                    !selectedDocument ||
                    summarizing
                  }
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-violet-500/15 bg-violet-500/[0.07] px-4 py-2.5 text-sm text-violet-300 transition hover:bg-violet-500/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {summarizing ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Sparkles size={15} />
                  )}

                  <span className="hidden sm:inline">
                    {summarizing
                      ? "Summarizing"
                      : "AI Summary"
                    }
                  </span>

                </button>

              </div>


              <div className="min-h-[520px] p-5 md:p-7">

                {summarizing ? (

                  <LoadingWorkspace
                    title="Reading the document"
                    description="Ollama is generating a grounded summary from the selected file."
                  />

                ) : summary ? (

                  <div>

                    <div className="mb-5 flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                        <Sparkles size={16} />
                      </div>

                      <div>

                        <p className="text-sm font-medium text-zinc-300">
                          AI document summary
                        </p>

                        <p className="text-[11px] text-zinc-700">
                          Generated locally with Ollama
                        </p>

                      </div>

                    </div>


                    <div className="rounded-2xl border border-white/[0.055] bg-[#08090d] p-5">

                      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-400">
                        {summary}
                      </p>

                    </div>

                  </div>

                ) : (

                  <EmptyBox
                    icon={Sparkles}
                    title="Generate a focused summary"
                    description="Select a document and let InterviewForge create an interview-friendly summary."
                  />

                )}

              </div>

            </section>

          </div>

        </div>

      </div>

    </>
  )
}


// ============================================================
// CODING GYM
// ============================================================

function CodingGymPage({
  exercises,
  loading,
  selectedExercise,
  selectExercise,
  code,
  setCode,
  resetCode,
  submitCode,
  submitting,
  result,
}) {
  return (
    <>

      <PageHeader
        icon={Code2}
        eyebrow="Practice Environment"
        title="Coding Gym"
        description="Solve Python challenges against real automated tests."
        action={

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-zinc-600">
            {exercises.length} exercises
          </div>

        }
      />


      <div className="grid flex-1 overflow-hidden xl:grid-cols-[315px_1fr]">


        {/* EXERCISES */}

        <aside className="overflow-y-auto border-r border-white/[0.06] bg-[#08090d]/60 p-3">

          <p className="mb-3 px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-700">
            Challenge Library
          </p>


          {loading ? (

            <SkeletonList />

          ) : (

            <div className="space-y-1.5">

              {exercises.map(
                (exercise) => {

                  const active =
                    selectedExercise?.id ===
                    exercise.id

                  return (

                    <button
                      key={exercise.id}
                      onClick={() =>
                        selectExercise(
                          exercise
                        )
                      }
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-violet-500/15 bg-violet-500/[0.07]"
                          : "border-transparent hover:bg-white/[0.03]"
                      }`}
                    >

                      <div className="flex items-center justify-between gap-3">

                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                            exercise.difficulty ===
                            "Beginner"
                              ? "bg-emerald-500/[0.07] text-emerald-400"
                              : "bg-amber-500/[0.07] text-amber-400"
                          }`}
                        >
                          {
                            exercise.difficulty
                          }
                        </span>

                        <span className="text-[10px] text-zinc-800">
                          {exercise.id}
                        </span>

                      </div>

                      <p className="mt-3 text-sm font-medium text-zinc-300">
                        {exercise.title}
                      </p>

                      <p className="mt-1 text-xs text-zinc-700">
                        {exercise.topic}
                      </p>

                    </button>

                  )
                }
              )}

            </div>

          )}

        </aside>


        {/* WORKSPACE */}

        <section className="overflow-y-auto p-4 md:p-7">

          {!selectedExercise ? (

            <EmptyBox
              icon={Code2}
              title="Choose a challenge"
              description="Select an exercise to start coding."
            />

          ) : (

            <div className="mx-auto max-w-7xl">

              <div className="mb-6">

                <div className="flex flex-wrap items-center gap-2">

                  <Tag>
                    {selectedExercise.difficulty}
                  </Tag>

                  <Tag>
                    {selectedExercise.topic}
                  </Tag>

                </div>


                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-100">
                  {selectedExercise.title}
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
                  {selectedExercise.description}
                </p>

              </div>


              <div className="grid gap-5 2xl:grid-cols-[1fr_390px]">


                {/* EDITOR */}

                <div>

                  <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#050608] shadow-2xl shadow-black/20">

                    <div className="flex h-12 items-center justify-between border-b border-white/[0.06] bg-[#090a0d] px-4">

                      <div className="flex items-center gap-3">

                        <div className="flex gap-1.5">

                          <span className="h-2.5 w-2.5 rounded-full bg-red-400/40" />
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/40" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/40" />

                        </div>

                        <div className="h-4 w-px bg-white/[0.07]" />

                        <div className="flex items-center gap-2 text-xs text-zinc-600">

                          <Code2 size={13} />

                          solution.py
                        </div>

                      </div>


                      <button
                        onClick={
                          resetCode
                        }
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-400"
                      >
                        <RotateCcw size={13} />

                        Reset
                      </button>

                    </div>


                    <textarea
                      value={code}
                      onChange={(event) =>
                        setCode(
                          event.target.value
                        )
                      }
                      spellCheck="false"
                      className="min-h-[480px] w-full resize-y bg-[#050608] p-5 font-mono text-[13px] leading-7 text-zinc-300 outline-none"
                    />

                  </div>


                  <div className="mt-4 flex items-center justify-between gap-4">

                    <p className="hidden text-[11px] text-zinc-700 sm:block">
                      Code is executed locally against hidden tests.
                    </p>


                    <button
                      onClick={
                        submitCode
                      }
                      disabled={
                        submitting ||
                        !code.trim()
                      }
                      className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Zap size={16} />
                      )}

                      {submitting
                        ? "Running tests"
                        : "Run tests"
                      }
                    </button>

                  </div>

                </div>


                {/* RESULT */}

                <div className="2xl:sticky 2xl:top-0 2xl:self-start">

                  <PanelCard
                    title="Test Results"
                    description="Deterministic Python evaluation"
                  >

                    {submitting ? (

                      <LoadingWorkspace
                        title="Running your solution"
                        description="Executing the hidden test suite..."
                        compact
                      />

                    ) : result ? (

                      <CodingResult
                        result={result}
                      />

                    ) : (

                      <EmptyBox
                        icon={Gauge}
                        title="Ready to evaluate"
                        description="Run your solution to see scores and test feedback."
                        compact
                      />

                    )}

                  </PanelCard>

                </div>

              </div>

            </div>

          )}

        </section>

      </div>

    </>
  )
}


// ============================================================
// CODING RESULT
// ============================================================

function CodingResult({
  result
}) {

  const good =
    result.passed

  return (
    <div className="space-y-5">

      <div
        className={`rounded-2xl border p-5 ${
          good
            ? "border-emerald-500/10 bg-emerald-500/[0.035]"
            : "border-red-500/10 bg-red-500/[0.03]"
        }`}
      >

        <div className="flex items-end justify-between gap-4">

          <div>

            <p
              className={`text-sm font-medium ${
                good
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
            >
              {good
                ? "All tests passed"
                : "Needs improvement"
              }
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-600">
              {result.feedback}
            </p>

          </div>


          <p
            className={`text-4xl font-semibold tracking-tight ${
              good
                ? "text-emerald-300"
                : "text-red-300"
            }`}
          >
            {result.score}
            <span className="text-lg">
              %
            </span>
          </p>

        </div>

      </div>


      {result.tests?.length > 0 && (

        <div className="space-y-2">

          {result.tests.map(
            (test) => (

              <div
                key={test.test}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-3"
              >

                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    test.passed
                      ? "bg-emerald-500/[0.07] text-emerald-400"
                      : "bg-red-500/[0.07] text-red-400"
                  }`}
                >
                  {test.passed ? (
                    <Check size={14} />
                  ) : (
                    <X size={14} />
                  )}
                </div>

                <p className="flex-1 text-xs text-zinc-500">
                  Test {test.test}
                </p>

                <span
                  className={`text-[10px] font-semibold ${
                    test.passed
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {test.passed
                    ? "PASS"
                    : "FAIL"
                  }
                </span>

              </div>

            )
          )}

        </div>

      )}

    </div>
  )
}


// ============================================================
// INTERVIEW LAB
// ============================================================

function InterviewLabPage({
  topics,
  difficulties,
  topic,
  setTopic,
  difficulty,
  setDifficulty,
  question,
  answer,
  setAnswer,
  getQuestion,
  loadingQuestion,
  evaluateAnswer,
  evaluatingAnswer,
  result,
  resetInterview,
}) {
  return (
    <>

      <PageHeader
        icon={GraduationCap}
        eyebrow="Mock Interview"
        title="Interview Lab"
        description="Practice technical answers and receive structured local AI feedback."
        action={

          <button
            onClick={
              resetInterview
            }
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300"
          >
            <RotateCcw size={15} />

            <span className="hidden sm:inline">
              Reset session
            </span>
          </button>

        }
      />


      <div className="flex-1 overflow-y-auto p-4 md:p-7">

        <div className="mx-auto max-w-[1450px]">


          {/* CONTROLS */}

          <div className="grid gap-3 md:grid-cols-2">

            <SelectPanel
              label="Topic"
              icon={Target}
              value={topic}
              options={topics}
              onChange={(value) => {
                setTopic(value)
                resetInterview()
              }}
            />

            <SelectPanel
              label="Difficulty"
              icon={Gauge}
              value={difficulty}
              options={difficulties}
              onChange={(value) => {
                setDifficulty(value)
                resetInterview()
              }}
            />

          </div>


          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_430px]">


            {/* QUESTION */}

            <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.018]">

              <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-violet-400/70">
                    {topic}
                    {" • "}
                    {difficulty}
                  </p>

                  <p className="mt-1 text-sm font-medium text-zinc-300">
                    Technical interview
                  </p>

                </div>


                <button
                  onClick={
                    getQuestion
                  }
                  disabled={
                    loadingQuestion
                  }
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium transition hover:brightness-110 disabled:opacity-40"
                >
                  {loadingQuestion ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Sparkles size={15} />
                  )}

                  {question
                    ? "Next question"
                    : "Start interview"
                  }
                </button>

              </div>


              <div className="p-5 md:p-7">

                {!question ? (

                  <EmptyBox
                    icon={GraduationCap}
                    title="Start your mock interview"
                    description="Select a topic and difficulty. InterviewForge will ask one question at a time and evaluate your response."
                  />

                ) : (

                  <>

                    <div className="rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.055] to-indigo-500/[0.025] p-5">

                      <div className="flex gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                          <BrainCircuit size={17} />
                        </div>

                        <div>

                          <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-violet-400/70">
                            Interview question
                          </p>

                          <p className="mt-3 text-base leading-7 text-zinc-200 md:text-lg md:leading-8">
                            {question}
                          </p>

                        </div>

                      </div>

                    </div>


                    <div className="mt-6">

                      <div className="mb-2 flex items-center justify-between">

                        <label className="text-xs font-medium text-zinc-500">
                          Your answer
                        </label>

                        <span className="text-[10px] text-zinc-800">
                          Explain it like a real interview
                        </span>

                      </div>


                      <textarea
                        value={answer}
                        onChange={(event) =>
                          setAnswer(
                            event.target.value
                          )
                        }
                        placeholder="Structure your answer clearly: definition → explanation → example..."
                        className="min-h-[250px] w-full resize-y rounded-2xl border border-white/[0.07] bg-[#07080b] p-5 text-sm leading-7 text-zinc-300 outline-none transition placeholder:text-zinc-800 focus:border-violet-500/25"
                      />

                    </div>


                    <div className="mt-4 flex justify-end">

                      <button
                        onClick={
                          evaluateAnswer
                        }
                        disabled={
                          evaluatingAnswer ||
                          !answer.trim()
                        }
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium transition hover:brightness-110 disabled:opacity-40"
                      >
                        {evaluatingAnswer ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Target size={15} />
                        )}

                        {evaluatingAnswer
                          ? "Evaluating"
                          : "Evaluate answer"
                        }
                      </button>

                    </div>

                  </>

                )}

              </div>

            </section>


            {/* FEEDBACK */}

            <PanelCard
              title="Interview Feedback"
              description="Correctness, clarity and technical depth"
            >

              {evaluatingAnswer ? (

                <LoadingWorkspace
                  title="Evaluating your answer"
                  description="The local model is scoring your response..."
                  compact
                />

              ) : result?.error ? (

                <ErrorBox
                  text={result.error}
                />

              ) : result ? (

                <InterviewResult
                  result={result}
                />

              ) : (

                <EmptyBox
                  icon={Activity}
                  title="Feedback appears here"
                  description="Submit an interview answer to receive detailed scoring."
                  compact
                />

              )}

            </PanelCard>

          </div>

        </div>

      </div>

    </>
  )
}


// ============================================================
// INTERVIEW RESULT
// ============================================================

function InterviewResult({
  result
}) {
  return (
    <div className="space-y-5">

      <div className="flex items-center gap-5">

        <ScoreRing
          score={
            result.total_score
          }
        />

        <div>

          <p className="text-sm font-medium text-zinc-300">
            Overall interview score
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-700">
            Based on correctness, clarity and depth.
          </p>

        </div>

      </div>


      <div className="grid grid-cols-3 gap-2">

        <ScoreTile
          label="Correct"
          value={
            result.correctness
          }
        />

        <ScoreTile
          label="Clarity"
          value={
            result.clarity
          }
        />

        <ScoreTile
          label="Depth"
          value={
            result.depth
          }
        />

      </div>


      <FeedbackBlock
        title="Feedback"
      >
        {result.feedback}
      </FeedbackBlock>


      {result.strong_points?.length > 0 && (

        <FeedbackList
          title="Strong points"
          icon={Check}
          items={
            result.strong_points
          }
          positive
        />

      )}


      {result.improvements?.length > 0 && (

        <FeedbackList
          title="Improve next"
          icon={Target}
          items={
            result.improvements
          }
        />

      )}


      {result.sample_answer && (

        <details className="group overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015]">

          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-medium text-zinc-500">

            Stronger sample answer

            <ChevronRight
              size={14}
              className="transition group-open:rotate-90"
            />

          </summary>

          <p className="border-t border-white/[0.05] px-4 py-4 text-xs leading-6 text-zinc-600">
            {result.sample_answer}
          </p>

        </details>

      )}


      {result.follow_up_question && (

        <div className="rounded-xl border border-violet-500/10 bg-violet-500/[0.04] p-4">

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-400/70">
            Follow-up question
          </p>

          <p className="mt-2 text-xs leading-6 text-zinc-500">
            {
              result.follow_up_question
            }
          </p>

        </div>

      )}

    </div>
  )
}


// ============================================================
// PROGRESS DASHBOARD
// ============================================================

function ProgressDashboard({
  data,
  loading,
  error,
  refresh,
}) {

  if (loading) {

    return (
      <CenteredLoader
        text="Loading progress analytics..."
      />
    )
  }


  if (error) {

    return (
      <div className="flex flex-1 items-center justify-center p-6">

        <ErrorBox
          text={error}
          action={refresh}
        />

      </div>
    )
  }


  if (!data) {
    return null
  }


  const overview =
    data.overview || {}

  const coding =
    overview.coding || {}

  const interview =
    overview.interview || {}


  return (
    <>

      <PageHeader
        icon={BarChart3}
        eyebrow="Performance Analytics"
        title="Progress Dashboard"
        description="See what you're improving and where to focus next."
        action={

          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[0.05]"
          >
            <RefreshCw size={15} />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>

        }
      />


      <div className="flex-1 overflow-y-auto p-4 md:p-7">

        <div className="mx-auto max-w-[1500px]">


          {/* STATS */}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

            <MetricCard
              icon={Activity}
              label="Practice Sessions"
              value={
                overview.total_practice_sessions ||
                0
              }
              hint="All recorded sessions"
            />

            <MetricCard
              icon={Code2}
              label="Coding Average"
              value={`${coding.average_score || 0}%`}
              hint={`${coding.attempts || 0} attempts`}
            />

            <MetricCard
              icon={Trophy}
              label="Coding Pass Rate"
              value={`${coding.pass_rate || 0}%`}
              hint={`${coding.passed_attempts || 0} passed`}
            />

            <MetricCard
              icon={GraduationCap}
              label="Interview Average"
              value={`${interview.average_score || 0}%`}
              hint={`${interview.attempts || 0} interviews`}
            />

          </div>


          {/* CHART */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

            <PanelCard
              title="Performance Trend"
              description="Average score across your recent practice days"
            >

              <ProgressChart
                data={
                  data.daily_progress || []
                }
              />

            </PanelCard>


            <PanelCard
              title="Interview Skills"
              description="Average rubric scores"
            >

              <MetricBar
                label="Correctness"
                value={
                  interview.correctness ||
                  0
                }
                max={10}
              />

              <MetricBar
                label="Clarity"
                value={
                  interview.clarity ||
                  0
                }
                max={10}
              />

              <MetricBar
                label="Technical depth"
                value={
                  interview.depth ||
                  0
                }
                max={10}
              />

            </PanelCard>

          </div>


          {/* STRENGTHS */}

          <div className="mt-6 grid gap-6 xl:grid-cols-2">

            <PanelCard
              title="Focus Areas"
              description="Topics currently below 70%"
            >

              {data.weak_areas?.length > 0 ? (

                <TopicRows
                  items={
                    data.weak_areas
                  }
                  weak
                />

              ) : (

                <EmptyBox
                  icon={Target}
                  title="No weak area detected"
                  description="More practice data will make recommendations stronger."
                  compact
                />

              )}

            </PanelCard>


            <PanelCard
              title="Strong Areas"
              description="Topics currently at 70% or above"
            >

              {data.strong_areas?.length > 0 ? (

                <TopicRows
                  items={
                    data.strong_areas
                  }
                />

              ) : (

                <EmptyBox
                  icon={Trophy}
                  title="Build your strengths"
                  description="Complete more coding and interview sessions."
                  compact
                />

              )}

            </PanelCard>

          </div>


          {/* TOPICS */}

          <div className="mt-6">

            <PanelCard
              title="Topic Performance"
              description="Average results across Coding Gym and Interview Lab"
            >

              {data.topic_performance?.length > 0 ? (

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

                  {data.topic_performance.map(
                    (item, index) => (

                      <TopicCard
                        key={`${item.topic}-${item.type}-${index}`}
                        item={item}
                      />

                    )
                  )}

                </div>

              ) : (

                <EmptyBox
                  icon={BarChart3}
                  title="No topic data yet"
                  description="Your activity will appear here after practice."
                  compact
                />

              )}

            </PanelCard>

          </div>


          {/* RECENT */}

          <div className="mt-6 grid gap-6 xl:grid-cols-2">

            <PanelCard
              title="Recent Coding"
              description="Latest coding attempts"
            >

              <HistoryList
                items={
                  data.coding_history ||
                  []
                }
                type="coding"
              />

            </PanelCard>


            <PanelCard
              title="Recent Interviews"
              description="Latest interview evaluations"
            >

              <HistoryList
                items={
                  data.interview_history ||
                  []
                }
                type="interview"
              />

            </PanelCard>

          </div>

        </div>

      </div>

    </>
  )
}


// ============================================================
// RECHART
// ============================================================

function ProgressChart({
  data
}) {

  if (!data.length) {

    return (
      <EmptyBox
        icon={BarChart3}
        title="No timeline yet"
        description="Practice on more days to build a progress trend."
        compact
      />
    )
  }


  return (
    <div className="h-[280px] w-full">

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <AreaChart
          data={data}
          margin={{
            top: 15,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >

          <defs>

            <linearGradient
              id="scoreGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >

              <stop
                offset="5%"
                stopColor="#8b5cf6"
                stopOpacity={0.25}
              />

              <stop
                offset="95%"
                stopColor="#8b5cf6"
                stopOpacity={0}
              />

            </linearGradient>

          </defs>


          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />


          <XAxis
            dataKey="date"
            tick={{
              fill: "#52525b",
              fontSize: 11,
            }}
            axisLine={false}
            tickLine={false}
          />


          <YAxis
            domain={[0, 100]}
            tick={{
              fill: "#52525b",
              fontSize: 11,
            }}
            axisLine={false}
            tickLine={false}
          />


          <Tooltip
            contentStyle={{
              background: "#0b0c10",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />


          <Area
            type="monotone"
            dataKey="average_score"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#scoreGradient)"
          />

        </AreaChart>

      </ResponsiveContainer>

    </div>
  )
}


// ============================================================
// GENERAL COMPONENTS
// ============================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  hint
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5">

      <div className="flex items-center justify-between">

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.035] text-zinc-600">
          <Icon size={17} />
        </div>

        <Activity
          size={14}
          className="text-zinc-800"
        />

      </div>


      <p className="mt-5 text-2xl font-semibold tracking-tight text-zinc-200">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-[11px] text-zinc-800">
        {hint}
      </p>

    </div>
  )
}


function PanelCard({
  title,
  description,
  children
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.018]">

      <div className="border-b border-white/[0.055] px-5 py-4">

        <p className="text-sm font-medium text-zinc-300">
          {title}
        </p>

        <p className="mt-1 text-xs text-zinc-700">
          {description}
        </p>

      </div>

      <div className="p-5">
        {children}
      </div>

    </section>
  )
}


function AvatarIcon({
  children
}) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/10 bg-violet-500/[0.07] text-violet-300">
      {children}
    </div>
  )
}


function Tag({
  children
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-[10px] font-medium text-zinc-600">
      {children}
    </span>
  )
}


function SelectPanel({
  label,
  icon: Icon,
  value,
  options,
  onChange
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-4">

      <div className="flex items-center gap-2">

        <Icon
          size={15}
          className="text-zinc-700"
        />

        <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
          {label}
        </label>

      </div>


      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-3 w-full rounded-xl border border-white/[0.07] bg-[#090a0e] px-3 py-2.5 text-sm text-zinc-300 outline-none"
      >

        {options.map(
          (item) => (

            <option
              key={item}
              value={item}
            >
              {item}
            </option>

          )
        )}

      </select>

    </div>
  )
}


function ScoreRing({
  score
}) {

  const normalized =
    Math.max(
      0,
      Math.min(
        100,
        Number(score || 0)
      )
    )

  return (
    <div
      className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
      style={{
        background:
          `conic-gradient(#8b5cf6 ${normalized * 3.6}deg, rgba(255,255,255,0.05) 0deg)`
      }}
    >

      <div className="absolute inset-[6px] rounded-full bg-[#0b0c10]" />

      <div className="relative text-center">

        <p className="text-2xl font-semibold text-zinc-200">
          {score}
        </p>

        <p className="text-[9px] uppercase tracking-wider text-zinc-700">
          /100
        </p>

      </div>

    </div>
  )
}


function ScoreTile({
  label,
  value
}) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-white/[0.018] p-3 text-center">

      <p className="text-lg font-semibold text-zinc-300">
        {value}
        <span className="text-xs text-zinc-700">
          /10
        </span>
      </p>

      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-zinc-700">
        {label}
      </p>

    </div>
  )
}


function FeedbackBlock({
  title,
  children
}) {
  return (
    <div>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
        {title}
      </p>

      <div className="rounded-xl border border-white/[0.055] bg-white/[0.015] p-4 text-xs leading-6 text-zinc-600">
        {children}
      </div>

    </div>
  )
}


function FeedbackList({
  title,
  icon: Icon,
  items,
  positive = false
}) {
  return (
    <div>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
        {title}
      </p>

      <div className="space-y-2">

        {items.map(
          (item, index) => (

            <div
              key={index}
              className="flex gap-3 rounded-xl border border-white/[0.05] bg-white/[0.012] p-3"
            >

              <Icon
                size={14}
                className={`mt-0.5 shrink-0 ${
                  positive
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              />

              <p className="text-xs leading-5 text-zinc-600">
                {item}
              </p>

            </div>

          )
        )}

      </div>

    </div>
  )
}


function MetricBar({
  label,
  value,
  max
}) {

  const percentage =
    Math.min(
      100,
      Number(value || 0) /
      max *
      100
    )

  return (
    <div className="mb-5 last:mb-0">

      <div className="mb-2 flex items-center justify-between">

        <span className="text-xs text-zinc-600">
          {label}
        </span>

        <span className="text-xs font-medium text-zinc-400">
          {value}/{max}
        </span>

      </div>


      <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">

        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
          style={{
            width:
              `${percentage}%`
          }}
        />

      </div>

    </div>
  )
}


function TopicRows({
  items,
  weak = false
}) {
  return (
    <div className="space-y-2">

      {items.map(
        (item, index) => (

          <div
            key={`${item.topic}-${index}`}
            className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5"
          >

            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                weak
                  ? "bg-amber-500/[0.06] text-amber-400"
                  : "bg-emerald-500/[0.06] text-emerald-400"
              }`}
            >

              {weak ? (
                <Target size={15} />
              ) : (
                <Trophy size={15} />
              )}

            </div>


            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-medium text-zinc-400">
                {item.topic}
              </p>

              <p className="mt-0.5 text-[10px] capitalize text-zinc-800">
                {item.type}
                {" • "}
                {item.attempts} attempts
              </p>

            </div>


            <p
              className={`text-sm font-semibold ${
                weak
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {item.average_score}%
            </p>

          </div>

        )
      )}

    </div>
  )
}


function TopicCard({
  item
}) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-white/[0.015] p-4">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-zinc-400">
            {item.topic}
          </p>

          <p className="mt-1 text-[10px] capitalize text-zinc-800">
            {item.type}
          </p>

        </div>

        <p className="text-lg font-semibold text-violet-300">
          {item.average_score}%
        </p>

      </div>


      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">

        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
          style={{
            width:
              `${Math.min(
                100,
                item.average_score
              )}%`
          }}
        />

      </div>


      <p className="mt-3 text-[10px] text-zinc-800">
        {item.attempts} attempts
      </p>

    </div>
  )
}


function HistoryList({
  items,
  type
}) {

  if (!items.length) {

    return (
      <EmptyBox
        icon={
          type === "coding"
            ? Code2
            : GraduationCap
        }
        title="No history yet"
        description="Complete a session to start building history."
        compact
      />
    )
  }


  return (
    <div className="space-y-2">

      {items.slice(0, 6).map(
        (item, index) => (

          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5"
          >

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-700">

              {type === "coding" ? (
                <Code2 size={15} />
              ) : (
                <GraduationCap size={15} />
              )}

            </div>


            <div className="min-w-0 flex-1">

              <p className="truncate text-sm text-zinc-500">

                {type === "coding"
                  ? item.topic
                  : `${item.topic} interview`
                }

              </p>

              <p className="mt-0.5 text-[10px] text-zinc-800">

                {item.difficulty}
                {" • "}
                {formatDateTime(
                  item.created_at
                )}

              </p>

            </div>


            <p
              className={`text-sm font-semibold ${
                item.score >= 70
                  ? "text-emerald-400"
                  : item.score >= 50
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {item.score}%
            </p>

          </div>

        )
      )}

    </div>
  )
}


function EmptyBox({
  icon: Icon,
  title,
  description,
  compact = false
}) {
  return (
    <div
      className={`flex items-center justify-center text-center ${
        compact
          ? "min-h-[180px]"
          : "min-h-[420px]"
      }`}
    >

      <div className="max-w-sm">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.02] text-zinc-800">
          <Icon size={20} />
        </div>

        <p className="mt-4 text-sm font-medium text-zinc-500">
          {title}
        </p>

        <p className="mt-2 text-xs leading-5 text-zinc-700">
          {description}
        </p>

      </div>

    </div>
  )
}


function LoadingWorkspace({
  title,
  description,
  compact = false
}) {
  return (
    <div
      className={`flex items-center justify-center text-center ${
        compact
          ? "min-h-[180px]"
          : "min-h-[420px]"
      }`}
    >

      <div className="max-w-sm">

        <Loader2
          size={24}
          className="mx-auto animate-spin text-violet-400"
        />

        <p className="mt-4 text-sm font-medium text-zinc-400">
          {title}
        </p>

        <p className="mt-2 text-xs leading-5 text-zinc-700">
          {description}
        </p>

      </div>

    </div>
  )
}


function SkeletonList() {
  return (
    <div className="space-y-2">

      {[1, 2, 3, 4].map(
        (item) => (

          <div
            key={item}
            className="animate-pulse rounded-xl border border-white/[0.04] p-4"
          >

            <div className="h-3 w-2/3 rounded bg-white/[0.04]" />

            <div className="mt-3 h-2 w-1/3 rounded bg-white/[0.025]" />

          </div>

        )
      )}

    </div>
  )
}


function CenteredLoader({
  text
}) {
  return (
    <div className="flex flex-1 items-center justify-center">

      <div className="text-center">

        <Loader2
          size={26}
          className="mx-auto animate-spin text-violet-400"
        />

        <p className="mt-4 text-sm text-zinc-600">
          {text}
        </p>

      </div>

    </div>
  )
}


function ErrorBox({
  text,
  action
}) {
  return (
    <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-5">

      <p className="text-sm text-red-300">
        {text}
      </p>

      {action && (

        <button
          onClick={action}
          className="mt-4 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-zinc-400"
        >
          <RefreshCw size={13} />

          Retry
        </button>

      )}

    </div>
  )
}


// ============================================================
// DATE
// ============================================================

function formatDateTime(value) {

  if (!value) {
    return ""
  }

  const normalized =
    value.includes("T")
      ? value
      : value.replace(
          " ",
          "T"
        )

  const date =
    new Date(normalized)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value
  }

  return date.toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  )
}


export default App