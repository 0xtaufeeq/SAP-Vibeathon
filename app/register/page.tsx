"use client"

export const dynamic = 'force-dynamic'

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { ArrowLeft, User, GraduationCap, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type AttendeeCategory = "professional" | "student"

interface ProfessionalFormData {
  fullName: string
  email: string
  password: string
  mobileNumber: string
  attendeeCategory: "professional"
  company: string
  designation: string
  foodChoice: "veg" | "non-veg"
  country: string
  gender: string
  bloodGroup: string
  emergencyContactName: string
  emergencyContactNumber: string
  consentUpdates: boolean
}

interface StudentFormData {
  fullName: string
  email: string
  password: string
  mobileNumber: string
  attendeeCategory: "student"
  college: string
  ugPg: "UG" | "PG"
  yearOfStudy: string
  foodChoice: "veg" | "non-veg"
  country: string
  gender: string
  bloodGroup: string
  emergencyContactName: string
  emergencyContactNumber: string
  consentUpdates: boolean
}

const countries = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China", "Singapore"
]

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

const yearsOfStudy = ["1", "2", "3", "4", "5", "6"]

export default function RegisterPage() {
  const [attendeeCategory, setAttendeeCategory] = useState<AttendeeCategory | null>(null)
  const [professionalData, setProfessionalData] = useState<Partial<ProfessionalFormData>>({
    attendeeCategory: "professional",
    foodChoice: "veg",
    consentUpdates: false
  })
  const [studentData, setStudentData] = useState<Partial<StudentFormData>>({
    attendeeCategory: "student",
    foodChoice: "veg",
    ugPg: "UG",
    yearOfStudy: "1",
    consentUpdates: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [registrationId, setRegistrationId] = useState("")
  const supabase = createClient()
  const router = useRouter()

  const handleCategorySelect = (category: AttendeeCategory) => {
    setAttendeeCategory(category)
  }

  const handleProfessionalDataChange = (field: keyof ProfessionalFormData, value: any) => {
    setProfessionalData(prev => ({ ...prev, [field]: value }))
  }

  const handleStudentDataChange = (field: keyof StudentFormData, value: any) => {
    setStudentData(prev => ({ ...prev, [field]: value }))
  }

  const validateProfessionalForm = (): boolean => {
    const required = ['fullName', 'email', 'password', 'mobileNumber', 'company', 'designation', 'foodChoice']
    return required.every(field => professionalData[field as keyof ProfessionalFormData])
  }

  const validateStudentForm = (): boolean => {
    const required = ['fullName', 'email', 'password', 'mobileNumber', 'college', 'ugPg', 'yearOfStudy', 'foodChoice']
    return required.every(field => studentData[field as keyof StudentFormData])
  }

  const generateRegistrationId = (): string => {
    const prefix = attendeeCategory === "professional" ? "PROF" : "STU"
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!attendeeCategory) return

    const isValid = attendeeCategory === "professional" ? validateProfessionalForm() : validateStudentForm()
    
    if (!isValid) {
      toast.error("Please fill in all required fields before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      const data = attendeeCategory === "professional" ? professionalData : studentData
      
      // Create user account in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email!,
        password: data.password!,
        options: {
          data: {
            full_name: data.fullName,
            mobile_number: data.mobileNumber,
            phone: data.mobileNumber, // Added to match trigger COALESCE
            user_type: attendeeCategory,
            attendee_category: attendeeCategory, // Keep for backward compatibility
            ...(attendeeCategory === "professional" ? {
              company: professionalData.company,
              designation: professionalData.designation,
            } : {
              college: studentData.college,
              ug_pg: studentData.ugPg,
              year_of_study: studentData.yearOfStudy,
            }),
            food_choice: data.foodChoice,
            country: data.country,
            gender: data.gender,
            blood_group: data.bloodGroup,
            emergency_contact_name: data.emergencyContactName,
            emergency_contact_number: data.emergencyContactNumber,
            consent_updates: data.consentUpdates,
          },
        },
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      if (authData.user) {
        const regId = generateRegistrationId()
        setRegistrationId(regId)
        setRegistrationComplete(true)

        toast.success("Registration successful! Please check your email for verification.")
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Complete!</CardTitle>
            <CardDescription>
              Your registration ID is: <span className="font-mono font-bold text-primary">{registrationId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>You will receive a confirmation email with your QR code shortly.</p>
              <p className="mt-2">Check your email for event details and agenda access.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/agenda">View Agenda</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Logo size="lg" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Event Registration</h1>
            <p className="text-muted-foreground">Join us for an amazing event experience</p>
          </div>
        </div>

        {!attendeeCategory ? (
          /* Category Selection */
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Select Your Category</CardTitle>
                <CardDescription className="text-center">
                  Choose your attendee category to proceed with registration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleCategorySelect("professional")}
                  >
                    <CardContent className="p-6 text-center">
                      <User className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="text-xl font-semibold mb-2">Professional</h3>
                      <p className="text-muted-foreground text-sm">
                        For working professionals, entrepreneurs, and industry experts
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleCategorySelect("student")}
                  >
                    <CardContent className="p-6 text-center">
                      <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="text-xl font-semibold mb-2">Student</h3>
                      <p className="text-muted-foreground text-sm">
                        For undergraduate and postgraduate students
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Registration Form */
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {attendeeCategory === "professional" ? "Professional Registration" : "Student Registration"}
                    </CardTitle>
                    <CardDescription>
                      Please fill in your details to complete registration
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAttendeeCategory(null)}
                  >
                    Change Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="Enter your full name"
                          value={attendeeCategory === "professional" ? professionalData.fullName || "" : studentData.fullName || ""}
                          onChange={(e) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("fullName", e.target.value)
                            } else {
                              handleStudentDataChange("fullName", e.target.value)
                            }
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={attendeeCategory === "professional" ? professionalData.email || "" : studentData.email || ""}
                          onChange={(e) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("email", e.target.value)
                            } else {
                              handleStudentDataChange("email", e.target.value)
                            }
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobileNumber">Mobile Number *</Label>
                        <Input
                          id="mobileNumber"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={attendeeCategory === "professional" ? professionalData.mobileNumber || "" : studentData.mobileNumber || ""}
                          onChange={(e) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("mobileNumber", e.target.value)
                            } else {
                              handleStudentDataChange("mobileNumber", e.target.value)
                            }
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a password"
                          value={attendeeCategory === "professional" ? professionalData.password || "" : studentData.password || ""}
                          onChange={(e) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("password", e.target.value)
                            } else {
                              handleStudentDataChange("password", e.target.value)
                            }
                          }}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional/Student Specific Fields */}
                  {attendeeCategory === "professional" ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Professional Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company">Company *</Label>
                          <Input
                            id="company"
                            placeholder="Your company name"
                            value={professionalData.company || ""}
                            onChange={(e) => handleProfessionalDataChange("company", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="designation">Designation *</Label>
                          <Input
                            id="designation"
                            placeholder="Your job title"
                            value={professionalData.designation || ""}
                            onChange={(e) => handleProfessionalDataChange("designation", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Academic Information</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="college">College *</Label>
                          <Input
                            id="college"
                            placeholder="Your college name"
                            value={studentData.college || ""}
                            onChange={(e) => handleStudentDataChange("college", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ugPg">UG/PG *</Label>
                          <Select value={studentData.ugPg || "UG"} onValueChange={(value) => handleStudentDataChange("ugPg", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UG">Undergraduate</SelectItem>
                              <SelectItem value="PG">Postgraduate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yearOfStudy">Year of Study *</Label>
                          <Select value={studentData.yearOfStudy || "1"} onValueChange={(value) => handleStudentDataChange("yearOfStudy", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {yearsOfStudy.map(year => (
                                <SelectItem key={year} value={year}>Year {year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Additional Information</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="foodChoice">Food Choice *</Label>
                        <Select 
                          value={attendeeCategory === "professional" ? professionalData.foodChoice || "veg" : studentData.foodChoice || "veg"} 
                          onValueChange={(value) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("foodChoice", value)
                            } else {
                              handleStudentDataChange("foodChoice", value)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="veg">Vegetarian</SelectItem>
                            <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select 
                          value={attendeeCategory === "professional" ? professionalData.country || "" : studentData.country || ""} 
                          onValueChange={(value) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("country", value)
                            } else {
                              handleStudentDataChange("country", value)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select 
                          value={attendeeCategory === "professional" ? professionalData.gender || "" : studentData.gender || ""} 
                          onValueChange={(value) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("gender", value)
                            } else {
                              handleStudentDataChange("gender", value)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <Select 
                          value={attendeeCategory === "professional" ? professionalData.bloodGroup || "" : studentData.bloodGroup || ""} 
                          onValueChange={(value) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("bloodGroup", value)
                            } else {
                              handleStudentDataChange("bloodGroup", value)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                          <SelectContent>
                            {bloodGroups.map(group => (
                              <SelectItem key={group} value={group}>{group}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Emergency Contact</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                        <Input
                          id="emergencyContactName"
                          placeholder="Emergency contact full name"
                          value={attendeeCategory === "professional" ? professionalData.emergencyContactName || "" : studentData.emergencyContactName || ""}
                          onChange={(e) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("emergencyContactName", e.target.value)
                            } else {
                              handleStudentDataChange("emergencyContactName", e.target.value)
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactNumber">Emergency Contact Number</Label>
                        <Input
                          id="emergencyContactNumber"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={attendeeCategory === "professional" ? professionalData.emergencyContactNumber || "" : studentData.emergencyContactNumber || ""}
                          onChange={(e) => {
                            if (attendeeCategory === "professional") {
                              handleProfessionalDataChange("emergencyContactNumber", e.target.value)
                            } else {
                              handleStudentDataChange("emergencyContactNumber", e.target.value)
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Consent */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="consent"
                        checked={attendeeCategory === "professional" ? professionalData.consentUpdates : studentData.consentUpdates}
                        onCheckedChange={(checked) => {
                          if (attendeeCategory === "professional") {
                            handleProfessionalDataChange("consentUpdates", checked)
                          } else {
                            handleStudentDataChange("consentUpdates", checked)
                          }
                        }}
                      />
                      <Label htmlFor="consent" className="text-sm">
                        I would like to receive updates & notifications from this event organizer
                      </Label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Registering..." : "Complete Registration"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
