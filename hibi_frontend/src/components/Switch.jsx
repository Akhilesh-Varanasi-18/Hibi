"use client"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"

export function SwitchDemo() {
    const [dark,setDark] = useState(false);
    const handleClick = () => {
        dark ? document.body.classList.remove("dark") :document.body.classList.add("dark");
        setDark(!dark);
    }
  return (
    <div className="flex items-center space-x-2">
      <Switch onClick={handleClick} id="airplane-mode" />
      <Label htmlFor="airplane-mode">Dark mode</Label>
    </div>
  )
}
