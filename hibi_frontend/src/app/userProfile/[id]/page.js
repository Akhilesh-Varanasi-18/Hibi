import UserProfile from '@/app/components/userProfile/UserProfile'
import React from 'react'

const page = async ({params}) => {
    const { id } =  await params
  return (
    <div>
        {
            id && 
            <UserProfile id={id} />
        }
    </div>
  )
}

export default page