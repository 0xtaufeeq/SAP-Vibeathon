import { Sparkles } from "lucide-react"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-lg bg-primary flex items-center justify-center`}>
        <Sparkles className={`${iconSizes[size]} text-primary-foreground`} />
      </div>
      <span className={`font-semibold ${size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl"}`}>
        Event Hub
      </span>
    </div>
  )
}
