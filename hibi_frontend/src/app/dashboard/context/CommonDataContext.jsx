"use client"
import React, { createContext, useState } from 'react'

export const CommonDataContext = createContext();
const DataContext = ({children}) => {
   const [statusTypes , setStatusTypes] = useState(null);
   const [reqCounts, setReqCounts] = useState({
    permissions : 0,
    leaves : 0,
    ods : 0,
    thumb : 0
   });

  return (
    <CommonDataContext.Provider value={{statusTypes , setStatusTypes, reqCounts, setReqCounts}}>
        {children}
    </CommonDataContext.Provider>
  )
}

export default DataContext;