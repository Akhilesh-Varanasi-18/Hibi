"use client"
import React, { useContext, useEffect, useState } from 'react'
import { CommonDataContext } from './context/CommonDataContext';
import statusApi from '@/Apis/status_Api';
import CustomLoader from '../components/ReusableComponents/Loader';

const DashBoardWrapper = ({children}) => {
  const [loading, setLoading] = useState(true);
  const { statusTypes , setStatusTypes } = useContext(CommonDataContext);
  const fetchStatusTypes = async () => {
    try {
      const res  = await statusApi.getStatusTypes();
      if(res.success){
        setStatusTypes(res.data);
      }else{
        setStatusTypes([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatusTypes()
  },[]);

  if (loading) {
    return (
      <CustomLoader />
    )
  }
  return (
    <div>{children}</div>
  )
}

export default DashBoardWrapper