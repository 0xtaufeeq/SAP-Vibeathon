"use client"

export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MessageSquare, TrendingUp, Clock, Star, Scan, CheckCircle2, Plus, Settings, ShieldCheck, Mail, Trash2 } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ChatWidget } from "@/components/chat-widget"
import Link from "next/link"
import { useUser } from "@/hooks/use-supabase"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { respondToOrganizerInvite } from "@/lib/actions"
import { toast } from "sonner"

export default function DashboardPage() {
  const { user, loading } = useUser()
  const [greeting, setGreeting] = useState("Hello")
  const [stats, setStats] = useState({
    sessions: 0,
    connections: 0,
    messages: 0
  })
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [volunteerEvents, setVolunteerEvents] = useState<any[]>([])
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [dismissedEvents, setDismissedEvents] = useState<number[]>([])
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    // Load dismissed events from localStorage
    const saved = localStorage.getItem('dismissed_volunteer_events')
    if (saved) {
      setDismissedEvents(JSON.parse(saved))
    }
  }, [])

  const handleDismissEvent = (eventId: number) => {
    const updated = [...dismissedEvents, eventId]
    setDismissedEvents(updated)
    localStorage.setItem('dismissed_volunteer_events', JSON.stringify(updated))
    toast.success("Event removed from console")
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchVolunteerStatus()
      
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning")
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon")
      } else if (hour >= 17 && hour < 22) {
        setGreeting("Good Evening")
      } else {
        setGreeting("It's Too Late, Time to go to Bed")
      }
    }
  }, [user])

  const fetchVolunteerStatus = async () => {
    try {
      // 1. Fetch Approved Roles (Console)
      const { data: approvedData, error: approvedError } = await supabase
        .from('event_team')
        .select(`
          id,
          role,
          status,
          can_scan_qr,
          events (
            id,
            title,
            start_time,
            end_time,
            timezone
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'APPROVED')

      if (approvedError) throw approvedError
      if (approvedData) {
        setVolunteerEvents(approvedData.map((item: any) => ({
          ...item,
          event_title: item.events.title,
          start_time: item.events.start_time,
          end_time: item.events.end_time,
          event_id: item.events.id
        })))
      }

      // 2. Fetch Pending Invitations 
      const { data: inviteData, error: inviteError } = await supabase
        .from('event_team')
        .select(`
          id,
          role,
          status,
          events (
            id,
            title,
            owner_id,
            users:owner_id ( name )
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'PENDING')
        .eq('role', 'ORGANIZER')

      if (inviteError) throw inviteError
      setPendingInvites(inviteData || [])
    } catch (err) {
      console.error("Error fetching volunteer/invite status:", err)
    }
  }

  const handleInviteResponse = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const result = await respondToOrganizerInvite(id, status)
      if (result.success) {
        toast.success(status === 'APPROVED' ? "Invitation accepted!" : "Invitation declined")
        fetchVolunteerStatus()
      } else {
        toast.error(result.error || "Failed to respond to invitation")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
    }
  }

  const isEventActive = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const now = new Date().getTime()
    // Available 30 mins before start until end of event
    return now >= (start - 30 * 60 * 1000) && now <= end
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch registrations count
      const { count: regCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Fetch connections count
      const { count: connectCount } = await supabase
        .from('user_connections')
        .select('*', { count: 'exact', head: true })
        .or(`follower_id.eq.${user?.id},followed_id.eq.${user?.id}`)
        .eq('status', 'APPROVED')

      // Fetch upcoming sessions for this user (where they are owner, registrant, or team member)
      const { data: agendaData } = await supabase
        .from('agenda_view')
        .select('*')
        .or(`owner_id.eq.${user?.id},isInAgenda.eq.true,isTeamMember.eq.true`)
        .limit(4) // Show up to 4 on dashboard

      setStats(prev => ({
        ...prev,
        sessions: regCount || 0,
        connections: connectCount || 0,
      }))

      if (agendaData) {
        setUpcomingSessions(agendaData)
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
  
  const metadata = user.user_metadata
  const isProfessional = 
    metadata?.user_type?.toLowerCase() === "professional" || 
    metadata?.attendee_category?.toLowerCase() === "professional"

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header Section */}
        <div className="mb-12 opacity-0 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ animationDelay: '0s', animationFillMode: 'forwards' }}>
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold mb-3 text-foreground tracking-tight">
              {greeting}, {displayName}
            </h1>
            <p className="text-lg text-muted-foreground">Here&apos;s your personalized event experience.</p>
          </div>
          {isProfessional && (
            <div className="flex gap-2">
              <Button onClick={() => router.push('/events/create')} size="lg" className="rounded-full shadow-lg transition-all hover:scale-105">
                <Plus className="h-5 w-5 mr-2" />
                Host New Event
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          <Card className="border-border/40 transition-all duration-200 hover:bg-muted/30 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Calendar className="h-5 w-5 text-primary/70" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today</span>
                </div>
                <div>
                  <p className="text-3xl font-semibold mb-1">{stats.sessions}</p>
                  <p className="text-sm text-muted-foreground">Sessions scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/40 transition-all duration-200 hover:bg-muted/30 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-primary/70" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Network</span>
                </div>
                <div>
                  <p className="text-3xl font-semibold mb-1">{stats.connections}</p>
                  <p className="text-sm text-muted-foreground">New connections</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/40 transition-all duration-200 hover:bg-muted/30 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <MessageSquare className="h-5 w-5 text-primary/70" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inbox</span>
                </div>
                <div>
                  <p className="text-3xl font-semibold mb-1">{stats.messages}</p>
                  <p className="text-sm text-muted-foreground">Unread messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Organizer Invitations */}
        {pendingInvites.length > 0 && (
          <div className="mb-12 animate-fade-in-up">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Event Invitations
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="border-primary bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Invitation to Collaborate</CardTitle>
                    <CardDescription>
                      You have been invited to be an **Organizer** for **{invite.events.title}** by {invite.events.users.name}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleInviteResponse(invite.id, 'APPROVED')}
                    >
                      Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleInviteResponse(invite.id, 'REJECTED')}
                    >
                      Decline
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Volunteer Console Section */}
        {volunteerEvents.filter(v => !dismissedEvents.includes(v.event_id)).length > 0 && (
          <div className="mb-12 animate-fade-in-up">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              {volunteerEvents.some(v => v.role === 'ORGANIZER') ? 'Organizer QR Scanning Console' : 'Volunteer Console'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {volunteerEvents
                .filter(v => !dismissedEvents.includes(v.event_id))
                .map((vEvent) => (
                <Card key={vEvent.id} className="border-primary/20 bg-primary/5 relative group/card">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{vEvent.event_title}</CardTitle>
                        <CardDescription>
                          Role: <span className="capitalize font-medium text-primary">{vEvent.role.toLowerCase()}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {new Date() > new Date(vEvent.end_time) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => handleDismissEvent(vEvent.event_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Badge variant={isEventActive(vEvent.start_time, vEvent.end_time) ? "default" : "outline"}>
                          {isEventActive(vEvent.start_time, vEvent.end_time) ? 'Active Now' : (new Date() > new Date(vEvent.end_time) ? 'Ended' : 'Upcoming')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(vEvent.start_time).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          timeZone: vEvent.events.timezone || 'Asia/Kolkata',
                          timeZoneName: 'short'
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {vEvent.can_scan_qr ? 'QR Scanning Enabled' : 'Task Observer'}
                      </div>
                    </div>
                    
                    {vEvent.can_scan_qr ? (
                      <Button 
                        disabled={!isEventActive(vEvent.events.start_time, vEvent.events.end_time)}
                        className="w-full h-12 text-lg font-medium group transition-all"
                        onClick={() => router.push(`/volunteer/check-in?eventId=${vEvent.event_id}`)}
                      >
                        <Scan className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                        {isEventActive(vEvent.events.start_time, vEvent.events.end_time) 
                          ? 'Open Check-in Scanner' 
                          : (new Date() > new Date(vEvent.events.end_time) 
                              ? 'Event Ended' 
                              : 'Available at Event Start')}
                      </Button>
                    ) : (
                      <div className="p-4 border border-dashed rounded-lg text-center bg-muted/20">
                        <p className="text-sm text-muted-foreground font-medium">Assigned Role: Task Observer</p>
                        <p className="text-[10px] text-muted-foreground">Scan capability not assigned for this role.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Features */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <Link href="/explore" className="group">
            <Card className="h-full border-border/40 transition-all duration-200 hover:bg-muted/30 hover:border-primary/40 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-200 group-hover:bg-primary/20">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stats.sessions} Sessions
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold mb-2">My Explore</CardTitle>
                <CardDescription className="text-base">
                  Your personalized schedule for today
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  View upcoming sessions and add new ones to your schedule
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/networking" className="group">
            <Card className="h-full border-border/40 transition-all duration-200 hover:bg-muted/30 hover:border-primary/40 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-200 group-hover:bg-primary/20">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stats.connections} New
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold mb-2">Networking</CardTitle>
                <CardDescription className="text-base">
                  Connect with professionals
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  Discover and connect with like-minded attendees
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/chat" className="group">
            <Card className="h-full border-border/40 transition-all duration-200 hover:bg-muted/30 hover:border-primary/40 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-200 group-hover:bg-primary/20">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    24/7
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold mb-2">AI Concierge</CardTitle>
                <CardDescription className="text-base">
                  Your personal event assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  Get instant help, recommendations, and answers
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Today's Schedule Preview */}
        <div className="space-y-6">
          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-semibold">Today&apos;s Schedule</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild className="hover:bg-muted/50">
                  <Link href="/explore">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {upcomingSessions.filter(s => new Date(s.end_time) > new Date()).length > 0 ? (
                  upcomingSessions
                    .filter(s => new Date(s.end_time) > new Date())
                    .map((session, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/40 transition-all duration-200 hover:bg-muted/50 cursor-pointer group">
                      <div className="flex flex-col items-center gap-1 min-w-[100px]">
                        <span className="text-lg font-semibold text-primary">
                          {new Date(session.start_time).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            timeZone: session.timezone || 'Asia/Kolkata'
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                          {new Intl.DateTimeFormat('en-US', {
                            timeZone: session.timezone || 'Asia/Kolkata',
                            timeZoneName: 'short'
                          }).format(new Date(session.start_time)).split(' ').pop()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base mb-1 group-hover:text-primary transition-colors">
                          {session.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.location} <span className="mx-1">·</span> {session.speaker}
                        </p>
                      </div>
                      {(session.isOrganizer || session.owner_id === user?.id) ? (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/events/manage/${session.id}`)
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-green-500/10">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-[10px] font-semibold text-green-500 uppercase mt-0.5">Joined</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No active sessions scheduled</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conducted Events Section */}
          {upcomingSessions.filter(s => new Date(s.end_time) <= new Date()).length > 0 && (
            <Card className="border-border/40 bg-muted/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-semibold text-muted-foreground">Conducted Events</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {upcomingSessions
                    .filter(s => new Date(s.end_time) <= new Date())
                    .map((session, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/10 border border-border/20 grayscale opacity-60 transition-all duration-200 hover:grayscale-0 hover:opacity-100 cursor-pointer group"
                      onClick={() => router.push(`/explore`)} // Or specific event details if available
                    >
                      <div className="flex flex-col items-center gap-1 min-w-[100px]">
                        <span className="text-lg font-semibold text-muted-foreground">
                          {new Date(session.start_time).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            timeZone: session.timezone || 'Asia/Kolkata'
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                          {new Intl.DateTimeFormat('en-US', {
                            timeZone: session.timezone || 'Asia/Kolkata',
                            timeZoneName: 'short'
                          }).format(new Date(session.start_time)).split(' ').pop()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base mb-1 text-muted-foreground group-hover:text-primary transition-colors">
                          {session.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.location} <span className="mx-1">·</span> {session.speaker}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(session.isOrganizer || session.owner_id === user?.id) && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-shrink-0 grayscale-0 opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/events/manage/${session.id}`)
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        )}
                        <Badge variant="outline" className="mt-0">Conducted</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ChatWidget />
    </div>
  )
}
