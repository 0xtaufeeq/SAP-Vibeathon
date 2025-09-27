"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, Send, Sparkles } from "lucide-react"
import Link from "next/link"

interface ChatWidgetProps {
  className?: string
}

export function ChatWidget({ className = "" }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")

  const quickQuestions = ["What's on my agenda?", "Find AI sessions", "Networking tips", "Event schedule"]

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {isOpen ? (
        <Card className="w-80 h-96 flex flex-col shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-sm">AI Concierge</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4 pt-0">
            <div className="flex-1 mb-4">
              <div className="bg-muted rounded-lg p-3 mb-4">
                <p className="text-sm">Hi! I'm your AI event assistant. How can I help you today?</p>
              </div>
              <div className="space-y-2">
                {quickQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs h-8 bg-transparent"
                    onClick={() => setMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="text-sm"
                  size={1}
                />
                <Button size="sm">
                  <Send className="h-3 w-3" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href="/chat">Open full chat</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
