"use client"
import ThemeStudio from '@/app/components/dashboard/appearance/ThemeStudio'
import UpdateOrganizationAssests from '@/app/components/dashboard/appearance/UpdateOrganizationAssests'
import PageHeader from '@/app/components/ReusableComponents/PageHeader'
import UnauthorizedPage from '@/app/components/ReusableComponents/UnauthorizedPage'
import { UsersContext } from '@/app/context/UserContext'
import Comparing from '@/utils/CommonFunctionality'
import React, { useContext } from 'react'

const page = () => {

  const { previlege , role } = useContext(UsersContext);
  return (
    <div className='px-6'>
      {
        // if the user has superadmin or designer role, then show the appearance settings page
        (Comparing.compareStrings(previlege, "SUPERADMIN") || Comparing.compareStrings(role, "DESIGNER")) ? <div>
          <PageHeader
            title={"Appearance settings"}
            rightContent={<UpdateOrganizationAssests />}
          />
          <ThemeStudio />
        </div> 
        :
        <UnauthorizedPage />
      }

    </div>
  )
}

export default page