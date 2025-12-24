"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode
}

interface TooltipProps {
  children: React.ReactNode
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface TooltipContentProps {
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  return <>{children}</>
}

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <>{children}</>
}

const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, asChild }) => {
  return <>{children}</>
}

const TooltipContent: React.FC<TooltipContentProps> = ({
  children,
  side = 'top',
  className
}) => {
  return (
    <div
      className={cn(
        "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg border border-gray-700 whitespace-nowrap",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
        side === 'top' && "bottom-full left-1/2 transform -translate-x-1/2 mb-1",
        side === 'bottom' && "top-full left-1/2 transform -translate-x-1/2 mt-1",
        side === 'left' && "right-full top-1/2 transform -translate-y-1/2 mr-1",
        side === 'right' && "left-full top-1/2 transform -translate-y-1/2 ml-1",
        className
      )}
    >
      {children}
      {/* Arrow */}
      <div
        className={cn(
          "absolute w-2 h-2 bg-gray-900 border border-gray-700 transform rotate-45",
          side === 'top' && "top-full left-1/2 -translate-x-1/2 -mt-1",
          side === 'bottom' && "bottom-full left-1/2 -translate-x-1/2 -mb-1",
          side === 'left' && "left-full top-1/2 -translate-y-1/2 -ml-1",
          side === 'right' && "right-full top-1/2 -translate-y-1/2 -mr-1"
        )}
      />
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
