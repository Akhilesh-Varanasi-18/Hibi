"use client"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

const UnauthorizedPage = () => {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-red-600 dark:text-red-400">
          You have no permission to access this page
        </div>
        <Link href="/login"><Button>Login</Button></Link>
      </div>
  )
}

export default UnauthorizedPage