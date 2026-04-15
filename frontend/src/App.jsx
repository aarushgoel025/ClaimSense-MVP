import { useState, useRef, useEffect, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import './index.css'

const API_BASE = 'claimsense-mvp-production.up.railway.app'

const LOADING_MESSAGES = [
  'Extracting rejection details...',
  'Checking IRDAI guidelines...',
  'Scanning Ombudsman precedents...',
  'Building your appeal strategy...',
  'Drafting appeal letter...',
]

// ─── ICONS (inline SVGs) ─────────────────────────────────────────────────────
const Icons = {
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" />
    </svg>
  ),
  AI: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
    </svg>
  ),
  Letter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
    </svg>
  ),
  PDF: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Copy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  File: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Back: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
}

// ─── SCORE RING ───────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius = 70
  const stroke = 10
  const norm = radius - stroke / 2
  const circumference = 2 * Math.PI * norm
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const offset = circumference - (animated / 100) * circumference

  let color = '#DC2626'
  let label = 'Weak Grounds — Reconsider Before Appealing'
  if (score >= 71) { color = '#16A34A'; label = 'Strong Grounds — Recommended to Appeal' }
  else if (score >= 41) { color = '#D97706'; label = 'Moderate Grounds — Appeal with Additional Evidence' }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Track */}
          <circle
            cx="80" cy="80" r={norm}
            fill="none" stroke="#E2E8F0" strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx="80" cy="80" r={norm}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="ring-gauge transition-all duration-1000 ease-out"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-400 font-medium">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Appeal Strength</p>
        <p className="text-base font-semibold" style={{ color }}>{label}</p>
      </div>
    </div>
  )
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
            <span className="text-white text-xs font-bold">CS</span>
          </div>
          <span className="text-navy font-bold text-lg tracking-tight">ClaimSense</span>
        </div>
        <span className="text-sm text-gray-400 hidden sm:block">Powered by Gemini 2.5 Flash</span>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="fade-in max-w-3xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-electric text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-electric animate-pulse"></span>
            AI-Powered Claim Analysis
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-navy leading-tight mb-6">
            Fight your claim rejection<br />
            <span className="text-blue-electric">with the law on your side.</span>
          </h1>

          <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Upload your health insurance rejection letter. Our AI analyzes it against IRDAI guidelines
            and Ombudsman rulings — then drafts your appeal letter instantly.
          </p>

          <button
            id="cta-analyze"
            onClick={onStart}
            className="btn-primary text-base px-8 py-4 inline-flex items-center gap-3 text-lg"
          >
            Analyze My Claim
            <Icons.ArrowRight />
          </button>
        </div>

        {/* Value Props */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full slide-up">
          {[
            {
              icon: <Icons.Upload />,
              step: '01',
              title: 'Upload Your Letter',
              desc: 'Drag and drop your rejection letter PDF. Supports all major insurer formats.',
            },
            {
              icon: <Icons.AI />,
              step: '02',
              title: 'AI Analyzes It',
              desc: 'Our AI checks against 50+ IRDAI circulars and hundreds of Ombudsman rulings.',
            },
            {
              icon: <Icons.Letter />,
              step: '03',
              title: 'Get Appeal Letter',
              desc: 'Receive a ready-to-send, legally grounded appeal letter in seconds.',
            },
          ].map((item) => (
            <div key={item.step} className="card p-6 text-left hover:shadow-cardHover transition-shadow duration-300">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-electric flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-300 tracking-widest">{item.step}</span>
                  <h3 className="text-navy font-semibold text-base mt-0.5 mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400">
        Powered by Gemini 2.5 Flash · Built for Indian policyholders
      </footer>
    </div>
  )
}

// ─── UPLOAD PAGE ──────────────────────────────────────────────────────────────
function UploadPage({ onAnalyze, onBack }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') setFile(f)
    else alert('Please upload a valid PDF file.')
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-4xl mx-auto w-full">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-navy transition-colors text-sm font-medium">
          <Icons.Back /> Back to Home
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center">
            <span className="text-white text-xs font-bold">CS</span>
          </div>
          <span className="text-navy font-semibold">ClaimSense</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="card p-10 w-full max-w-xl fade-in">
          <h2 className="font-display text-2xl font-bold text-navy mb-2">Upload Rejection Letter</h2>
          <p className="text-gray-400 text-sm mb-8">Upload the PDF of your health insurance claim rejection letter.</p>

          {/* Drop Zone */}
          <div
            id="drop-zone"
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => inputRef.current.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-electric">
                  <Icons.File />
                </div>
                <p className="font-semibold text-navy text-base">{file.name}</p>
                <p className="text-sm text-gray-400">{formatSize(file.size)}</p>
                <span className="badge-chip mt-1">PDF Loaded ✓</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center text-gray-400">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border border-border">
                  <Icons.Upload />
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Drag & drop your PDF here</p>
                  <p className="text-sm mt-1">or <span className="text-blue-electric font-medium">browse files</span></p>
                </div>
                <p className="text-xs text-gray-300">Supports PDF files up to 20MB</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            id="btn-submit"
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            disabled={!file}
            onClick={() => onAnalyze(file)}
          >
            <Icons.AI />
            Analyze Claim
          </button>

          <p className="text-xs text-gray-300 text-center mt-4">
            Your document is processed securely and never stored.
          </p>
        </div>
      </main>
    </div>
  )
}

// ─── LOADING PAGE ─────────────────────────────────────────────────────────────
function LoadingPage() {
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center px-6">
      <div className="card p-12 flex flex-col items-center gap-8 max-w-sm w-full text-center">
        {/* Logo pulse */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-navy flex items-center justify-center animate-pulse">
            <span className="text-white text-2xl font-bold font-display">CS</span>
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-blue-electric opacity-30 animate-ping"></div>
        </div>

        {/* Spinner */}
        <div className="spinner"></div>

        {/* Rotating message */}
        <div className="min-h-[28px]">
          <p key={msgIdx} className="text-navy font-semibold text-base fade-in">
            {LOADING_MESSAGES[msgIdx]}
          </p>
        </div>

        <p className="text-gray-300 text-xs">This may take 20–40 seconds</p>
      </div>
    </div>
  )
}

// ─── RESULTS PAGE ──────────────────────────────────────────────────────────────
function ResultsPage({ data, onReset }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(data.appeal_letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 60
    const maxWidth = pageWidth - margin * 2
    let y = 60

    // Letterhead
    doc.setFillColor(27, 58, 107)
    doc.rect(0, 0, pageWidth, 80, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('ClaimSense', margin, 38)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('AI-Powered Insurance Claim Appeal', margin, 56)

    // Date
    y = 110
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.text(`Date: ${dateStr}`, margin, y)
    y += 24

    // Divider
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(1)
    doc.line(margin, y, pageWidth - margin, y)
    y += 20

    // Title
    doc.setTextColor(27, 58, 107)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('APPEAL LETTER', margin, y)
    y += 20
    doc.setDrawColor(45, 127, 249)
    doc.setLineWidth(2)
    doc.line(margin, y, margin + 80, y)
    y += 20

    // Letter body
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(10.5)
    doc.setFont('helvetica', 'normal')

    const lines = doc.splitTextToSize(data.appeal_letter, maxWidth)
    const lineHeight = 16

    lines.forEach((line) => {
      if (y + lineHeight > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage()
        y = 60
      }
      doc.text(line, margin, y)
      y += lineHeight
    })

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(180, 180, 180)
      doc.text(
        `ClaimSense Appeal Letter · Generated on ${dateStr} · Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'center' }
      )
    }

    doc.save('ClaimSense_Appeal_Letter.pdf')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
              <span className="text-white text-xs font-bold">CS</span>
            </div>
            <span className="text-navy font-semibold">ClaimSense</span>
          </div>
          <button onClick={onReset} className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
            <Icons.Back /> Analyze Another
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="fade-in">
          <p className="text-blue-electric text-sm font-semibold uppercase tracking-widest mb-2">Analysis Complete</p>
          <h2 className="font-display text-3xl font-bold text-navy">Your Claim Report</h2>
        </div>

        {/* A. Score Card */}
        <div className="card p-8 fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <ScoreRing score={data.success_score} />
            <div className="flex-1 sm:pt-2 text-center sm:text-left">
              <h3 className="text-navy font-bold text-xl mb-3">Appeals Success Score</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                This score is calculated based on IRDAI compliance violations, available Ombudsman precedents,
                document quality, rejection clarity, and procedural errors by the insurer.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-4 text-center">
                {[
                  { label: '0–40', desc: 'Weak', color: '#DC2626' },
                  { label: '41–70', desc: 'Moderate', color: '#D97706' },
                  { label: '71–100', desc: 'Strong', color: '#16A34A' },
                ].map((r) => (
                  <div key={r.label} className="rounded-xl bg-gray-50 border border-border p-3">
                    <p className="font-bold text-sm" style={{ color: r.color }}>{r.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* B. Rejection Analysis */}
        <div className="card p-8 fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-danger">
              <Icons.Alert />
            </div>
            <h3 className="text-navy font-bold text-lg">Rejection Analysis</h3>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-6">
            <p className="text-xs font-semibold text-danger uppercase tracking-wider mb-2">Detected Rejection Reason</p>
            <p className="text-gray-700 font-medium leading-relaxed">{data.rejection_reason}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Grounds for Appeal</p>
            <div className="flex flex-wrap gap-2">
              {data.grounds_for_appeal.map((ground, i) => (
                <div key={i} className="badge-chip text-sm py-2">
                  <span className="text-blue-electric font-bold mr-1">#{i + 1}</span>
                  {ground}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* C. Recommended Strategy */}
        <div className="card p-8 fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-electric">
              <Icons.AI />
            </div>
            <h3 className="text-navy font-bold text-lg">Recommended Strategy</h3>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <p className="text-gray-700 leading-relaxed">{data.recommended_strategy}</p>
          </div>
        </div>

        {/* D. Appeal Letter */}
        <div className="card p-8 fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-success">
                <Icons.Letter />
              </div>
              <h3 className="text-navy font-bold text-lg">Appeal Letter</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="btn-copy"
                onClick={handleCopy}
                className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
              >
                {copied ? <><Icons.Check /> Copied!</> : <><Icons.Copy /> Copy</>}
              </button>
              <button
                id="btn-download-pdf"
                onClick={handleDownloadPDF}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
              >
                <Icons.PDF /> Download PDF
              </button>
            </div>
          </div>

          <textarea
            id="appeal-letter-text"
            className="letter-box"
            readOnly
            value={data.appeal_letter}
          />

          <p className="text-xs text-gray-300 mt-3">
            Review the letter carefully. Fill in placeholders like [POLICYHOLDER NAME], [POLICY NUMBER], [DATE] before sending.
          </p>
        </div>
      </main>

      <footer className="text-center py-8 text-sm text-gray-300 border-t border-border mt-4">
        Powered by Gemini 2.5 Flash · Built for Indian policyholders · ClaimSense MVP
      </footer>
    </div>
  )
}

// ─── ERROR CARD ────────────────────────────────────────────────────────────────
function ErrorCard({ message, onReset }) {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-6">
      <div className="card p-10 max-w-md w-full text-center fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-danger mx-auto mb-5">
          <Icons.Alert />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy mb-3">Analysis Failed</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">{message}</p>
        <button onClick={onReset} className="btn-primary flex items-center gap-2 mx-auto">
          <Icons.Back /> Try Again
        </button>
      </div>
    </div>
  )
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  // 'landing' | 'upload' | 'loading' | 'results' | 'error'
  const [view, setView] = useState('landing')
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAnalyze = async (file) => {
    setView('loading')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || `Server error: ${res.status}`)
      }

      setResult(data)
      setView('results')
    } catch (err) {
      setErrorMsg(err.message || 'Could not reach the ClaimSense server. Please ensure the backend is running.')
      setView('error')
    }
  }

  const handleReset = () => {
    setView('landing')
    setResult(null)
    setErrorMsg('')
  }

  if (view === 'landing') return <LandingPage onStart={() => setView('upload')} />
  if (view === 'upload') return <UploadPage onAnalyze={handleAnalyze} onBack={() => setView('landing')} />
  if (view === 'loading') return <LoadingPage />
  if (view === 'results') return <ResultsPage data={result} onReset={handleReset} />
  if (view === 'error') return <ErrorCard message={errorMsg} onReset={handleReset} />

  return null
}
