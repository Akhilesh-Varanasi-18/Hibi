"use client"
import React, { useContext, useState } from 'react'
import CreateTrips from './components/CreateTrips'
import Trips from './components/Trips'
import Comparing from '@/utils/CommonFunctionality'
import { UsersContext } from '@/app/context/UserContext'

const page = () => {
  return (
        <Trips />
  )
}

export default page