"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      window.location.href = "/dashboard"
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-primary/5 border-r border-border">
        <div className="max-w-md space-y-6 px-12 py-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Returning Attendees
          </span>
          <h2 className="text-4xl font-bold leading-tight">
            Access your personalized event agenda, connections, and live updates.
          </h2>
          <p className="text-muted-foreground text-lg">
            Log back in to pick up where you left off and discover fresh recommendations tailored to your interests.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div>
              <p className="text-2xl font-semibold text-foreground">97%</p>
              <p>Match satisfaction rate</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">24/7</p>
              <p>AI concierge support</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">Log in with your event registration email to continue.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Log in to Event Hub</CardTitle>
              <CardDescription>Enter your credentials to access your personalized experience.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="jane.doe@email.com" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="font-normal">
                      Remember me
                    </Label>
                  </div>
                  <Link href="#" className="text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            New to Event Hub?{" "}
            <Link href="/onboarding" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

