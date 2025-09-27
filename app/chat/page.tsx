"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2, MessageSquare, Sparkles, Clock, MapPin, Users, Calendar, HelpCircle } from "lucide-react"
import { Navigation } from "@/components/navigation"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  suggestions?: string[]
}

const quickActions = [
  { icon: Calendar, label: "Show my agenda", query: "What's on my agenda today?" },
  { icon: MapPin, label: "Find a session", query: "Help me find sessions about AI" },
  { icon: Users, label: "Networking tips", query: "How can I network effectively at this event?" },
  { icon: Clock, label: "Event schedule", query: "What time does the event start and end?" },
]

const mockResponses = {
  "what's on my agenda today?": {
    content:
      "Here's your agenda for today:\n\n• 9:00 AM - The Future of AI in Web Development (Main Stage)\n• 2:00 PM - Advanced Machine Learning Techniques (Main Stage)\n\nYou have 2 sessions scheduled. Would you like me to help you find more sessions that match your interests?",
    suggestions: ["Find more AI sessions", "Show networking opportunities", "Set reminders for my sessions"],
  },
  "help me find sessions about ai": {
    content:
      "I found several AI-related sessions that match your interests:\n\n• The Future of AI in Web Development (95% match)\n• Advanced Machine Learning Techniques (91% match)\n• Cybersecurity in the Age of AI (82% match)\n\nWould you like me to add any of these to your agenda?",
    suggestions: ["Add all to agenda", "Show session details", "Find AI networking events"],
  },
  "how can i network effectively at this event?": {
    content:
      "Here are some networking tips for this event:\n\n1. Use our Smart Networking feature to find people with similar interests\n2. Attend the networking breaks between sessions\n3. Join topic-specific discussion groups\n4. Don't forget to exchange contact information\n\nI can help you find networking opportunities based on your interests. Would you like me to show you potential connections?",
    suggestions: ["Show networking matches", "Find networking events", "Tips for introverts"],
  },
  "what time does the event start and end?": {
    content:
      "Today's event schedule:\n\n• Registration: 8:00 AM - 8:45 AM\n• Opening Keynote: 9:00 AM\n• Sessions: 9:00 AM - 5:00 PM\n• Networking Reception: 5:00 PM - 7:00 PM\n\nThe venue is located at the Convention Center, Hall A. Need directions or transportation info?",
    suggestions: ["Get directions", "Show parking info", "Set arrival reminder"],
  },
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your AI event concierge. I can help you navigate the event, find sessions, connect with other attendees, and answer any questions you have. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
      suggestions: ["Show my agenda", "Find networking opportunities", "Event information", "Help with sessions"],
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(() => {
      const response = mockResponses[content.toLowerCase() as keyof typeof mockResponses] || {
        content:
          "I understand you're asking about that. Let me help you with some relevant information. You can use the quick actions below or ask me anything specific about the event, sessions, or networking opportunities.",
        suggestions: ["Show my agenda", "Find sessions", "Networking help", "Event info"],
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        isUser: false,
        timestamp: new Date(),
        suggestions: response.suggestions,
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickAction = (query: string) => {
    sendMessage(query)
  }

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">AI Concierge</h1>
          </div>
          <p className="text-muted-foreground">
            Your intelligent event assistant is here to help with anything you need.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:border-primary/50 bg-transparent"
              onClick={() => handleQuickAction(action.query)}
            >
              <action.icon className="h-5 w-5 text-primary" />
              <span className="text-sm text-center">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Chat Container */}
        <Card className="h-[600px] flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${message.isUser ? "order-2" : "order-1"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.isUser ? "bg-primary text-primary-foreground ml-4" : "bg-muted text-foreground mr-4"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                    <div
                      className={`flex items-center gap-2 mt-1 px-2 ${message.isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!message.isUser && (
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3 mr-4">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 bg-transparent"
                            onClick={() => handleSuggestion(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="bg-muted text-foreground rounded-2xl px-4 py-3 mr-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything about the event..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage(inputValue)}
                  className="flex-1"
                />
                <Button onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <HelpCircle className="h-3 w-3" />
                <span>Try asking about sessions, networking, schedules, or event information</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
