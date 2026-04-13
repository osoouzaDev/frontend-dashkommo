"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface CompactModeContextType {
  isCompact: boolean
  toggleCompact: () => void
  setIsCompact: (value: boolean) => void
}

const CompactModeContext = createContext<CompactModeContextType | undefined>(undefined)

export function CompactModeProvider({ children }: { children: React.ReactNode }) {
  const [isCompact, setIsCompactState] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("compact-mode")
    if (saved === "true") {
      setIsCompactState(true)
      document.documentElement.classList.add("compact")
    }
    setMounted(true)
  }, [])

  const setIsCompact = (value: boolean) => {
    setIsCompactState(value)
    if (value) {
      document.documentElement.classList.add("compact")
      localStorage.setItem("compact-mode", "true")
    } else {
      document.documentElement.classList.remove("compact")
      localStorage.setItem("compact-mode", "false")
    }
  }

  const toggleCompact = () => {
    setIsCompact(!isCompact)
  }

  return (
    <CompactModeContext.Provider value={{ isCompact, toggleCompact, setIsCompact }}>
      {children}
    </CompactModeContext.Provider>
  )
}

export function useCompactMode() {
  const context = useContext(CompactModeContext)
  if (context === undefined) {
    throw new Error("useCompactMode must be used within a CompactModeProvider")
  }
  return context
}
