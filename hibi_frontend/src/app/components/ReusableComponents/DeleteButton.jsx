import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import React from 'react'

const DeleteButton = () => {
  return (
    <Button className='text-red-700 border-transparent hover:text-red-700' variant="outline"><Trash2 /></Button>
  )
}

export default DeleteButton