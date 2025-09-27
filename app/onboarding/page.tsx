"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { Upload, Loader2, CheckCircle, X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

type OnboardingStep = "register" | "upload" | "interests" | "complete"

const mockInterests = [
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Cloud Computing",
  "Data Science",
  "Cybersecurity",
  "Mobile Development",
  "DevOps",
  "Blockchain",
  "Product Management",
  "UX Design",
  "Digital Marketing",
  "Startup Ecosystem",
  "Leadership",
  "Innovation",
  "Sustainability",
  "Fintech",
  "Healthcare Tech",
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("register")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    company: "",
    role: "",
  })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [customInterest, setCustomInterest] = useState("")

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep("upload")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setIsUploading(true)
      setUploadProgress(0)

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            setUploadComplete(true)
            setTimeout(() => setCurrentStep("interests"), 1500)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))
  }

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests((prev) => [...prev, customInterest.trim()])
      setCustomInterest("")
    }
  }

  const removeInterest = (interest: string) => {
    setSelectedInterests((prev) => prev.filter((i) => i !== interest))
  }

  const handleCompleteOnboarding = () => {
    setCurrentStep("complete")
    setTimeout(() => {
      window.location.href = "/dashboard"
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <div className="flex items-center justify-center gap-2 mb-6">
            {["register", "upload", "interests", "complete"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step
                      ? "bg-primary text-primary-foreground"
                      : ["register", "upload", "interests", "complete"].indexOf(currentStep) > index
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && <div className="w-12 h-px bg-border mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Registration Step */}
        {currentStep === "register" && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to Event Hub</CardTitle>
              <CardDescription>
                Create your account to get started with your personalized event experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Upload Step */}
        {currentStep === "upload" && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Upload Your LinkedIn Profile</CardTitle>
              <CardDescription>We'll analyze your profile to create personalized recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadComplete ? (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={isUploading}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-4">
                        {isUploading ? (
                          <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        ) : (
                          <Upload className="h-12 w-12 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-lg font-medium">
                            {isUploading ? "Processing your profile..." : "Drop your LinkedIn PDF here"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isUploading ? `${uploadProgress}% complete` : "or click to browse files"}
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {isUploading && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  <div className="text-center text-sm text-muted-foreground">
                    <p>
                      Don't have a LinkedIn PDF?{" "}
                      <Link href="#" className="text-primary hover:underline">
                        Learn how to export
                      </Link>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Profile Uploaded Successfully!</h3>
                  <p className="text-muted-foreground">Analyzing your interests and experience...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Interests Step */}
        {currentStep === "interests" && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Your Interest Profile</CardTitle>
              <CardDescription>
                We've identified these interests from your profile. Add or remove any to personalize your experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selected Interests */}
              {selectedInterests.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">Your Selected Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map((interest) => (
                      <Badge key={interest} variant="default" className="px-3 py-1">
                        {interest}
                        <button onClick={() => removeInterest(interest)} className="ml-2 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Interest */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Add Custom Interest</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a custom interest..."
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
                  />
                  <Button onClick={addCustomInterest} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Available Interests */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Suggested Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {mockInterests
                    .filter((interest) => !selectedInterests.includes(interest))
                    .map((interest) => (
                      <Badge
                        key={interest}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                </div>
              </div>

              <Button
                onClick={handleCompleteOnboarding}
                className="w-full"
                size="lg"
                disabled={selectedInterests.length === 0}
              >
                Complete Setup ({selectedInterests.length} interests selected)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Welcome to Event Hub!</h3>
              <p className="text-muted-foreground mb-4">
                Your profile is ready. Redirecting to your personalized dashboard...
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
