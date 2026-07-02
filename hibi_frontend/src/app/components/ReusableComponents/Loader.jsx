"use client"
import { Loader2 } from 'lucide-react'
import React from 'react'

const CustomLoader = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Loader2 
        className="h-8 w-8 animate-spin transition-transform duration-300 ease-in-out text-foreground" 
      />
    </div>
  )
}

export default CustomLoader 