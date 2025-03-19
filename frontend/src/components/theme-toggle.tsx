"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"

import { Button } from "./ui/button"
import { useTheme } from "./theme-provider"
import { Tooltip as TooltipPrimitive } from '@mui/material';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [currentIcon, setCurrentIcon] = React.useState<React.ReactNode>(<Sun className="h-4 w-4" />)
  const [tooltipText, setTooltipText] = React.useState<string>("Switch to dark mode")

  // Set the initial icon and tooltip based on the current theme
  React.useEffect(() => {
    if (theme) {
      updateIconAndTooltip(theme)
    }
  }, [theme])

  // Function to cycle through themes: light -> dark -> system -> light...
  const cycleTheme = React.useCallback(() => {
    try {
      if (theme === "light") {
        setTheme("dark")
      } else if (theme === "dark") {
        setTheme("system")
      } else {
        setTheme("light")
      }
    } catch (error) {
      console.error("Error cycling theme:", error)
    }
  }, [theme, setTheme])

  // Update the visible icon and tooltip text based on theme
  const updateIconAndTooltip = React.useCallback((themeValue: string) => {
    if (themeValue === "light") {
      setCurrentIcon(<Sun className="h-4 w-4" />)
      setTooltipText("Switch to dark mode")
    } else if (themeValue === "dark") {
      setCurrentIcon(<Moon className="h-4 w-4" />)
      setTooltipText("Switch to system mode")
    } else {
      setCurrentIcon(<Laptop className="h-4 w-4" />)
      setTooltipText("Switch to light mode")
    }
  }, [])

  // Prevent unnecessary renders
  const handleClick = React.useCallback(() => {
    cycleTheme()
  }, [cycleTheme])

  return (
    <TooltipPrimitive title={tooltipText} arrow>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative h-8 w-8 rounded-full"
        onClick={handleClick}
      >
        {currentIcon}
      </Button>
    </TooltipPrimitive>
  )
} 