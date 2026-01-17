"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Navigation } from "@/components/navigation"
import { createEvent, addOrganizer } from "@/lib/actions"
import { toast } from "sonner"
import { Calendar, MapPin, Users, Plus, Loader2, Save, Trash2, Mail, Check, ShieldCheck, Lock, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<number | null>(null)
  
  // Event Form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    start_time: "",
    end_time: "",
    timezone: "Asia/Kolkata",
    is_volunteer_open: true,
    is_invite_only: false,
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState("")

  // Common Timezones
  const timezones = [
    { label: "India (IST)", value: "Asia/Kolkata" },
    { label: "Singapore (SGT)", value: "Asia/Singapore" },
    { label: "London (GMT/BST)", value: "Europe/London" },
    { label: "New York (EST/EDT)", value: "America/New_York" },
    { label: "San Francisco (PST/PDT)", value: "America/Los_Angeles" },
    { label: "Dubai (GST)", value: "Asia/Dubai" },
    { label: "Tokyo (JST)", value: "Asia/Tokyo" }
  ]

  // Organizer Logic
  const [organizerEmail, setOrganizerEmail] = useState("")
  const [addingOrganizer, setAddingOrganizer] = useState(false)
  const [team, setTeam] = useState<string[]>([])

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (!formData.tags.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag]
        })
      }
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tagToRemove)
    })
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Create a date object from the local string and the selected timezone
      // Since datetime-local gives "YYYY-MM-DDTHH:mm", we can treat it as the target time
      const result = await createEvent({
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      })
      
      if (result?.error) {
        toast.error(result.error)
        return
      }

      setCreatedEventId(result.data.id)
      toast.success("Event created successfully! Now you can add organizers.")
    } catch (error: any) {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddOrganizer = async () => {
    if (!createdEventId || !organizerEmail) return
    setAddingOrganizer(true)
    try {
      const result = await addOrganizer(createdEventId, organizerEmail)
      
      if (result?.error) {
        toast.error(result.error)
        return
      }

      setTeam(prev => [...prev, organizerEmail])
      setOrganizerEmail("")
      toast.success("Organizer added successfully!")
    } catch (error: any) {
      toast.error("Failed to connect to server. Please check your internet.")
    } finally {
      setAddingOrganizer(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Host an Event</h1>
          <p className="text-muted-foreground">Fill in the details to launch your professional session.</p>
        </div>

        {!createdEventId ? (
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Once created, you can invite other organizers.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. AI Innovation Summit" 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Markdown supported)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Tell us what the event is about..." 
                    className="min-h-[120px]"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start Time</Label>
                    <Input 
                      id="start" 
                      type="datetime-local" 
                      required 
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End Time</Label>
                    <Input 
                      id="end" 
                      type="datetime-local" 
                      required 
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    value={formData.timezone}
                    onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">Venue / Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="venue" 
                      placeholder="Main Hall A / Zoom Link" 
                      className="pl-10"
                      value={formData.venue}
                      onChange={(e) => setFormData({...formData, venue: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-sm cursor-pointer" htmlFor="vol-open">Open for Volunteers</Label>
                        <p className="text-[10px] text-muted-foreground">Accept volunteer apps.</p>
                      </div>
                    </div>
                    <Switch 
                      id="vol-open"
                      checked={formData.is_volunteer_open} 
                      onCheckedChange={(v) => setFormData({...formData, is_volunteer_open: v})} 
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-amber-500/10">
                        <Lock className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-sm cursor-pointer" htmlFor="invite-only">Invite Only</Label>
                        <p className="text-[10px] text-muted-foreground">Private session.</p>
                      </div>
                    </div>
                    <Switch 
                      id="invite-only"
                      checked={formData.is_invite_only} 
                      onCheckedChange={(v) => setFormData({...formData, is_invite_only: v})} 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base">Event Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
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
                      Add tags like AI, Frontend, Networking to help people find your event.
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Create Event
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Event Created!
                </CardTitle>
                <CardDescription>Your event is now live. Add organizers to collaborate.</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manage Team
                </CardTitle>
                <CardDescription>Add organizers by their registered email address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="colleague@company.com" 
                      className="pl-10"
                      value={organizerEmail}
                      onChange={(e) => setOrganizerEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddOrganizer} disabled={addingOrganizer || !organizerEmail}>
                    {addingOrganizer ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Invited Organizers</h4>
                  <div className="flex flex-wrap gap-2">
                    {team.length > 0 ? team.map(email => (
                      <Badge key={email} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                        {email}
                        <Trash2 className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setTeam(prev => prev.filter(e => e !== email))} />
                      </Badge>
                    )) : (
                      <p className="text-sm text-muted-foreground italic">No organizers added yet.</p>
                    )}
                  </div>
                </div>

                <Separator />
                
                <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                  Done & Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
