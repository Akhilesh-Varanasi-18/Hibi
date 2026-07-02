'use client'
import React, { useContext, useEffect } from 'react'
import { Toggle } from "@/components/ui/toggle"
import { UsersContext } from '../context/UserContext'
import { MdOutlineLightMode, MdOutlineDarkMode } from "react-icons/md";

// ToggleComponent is used to toggle the dark mode of the application.
const ToggleComponent = () => {
    const {theme , setTheme} = useContext(UsersContext) || {};
    useEffect(() => {
        setTheme(localStorage.getItem("theme") || "white");
    },[])
    return (
        <div>
            <Toggle
                aria-label="Toggle dark mode"
                onClick={() => {
                    if (typeof window !== "undefined") {
                        const html = document.documentElement;
                        if (html.classList.contains("dark")) {
                            setTheme("white")
                            html.classList.remove("dark");
                            localStorage.setItem("theme", "light");
                        } else {
                            html.classList.add("dark");
                            setTheme("dark")
                            localStorage.setItem("theme", "dark");
                        }
                    }
                }}
            >
                <span className="block dark:hidden"><MdOutlineLightMode className="h-5 w-5" /></span>
                <span className="hidden dark:block"><MdOutlineDarkMode className="h-5 w-5" /></span>
            </Toggle>
        </div>
    )
}

export default ToggleComponent
