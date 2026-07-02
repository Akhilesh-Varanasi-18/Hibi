"use client"
import React, { useEffect, useState } from 'react'
import EmployeeCard from './ProfileComponents/ProfileData'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PersonalDetails from './ProfileComponents/PersonalDetails'
import BankDetails from './ProfileComponents/BankDetails'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DigiLocker } from './ProfileComponents/DigiLocker'
import TwoFactor from './ProfileComponents/TwoFactorAuthentication'
import CareerHistory from './ProfileComponents/CareerHistory'
import { Contacts } from './ProfileComponents/ContactDetails'


// Main profile page component
const Page = () => {
    const router = useRouter();

    const HandleBack = () => {
        router?.back?.();
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
            <div className="absolute t-0 r-0">
            <Button variant="outline" onClick={() => { HandleBack() }} >
                Back
            </Button>
            </div>
            <div className="w-full min-h-full lg:max-w-[420px] space-y-6 flex flex-col items-center pt-10 mt-20">
                <EmployeeCard  />
                <TwoFactor />
            </div>
            <div className="flex-1 space-y-6">
                <Tabs defaultValue="personaldetails" className="w-full">
                    <TabsList className="w-fit justify-start rounded-xl p-1.5 h-auto bg-muted/30">
                        <TabsTrigger
                            value="personaldetails"
                        >
                            Personal Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="digilocker"
                        >
                            Digi Locker
                        </TabsTrigger>
                        <TabsTrigger
                            value="career"
                        >
                            Career History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="personaldetails" className="space-y-6 mt-6">
                        <PersonalDetails/>
                        <BankDetails  />
                        <Contacts  />
                    </TabsContent>
                    <TabsContent value="digilocker" className="space-y-6 mt-6">
                        <DigiLocker />
                    </TabsContent>
                    <TabsContent value="career" className="space-y-6 mt-6">
                        <CareerHistory />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )

}

export default Page