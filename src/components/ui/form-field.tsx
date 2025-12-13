import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  error,
  required,
  description,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm font-medium text-destructive mt-1.5">{error}</p>
      )}
    </div>
  )
}

