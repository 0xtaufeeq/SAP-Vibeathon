"use client"

import type React from "react"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { Upload, Loader2, CheckCircle, X, Plus, ArrowLeft, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

type OnboardingStep = "register" | "upload" | "interests" | "complete"

const defaultInterests = [
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

const steps: Array<{
  id: OnboardingStep
  title: string
  description: string
  highlights: string[]
}> = [
  {
    id: "register",
    title: "Create your profile",
    description: "Tell us about yourself so we can tailor the agenda, matches, and concierge support to your goals.",
    highlights: [
      "Unlock personalized session recommendations",
      "Surface relevant people and sponsors instantly",
      "Sync your interests across agenda, chat, and networking",
    ],
  },
  {
    id: "upload",
    title: "Drop in your LinkedIn PDF",
    description: "We analyze your experience with Gemini to pre-fill key interests and talking points.",
    highlights: [
      "Secure, one-time analysis of your export",
      "No data stored after extraction",
      "Get to networking in under a minute",
    ],
  },
  {
    id: "interests",
    title: "Fine-tune your interests",
    description: "Blend AI-detected skills with your own focus areas – the graph updates recommendations in real time.",
    highlights: [
      "Tap any glowing node to add/remove an interest",
      "Type in niche topics to steer the concierge",
      "Aim for 8+ interests for best matchmaking",
    ],
  },
  {
    id: "complete",
    title: "Launch your event HQ",
    description: "Sit tight while we prep your dashboard, agenda, and smart introductions.",
    highlights: [
      "Jump straight into real-time updates",
      "Access concierge chat and networking",
      "Bookmark sessions from any device",
    ],
  },
]

const interestNodePositions = [
  { top: "12%", left: "16%" },
  { top: "8%", left: "58%" },
  { top: "22%", left: "78%" },
  { top: "40%", left: "10%" },
  { top: "36%", left: "48%" },
  { top: "44%", left: "78%" },
  { top: "62%", left: "22%" },
  { top: "66%", left: "58%" },
  { top: "78%", left: "35%" },
  { top: "18%", left: "34%" },
  { top: "54%", left: "30%" },
  { top: "70%", left: "76%" },
]

const floatingStyles = `
  @keyframes onboarding-float {
    0%, 100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(0, -16px, 0) scale(1.03);
    }
  }

  @keyframes onboarding-pulse {
    0%, 100% {
      opacity: 0.35;
    }
    50% {
      opacity: 0.7;
    }
  }
`

function AnimatedInterestGraph({
  nodes,
  onSelect,
  selected,
}: {
  nodes: string[]
  onSelect: (interest: string) => void
  selected: string[]
}) {
  return (
    <div className="relative h-[420px] rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10" />
        <div className="absolute inset-x-12 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute inset-y-12 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/15 to-transparent" />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.08),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_50%)]" />

      {nodes.map((interest, index) => {
        const position = interestNodePositions[index % interestNodePositions.length]
        const isActive = selected.includes(interest)

        return (
          <button
            key={`${interest}-${index}`}
            type="button"
            onClick={() => onSelect(interest)}
            aria-pressed={isActive}
            className={`absolute flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg backdrop-blur transition-colors duration-300 ${
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/20 bg-card/70 text-muted-foreground hover:border-primary/60 hover:text-foreground"
            }`}
            style={{
              top: position.top,
              left: position.left,
              animation: "onboarding-float 12s ease-in-out infinite",
              animationDelay: `${(index % 6) * 0.45}s`,
              animationDuration: `${12 + (index % 4) * 2}s`,
            }}
          >
            <span>{interest}</span>
            {isActive && <CheckCircle className="h-3.5 w-3.5" />}
          </button>
        )
      })}

      <div className="pointer-events-none absolute inset-3 rounded-[26px] border border-white/10" style={{ animation: "onboarding-pulse 8s ease-in-out infinite" }} />
    </div>
  )
}

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
  const [suggestedInterests, setSuggestedInterests] = useState<string[]>(defaultInterests)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const dedupeList = (values: string[]) => {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep("upload")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Unsupported file type",
        description: "Please upload a LinkedIn PDF export.",
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setIsUploading(true)
    setUploadProgress(10)
    setUploadComplete(false)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/profile-skills", {
        method: "POST",
        body: formData,
      })

      setUploadProgress(60)

      const rawPayload = await response.text()
      let payload: { skills?: string[]; error?: string } | null = null
      try {
        payload = rawPayload ? JSON.parse(rawPayload) : null
      } catch (error) {
        console.warn("Failed to parse API response", { rawPayload, error })
      }

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to analyze your profile. Please try again.")
      }

      const skills = dedupeList(payload?.skills ?? [])

      if (skills.length === 0) {
        throw new Error("We couldn't detect any skills. Please review your PDF and try again.")
      }

      setSelectedInterests(skills)
      setSuggestedInterests(dedupeList([...skills, ...defaultInterests]))
      setUploadProgress(100)
      setUploadComplete(true)

      toast({
        title: "Profile analyzed",
        description: `We detected ${skills.length} skill${skills.length === 1 ? "" : "s"}.`,
      })

      setTimeout(() => setCurrentStep("interests"), 1400)
    } catch (error) {
      console.error("Failed to analyze profile", error)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
      setUploadProgress(0)
      setUploadComplete(false)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : dedupeList([...prev, interest]),
    )
  }

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests((prev) => dedupeList([...prev, customInterest.trim()]))
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

  const currentStepIndex = Math.max(0, steps.findIndex((step) => step.id === currentStep))
  const progress = ((currentStepIndex + (currentStep === "complete" ? 1 : 0)) / steps.length) * 100
  const activeStep = steps[currentStepIndex] ?? steps[0]

  const animatedNodes = useMemo(
    () => dedupeList([...selectedInterests, ...suggestedInterests]).slice(0, 12),
    [selectedInterests, suggestedInterests],
  )

  const handleBack = () => {
    if (currentStep === "register") return
    const previousStep = steps[Math.max(0, currentStepIndex - 1)]
    setCurrentStep(previousStep.id)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <style jsx global>{floatingStyles}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/4 right-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-1/3 left-1/3 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Logo size="lg" />
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-primary">Event Hub Onboarding</p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground lg:text-4xl">
                Let's tailor your event experience
              </h1>
            </div>
          </div>
          <div className="w-full max-w-sm">
            <div className="h-2 rounded-full bg-border/40">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-3xl border border-border/60 bg-card/85 p-8 shadow-lg backdrop-blur">
            <div className="relative pl-6">
              <div className="absolute left-6 top-6 bottom-6 w-px bg-border/50" aria-hidden />
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const isActive = step.id === currentStep
                  const isComplete = index < currentStepIndex

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => (isComplete || isActive ? setCurrentStep(step.id) : null)}
                      className={`group relative w-full rounded-2xl border border-transparent px-4 py-3 text-left transition ${
                        isActive
                          ? "border-primary/80 bg-primary/15 text-foreground shadow"
                          : isComplete
                            ? "border-primary/20 bg-primary/5 text-primary"
                            : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : isComplete
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight text-foreground/90">{step.title}</p>
                          {isActive ? (
                            <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                          ) : (
                            <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-2">{step.description}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-primary/15 bg-primary/8 px-5 py-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-primary/90">
                <Sparkles className="h-4 w-4" /> Pro insight
              </p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                {activeStep.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/90 shadow-2xl backdrop-blur">
              <div className="grid gap-4 border-b border-border/40 bg-gradient-to-r from-primary/10 via-transparent to-transparent px-8 py-6 lg:grid-cols-[auto_auto] lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-primary">Step {currentStepIndex + 1}</p>
                  <h2 className="mt-2 text-[1.65rem] font-semibold text-card-foreground">{activeStep.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {activeStep.description}
                  </p>
                </div>
                {currentStep !== "register" && currentStep !== "complete" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mt-1 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                )}
              </div>

              {currentStep === "register" && (
                <div className="grid gap-0 lg:grid-cols-[1.25fr_0.95fr]">
                  <div className="space-y-8 px-8 py-8 lg:px-10">
                    <div className="rounded-2xl border border-primary/30 bg-primary/12 px-5 py-4 text-sm text-primary/90">
                      Complete your profile to unlock curated agendas, introductions, and concierge tips tailored to your goals.
                    </div>
                    <form onSubmit={handleRegister} className="space-y-7">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First name</Label>
                          <Input
                            id="firstName"
                            placeholder="Jane"
                            value={formData.firstName}
                            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last name</Label>
                          <Input
                            id="lastName"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="jane.doe@email.com"
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
                            placeholder="Create a secure password"
                            value={formData.password}
                            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            placeholder="Event Companion"
                            value={formData.company}
                            onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Input
                            id="role"
                            placeholder="Product Manager"
                            value={formData.role}
                            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <span className="leading-relaxed">We never share your information with third parties.</span>
                        <Link href="#" className="text-primary underline-offset-2 hover:underline">
                          Privacy details
                        </Link>
                      </div>
                      <Button type="submit" className="w-full" size="lg">
                        Continue to upload
                      </Button>
                    </form>
                  </div>

                  <div className="hidden border-l border-border/60 bg-secondary/5 px-8 py-12 lg:block">
                    <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">What you'll unlock</p>
                    <ul className="mt-8 space-y-6 text-sm text-muted-foreground">
                      <li className="space-y-1">
                        <span className="font-medium text-foreground">Smart agenda</span>
                        <p className="text-xs text-muted-foreground/80">Ranked sessions that match your goals.</p>
                      </li>
                      <li className="space-y-1">
                        <span className="font-medium text-foreground">Match-ready profile</span>
                        <p className="text-xs text-muted-foreground/80">Let attendees know exactly why to meet you.</p>
                      </li>
                      <li className="space-y-1">
                        <span className="font-medium text-foreground">Concierge onboarding</span>
                        <p className="text-xs text-muted-foreground/80">AI assistant primed with your context.</p>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {currentStep === "upload" && (
                <div className="grid gap-10 px-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-primary/25 bg-primary/12 px-5 py-4 text-sm text-primary/90">
                      Export your LinkedIn profile as a PDF and drop it here. Gemini will scan it in seconds to surface skills, industries, and keywords you can tweak in the next step.
                    </div>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2 text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" /> Secure, one-time processing
                      </p>
                      <p className="leading-relaxed">No storage of your PDF once interests are extracted.</p>
                      <p className="leading-relaxed">
                        Need help exporting?{' '}
                        <Link href="#" className="text-primary underline-offset-2 hover:underline">
                          View quick guide
                        </Link>
                      </p>
                    </div>
                  </div>

                  <div>
                  <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-primary/35 bg-primary/10/10 p-10 text-center transition-colors hover:border-primary/70">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={isUploading}
                        ref={fileInputRef}
                      />
                      <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center gap-4">
                        {isUploading ? (
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        ) : (
                          <Upload className="h-12 w-12 text-primary" />
                        )}
                        <div className="space-y-1.5">
                          <p className="text-lg font-medium text-foreground">
                            {isUploading ? "Analyzing your profile" : "Drag & drop your LinkedIn PDF"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isUploading ? `${uploadProgress}% complete` : "or click to browse your files"}
                          </p>
                        </div>
                        <Button variant="outline" disabled={isUploading}>
                          Browse files
                        </Button>
                      </label>
                      <div className="pointer-events-none absolute inset-4 rounded-3xl border border-primary/20" />
                    </div>

                    {isUploading && (
                      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}

                    {uploadComplete && (
                      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm text-primary">
                        <p className="font-medium text-foreground">We found key skills!</p>
                        <p className="mt-1 text-muted-foreground">Hang tight while we stage them for your interest map...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === "interests" && (
                <div className="space-y-10 px-8 py-10 lg:px-10">
                  <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-8">
                      <div className="flex flex-col gap-6 rounded-3xl border border-primary/20 bg-primary/10/20 p-6">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Your selected interests</p>
                            <p className="text-xs text-muted-foreground">Tap any tag to remove it from your focus map.</p>
                          </div>
                          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            {selectedInterests.length} chosen
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedInterests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Add at least one interest to continue.</p>
                          ) : (
                            selectedInterests.map((interest) => (
                              <Badge key={interest} variant="default" className="group px-3 py-1 text-sm">
                                {interest}
                                <button
                                  onClick={() => removeInterest(interest)}
                                  className="ml-2 rounded-full bg-black/10 p-1 text-primary-foreground/80 transition hover:bg-black/25"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Add custom interest</Label>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Input
                              placeholder="Enter a niche topic, emerging trend, or skill"
                              value={customInterest}
                              onChange={(e) => setCustomInterest(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
                            />
                            <Button onClick={addCustomInterest} size="sm" className="sm:w-auto">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Quick add keywords</Label>
                          <div className="flex flex-wrap gap-2">
                            {["Networking", "Leadership", "Customer Success", "Product Ops"].map((interest) => (
                              <Badge
                                key={interest}
                                variant="outline"
                                className="cursor-pointer px-3 py-1 text-sm transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:text-primary"
                                onClick={() => toggleInterest(interest)}
                              >
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Gemini suggestions</Label>
                        <div className="flex flex-wrap gap-2">
                          {suggestedInterests
                            .filter((interest) => !selectedInterests.includes(interest))
                            .map((interest) => (
                              <Badge
                                key={interest}
                                variant="outline"
                                className="cursor-pointer px-3 py-1 text-sm transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:text-primary"
                                onClick={() => toggleInterest(interest)}
                              >
                                {interest}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>

                    <AnimatedInterestGraph nodes={animatedNodes} onSelect={toggleInterest} selected={selectedInterests} />
                  </div>

                  <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-primary">
                    <p className="font-medium text-foreground">Pro tip</p>
                    <p className="text-muted-foreground">
                      Mix industries, disciplines, and soft skills. The more varied your interests, the better our match graph works across sessions, people, and sponsors.
                    </p>
                  </div>

                  <Button
                    onClick={handleCompleteOnboarding}
                    className="w-full"
                    size="lg"
                    disabled={selectedInterests.length === 0}
                  >
                    Complete setup ({selectedInterests.length} interests selected)
                  </Button>
                </div>
              )}

              {currentStep === "complete" && (
                <div className="px-8 py-16 text-center">
                  <CheckCircle className="mx-auto h-16 w-16 text-primary" />
                  <h3 className="mt-6 text-3xl font-semibold text-foreground">Welcome to Event Hub!</h3>
                  <p className="mt-3 text-muted-foreground">
                    Your profile is ready. We’re stitching together a personalized dashboard, matches, and agenda. Hang tight
                    while we redirect you.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /> Preparing your experience…
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
