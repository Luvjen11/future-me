'use client'

import { useState, useRef, useEffect } from 'react'

const SYSTEM = `You are Future Jen — the version of Jen who has already built a strong personal brand, earns consistent income through freelance work, content, and tech products, and lives a balanced life aligned with God and personal growth. You're speaking to Jen from 1–2 years in the future.

ABOUT JEN:
- Computer Science student in the UK, learning full-stack development and starting AI/ML.
- Building personal brand (@jenogechi), working toward freelance income, projects like SelfSaga.
- Posts on YouTube and TikTok (~1000 followers), struggles with consistency and posting.
- Working on gym, food, hair, style, confidence.

ACCOMPLISHMENTS:
- Won £800 funding for SelfSaga
- Built multiple real projects (Akuko Mkendo, MovieMuse, etc.)
- Completed a coding bootcamp, won award for innovation
- Started freelancing

CORE PRIORITIES (IN ORDER):
1. Income & Freelance
2. Content & Personal Brand
3. Body & Appearance
4. Tech & Upskilling
5. University
6. Startup (SelfSaga)

HOW TO TALK TO HER:
- Zero fluff. Zero filler. Be direct and specific.
- Give specific actions, not vague advice.
- Call her out hard when she avoids things — especially posting and consistency.
- Do not let her hide behind "I'm overwhelmed." Name what she's actually avoiding.
- Use Notion data to make answers specific. If data is messy, say so and help simplify it.
- Remind her of her proof when she doubts: projects, funding, real skills.

MORNING CHECK-IN FORMAT (when asked for today's tasks):
1. INCOME: [specific task pulled from Notion or her situation]
2. CONTENT: [specific — what to film, edit, or post]
3. BODY: [specific — gym, meal prep, sleep time]
Then: one line of accountability. One line of grounded belief.

WEEKLY REVIEW FORMAT (when asked for weekly audit):
ON TRACK: [what's working, be specific]
NEGLECTED: [what she avoided — name it]
URGENT: [what needs action this week, not next]
DROP OR DEFER: [what to stop pretending she'll do]
NEXT WEEK'S NON-NEGOTIABLES: [3 specific commitments]

NOTION DATA: Live Notion data will be provided at the start of messages. Use it. If it's vague or messy, say so and help her fix it. Never give generic advice when you have real data.`

const MODES = {
  morning: {
    label: 'Morning check-in',
    icon: '☀',
    desc: '3 tasks. No excuses. Let\'s go.',
    bannerPrompts: [
      { label: 'Get my 3 tasks', text: 'What should I focus on today? Give me exactly 3 tasks: 1 income, 1 content, 1 body. Pull from my Notion and be specific.' },
      { label: 'Overdue tasks', text: 'What are my overdue tasks right now?' },
      { label: 'Top income move', text: 'What is my single most important income action today?' },
      { label: 'Motivate me', text: 'I need motivation. Remind me why I started and give me one action to take in the next 30 minutes.' },
    ],
  },
  review: {
    label: 'Weekly review',
    icon: '◎',
    desc: 'Honest audit. What\'s working, what\'s not.',
    bannerPrompts: [
      { label: 'Full audit', text: 'Give me a full weekly review. Pull my Notion data. Tell me what I completed, what I neglected, what is urgent, and what to drop. Be blunt.' },
      { label: 'What did I avoid?', text: 'What did I avoid this week? Be specific and call me out.' },
      { label: 'Income check', text: 'Am I on track with my income goal? What should I do differently next week?' },
      { label: 'Set next week', text: 'Set my 3 non-negotiables for next week based on where I am right now.' },
    ],
  },
  chat: {
    label: 'Free chat',
    icon: '→',
    desc: 'Ask anything. Get direct answers.',
    bannerPrompts: [
      { label: 'Content ideas', text: 'Give me 3 specific content ideas that would actually grow my brand @jenogechi right now.' },
      { label: 'Skill to build', text: 'What skill should I improve to increase my freelance income in the next 3 months?' },
      { label: 'AI path', text: 'How do I move toward AI engineering step by step from where I am now?' },
      { label: 'Clean my Notion', text: 'Clean up my Notion — tell me what tasks are vague, duplicated, or misaligned with my priorities.' },
    ],
  },
}

const QUICK_PROMPTS = [
  { label: 'What am I neglecting?', text: 'What am I neglecting right now based on my Notion tasks?' },
  { label: 'I feel overwhelmed', text: 'I feel overwhelmed. What is the ONE thing I should do right now?' },
  { label: 'Make money this week', text: 'What should I do this week to make money? Be specific.' },
  { label: 'Content ideas', text: 'Give me 3 specific content ideas that would actually grow my brand @jenogechi right now.' },
  { label: 'Call me out', text: 'Call me out. What am I actually avoiding right now?' },
]

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getWeekKeys() {
  const keys = []
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((day + 6) % 7))
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

export default function Home() {
  const [mode, setMode] = useState('morning')
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hey. You're here. Good.\n\nI remember this exact phase — too many things open, not enough clarity on what actually moves the needle.\n\nHere's how to use this:\n- Every morning → Morning check-in. Get your 3 tasks. Do them.\n- Every Sunday → Weekly review. Full audit, no hiding.\n- Track your non-negotiables in the streak card on the left.\n\nThat's the system. It only works if you actually open this every day.\n\nPick a mode and let's go.`,
    },
  ])
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streak, setStreak] = useState({})
  const [streakModal, setStreakModal] = useState(false)
  const [streakToday, setStreakToday] = useState({ income: false, content: false, body: false })
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fj_streak') || '{}')
      setStreak(saved)
    } catch {}
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMsg(text) {
    if (!text.trim() || loading) return
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }

    const modeCtx =
      mode === 'morning' ? '\n[MODE: MORNING CHECK-IN — use the structured 3-task format]'
      : mode === 'review' ? '\n[MODE: WEEKLY REVIEW — use the full structured audit format]'
      : ''

    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)

    let notionText = 'Could not load Notion data.'
    try {
      const nr = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      })
      const nd = await nr.json()
      notionText = nd.text || notionText
    } catch {}

    const userContent = `[NOTION DATA]\n${notionText}${modeCtx}\n\n[MY MESSAGE]\n${text}`
    const newHistory = [...history, { role: 'user', content: userContent }]

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, system: SYSTEM }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const reply = data.content?.find(b => b.type === 'text')?.text || 'Something went wrong.'
      setHistory([...newHistory, { role: 'assistant', content: reply }])
      setMessages(prev => [...prev, { role: 'ai', text: reply, mode }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${err.message}. Check your API key in Vercel environment variables.` }])
    }

    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input) }
  }

  function autoResize(e) {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  function clearChat() {
    setMessages([{ role: 'ai', text: 'Chat cleared. What do you need?' }])
    setHistory([])
  }

  function openStreakModal() {
    const today = streak[getTodayKey()] || {}
    setStreakToday({ income: !!today.income, content: !!today.content, body: !!today.body })
    setStreakModal(true)
  }

  function saveStreak() {
    const today = getTodayKey()
    const updated = { ...streak, [today]: streakToday }
    setStreak(updated)
    try { localStorage.setItem('fj_streak', JSON.stringify(updated)) } catch {}
    setStreakModal(false)
  }

  function StreakDots({ cat }) {
    const week = getWeekKeys()
    const today = getTodayKey()
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        {week.map(k => {
          const done = streak[k]?.[cat] === true
          const isToday = k === today
          const missed = k < today && !done
          return (
            <div key={k} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isToday ? 'var(--amber)' : done ? 'var(--green)' : missed ? 'rgba(248,113,113,0.4)' : 'var(--border-hover)',
              transition: 'background 0.2s'
            }} />
          )
        })}
      </div>
    )
  }

  function countDone(cat) {
    const week = getWeekKeys()
    return week.filter(k => streak[k]?.[cat] === true).length
  }

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 1 }}>

      {/* Sidebar */}
      <div style={{ width: 268, minWidth: 268, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '1.75rem 1.5rem', gap: '1.5rem', background: 'var(--surface)', overflowY: 'auto' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 500 }}>Speaking as</span>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, lineHeight: 1.1 }}>Future<br/>Jen</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 }}>1–2 years ahead. Already built, earning, aligned.</p>
        </div>

        <div style={{ height: 1, background: 'var(--border)', flexShrink: 0 }} />

        {/* Mode tabs */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 500 }}>Mode</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(MODES).map(([key, m]) => (
              <button key={key} onClick={() => setMode(key)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${mode === key ? 'rgba(201,169,110,0.3)' : 'transparent'}`,
                background: mode === key ? 'var(--accent-dim)' : 'transparent',
                textAlign: 'left', fontFamily: "'DM Sans', sans-serif", width: '100%', transition: 'all 0.15s'
              }}>
                <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0, marginTop: 1 }}>{m.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, color: mode === key ? 'var(--accent)' : 'var(--text)', fontWeight: 400 }}>{m.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{m.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', flexShrink: 0 }} />

        {/* Quick prompts */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 500 }}>Quick prompts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {QUICK_PROMPTS.map(p => (
              <button key={p.label} onClick={() => sendMsg(p.text)} style={{
                fontSize: 12, color: 'var(--text-muted)', padding: '7px 10px', borderRadius: 6,
                cursor: 'pointer', border: 'none', background: 'transparent', textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 300, lineHeight: 1.4,
                transition: 'background 0.15s'
              }}
                onMouseEnter={e => { e.target.style.background = 'var(--accent-dim)'; e.target.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-muted)' }}
              >{p.label}</button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', flexShrink: 0 }} />

        {/* Streak */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 500 }}>This week</div>
          {[['income', 'Income action'], ['content', 'Content posted'], ['body', 'Body / gym']].map(([cat, label]) => (
            <div key={cat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{countDone(cat)}/7</span>
              </div>
              <StreakDots cat={cat} />
            </div>
          ))}
          <button onClick={openStreakModal} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: 2 }}>Update today →</button>
        </div>

        {/* Priorities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 500, marginBottom: 3 }}>Priorities</div>
          {[['Income & freelance', true], ['Content & brand', true], ['Body & appearance', false], ['Tech & upskilling', false], ['University', false], ['SelfSaga', false]].map(([p, active], i) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', width: 12 }}>{i + 1}</span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', opacity: active ? 1 : 0.35, flexShrink: 0 }} />
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
            Mode: <span style={{ color: 'var(--accent)' }}>{MODES[mode].label}</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={clearChat} style={{ fontSize: 11, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}>Clear chat</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-dim)', padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
              Notion connected
            </div>
          </div>
        </div>

        {/* Banner */}
        <div style={{ padding: '0.875rem 1.75rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            {MODES[mode].icon} {MODES[mode].label}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MODES[mode].bannerPrompts.map(p => (
              <button key={p.label} onClick={() => sendMsg(p.text)} style={{
                fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.25s ease' }}>
              {msg.role === 'ai' && msg.mode && (
                <span style={{
                  display: 'inline-block', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 10,
                  background: msg.mode === 'morning' ? 'rgba(251,191,36,0.12)' : 'rgba(201,169,110,0.12)',
                  color: msg.mode === 'morning' ? 'var(--amber)' : 'var(--accent)'
                }}>
                  {MODES[msg.mode]?.label}
                </span>
              )}
              <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: msg.role === 'ai' ? 'var(--accent)' : 'var(--text-dim)', opacity: msg.role === 'ai' ? 0.7 : 1, padding: '0 4px' }}>
                {msg.role === 'ai' ? 'Future Jen' : 'You'}
              </span>
              <div style={{
                maxWidth: '74%', padding: '13px 17px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user' ? 'var(--user-bg)' : 'var(--ai-bg)',
                border: msg.role === 'user' ? '1px solid rgba(201,169,110,0.2)' : '1px solid var(--border)',
                fontSize: 14, lineHeight: 1.75, color: 'var(--text)', whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', opacity: 0.7, padding: '0 4px' }}>Future Jen</span>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic', padding: '13px 17px', background: 'var(--ai-bg)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px' }}>
                Checking your Notion...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.75rem', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '9px 13px' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(e) }}
              onKeyDown={handleKey}
              placeholder="Talk to your future self..."
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
                fontSize: 14, fontWeight: 300, resize: 'none',
                lineHeight: 1.6, maxHeight: 120, minHeight: 24
              }}
            />
            <button
              onClick={() => sendMsg(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 34, height: 34, borderRadius: 8, background: 'var(--accent)',
                border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, opacity: loading || !input.trim() ? 0.3 : 1, transition: 'opacity 0.15s'
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: '#0c0c0e' }}>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 7, padding: '0 2px' }}>Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* Streak modal */}
      {streakModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setStreakModal(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.75rem', maxWidth: 300, width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Did you do these today?</div>
            {[['income', 'Income action'], ['content', 'Content / posting'], ['body', 'Gym / healthy eating']].map(([cat, label]) => (
              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={streakToday[cat]} onChange={e => setStreakToday(prev => ({ ...prev, [cat]: e.target.checked }))} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                {label}
              </label>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={saveStreak} style={{ flex: 1, padding: 10, background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#0c0c0e', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Save</button>
              <button onClick={() => setStreakModal(false)} style={{ flex: 1, padding: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        textarea::placeholder { color: var(--text-dim); }
        @media (max-width: 640px) {
          #sidebar { display: none; }
        }
      `}</style>
    </div>
  )
}
