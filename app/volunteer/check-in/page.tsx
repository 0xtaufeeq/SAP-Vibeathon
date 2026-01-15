"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation } from "@/components/navigation"
import { useUser } from "@/hooks/use-supabase"
import { processCheckIn } from "@/lib/actions"
import { toast } from "sonner"
import { Scan, ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react"

export default function VolunteerCheckInPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get("eventId")
  const { user } = useUser()
  const router = useRouter()
  
  const [ticketHash, setTicketHash] = useState("")
  const [loading, setLoading] = useState(false)
  const [lastCheckIn, setLastCheckIn] = useState<any>(null)

  useEffect(() => {
    if (!eventId) {
      router.push("/dashboard")
    }
  }, [eventId, router])

  const handleCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!ticketHash || !eventId || !user) return

    setLoading(true)
    try {
      const result = await processCheckIn(ticketHash)
      
      if (result.success) {
        toast.success("Check-in successful!")
        setLastCheckIn({
          success: true,
          name: "Attendee", // The userName isn't returned by current processCheckIn Implementation
          time: new Date().toLocaleTimeString()
        })
        setTicketHash("")
      }
    } catch (error: any) {
      console.error("Check-in error:", error)
      const errorMessage = error.message || "Check-in failed"
      toast.error(errorMessage)
      setLastCheckIn({
        success: false,
        error: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scan className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Attendee Check-in</CardTitle>
            </div>
            <CardDescription>
              Enter the ticket hash or scan the attendee's QR code to verify their registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticketHash">Ticket Hash / Code</Label>
                <div className="flex gap-2">
                  <Input 
                    id="ticketHash"
                    placeholder="Paste ticket hash here..."
                    value={ticketHash}
                    onChange={(e) => setTicketHash(e.target.value)}
                    className="font-mono"
                    autoFocus
                  />
                  <Button type="submit" disabled={loading || !ticketHash}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
              </div>
            </form>

            {lastCheckIn && (
              <div className={`mt-8 p-4 rounded-lg border flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 ${
                lastCheckIn.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
              }`}>
                {lastCheckIn.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mt-1" />
                )}
                <div>
                  <h4 className={`font-bold ${lastCheckIn.success ? 'text-green-700' : 'text-red-700'}`}>
                    {lastCheckIn.success ? 'Check-in Confirmed' : 'Check-in Rejected'}
                  </h4>
                  {lastCheckIn.success ? (
                    <p className="text-sm text-green-600">
                      Attendee: <span className="font-semibold">{lastCheckIn.name}</span>
                      <br />
                      Time: {lastCheckIn.time}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">{lastCheckIn.error}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 bg-muted p-6 rounded-xl space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Volunteer Instructions
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
            <li>Ask the attendee for their digital ticket on the event app.</li>
            <li>Verify the name on their ID matches the name shown after verification.</li>
            <li>If the ticket hash is invalid, ask them to refresh their profile page.</li>
            <li>Direct any issues to the head organizer.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
