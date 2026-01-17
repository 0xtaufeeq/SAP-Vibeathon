"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Navigation } from "@/components/navigation"
import { updateEventDetails, addOrganizer, updateVolunteerStatus, removeTeamMember, updateRegistrationStatus } from "@/lib/actions"
import { toast } from "sonner"
import { Users, Save, Mail, Check, CheckCircle2, X, Shield, Settings, Trash2, Loader2, ArrowLeft, ExternalLink, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { Switch } from "@/components/ui/switch"

export default function ManageEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [eventData, setEventData] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([])
  const [confirmedAttendees, setConfirmedAttendees] = useState<any[]>([])
  const [currentPermissions, setCurrentPermissions] = useState<{
    isOwner: boolean;
    canManageTeam: boolean;
    canScanQR: boolean;
  }>({
    isOwner: false,
    canManageTeam: false,
    canScanQR: false
  })
  
  // New Organizer Form
  const [newOrgEmail, setNewOrgEmail] = useState("")
  const [newOrgPerms, setNewOrgPerms] = useState({
    can_manage_team: true,
    can_scan_qr: true,
    can_manage_tasks: true
  })
  const [tagInput, setTagInput] = useState("")

  const supabase = createBrowserClient()

  useEffect(() => {
    fetchData()
  }, [eventId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      
      if (eventError) throw eventError

      // Fetch Event Tags
      const { data: tagData, error: tagError } = await supabase
        .from('event_tags')
        .select('tag_id, master_tags(tag_name)')
        .eq('event_id', eventId)

      if (tagError) throw tagError
      const tags = (tagData || [])
        .map((t: any) => t.master_tags?.tag_name)
        .filter(Boolean)

      setEventData({
        ...event,
        tags
      })

      // Fetch Team (Organizers)
      const { data: teamData, error: teamError } = await supabase
        .from('event_team')
        .select(`
          id,
          user_id,
          role,
          status,
          can_manage_team,
          can_scan_qr,
          can_manage_tasks,
          users:user_id ( name, email, linkedin_pdf_url )
        `)
        .eq('event_id', eventId)
        .eq('role', 'ORGANIZER')
      
      if (teamError) throw teamError
      setTeam(teamData || [])

      // Fetch Volunteers
      const { data: volData, error: volError } = await supabase
        .from('event_team')
        .select(`
          id,
          user_id,
          role,
          status,
          can_manage_team,
          can_scan_qr,
          can_manage_tasks,
          users:user_id ( name, email, linkedin_pdf_url )
        `)
        .eq('event_id', eventId)
        .eq('role', 'VOLUNTEER')
      
      if (volError) throw volError
      setVolunteers(volData || [])

      // Fetch Pending Registrations (for invite-only)
      const { data: regData, error: regError } = await supabase
        .from('event_registrations')
        .select(`
          reg_id,
          user_id,
          status,
          users:user_id ( name, email, linkedin_pdf_url )
        `)
        .eq('event_id', eventId)
        .eq('status', 'PENDING')
      
      if (regError) throw regError
      setPendingRegistrations(regData || [])

      // Fetch Confirmed Attendees
      const { data: confirmedData, error: confirmedError } = await supabase
        .from('event_registrations')
        .select(`
          reg_id,
          user_id,
          status,
          is_checked_in,
          users:user_id ( name, email, linkedin_pdf_url )
        `)
        .eq('event_id', eventId)
        .or(`status.eq.APPROVED,and(status.eq.PENDING,event_id.eq.${eventId})`) // If public they might be pending due to the bug
      
      // Filter confirmed: APPROVED or (PENDING and event is public)
      const confirmed = (confirmedData || []).filter(r => 
        r.status === 'APPROVED' || (event.is_invite_only === false && r.status === 'PENDING')
      )
      setConfirmedAttendees(confirmed)

      // Get current user permissions
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const isOwner = event.owner_id === user.id
        const userTeamRecord = teamData?.find((t: any) => t.user_id === user.id)
        
        // Also check volunteers just in case (though they shouldn't usually be here)
        const userVolRecord = volData?.find((t: any) => t.user_id === user.id)
        const record = userTeamRecord || userVolRecord

        setCurrentPermissions({
          isOwner,
          canManageTeam: isOwner || record?.can_manage_team || false,
          canScanQR: isOwner || record?.can_scan_qr || false
        })
      }

    } catch (err: any) {
      toast.error(err.message)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Helper to format UTC DB date to local datetime-local input string
  const formatToLocalValue = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (!eventData.tags?.includes(newTag)) {
        setEventData({
          ...eventData,
          tags: [...(eventData.tags || []), newTag]
        })
      }
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setEventData({
      ...eventData,
      tags: (eventData.tags || []).filter((t: string) => t !== tagToRemove)
    })
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Ensure we send as UTC ISO strings
      // We also include the timezone in the update
      const updates = {
        ...eventData,
        start_time: new Date(eventData.start_time).toISOString(),
        end_time: new Date(eventData.end_time).toISOString(),
        timezone: eventData.timezone || 'Asia/Kolkata'
      }
      await updateEventDetails(parseInt(eventId), updates)
      toast.success("Event updated successfully")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddOrganizer = async () => {
    try {
      const result = await addOrganizer(parseInt(eventId), newOrgEmail, newOrgPerms)
      
      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Organizer added")
      setNewOrgEmail("")
      fetchData()
    } catch (error: any) {
      toast.error("An unexpected error occurred")
    }
  }

  const handleVolunteerAction = async (appId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateVolunteerStatus(appId, status, { can_scan_qr: true })
      toast.success(`Volunteer ${status.toLowerCase()}`)
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRegistrationAction = async (regId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateRegistrationStatus(regId, status)
      toast.success(`Attendee request ${status.toLowerCase()}`)
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeTeamMember(parseInt(eventId), userId)
      toast.success("Member removed")
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content: Event Details */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Edit Event Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      value={eventData.title} 
                      onChange={(e) => setEventData({...eventData, title: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={eventData.description} 
                      className="min-h-[150px]"
                      onChange={(e) => setEventData({...eventData, description: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input 
                        type="datetime-local"
                        value={formatToLocalValue(eventData.start_time)} 
                        onChange={(e) => setEventData({...eventData, start_time: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input 
                        type="datetime-local"
                        value={formatToLocalValue(eventData.end_time)} 
                        onChange={(e) => setEventData({...eventData, end_time: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Event Timezone</Label>
                    <select
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      value={eventData.timezone || 'Asia/Kolkata'}
                      onChange={(e) => setEventData({...eventData, timezone: e.target.value})}
                    >
                      <option value="Asia/Kolkata">India (IST)</option>
                      <option value="Asia/Singapore">Singapore (SGT)</option>
                      <option value="Europe/London">London (GMT/BST)</option>
                      <option value="America/New_York">New York (EST/EDT)</option>
                      <option value="America/Los_Angeles">San Francisco (PST/PDT)</option>
                      <option value="Asia/Dubai">Dubai (GST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input 
                      value={eventData.venue} 
                      onChange={(e) => setEventData({...eventData, venue: e.target.value})} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-base">Open for Volunteers</Label>
                      <p className="text-sm text-muted-foreground">Allow attendees to apply as volunteers.</p>
                    </div>
                    <Switch 
                      checked={eventData.is_volunteer_open} 
                      onCheckedChange={(v) => setEventData({...eventData, is_volunteer_open: v})} 
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-base">Invite Only</Label>
                      <p className="text-sm text-muted-foreground">Restrict to invited guests.</p>
                    </div>
                    <Switch 
                      checked={eventData.is_invite_only} 
                      onCheckedChange={(v) => setEventData({...eventData, is_invite_only: v})} 
                    />
                  </div>

                  <div className="space-y-4 pt-2 border-t">
                    <Label className="text-base">Event Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {(eventData.tags || []).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="gap-1 px-3 py-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Type a tag and press Space or Enter..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Add tags to improve discoverability in Explore.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Volunteers & Applications
                </CardTitle>
                <CardDescription>Review and manage volunteer status.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {volunteers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No volunteer applications yet.</p>
                  ) : volunteers.map(vol => (
                    <div key={vol.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        {/* @ts-ignore */}
                        <p className="font-medium">{vol.users.name}</p>
                        {/* @ts-ignore */}
                        <p className="text-xs text-muted-foreground">{vol.users.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={vol.status === 'APPROVED' ? 'default' : vol.status === 'PENDING' ? 'secondary' : 'destructive'}>
                            {vol.status}
                          </Badge>
                          {/* @ts-ignore */}
                          {(Array.isArray(vol.users) ? vol.users[0] : vol.users)?.linkedin_pdf_url && (
                            <a 
                              href={(Array.isArray(vol.users) ? vol.users[0] : vol.users).linkedin_pdf_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] flex items-center gap-1 text-primary hover:underline"
                            >
                              <FileText className="h-3 w-3" />
                              Look at LinkedIn PDF
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {vol.status === 'PENDING' ? (
                          currentPermissions.canManageTeam && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleVolunteerAction(vol.id, 'APPROVED')}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleVolunteerAction(vol.id, 'REJECTED')}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )
                        ) : (
                          currentPermissions.canManageTeam && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveMember(vol.user_id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {(eventData.is_invite_only || pendingRegistrations.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Attendee Requests
                  </CardTitle>
                  <CardDescription>
                    {eventData.is_invite_only 
                      ? "Review requests for this invite-only event." 
                      : "Pending registrations that need approval (even for public events)."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRegistrations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No pending requests.</p>
                    ) : pendingRegistrations.map(reg => (
                      <div key={reg.reg_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          {/* @ts-ignore */}
                          <p className="font-medium text-sm">{(Array.isArray(reg.users) ? reg.users[0] : reg.users)?.name}</p>
                          {/* @ts-ignore */}
                          <p className="text-xs text-muted-foreground">{(Array.isArray(reg.users) ? reg.users[0] : reg.users)?.email}</p>
                          {/* @ts-ignore */}
                          {(Array.isArray(reg.users) ? reg.users[0] : reg.users)?.linkedin_pdf_url && (
                             <a 
                               href={(Array.isArray(reg.users) ? reg.users[0] : reg.users).linkedin_pdf_url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-[10px] flex items-center gap-1 text-primary hover:underline mt-1"
                             >
                               <FileText className="h-3 w-3" />
                               Look at LinkedIn PDF
                             </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {currentPermissions.canManageTeam && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleRegistrationAction(reg.reg_id, 'APPROVED')}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRegistrationAction(reg.reg_id, 'REJECTED')}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Confirmed Attendees
                </CardTitle>
                <CardDescription>View all participants registered for this event.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {confirmedAttendees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No confirmed attendees yet.</p>
                  ) : confirmedAttendees.map(reg => (
                    <div key={reg.reg_id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div>
                        {/* @ts-ignore */}
                        <p className="font-medium text-sm">{(Array.isArray(reg.users) ? reg.users[0] : reg.users)?.name}</p>
                        {/* @ts-ignore */}
                        <p className="text-xs text-muted-foreground">{(Array.isArray(reg.users) ? reg.users[0] : reg.users)?.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {reg.is_checked_in && (
                          <Badge variant="outline" className="text-green-600 bg-green-50">Checked-in</Badge>
                        )}
                        {/* @ts-ignore */}
                        {(Array.isArray(reg.users) ? reg.users[0] : reg.users)?.linkedin_pdf_url && (
                          <a 
                            href={(Array.isArray(reg.users) ? reg.users[0] : reg.users).linkedin_pdf_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 border rounded-md hover:bg-muted"
                            title="LinkedIn PDF"
                          >
                            <FileText className="h-4 w-4 text-primary" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Organizers
                </CardTitle>
                <CardDescription>Collaborators with management access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentPermissions.canManageTeam && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Invite by Email</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="email@example.com" 
                          value={newOrgEmail}
                          onChange={(e) => setNewOrgEmail(e.target.value)}
                        />
                        <Button size="sm" onClick={handleAddOrganizer}>Add</Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs cursor-pointer" htmlFor="p-team">Can manage team</Label>
                        <Switch id="p-team" checked={newOrgPerms.can_manage_team} onCheckedChange={(v) => setNewOrgPerms({...newOrgPerms, can_manage_team: v})} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs cursor-pointer" htmlFor="p-scan">Can scan tickets</Label>
                        <Switch id="p-scan" checked={newOrgPerms.can_scan_qr} onCheckedChange={(v) => setNewOrgPerms({...newOrgPerms, can_scan_qr: v})} />
                      </div>
                    </div>
                    <Separator />
                  </div>
                )}

                <div className="space-y-3">
                  {team.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        {/* @ts-ignore */}
                        <p className="text-sm font-medium">{member.users.name}</p>
                        {/* @ts-ignore */}
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{member.users.email}</p>
                      </div>
                      {member.user_id !== eventData.owner_id && currentPermissions.isOwner && (
                        <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0" onClick={() => handleRemoveMember(member.user_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
