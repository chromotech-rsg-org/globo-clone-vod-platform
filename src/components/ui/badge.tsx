
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/80",
        secondary:
          "border-transparent bg-admin-muted text-admin-foreground hover:bg-admin-muted/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-admin-foreground border-admin-border",
        "admin-success": "border-transparent bg-admin-success text-admin-success-foreground",
        "admin-danger": "border-transparent bg-admin-danger text-admin-danger-foreground",
        "admin-muted": "border-transparent bg-admin-muted text-admin-muted-foreground",
        "admin-warning": "border-transparent bg-yellow-600 text-white",
        "admin-destructive": "border-transparent bg-red-600 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
