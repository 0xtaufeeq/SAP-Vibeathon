"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  GraduationCap,
  MapPin,
  Download,
  Share2,
  Edit,
  QrCode,
  Calendar,
  Award,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
import { useUser } from "@/hooks/use-supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import QRCodeLib from "qrcode"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"

interface Registration {
  reg_id: number
  event_id: number
  ticket_hash: string
  event_title: string
  start_time: string
  venue: string
  is_checked_in: boolean
  qr_code?: string
}

interface UserProfile {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    phone?: string
    user_type?: "professional" | "student"
    company?: string
    designation?: string
    experience?: string
    college?: string
    degree?: string
    year_of_study?: string
    skills?: string[]
    avatar_url?: string
  }
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [stats, setStats] = useState({
    attended: 0,
    connections: 0,
    organized: 0,
    volunteered: 0
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    company: "",
    designation: "",
    experience: "",
    college: "",
    degree: "",
    year_of_study: "",
    skills: [] as string[]
  })
  const [skillInput, setSkillInput] = useState("")

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push("/login")
        return
      }
      loadUserProfile()
      // Initialize edit form with current data
      if (user.user_metadata) {
        setEditForm({
          full_name: user.user_metadata.full_name || "",
          phone: user.user_metadata.phone || "",
          company: user.user_metadata.company || "",
          designation: user.user_metadata.designation || "",
          experience: user.user_metadata.experience || "",
          college: user.user_metadata.college || "",
          degree: user.user_metadata.degree || "",
          year_of_study: user.user_metadata.year_of_study || "",
          skills: user.user_metadata.skills || []
        })
      }
    }
  }, [user, userLoading, router])

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && skillInput.trim()) {
      e.preventDefault()
      const newSkill = skillInput.trim()
      if (!editForm.skills.includes(newSkill)) {
        setEditForm({
          ...editForm,
          skills: [...editForm.skills, newSkill]
        })
      }
      setSkillInput("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(s => s !== skillToRemove)
    })
  }

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const supabase = createClient()
      
      // Fetch registrations with event details
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          reg_id,
          event_id,
          ticket_hash,
          is_checked_in,
          events (
            title,
            start_time,
            end_time,
            venue
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'APPROVED')

      if (error) throw error

      if (data) {
        const regsWithQr = await Promise.all(data.map(async (reg: any) => {
          const qrData = JSON.stringify({
            regId: reg.reg_id,
            ticketHash: reg.ticket_hash,
            userId: user.id,
            eventId: reg.event_id
          })
          
          const qrCodeDataUrl = await QRCodeLib.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF"
            }
          })

          return {
            reg_id: reg.reg_id,
            event_id: reg.event_id,
            ticket_hash: reg.ticket_hash,
            event_title: reg.events.title,
            start_time: reg.events.start_time,
            end_time: reg.events.end_time, // Added end_time
            venue: reg.events.venue,
            is_checked_in: reg.is_checked_in,
            qr_code: qrCodeDataUrl
          }
        }))
        // Filter out events that have already ended
        const activeRegs = regsWithQr.filter((reg: any) => new Date(reg.end_time) > new Date())
        setRegistrations(activeRegs)
        
        // Calculate basic stats from registrations (from all registrations, not just active ones)
        const attended = data.filter((r: any) => r.is_checked_in).length
        
        // Fetch organized events count
        const { count: organizedCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)

        // Fetch connections count
        const { count: connectCount } = await supabase
          .from('user_connections')
          .select('*', { count: 'exact', head: true })
          .or(`follower_id.eq.${user.id},followed_id.eq.${user.id}`)
          .eq('status', 'APPROVED')

        // Fetch volunteering count
        const { count: volunteerCount } = await supabase
          .from('event_team')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('role', 'VOLUNTEER')
          .eq('status', 'APPROVED')

        setStats({
          attended: attended,
          organized: organizedCount || 0,
          connections: connectCount || 0,
          volunteered: volunteerCount || 0
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Failed to load registrations")
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = (reg: Registration) => {
    if (!reg.qr_code) return
    
    const link = document.createElement("a")
    link.href = reg.qr_code
    link.download = `qr-${reg.event_title.replace(/\s+/g, '-').toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`${reg.event_title} QR code downloaded!`)
  }

  const downloadAllQRs = async () => {
    if (registrations.length === 0) return
    
    toast.info("Preparing QR codes for download...")
    
    // For simplicity in a web env without specialized zip libs, we'll download them sequentially or just a few.
    // In a real app one might use jszip.
    for (const reg of registrations) {
      downloadQRCode(reg)
      // Small delay to prevent browser blocking multiple downloads
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    toast.success("All QR codes downloaded!")
  }

  const nextQR = () => {
    setCurrentIndex((prev) => (prev + 1) % registrations.length)
  }

  const prevQR = () => {
    setCurrentIndex((prev) => (prev - 1 + registrations.length) % registrations.length)
  }

  const shareProfile = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: "My Event Profile",
          text: `Check out my profile for the event!`,
          url: window.location.href
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Profile link copied to clipboard!")
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const supabase = createClient()
      
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          ...editForm
        }
      })
      
      if (error) throw error
      
      toast.success("Profile updated successfully!")
      setEditDialogOpen(false)
      
      // Reload the page to get fresh data
      window.location.reload()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const metadata = user.user_metadata
  const isProfessional = 
    metadata?.user_type?.toLowerCase() === "professional" || 
    metadata?.attendee_category?.toLowerCase() === "professional"

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">My Profile</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={shareProfile}
              className="transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              <Share2 className="h-4 w-4 mr-2 transition-transform duration-300 hover:rotate-12" />
              Share
            </Button>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <Edit className="h-4 w-4 mr-2 transition-transform duration-300 hover:rotate-12" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in-right">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your profile information. Changes will be reflected across the platform.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  {isProfessional ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={editForm.company}
                          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                          placeholder="Enter your company name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="designation">Designation</Label>
                        <Input
                          id="designation"
                          value={editForm.designation}
                          onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                          placeholder="Enter your job title"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          value={editForm.experience}
                          onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                          placeholder="Enter years of experience"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="college">College/University</Label>
                        <Input
                          id="college"
                          value={editForm.college}
                          onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                          placeholder="Enter your college name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="degree">Degree/Program</Label>
                        <Input
                          id="degree"
                          value={editForm.degree}
                          onChange={(e) => setEditForm({ ...editForm, degree: e.target.value })}
                          placeholder="Enter your degree"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="year_of_study">Year of Study</Label>
                        <Select
                          value={editForm.year_of_study}
                          onValueChange={(value) => setEditForm({ ...editForm, year_of_study: value })}
                        >
                          <SelectTrigger id="year_of_study">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1st Year</SelectItem>
                            <SelectItem value="2">2nd Year</SelectItem>
                            <SelectItem value="3">3rd Year</SelectItem>
                            <SelectItem value="4">4th Year</SelectItem>
                            <SelectItem value="5">5th Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base">Skills & Interests</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editForm.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
                          {skill}
                          <button 
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Type a skill and press Space or Enter..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Press Space or Enter to add a skill. Click the X to remove.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Profile Card */}
            <Card className="animate-fade-in-up transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/50 hover:scale-110">
                    <AvatarImage src={metadata?.avatar_url} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(metadata?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {metadata?.full_name || "User"}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={isProfessional ? "default" : "secondary"} className="animate-bounce-in">
                        {isProfessional ? (
                          <>
                            <Briefcase className="h-3 w-3 mr-1" />
                            Professional
                          </>
                        ) : (
                          <>
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Student
                          </>
                        )}
                      </Badge>
                    </div>
                    {isProfessional ? (
                      <div className="space-y-1">
                        {metadata?.designation && (
                          <p className="text-lg font-semibold">{metadata.designation}</p>
                        )}
                        {metadata?.company && (
                          <p className="text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {metadata.company}
                          </p>
                        )}
                        {metadata?.experience && (
                          <p className="text-sm text-muted-foreground">
                            {metadata.experience} years experience
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {metadata?.degree && (
                          <p className="text-lg font-semibold">{metadata.degree}</p>
                        )}
                        {metadata?.college && (
                          <p className="text-muted-foreground flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            {metadata.college}
                          </p>
                        )}
                        {metadata?.year_of_study && (
                          <p className="text-sm text-muted-foreground">
                            Year {metadata.year_of_study}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  {metadata?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{metadata.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills & Interests */}
            {metadata?.skills && metadata.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Skills & Interests
                  </CardTitle>
                  <CardDescription>
                    Your areas of expertise and interests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {metadata.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity/Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Event Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-3xl font-bold text-primary">{stats.attended}</p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">Sessions Attended</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-3xl font-bold text-primary">{stats.connections}</p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">Connections Made</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-3xl font-bold text-primary">{stats.organized}</p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">Events Organized</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-3xl font-bold text-primary">{stats.volunteered}</p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">Volunteered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - QR Code Slider */}
          <div className="space-y-6">
            <Card className="sticky top-4 animate-fade-in-up transition-all duration-300 hover:shadow-xl overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-primary/10 rounded-full transition-all duration-300 hover:bg-primary/20 hover:scale-110 hover:rotate-12">
                    <QrCode className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle>Your Event Passes</CardTitle>
                <CardDescription>
                  {registrations.length > 0 
                    ? `You have ${registrations.length} registered event${registrations.length > 1 ? 's' : ''}`
                    : "You haven't registered for any events yet"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {registrations.length > 0 ? (
                  <>
                    <div className="relative group">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentIndex}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col items-center"
                        >
                          <div className="p-4 bg-white rounded-lg border-2 border-primary transition-all duration-300 hover:border-primary/70 hover:shadow-lg hover:scale-105">
                            <img 
                              src={registrations[currentIndex].qr_code} 
                              alt={`${registrations[currentIndex].event_title} QR Code`} 
                              className="w-48 h-48"
                            />
                          </div>
                          
                          <div className="mt-4 text-center">
                            <h4 className="font-bold text-lg line-clamp-1">{registrations[currentIndex].event_title}</h4>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(registrations[currentIndex].start_time).toLocaleDateString()}
                            </p>
                            <p className="text-xs font-mono font-semibold mt-1 text-primary">
                              {registrations[currentIndex].ticket_hash.substring(0, 8).toUpperCase()}
                            </p>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {registrations.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-0 top-1/2 -translate-y-12 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={prevQR}
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-1/2 -translate-y-12 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={nextQR}
                          >
                            <ChevronRight className="h-6 w-6" />
                          </Button>
                          
                          <div className="flex justify-center gap-1 mt-2">
                            {registrations.map((_, idx) => (
                              <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-primary/20'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        className="w-full transition-all duration-300 hover:scale-105" 
                        onClick={() => downloadQRCode(registrations[currentIndex])}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Save Current
                      </Button>
                      <Button 
                        className="w-full transition-all duration-300 hover:scale-105" 
                        onClick={downloadAllQRs}
                        variant="default"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Save All
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No registrations found.</p>
                    <Button 
                      variant="link" 
                      onClick={() => router.push('/explore')}
                      className="mt-2"
                    >
                      Browse events
                    </Button>
                  </div>
                )}

                <div className="bg-muted p-4 rounded-lg transition-all duration-300 hover:bg-muted/80">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Check-in Info
                  </h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• One QR per event</li>
                    <li>• Scan at the entry gate</li>
                    <li>• Works offline after download</li>
                    <li>• Keep your ticket hash private</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
