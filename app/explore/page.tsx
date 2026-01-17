"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Clock, MapPin, User, Plus, Check, Calendar, Sparkles, ShieldCheck, Settings } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ChatWidget } from "@/components/chat-widget"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { useEffect } from "react"
import { registerForEvent, applyToVolunteer } from "@/lib/actions"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-supabase"
import { useRouter } from "next/navigation"

interface Session {
  id: string
  title: string
  description: string
  speaker: string
  speakerTitle: string
  time: string
  start_time: string
  end_time: string
  duration: string
  location: string
  track: string
  level: "Beginner" | "Intermediate" | "Advanced"
  tags: string[]
  isRecommended: boolean
  matchPercentage?: number
  isInAgenda: boolean
  is_volunteer_open: boolean
  owner_id: string
  isTeamMember: boolean
  isOrganizer: boolean
  is_invite_only: boolean
  registrationStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'
  timezone: string
}

export default function ExplorePage() {
  const { user } = useUser()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrack, setSelectedTrack] = useState<string>("all")

  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchSessions() {
      try {
        const now = new Date().toISOString()
        const { data, error } = await supabase
          .from('agenda_view')
          .select('*')
          .or(`end_time.gt.${now},start_time.gt.${now}`) // Show if it hasn't ended OR if it starts in the future
        
        if (error) throw error
        
        // Map database view to UI component interface
        const mappedSessions: Session[] = (data || []).map(s => ({
          ...s,
          tags: Array.isArray(s.tags) && s.tags.length > 0
            ? s.tags
            : (s.track ? [s.track] : []),
          level: (['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)]) as any,
          matchPercentage: s.isRecommended ? 85 + Math.floor(Math.random() * 10) : undefined,
          is_volunteer_open: true // Defaulted as most events have it open in schema
        }))
        
        setSessions(mappedSessions)
      } catch (err) {
        console.error("Error fetching sessions:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  const tracks = ["all", "AI & ML", "Frontend", "Security", "Product", "General"]

  const handleRegister = async (eventId: string) => {
    try {
      const result = await registerForEvent(parseInt(eventId))
      
      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Registration submitted!")
      // Update local state to reflect registration
      setSessions(prev => prev.map(s => s.id === eventId ? { 
        ...s, 
        registrationStatus: result.data.status,
        isInAgenda: result.data.status === 'APPROVED' 
      } : s))
    } catch (error: any) {
      toast.error("Failed to register")
    }
  }

  const handleVolunteer = async (eventId: string) => {
    try {
      const result = await applyToVolunteer(parseInt(eventId))
      
      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Volunteer application submitted!")
    } catch (error: any) {
      toast.error("Failed to submit application")
    }
  }

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.speaker.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTrack = selectedTrack === "all" || s.track === selectedTrack
    
    return matchesSearch && matchesTrack
  })

  const recommendedSessions = filteredSessions.filter(s => s.isRecommended)
  const myAgendaSessions = filteredSessions.filter(s => s.isInAgenda)
  const allSessions = filteredSessions

  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()

    if (Number.isNaN(startTime) || Number.isNaN(endTime)) return "Duration TBD"
    if (endTime <= startTime) return "Duration TBD"

    const minutes = Math.round((endTime - startTime) / 60000)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.round((minutes / 60) * 10) / 10
    return `${hours} hrs`
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
                  {new Date(session.start_time).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: session.timezone || 'Asia/Kolkata',
                    timeZoneName: 'short'
                  })} ({formatDuration(session.start_time, session.end_time)})
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {session.location}
                </span>
              </div>
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            {session.owner_id === user?.id || session.isOrganizer ? (
              <Button
                variant="outline"
                size="sm"
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => router.push(`/events/manage/${session.id}`)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Manage
              </Button>
            ) : (
              <>
                <Button
                  variant={session.registrationStatus === 'APPROVED' ? "default" : session.registrationStatus === 'PENDING' ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleRegister(session.id)}
                  disabled={session.registrationStatus !== 'NONE' && session.registrationStatus !== 'REJECTED'}
                >
                  {session.registrationStatus === 'APPROVED' ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Registered
                    </>
                  ) : session.registrationStatus === 'PENDING' ? (
                    <>
                      <Clock className="h-4 w-4 mr-1 text-orange-500" />
                      Request Pending
                    </>
                  ) : session.registrationStatus === 'REJECTED' ? (
                    'Request Rejected'
                  ) : session.is_invite_only ? (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Request to Join
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Register
                    </>
                  )}
                </Button>
                {session.is_volunteer_open && !session.isTeamMember && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs border border-dashed border-primary/30 hover:border-primary"
                    onClick={() => handleVolunteer(session.id)}
                  >
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Volunteer
                  </Button>
                )}
                {session.isTeamMember && (
                  <Badge variant="secondary" className="justify-center">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Team Member
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{session.speaker}</span>
          <span className="text-sm text-muted-foreground">• {session.speakerTitle}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{session.description}</p>
        {session.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {session.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="default" className="text-[11px] px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {session.tags.length > 5 && (
              <Badge variant="outline" className="text-[11px] px-2 py-0.5">
                +{session.tags.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Events</h1>
          <p className="text-muted-foreground">
            Discover upcoming events and sessions tailored to your interests.
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
