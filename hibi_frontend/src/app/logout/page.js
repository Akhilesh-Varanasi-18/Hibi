"use client"
import LoginApi from '@/Apis/LoginApi'
import { useRouter } from 'next/navigation'
import React, { useContext, useEffect } from 'react'
import { UsersContext } from '../context/UserContext'
import { defaultColorPalettes } from '../ColorPalettes'

const page = () => {
    const router = useRouter();
    const {setColorPalettesFromBackend} = useContext(UsersContext)
    useEffect(() => {
        const logout = async () => {
            const res = await LoginApi.Logout();
            if (res.success) {
                setColorPalettesFromBackend(defaultColorPalettes)
                router.push("/login");
            } else {
                console.log(res.error)
                router.push("/login");
            }
        }
        logout();
    })
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <span>Logging out.....</span>
        </div>
    )
}

export default page
