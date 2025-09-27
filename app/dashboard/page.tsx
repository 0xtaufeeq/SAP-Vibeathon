import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, MessageSquare, TrendingUp, Clock, Star } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ChatWidget } from "@/components/chat-widget"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, John!</h1>
          <p className="text-muted-foreground">Here's what's happening at your event today.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-xs text-muted-foreground">Sessions Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">New Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">95%</p>
                  <p className="text-xs text-muted-foreground">Match Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" asChild>
            <Link href="/agenda">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">My Agenda</CardTitle>
                    <CardDescription>5 sessions today</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View your personalized schedule and discover new sessions
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer" asChild>
            <Link href="/networking">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Networking</CardTitle>
                    <CardDescription>12 new matches</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Connect with like-minded professionals</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer" asChild>
            <Link href="/chat">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Concierge</CardTitle>
                    <CardDescription>Ask me anything</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Get instant help and recommendations</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Today's Schedule Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/agenda">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-primary">9:00 AM</div>
                <div className="flex-1">
                  <p className="font-medium">The Future of AI in Web Development</p>
                  <p className="text-sm text-muted-foreground">Main Stage • Sarah Chen</p>
                </div>
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-primary">4:15 PM</div>
                <div className="flex-1">
                  <p className="font-medium">Advanced Machine Learning Techniques</p>
                  <p className="text-sm text-muted-foreground">Main Stage • Dr. James Liu</p>
                </div>
                <Star className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChatWidget />
    </div>
  )
}
