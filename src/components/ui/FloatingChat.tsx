'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, Brain, Minimize2, Maximize2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { stripMarkdown } from '@/lib/utils/stripMarkdown'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

// Pages where the floating chat should NOT appear
const HIDDEN_ON_PATHS = ['/intelligence', '/login', '/register']

export function FloatingChat() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      content: "Hello! I'm GATI AI. Ask me anything about Aadhaar coverage, risk patterns, or governance insights.",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ALL hooks must be declared before any conditional return
  useEffect(() => {
    if (!open || minimized) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, minimized])

  useEffect(() => {
    if (!open || minimized) return
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [open, minimized])

  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isTyping) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    const query = input.trim()
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, includeContext: true })
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.success ? stripMarkdown(data.response) : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Connection error. Please check your network and try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }, [input, isTyping])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Conditional render AFTER all hooks
  const isHidden = HIDDEN_ON_PATHS.some(p => pathname?.startsWith(p))
  if (isHidden) return null

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-[#0A2463] to-[#1E5AA8] text-white pl-4 pr-5 py-3 rounded-full shadow-2xl hover:shadow-[0_8px_30px_rgba(10,36,99,0.4)] transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="relative">
              <Brain className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-semibold tracking-wide">GATI AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(10,36,99,0.25), 0 0 0 1px rgba(255,255,255,0.05)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0A2463] to-[#1E5AA8] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">GATI AI Assistant</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-white/60 text-[10px]">Powered by Gemini · Live data</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimized(!minimized)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                >
                  {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <AnimatePresence>
              {!minimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {/* Messages */}
                  <div className="h-72 overflow-y-auto bg-[#F8FAFC] p-3 space-y-3 custom-scrollbar">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0A2463] to-[#1E5AA8] flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                            <Brain className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#0A2463] text-white rounded-br-sm'
                            : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0A2463] to-[#1E5AA8] flex items-center justify-center mr-2 flex-shrink-0">
                          <Brain className="w-3 h-3 text-white" />
                        </div>
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                          <div className="flex gap-1 items-center">
                            {[0, 0.15, 0.3].map((delay, i) => (
                              <motion.span
                                key={i}
                                className="w-1.5 h-1.5 bg-[#1E5AA8] rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick prompts — only on first open */}
                  {messages.length === 1 && (
                    <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto">
                      {['High risk states?', 'Coverage summary', 'Anomalies today?'].map(q => (
                        <button
                          key={q}
                          onClick={() => {
                            setInput(q)
                            setTimeout(() => sendMessage(), 50)
                          }}
                          className="flex-shrink-0 text-[10px] px-2.5 py-1 bg-[#0A2463]/5 hover:bg-[#0A2463]/10 text-[#0A2463] rounded-full border border-[#0A2463]/10 transition-colors font-medium"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input */}
                  <form onSubmit={sendMessage} className="bg-white border-t border-gray-100 p-3 flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about coverage, risks, trends..."
                      disabled={isTyping}
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/10 transition-all placeholder:text-gray-400 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      className="w-8 h-8 rounded-xl bg-[#0A2463] text-white flex items-center justify-center hover:bg-[#1E5AA8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
