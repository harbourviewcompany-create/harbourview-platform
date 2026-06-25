"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: "left" | "right" | "top" | "bottom"
}

export function Sheet({ open, onOpenChange, children, side = "right" }: SheetProps) {
  if (!open) return null

  const sideClasses = {
    right: "right-0 top-0 h-full w-96 border-l",
    left: "left-0 top-0 h-full w-96 border-r",
    top: "top-0 left-0 w-full h-96 border-b",
    bottom: "bottom-0 left-0 w-full h-96 border-t",
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)} 
      />
      
      {/* Sheet Content */}
      <div
        className={cn(
          "fixed z-50 bg-background p-6 shadow-lg transition-transform",
          sideClasses[side]
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />
}