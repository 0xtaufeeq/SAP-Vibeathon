"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Heart, X, User, MapPin, Briefcase, Search, Users, MessageSquare, Undo2, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ChatWidget } from "@/components/chat-widget"
import Link from "next/link"

interface Participant {
  id: string
  name: string
  title: string
  company: string
  location: string
  bio: string
  interests: string[]
  matchPercentage: number
  profileImage?: string
  isConnected?: boolean
  isIgnored?: boolean
}

const mockParticipants: Participant[] = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "Senior AI Engineer",
    company: "Vercel",
    location: "San Francisco, CA",
    bio: "Passionate about building AI-powered developer tools and creating seamless user experiences. Love discussing the intersection of AI and web development.",
    interests: ["Artificial Intelligence", "Web Development", "Machine Learning", "Developer Tools", "React"],
    matchPercentage: 95,
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    title: "Principal Engineer",
    company: "Meta",
    location: "Menlo Park, CA",
    bio: "Building scalable systems that serve billions of users. Interested in distributed systems, performance optimization, and engineering leadership.",
    interests: ["React", "Architecture", "Performance", "Leadership", "Distributed Systems"],
    matchPercentage: 88,
  },
  {
    id: "3",
    name: "Dr. Emily Watson",
    title: "Security Researcher",
    company: "Stanford University",
    location: "Palo Alto, CA",
    bio: "Researching cybersecurity challenges in AI systems. Published author on security best practices and threat modeling.",
    interests: ["Cybersecurity", "AI Safety", "Research", "Threat Modeling", "Privacy"],
    matchPercentage: 82,
  },
  {
    id: "4",
    name: "Alex Thompson",
    title: "VP of Product",
    company: "Stripe",
    location: "San Francisco, CA",
    bio: "Product leader with 10+ years building fintech products. Passionate about user experience and data-driven decision making.",
    interests: ["Product Management", "Fintech", "User Experience", "Data Analytics", "Strategy"],
    matchPercentage: 76,
  },
  {
    id: "5",
    name: "Dr. James Liu",
    title: "ML Research Lead",
    company: "OpenAI",
    location: "San Francisco, CA",
    bio: "Leading research in large language models and their applications. Excited about the future of AI and its impact on society.",
    interests: ["Machine Learning", "Research", "Large Language Models", "AI Ethics", "Deep Learning"],
    matchPercentage: 91,
  },
]

export default function NetworkingPage() {
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [connections, setConnections] = useState<Participant[]>([])
  const [ignored, setIgnored] = useState<Participant[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const currentParticipant = participants[currentIndex]

  const handleConnect = () => {
    if (currentParticipant) {
      setConnections((prev) => [...prev, { ...currentParticipant, isConnected: true }])
      nextParticipant()
    }
  }

  const handleIgnore = () => {
    if (currentParticipant) {
      setIgnored((prev) => [...prev, { ...currentParticipant, isIgnored: true }])
      nextParticipant()
    }
  }

  const nextParticipant = () => {
    setCurrentIndex((prev) => prev + 1)
  }

  const undoLastAction = () => {
    if (connections.length > 0) {
      setConnections((prev) => prev.slice(0, -1))
      setCurrentIndex((prev) => Math.max(0, prev - 1))
    } else if (ignored.length > 0) {
      setIgnored((prev) => prev.slice(0, -1))
      setCurrentIndex((prev) => Math.max(0, prev - 1))
    }
  }

  const removeConnection = (participantId: string) => {
    setConnections((prev) => prev.filter((p) => p.id !== participantId))
  }

  const filteredConnections = connections.filter(
    (participant) =>
      participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.interests.some((interest) => interest.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const ParticipantCard = ({ participant }: { participant: Participant }) => (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <User className="h-12 w-12 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            {participant.matchPercentage}% match
          </Badge>
        </div>
        <CardTitle className="text-xl">{participant.name}</CardTitle>
        <CardDescription>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Briefcase className="h-3 w-3" />
            <span>{participant.title}</span>
          </div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="font-medium">{participant.company}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{participant.location}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">About</h4>
          <p className="text-sm text-muted-foreground">{participant.bio}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Interests</h4>
          <div className="flex flex-wrap gap-1">
            {participant.interests.map((interest) => (
              <Badge key={interest} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
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
          <h1 className="text-3xl font-bold mb-2">Smart Networking</h1>
          <p className="text-muted-foreground">Discover and connect with like-minded professionals at the event.</p>
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Discover ({participants.length - currentIndex} remaining)
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              My Connections ({connections.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {currentIndex < participants.length ? (
              <div className="max-w-md mx-auto space-y-6">
                <ParticipantCard participant={currentParticipant} />

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-14 w-14 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                    onClick={handleIgnore}
                  >
                    <X className="h-6 w-6" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full bg-transparent"
                    onClick={undoLastAction}
                    disabled={connections.length === 0 && ignored.length === 0}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>

                  <Button
                    size="lg"
                    className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
                    onClick={handleConnect}
                  >
                    <Heart className="h-6 w-6" />
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Swipe right to connect • Swipe left to pass</p>
                </div>
              </div>
            ) : (
              <Card className="text-center py-12 max-w-md mx-auto">
                <CardContent>
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No more participants</h3>
                  <p className="text-muted-foreground mb-4">
                    You've seen all available participants. Check back later for new attendees!
                  </p>
                  <Button asChild>
                    <Link href="#" onClick={() => document.querySelector('[value="connections"]')?.click()}>
                      View My Connections
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            {connections.length > 0 ? (
              <>
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search connections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Connections Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredConnections.map((participant) => (
                    <Card key={participant.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{participant.name}</CardTitle>
                            <CardDescription>{participant.title}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {participant.matchPercentage}% match
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            <span>{participant.company}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{participant.location}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {participant.interests.slice(0, 3).map((interest) => (
                              <Badge key={interest} variant="outline" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                            {participant.interests.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{participant.interests.length - 3} more
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="flex-1">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => removeConnection(participant.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start discovering participants to build your professional network.
                  </p>
                  <Button asChild>
                    <Link href="#" onClick={() => document.querySelector('[value="discover"]')?.click()}>
                      Start Networking
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <ChatWidget />
    </div>
  )
}
