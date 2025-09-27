import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

const notificationPrefs = [
  {
    id: "sessions",
    label: "Session reminders",
    description: "Get notified about upcoming sessions on your agenda.",
  },
  {
    id: "matches",
    label: "New networking matches",
    description: "Receive alerts when we find attendees that match your interests.",
  },
  {
    id: "announcements",
    label: "Event announcements",
    description: "Stay informed about major updates from the organizers.",
  },
]

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile, preferences, and notification settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update the information attendees see when connecting with you.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" placeholder="Jane" defaultValue="Jane" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Doe" defaultValue="Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" placeholder="Event Companion" defaultValue="Event Companion" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Job title</Label>
            <Input id="role" placeholder="Product Manager" defaultValue="Product Manager" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" placeholder="Short introduction" defaultValue="Passionate about building engaging event experiences." />
          </div>
          <div className="md:col-span-2">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Update your email or change your password.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="jane.doe@email.com" defaultValue="jane.doe@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" />
          </div>
          <div className="md:col-span-2">
            <Button variant="outline">Update Security</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose which updates you want to receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationPrefs.map((pref) => (
            <div key={pref.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium leading-none">{pref.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{pref.description}</p>
              </div>
              <Switch defaultChecked id={pref.id} />
            </div>
          ))}
          <Separator />
          <div className="flex justify-end">
            <Button variant="secondary">Save Preferences</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

