"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Mail, 
  Lock, 
  Phone, 
  Building2, 
  Briefcase, 
  School, 
  Calendar,
  Upload,
  Sparkles,
  Check,
  X
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type UserType = "professional" | "student" | null

interface FormData {
  userType: UserType
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  // Professional fields
  company?: string
  designation?: string
  experience?: string
  // Student fields
  college?: string
  degree?: string
  yearOfStudy?: string
  // LinkedIn
  linkedinFile?: File
  suggestedSkills?: string[]
  selectedSkills?: string[]
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    userType: null,
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    suggestedSkills: [],
    selectedSkills: [],
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()
  const router = useRouter()

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const validatePhone = (phone: string) => {
    return /^\+?[\d\s-()]+$/.test(phone) && phone.replace(/\D/g, "").length >= 10
  }

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0: // User type selection
        if (!formData.userType) {
          toast.error("Please select your role")
          return false
        }
        break

      case 1: // Full name
        if (!formData.fullName.trim()) {
          newErrors.fullName = "Name is required"
        } else if (formData.fullName.trim().length < 2) {
          newErrors.fullName = "Name must be at least 2 characters"
        }
        break

      case 2: // Email
        if (!formData.email.trim()) {
          newErrors.email = "Email is required"
        } else if (!validateEmail(formData.email)) {
          newErrors.email = "Please enter a valid email"
        }
        break

      case 3: // Password
        if (!formData.password) {
          newErrors.password = "Password is required"
        } else if (!validatePassword(formData.password)) {
          newErrors.password = "Password must be at least 6 characters"
        }
        break

      case 4: // Confirm password
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password"
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match"
        }
        break

      case 5: // Phone
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone number is required"
        } else if (!validatePhone(formData.phone)) {
          newErrors.phone = "Please enter a valid phone number"
        }
        break

      case 6: // Professional/Student specific
        if (formData.userType === "professional") {
          if (!formData.company?.trim()) {
            newErrors.company = "Company name is required"
          }
        } else {
          if (!formData.college?.trim()) {
            newErrors.college = "College name is required"
          }
        }
        break

      case 7: // Additional info
        if (formData.userType === "professional") {
          if (!formData.designation?.trim()) {
            newErrors.designation = "Designation is required"
          }
          if (!formData.experience) {
            newErrors.experience = "Experience is required"
          }
        } else {
          if (!formData.degree) {
            newErrors.degree = "Degree is required"
          }
          if (!formData.yearOfStudy) {
            newErrors.yearOfStudy = "Year of study is required"
          }
        }
        break
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0]
      toast.error(firstError)
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => prev + 1)
      setErrors({})
    }
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
    setErrors({})
  }

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    updateFormData("linkedinFile", file)
    setIsProcessing(true)

    try {
      // Extract text from PDF and get skill suggestions
      const formDataToSend = new FormData()
      formDataToSend.append("file", file)

      const response = await fetch("/api/extract-skills", {
        method: "POST",
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        // Even on error, if we got default skills, use them
        if (data.skills && data.skills.length > 0) {
          updateFormData("suggestedSkills", data.skills)
          toast.success(data.message || "Using default skills")
          handleNext()
        } else {
          throw new Error(data.error || "Failed to process file")
        }
      } else {
        const { skills, message } = data
        updateFormData("suggestedSkills", skills)
        toast.success(message || "Profile analyzed! Review suggested skills")
        handleNext()
      }
    } catch (error: any) {
      console.error("File upload error:", error)
      toast.error(error.message || "Failed to analyze profile. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleSkill = (skill: string) => {
    const selected = formData.selectedSkills || []
    if (selected.includes(skill)) {
      updateFormData("selectedSkills", selected.filter((s) => s !== skill))
    } else {
      updateFormData("selectedSkills", [...selected, skill])
    }
  }

  const handleSubmit = async () => {
    if ((formData.selectedSkills?.length || 0) === 0) {
      toast.error("Please select at least one skill")
      return
    }

    setIsSubmitting(true)

    try {
      let linkedinPdfUrl = ""
      if (formData.linkedinFile) {
        const fileExt = formData.linkedinFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(fileName, formData.linkedinFile)
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('profiles')
            .getPublicUrl(fileName)
          linkedinPdfUrl = publicUrl
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            user_type: formData.userType,
            linkedin_pdf_url: linkedinPdfUrl,
            ...(formData.userType === "professional"
              ? {
                  company: formData.company,
                  designation: formData.designation,
                  experience: formData.experience,
                }
              : {
                  college: formData.college,
                  degree: formData.degree,
                  year_of_study: formData.yearOfStudy,
                }),
            skills: formData.selectedSkills,
          },
        },
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      if (authData.user) {
        toast.success("Account created successfully!")
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSteps = formData.userType ? 9 : 0

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepContainer>
            <StepTitle>Welcome! 👋</StepTitle>
            <StepDescription>Let's get started. Are you a...</StepDescription>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <Card
                className={`p-6 cursor-pointer transition-all hover:scale-105 hover:border-primary ${
                  formData.userType === "professional" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => {
                  updateFormData("userType", "professional")
                  setTimeout(() => setStep(1), 300)
                }}
              >
                <Briefcase className="h-12 w-12 mb-4 text-primary mx-auto" />
                <h3 className="text-lg font-semibold text-center">Professional</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Working professional or entrepreneur
                </p>
              </Card>
              <Card
                className={`p-6 cursor-pointer transition-all hover:scale-105 hover:border-primary ${
                  formData.userType === "student" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => {
                  updateFormData("userType", "student")
                  setTimeout(() => setStep(1), 300)
                }}
              >
                <GraduationCap className="h-12 w-12 mb-4 text-primary mx-auto" />
                <h3 className="text-lg font-semibold text-center">Student</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Undergraduate or postgraduate student
                </p>
              </Card>
            </div>
          </StepContainer>
        )

      case 1:
        return (
          <StepContainer>
            <StepTitle>What's your name? ✨</StepTitle>
            <StepDescription>This is how we'll address you at the event</StepDescription>
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => updateFormData("fullName", e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleNext()}
                  className="border-0 bg-transparent text-lg focus-visible:ring-0"
                  autoFocus
                />
              </div>
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>
          </StepContainer>
        )

      case 2:
        return (
          <StepContainer>
            <StepTitle>Your email address 📧</StepTitle>
            <StepDescription>We'll use this for login and event updates</StepDescription>
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleNext()}
                  className="border-0 bg-transparent text-lg focus-visible:ring-0"
                  autoFocus
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
          </StepContainer>
        )

      case 3:
        return (
          <StepContainer>
            <StepTitle>Create a password 🔒</StepTitle>
            <StepDescription>At least 6 characters</StepDescription>
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleNext()}
                  className="border-0 bg-transparent text-lg focus-visible:ring-0"
                  autoFocus
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
          </StepContainer>
        )

      case 4:
        return (
          <StepContainer>
            <StepTitle>Confirm your password 🔑</StepTitle>
            <StepDescription>Type it again to make sure</StepDescription>
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleNext()}
                  className="border-0 bg-transparent text-lg focus-visible:ring-0"
                  autoFocus
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </StepContainer>
        )

      case 5:
        return (
          <StepContainer>
            <StepTitle>Phone number 📱</StepTitle>
            <StepDescription>For event updates and networking</StepDescription>
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleNext()}
                  className="border-0 bg-transparent text-lg focus-visible:ring-0"
                  autoFocus
                />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
          </StepContainer>
        )

      case 6:
        return (
          <StepContainer>
            {formData.userType === "professional" ? (
              <>
                <StepTitle>Where do you work? 🏢</StepTitle>
                <StepDescription>Your current company or organization</StepDescription>
                <div className="mt-8 space-y-2">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Company name"
                      value={formData.company || ""}
                      onChange={(e) => updateFormData("company", e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleNext()}
                      className="border-0 bg-transparent text-lg focus-visible:ring-0"
                      autoFocus
                    />
                  </div>
                  {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
                </div>
              </>
            ) : (
              <>
                <StepTitle>Which college? 🎓</StepTitle>
                <StepDescription>Your current educational institution</StepDescription>
                <div className="mt-8 space-y-2">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <School className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="College or university name"
                      value={formData.college || ""}
                      onChange={(e) => updateFormData("college", e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleNext()}
                      className="border-0 bg-transparent text-lg focus-visible:ring-0"
                      autoFocus
                    />
                  </div>
                  {errors.college && <p className="text-sm text-destructive">{errors.college}</p>}
                </div>
              </>
            )}
          </StepContainer>
        )

      case 7:
        return (
          <StepContainer>
            {formData.userType === "professional" ? (
              <>
                <StepTitle>Your role & experience 💼</StepTitle>
                <StepDescription>Tell us about your professional background</StepDescription>
                <div className="mt-8 space-y-4">
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="e.g., Senior Developer, Product Manager"
                        value={formData.designation || ""}
                        onChange={(e) => updateFormData("designation", e.target.value)}
                        className="border-0 bg-transparent text-lg focus-visible:ring-0"
                        autoFocus
                      />
                    </div>
                    {errors.designation && (
                      <p className="text-sm text-destructive">{errors.designation}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Years of Experience</Label>
                    <Select
                      value={formData.experience}
                      onValueChange={(value) => updateFormData("experience", value)}
                    >
                      <SelectTrigger className="text-lg">
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="1-3">1-3 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.experience && (
                      <p className="text-sm text-destructive">{errors.experience}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <StepTitle>Academic details 📚</StepTitle>
                <StepDescription>Your current program and year</StepDescription>
                <div className="mt-8 space-y-4">
                  <div className="space-y-2">
                    <Label>Degree Program</Label>
                    <Select
                      value={formData.degree}
                      onValueChange={(value) => updateFormData("degree", value)}
                    >
                      <SelectTrigger className="text-lg">
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B.Tech">B.Tech</SelectItem>
                        <SelectItem value="B.E">B.E</SelectItem>
                        <SelectItem value="BCA">BCA</SelectItem>
                        <SelectItem value="BSc">BSc</SelectItem>
                        <SelectItem value="M.Tech">M.Tech</SelectItem>
                        <SelectItem value="MCA">MCA</SelectItem>
                        <SelectItem value="MSc">MSc</SelectItem>
                        <SelectItem value="MBA">MBA</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.degree && <p className="text-sm text-destructive">{errors.degree}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Year of Study</Label>
                    <Select
                      value={formData.yearOfStudy}
                      onValueChange={(value) => updateFormData("yearOfStudy", value)}
                    >
                      <SelectTrigger className="text-lg">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                        <SelectItem value="5">5th Year</SelectItem>
                        <SelectItem value="6">6th Year</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.yearOfStudy && (
                      <p className="text-sm text-destructive">{errors.yearOfStudy}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </StepContainer>
        )

      case 8:
        return (
          <StepContainer>
            <StepTitle>Upload LinkedIn Profile 📄</StepTitle>
            <StepDescription>
              We'll analyze your profile and suggest relevant skills (PDF only)
            </StepDescription>
            <div className="mt-8">
              <label
                htmlFor="linkedin-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
                  {formData.linkedinFile && (
                    <p className="mt-4 text-sm text-primary font-medium">
                      ✓ {formData.linkedinFile.name}
                    </p>
                  )}
                </div>
                <input
                  id="linkedin-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </label>
              {isProcessing && (
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  Analyzing your profile... This may take a moment.
                </p>
              )}
            </div>
          </StepContainer>
        )

      case 9:
        return (
          <StepContainer>
            <StepTitle>Select your skills ✨</StepTitle>
            <StepDescription>
              Based on your profile, here are suggested skills. Select the ones that apply.
            </StepDescription>
            <div className="mt-8">
              {formData.suggestedSkills && formData.suggestedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.suggestedSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={
                        formData.selectedSkills?.includes(skill) ? "default" : "outline"
                      }
                      className="text-sm px-4 py-2 cursor-pointer transition-all hover:scale-105"
                      onClick={() => toggleSkill(skill)}
                    >
                      {formData.selectedSkills?.includes(skill) ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <span className="w-3 mr-1" />
                      )}
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No skills extracted yet</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                Selected: {formData.selectedSkills?.length || 0} skill(s)
              </p>
            </div>
          </StepContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((step) / (totalSteps)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Step {step + 1} of {totalSteps + 1}
          </p>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 mt-8"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={isProcessing || isSubmitting}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {step < 8 ? (
              <Button
                size="lg"
                onClick={handleNext}
                disabled={isProcessing}
                className="flex-1"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : step === 9 ? (
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Creating account..." : "Complete Registration"}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            ) : null}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function StepContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-lg p-8 shadow-lg min-h-[400px] flex flex-col justify-center">
      {children}
    </div>
  )
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl font-bold mb-2">{children}</h2>
}

function StepDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>
}
