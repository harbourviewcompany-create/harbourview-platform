"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode
  content: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function Popover({
  children,
  content,
  open: controlledOpen,
  onOpenChange,
  align = "center",
  side = "bottom",
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen

  const handleToggle = () => {
    const newOpen = !open
    if (onOpenChange) onOpenChange(newOpen)
    else setInternalOpen(newOpen)
  }

  return (
    <div className="relative inline-block">
      <div onClick={handleToggle} className="cursor-pointer">
        {children}
      </div>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] rounded-md border bg-popover p-4 text-popover-foreground shadow-md",
            side === "bottom" && "top-full",
            side === "top" && "bottom-full mb-2",
            align === "start" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "end" && "right-0"
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}