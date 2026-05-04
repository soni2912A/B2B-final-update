import React, { useState, useRef, useEffect, useCallback } from 'react'

/* ─────────────────────────────────────────────
   API helper – works with or without auth token
   ───────────────────────────────────────────── */
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  '/api/v1'

async function callBot(messages) {
  let token = null
  try { token = localStorage.getItem('auth_token') } catch {}
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token

  const res = await fetch(API_BASE + '/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Chatbot error')
  return data.data?.reply || 'Sorry, no response.'
}

function md(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}

function Dots() {
  return (
    <div style={{
      alignSelf: 'flex-start', display: 'flex', gap: 5, alignItems: 'center',
      background: 'rgba(255,255,255,.09)', padding: '11px 16px',
      borderRadius: '16px 16px 16px 4px',
    }}>
      {[0, .18, .36].map((d, i) => (
        <span key={i} style={{
          display: 'block', width: 7, height: 7, borderRadius: '50%',
          background: '#c4bbee',
          animation: 'cbPulse 1.2s ease-in-out infinite',
          animationDelay: d + 's',
        }} />
      ))}
    </div>
  )
}

const WELCOME = {
  role: 'assistant',
  content: "👋 Hi! I'm **BakeryBot**, your platform assistant.\n\nAsk me anything — orders, deliveries, invoices, corporate accounts, announcements, settings, or how any feature works!",
}

export default function ChatbotWidget() {
  const [open, setOpen]       = useState(false)
  const [msgs, setMsgs]       = useState([WELCOME])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [hasNew, setHasNew]   = useState(true)
  const [isMobile, setMobile] = useState(false)

  const endRef = useRef(null)
  const taRef  = useRef(null)

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  useEffect(() => {
    if (open) setTimeout(() => taRef.current?.focus(), 120)
  }, [open])

  function toggle() {
    setOpen(o => !o)
    setHasNew(false)
  }

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const newMsgs = [...msgs, userMsg]
    setMsgs(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const apiMsgs = newMsgs
        .filter((m, i) => !(i === 0 && m === WELCOME))
        .map(m => ({ role: m.role, content: m.content }))
        .slice(-10)
      const reply = await callBot(apiMsgs)
      setMsgs(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMsgs(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'Something went wrong. Try again.'}`,
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, msgs])

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const BUBBLE_SIZE  = 56
  const BUBBLE_RIGHT = 20
  const BUBBLE_BOT   = 20

  const panelW = isMobile ? 'calc(100vw - 24px)' : '370px'
  const panelH = isMobile ? 'calc(100vh - 100px)' : '520px'
  const panelR = isMobile ? '12px' : BUBBLE_RIGHT + 'px'
  const panelB = isMobile ? '80px' : (BUBBLE_BOT + BUBBLE_SIZE + 10) + 'px'

  return (
    <>
      <style>{`
        @keyframes cbPulse {
          0%,80%,100% { transform:translateY(0); opacity:.5 }
          40%          { transform:translateY(-5px); opacity:1 }
        }
        @keyframes cbSlide {
          from { opacity:0; transform:translateY(14px) scale(.95) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        .cb-panel { animation: cbSlide .22s cubic-bezier(.2,.8,.2,1) both }
        .cb-scroll::-webkit-scrollbar { width:4px }
        .cb-scroll::-webkit-scrollbar-track { background:transparent }
        .cb-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.18); border-radius:99px }
        .cb-ta { font-family:inherit }
        .cb-ta::placeholder { color:#9e96c0; opacity:1 }
        .cb-ta:focus { outline:none; border-color:#a56bff !important }
        .cb-bubble-btn { transition:transform .18s,box-shadow .18s }
        .cb-bubble-btn:hover { transform:scale(1.1) !important; box-shadow:0 8px 32px rgba(165,107,255,.5) !important }
        .cb-bubble-btn:active { transform:scale(.95) !important }
        .cb-send:hover:not(:disabled) { filter:brightness(1.18) }
        .cb-close-btn:hover { background:rgba(255,255,255,.1) !important }
      `}</style>

      {/* ── Chat Panel ── */}
      {open && (
        <div
          className="cb-panel"
          style={{
            position: 'fixed',
            right: panelR,
            bottom: panelB,
            width: panelW,
            height: panelH,
            zIndex: 99999,
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(160deg,#1c1535 0%,#150f2a 100%)',
            border: '1px solid rgba(165,107,255,.28)',
            boxShadow: '0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 14px',
            background: 'linear-gradient(135deg,rgba(255,138,92,.18),rgba(165,107,255,.22))',
            borderBottom: '1px solid rgba(165,107,255,.2)',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#ff8a5c,#a56bff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, boxShadow: '0 4px 14px rgba(165,107,255,.42)',
            }}>🤖</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0ecff', lineHeight: 1.2 }}>BakeryBot</div>
              <div style={{ fontSize: 11, color: '#9e96c0', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', flexShrink: 0 }} />
                Platform Assistant · Online
              </div>
            </div>

            <button
              className="cb-close-btn"
              onClick={() => setOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9e96c0', fontSize: 22, width: 32, height: 32,
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, transition: 'background .15s',
              }}
            >×</button>
          </div>

          {/* Messages */}
          <div className="cb-scroll" style={{
            flex: 1, overflowY: 'auto', padding: '14px 12px 8px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  maxWidth: '85%',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg,#ff8a5c,#ff5ea8)'
                    : 'rgba(255,255,255,.08)',
                  color: '#ede9ff',
                  padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: 13, lineHeight: 1.6,
                  boxShadow: '0 2px 10px rgba(0,0,0,.2)',
                  wordBreak: 'break-word',
                  border: m.role === 'assistant' ? '1px solid rgba(165,107,255,.13)' : 'none',
                }}
                dangerouslySetInnerHTML={{ __html: md(m.content) }}
              />
            ))}
            {loading && <Dots />}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px 12px',
            borderTop: '1px solid rgba(165,107,255,.15)',
            display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
            background: 'rgba(0,0,0,.18)',
          }}>
            <textarea
              ref={taRef}
              className="cb-ta"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything about this platform…"
              rows={1}
              style={{
                flex: 1, resize: 'none', padding: '9px 12px',
                borderRadius: 12,
                border: '1px solid rgba(165,107,255,.28)',
                background: 'rgba(255,255,255,.06)',
                color: '#ede9ff', fontSize: 13, lineHeight: 1.45,
                maxHeight: 100, overflowY: 'auto',
                transition: 'border-color .2s',
              }}
            />
            <button
              className="cb-send"
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: (!input.trim() || loading)
                  ? 'rgba(255,255,255,.1)'
                  : 'linear-gradient(135deg,#ff8a5c,#a56bff)',
                color: '#fff',
                cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, opacity: (!input.trim() || loading) ? 0.45 : 1,
                transition: 'background .2s, opacity .2s',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Bubble ── */}
      <button
        className="cb-bubble-btn"
        onClick={toggle}
        title={open ? 'Close chat' : 'Chat with BakeryBot'}
        style={{
          position: 'fixed',
          right: BUBBLE_RIGHT,
          bottom: BUBBLE_BOT,
          zIndex: 100000,
          width: BUBBLE_SIZE,
          height: BUBBLE_SIZE,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: open
            ? 'linear-gradient(135deg,#a56bff,#ff5ea8)'
            : 'linear-gradient(135deg,#ff8a5c,#a56bff)',
          boxShadow: '0 6px 24px rgba(165,107,255,.48)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{
          fontSize: 24,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform .2s',
          transform: open ? 'scale(.88) rotate(90deg)' : 'scale(1) rotate(0)',
        }}>
          {open ? '✕' : '💬'}
        </span>

        {/* Unread dot */}
        {!open && hasNew && (
          <span style={{
            position: 'absolute',
            top: 3, right: 3,
            width: 14, height: 14,
            borderRadius: '50%',
            background: '#ff3d9a',
            border: '2px solid #0e0921',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 800, color: '#fff',
            pointerEvents: 'none',
          }}>1</span>
        )}
      </button>
    </>
  )
}