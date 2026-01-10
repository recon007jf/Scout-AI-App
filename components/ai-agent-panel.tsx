"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronRight, Send, Sparkles, Mic, StopCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AIAgentPanel() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [messages, setMessages] = useState<Array<{ role: "user" | "agent"; content: string }>>([
    {
      role: "agent",
      content:
        "Good morning. I'm Helix, your strategic co-pilot. I'm here to help you understand Scout's recommendations and answer any questions about your targets or strategy.",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage = { role: "user" as const, content: inputValue }
    setMessages((prev) => [...prev, userMessage])

    // Simulate agent response (will be replaced with real API call)
    setTimeout(() => {
      const agentMessage = {
        role: "agent" as const,
        content:
          "This is a placeholder response. When connected to the backend, I'll provide context-aware insights about your targets, explain Scout's reasoning, and help with drafting strategy.",
      }
      setMessages((prev) => [...prev, agentMessage])
    }, 500)

    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceToggle = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      // Placeholder for actual transcription
      const transcribedText = "[Voice transcription will appear here when backend is connected]"
      setInputValue(transcribedText)
    } else {
      // Start recording
      setIsRecording(true)
      // In production, this would initialize Web Audio API or similar
    }
  }

  return (
    <div
      className={cn(
        "h-full border-l border-border bg-gradient-to-b from-card/40 to-card/20 backdrop-blur-sm transition-all duration-300 flex flex-col relative",
        isCollapsed ? "w-12" : "w-96",
      )}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute left-0 top-6 -ml-3 w-6 h-12 bg-card border border-border rounded-l-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all z-10"
        title={isCollapsed ? "Expand AI Agent" : "Collapse AI Agent"}
      >
        <ChevronRight className={cn("w-4 h-4 transition-transform", !isCollapsed && "rotate-180")} />
      </button>

      {isCollapsed && (
        <div className="flex flex-col items-center justify-start pt-20 text-muted-foreground">
          {/* Replaced layered icon with sparkles icon to represent AI */}
          <Sparkles className="w-7 h-7" />
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Helix</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your strategic co-pilot</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-primary/10 text-foreground"
                      : "bg-muted/50 text-foreground border border-border",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            {isRecording && (
              <div className="mb-2 flex items-center gap-2 text-xs text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording...
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about targets, strategy, or Scout's reasoning..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                onClick={handleVoiceToggle}
                size="icon"
                className={cn(
                  "transition-colors",
                  isRecording
                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-500"
                    : "bg-primary/10 hover:bg-primary/20 text-primary",
                )}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={handleSend}
                size="icon"
                className="bg-primary/10 hover:bg-primary/20 text-primary"
                disabled={!inputValue.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
