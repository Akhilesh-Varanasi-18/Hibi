"use client"
import React, { createContext, useState } from 'react'

export const UsersContext = createContext();
const UserContext = ({children}) => {
    const [user, setUser] = useState(null);
    const [role,setRole] = useState(null);
    const [previlege , setPrevilege] = useState(null);
    const [theme , setTheme] = useState(null);
    const [mainrole, setmainrole] = useState(null);
    const [colorPalettesFromBackend, setColorPalettesFromBackend] = useState({
      mainColor : "",
      graphBg : "",
      textOnGraphBg : "",
      textOnMainColor : "",

    })
  return (
    <UsersContext.Provider value={{user, setUser,role,setRole, previlege, setPrevilege, theme , setTheme,mainrole,setmainrole, colorPalettesFromBackend, setColorPalettesFromBackend}}>
        {children}
    </UsersContext.Provider>
  )
}

export default UserContext