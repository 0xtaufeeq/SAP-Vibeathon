"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Clock, MapPin, User, Plus, Check, Calendar, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ChatWidget } from "@/components/chat-widget"

interface Session {
  id: string
  title: string
  description: string
  speaker: string
  speakerTitle: string
  time: string
  duration: string
  location: string
  track: string
  level: "Beginner" | "Intermediate" | "Advanced"
  tags: string[]
  isRecommended: boolean
  matchPercentage?: number
  isInAgenda: boolean
}

const mockSessions: Session[] = [
  {
    id: "1",
    title: "The Future of AI in Web Development",
    description:
      "Explore how artificial intelligence is revolutionizing the way we build and deploy web applications, from automated code generation to intelligent user experiences.",
    speaker: "Sarah Chen",
    speakerTitle: "Senior AI Engineer at Vercel",
    time: "9:00 AM",
    duration: "45 min",
    location: "Main Stage",
    track: "AI & ML",
    level: "Intermediate" as const,
    tags: ["AI", "Web Development", "Automation"],
    isRecommended: true,
    matchPercentage: 95,
    isInAgenda: true,
  },
  {
    id: "2",
    title: "Building Scalable React Applications",
    description:
      "Learn best practices for architecting large-scale React applications that can grow with your team and user base.",
    speaker: "Michael Rodriguez",
    speakerTitle: "Principal Engineer at Meta",
    time: "10:30 AM",
    duration: "60 min",
    location: "Room A",
    track: "Frontend",
    level: "Advanced" as const,
    tags: ["React", "Architecture", "Performance"],
    isRecommended: true,
    matchPercentage: 88,
    isInAgenda: false,
  },
  {
    id: "3",
    title: "Cybersecurity in the Age of AI",
    description:
      "Understanding new security challenges and opportunities that emerge as AI becomes more integrated into our digital infrastructure.",
    speaker: "Dr. Emily Watson",
    speakerTitle: "Security Researcher at Stanford",
    time: "2:00 PM",
    duration: "45 min",
    location: "Room B",
    track: "Security",
    level: "Intermediate" as const,
    tags: ["Security", "AI", "Infrastructure"],
    isRecommended: true,
    matchPercentage: 82,
    isInAgenda: false,
  },
  {
    id: "4",
    title: "Product Management in Tech Startups",
    description:
      "Navigate the unique challenges of product management in fast-paced startup environments and learn frameworks for success.",
    speaker: "Alex Thompson",
    speakerTitle: "VP of Product at Stripe",
    time: "3:30 PM",
    duration: "45 min",
    location: "Room C",
    track: "Product",
    level: "Beginner" as const,
    tags: ["Product Management", "Startups", "Strategy"],
    isRecommended: false,
    isInAgenda: false,
  },
  {
    id: "5",
    title: "Advanced Machine Learning Techniques",
    description: "Deep dive into cutting-edge ML algorithms and their practical applications in real-world scenarios.",
    speaker: "Dr. James Liu",
    speakerTitle: "ML Research Lead at OpenAI",
    time: "4:15 PM",
    duration: "60 min",
    location: "Main Stage",
    track: "AI & ML",
    level: "Advanced" as const,
    tags: ["Machine Learning", "Algorithms", "Research"],
    isRecommended: true,
    matchPercentage: 91,
    isInAgenda: true,
  },
]

export default function AgendaPage() {
  const [sessions, setSessions] = useState<Session[]>(mockSessions)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrack, setSelectedTrack] = useState<string>("all")

  const tracks = ["all", "AI & ML", "Frontend", "Security", "Product"]

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesTrack = selectedTrack === "all" || session.track === selectedTrack
    return matchesSearch && matchesTrack
  })

  const recommendedSessions = filteredSessions.filter((s) => s.isRecommended)
  const myAgendaSessions = filteredSessions.filter((s) => s.isInAgenda)
  const allSessions = filteredSessions

  const toggleSessionInAgenda = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, isInAgenda: !session.isInAgenda } : session)),
    )
  }

  const SessionCard = ({ session }: { session: Session }) => (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {session.isRecommended && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {session.matchPercentage}% match
                </Badge>
              )}
              <Badge variant="outline">{session.level}</Badge>
            </div>
            <CardTitle className="text-lg leading-tight">{session.title}</CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.time} ({session.duration})
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {session.location}
                </span>
              </div>
            </CardDescription>
          </div>
          <Button
            variant={session.isInAgenda ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSessionInAgenda(session.id)}
          >
            {session.isInAgenda ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{session.speaker}</span>
          <span className="text-sm text-muted-foreground">• {session.speakerTitle}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{session.description}</p>
        <div className="flex flex-wrap gap-1">
          {session.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Event Agenda</h1>
          <p className="text-muted-foreground">
            Discover sessions tailored to your interests and build your perfect event schedule.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions, speakers, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              {tracks.map((track) => (
                <option key={track} value={track}>
                  {track === "all" ? "All Tracks" : track}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recommended" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommended" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Recommended for You ({recommendedSessions.length})
            </TabsTrigger>
            <TabsTrigger value="agenda" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              My Agenda ({myAgendaSessions.length})
            </TabsTrigger>
            <TabsTrigger value="all">All Sessions ({allSessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="space-y-4">
            {recommendedSessions.length > 0 ? (
              <div className="grid gap-4">
                {recommendedSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recommendations found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria to see more sessions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="agenda" className="space-y-4">
            {myAgendaSessions.length > 0 ? (
              <div className="grid gap-4">
                {myAgendaSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your agenda is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your personalized schedule by adding sessions from our recommendations.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {allSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <ChatWidget />
    </div>
  )
}
