"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Heart, X, User, MapPin, Briefcase, Search, Users, MessageSquare, Undo2, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ChatWidget } from "@/components/chat-widget"
import Link from "next/link"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { calculateMatchScore } from "@/lib/matching"

interface Participant {
  id: string
  name: string
  title: string
  company: string
  location: string
  bio: string
  interests: string[]
  matchPercentage: number
  event_ids: number[]
  isCommonEvent?: boolean
  profileImage?: string
  isConnected?: boolean
  isIgnored?: boolean
}

export default function NetworkingPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [userInterests, setUserInterests] = useState<string[]>([])
  const [userEventIds, setUserEventIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [connections, setConnections] = useState<Participant[]>([])
  const [ignored, setIgnored] = useState<Participant[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch current user skills/interests
        const { data: userData } = await supabase
          .from('user_interests')
          .select('master_tags(tag_name)')
          .eq('user_id', user.id)
        
        const myInterests = userData?.map((t: any) => t.master_tags?.tag_name) || []
        setUserInterests(myInterests)

        // Fetch current user event registrations
        const { data: myEvents } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id)
        
        const myEventIds = myEvents?.map(e => e.event_id) || []
        setUserEventIds(myEventIds)

        // Fetch other participants
        const { data, error } = await supabase
          .from('networking_view')
          .select('*')
          .neq('id', user.id) // Don't show myself
        
        if (error) throw error
        
        // Calculate dynamic scores and check for common events
        const processedParticipants = (data || []).map((p: any) => {
          const commonEvents = (p.event_ids || []).filter((id: number) => myEventIds.includes(id))
          
          return {
            ...p,
            matchPercentage: calculateMatchScore(myInterests, p.interests || []),
            // If they share an event, we keep their location (which is their venue) 
            // but we can flag it as a meeting point
            isCommonEvent: commonEvents.length > 0
          }
        })

        // Sort by match percentage
        processedParticipants.sort((a, b) => b.matchPercentage - a.matchPercentage)
        
        setParticipants(processedParticipants)
      } catch (err) {
        console.error("Error fetching networking data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
    setCurrentIndex((prev) => Math.min(prev + 1, participants.length))
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

  const ParticipantCard = ({ participant }: { participant: Participant }) => {
    const sharedInterests = (participant.interests || []).filter(i => 
      userInterests.some(u => u.toLowerCase() === i.toLowerCase())
    )
    const otherInterests = (participant.interests || []).filter(i => 
      !userInterests.some(u => u.toLowerCase() === i.toLowerCase())
    )

    return (
      <Card className="w-full max-w-md mx-auto border-border/40 overflow-hidden shadow-2xl relative">
        <CardHeader className="text-center pb-6 bg-muted/20">
          <div className="relative mb-6">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto ring-4 ring-background overflow-hidden">
              <User className="h-16 w-16 text-primary/70" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground border-0 shadow-lg px-3 py-1 font-bold">
                <Sparkles className="h-3 w-3 mr-1.5" />
                {participant.matchPercentage}% Match
              </Badge>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2 tracking-tight">{participant.name}</CardTitle>
          <CardDescription className="text-base space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Briefcase className="h-4 w-4 text-primary/60" />
              <span className="font-semibold text-foreground">{participant.title}</span>
            </div>
            <div className="font-medium text-muted-foreground">{participant.company}</div>
            
            {/* Highlighted Venue */}
            <div className={`flex items-center justify-center gap-1.5 p-2 rounded-lg transition-colors ${participant.isCommonEvent ? 'bg-primary/10 border border-primary/20 mt-2' : ''}`}>
              <MapPin className={`h-4 w-4 ${participant.isCommonEvent ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${participant.isCommonEvent ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                {participant.isCommonEvent ? `Meet at: ${participant.location}` : participant.location}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="bg-background/50 p-4 rounded-xl border border-border/50">
            <h4 className="font-bold mb-4 text-[10px] uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Users className="h-3 w-3" />
              Shared Interests
            </h4>
            <div className="flex flex-wrap gap-2">
              {sharedInterests.length > 0 ? sharedInterests.map((interest) => (
                <Badge key={interest} variant="default" className="text-[11px] px-3 py-1 bg-primary hover:bg-primary text-primary-foreground border-0 shadow-sm">
                  {interest}
                </Badge>
              )) : (
                <span className="text-[11px] text-muted-foreground italic">No direct interest matches</span>
              )}
            </div>
          </div>

          {(otherInterests.length > 0) && (
            <div className="px-1">
              <h4 className="font-bold mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Other Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {otherInterests.map((interest) => (
                  <Badge key={interest} variant="outline" className="text-[11px] px-2.5 py-0.5 border-border/60 text-muted-foreground font-medium">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Page Header */}
        <div className="mb-12 opacity-0 animate-fade-in" style={{ animationDelay: '0s', animationFillMode: 'forwards' }}>
          <h1 className="text-4xl md:text-5xl font-semibold mb-3 text-foreground tracking-tight">Smart Networking</h1>
          <p className="text-lg text-muted-foreground">Discover and connect with like-minded professionals at the event.</p>
        </div>

        <Tabs defaultValue="discover" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-muted/30 border border-border/40">
            <TabsTrigger value="discover" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Discover</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary border-0 text-xs">
                {participants.length - currentIndex}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2 data-[state=active]:bg-background">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Connections</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary border-0 text-xs">
                {connections.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-8">
            {currentIndex < participants.length ? (
              <div className="max-w-md mx-auto space-y-8">
                <ParticipantCard participant={currentParticipant} />

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-16 w-16 border-2 border-red-500/30 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 bg-background shadow-lg hover:shadow-xl"
                    onClick={handleIgnore}
                  >
                    <X className="h-7 w-7" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-12 w-12 hover:bg-muted/50"
                    onClick={undoLastAction}
                    disabled={connections.length === 0 && ignored.length === 0}
                  >
                    <Undo2 className="h-5 w-5" />
                  </Button>

                  <Button
                    size="lg"
                    className="rounded-full h-16 w-16 bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl border-0"
                    onClick={handleConnect}
                  >
                    <Heart className="h-7 w-7" />
                  </Button>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-green-600" />
                      Connect
                    </span>
                    <span className="mx-3 text-border">·</span>
                    <span className="inline-flex items-center gap-2">
                      <X className="h-3.5 w-3.5 text-red-600" />
                      Pass
                    </span>
                    <span className="mx-3 text-border">·</span>
                    <span className="inline-flex items-center gap-2">
                      <Undo2 className="h-3.5 w-3.5" />
                      Undo
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <Card className="text-center py-16 max-w-md mx-auto border-border/40">
                <CardContent>
                  <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">All caught up!</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    You&apos;ve seen all available participants. Check back later for new attendees or explore your connections.
                  </p>
                  <Button size="lg" asChild className="shadow-lg">
                    <Link href="#" onClick={(e) => {
                      e.preventDefault()
                      const button = document.querySelector('[value="connections"]') as HTMLButtonElement
                      button?.click()
                    }}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View My Connections
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="connections" className="space-y-8">
            {connections.length > 0 ? (
              <>
                {/* Search */}
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, company, or interests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-muted/30 border-border/40 focus:bg-background"
                  />
                </div>

                {/* Connections Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredConnections.map((participant) => (
                    <Card key={participant.id} className="border-border/40 transition-all duration-200 hover:bg-muted/20 hover:border-primary/30 group">
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="relative">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-background">
                              <User className="h-7 w-7 text-primary/70" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">{participant.name}</CardTitle>
                            <CardDescription className="text-sm">{participant.title}</CardDescription>
                            <Badge className="mt-2 bg-primary/90 text-primary-foreground border-0 text-xs px-2 py-0.5">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {participant.matchPercentage}%
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2.5 text-muted-foreground">
                            <Briefcase className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{participant.company}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{participant.location}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {participant.interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-xs bg-muted/50 border-border/40">
                              {interest}
                            </Badge>
                          ))}
                          {participant.interests.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-muted/50 border-border/40">
                              +{participant.interests.length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1 shadow-sm">
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            Message
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeConnection(participant.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="text-center py-16 max-w-md mx-auto border-border/40">
                <CardContent>
                  <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">No connections yet</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Start discovering participants to build your professional network at this event.
                  </p>
                  <Button size="lg" asChild className="shadow-lg">
                    <Link href="#" onClick={(e) => {
                      e.preventDefault()
                      const button = document.querySelector('[value="discover"]') as HTMLButtonElement
                      button?.click()
                    }}>
                      <Users className="h-4 w-4 mr-2" />
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
