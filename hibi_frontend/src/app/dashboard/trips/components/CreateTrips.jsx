"use client"
import { ToDoApis } from '@/Apis/ToDoApis';
import { DynamicFormDialog } from '@/app/components/ReusableComponents/DynamicFormDialog';
import CustomLoader from '@/app/components/ReusableComponents/Loader';
import React, { useState, useEffect, useContext } from 'react'
import { CommonDataContext } from '../../context/CommonDataContext';
import TripApi from '@/Apis/TripsApi';
import { RxCross2 } from 'react-icons/rx';
import { TiTick } from 'react-icons/ti';
import { useToast } from '@/hooks/use-toast';

const CreateTrips = ({onSuccess}) => {

  const [employees, setEmployees] = useState(null);
  const [statusId, setstatusId] = useState(null);
  const { statusTypes } = useContext(CommonDataContext);
  const {toast}=useToast();
  const getEmployees = async () => {
    const res = await ToDoApis.getEmployees();
    if (res.success) {
      const convertedToRequiredFormat = res?.data?.data?.map((item, i) => {
        return { _id: item?._id, name: item?.employeeName }
      })
      console.log(convertedToRequiredFormat)
      setEmployees(convertedToRequiredFormat)
    }
  }
  useEffect(() => {
    getEmployees();
    const status = statusTypes.find((e) => e?.statusType == "ACTIVE");
    console.log(status)
    if (status) {
      setstatusId(status._id);
    }
  }, [])


  const createTripConfig = {
    Title: "Create Trip",
    submitLabel: "Create Trip",
    DialogLabel: "Create Trip",
    submitVariant: "default",
    onSubmit: async (data) => {
      const res = await TripApi.addTrip(data);
      console.log(data)
      if (res.success) {
        toast?.({
          title: <div className='flex gap-2 items-center'>
            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
            <span>{res?.data?.message ?? "Team created successfully"}</span>
          </div>,
        });
        onSuccess && onSuccess()
      }
      else {
        toast?.({
          title: <div className='flex gap-2 items-center'>
            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
            <span>{res?.error ?? "Failed to create trip"}</span>
          </div>,
        });
      }
    },
    ExtraValues : {statusId},
    Fields: [
      {
        name: "tripTitle",
        type: "text",
        label: "Trip Title",
        required: true,
        errorMessage: "tripTitle is required",
      },
      {
        name: "tripType",
        type: "text",
        label: "Trip Type",
        required: true,
        errorMessage: "trip Type is required",
      },
      {
        name: "FromTo",
        type: "multicalendar",
        label: "Trip Period",
        DateStartName: "fromDate",
        takeFullWidth: true,
        DateEndName: "toDate",
        required: true,
        showUpcoming:true,
        errorMessage: "Please select both start and end dates",
      },
      {
        name: "tripHeadId",
        type: "select",
        label: "Trip Head",
        required: true,
        array: employees,
        showSearch: true,
        errorMessage: "Please Select Head"
      },
      {
        name: "tripParticipants",
        type: "select",
        label: "Trip Participants",
        multiselect: true,
        required: true,
        array: employees,
        showSearch: true,
        errorMessage: "Please select at least one employee",
      },
      {
        name: "advanceAmount",
        type: "number",
        label: "Advance Amount",
        required: true,
        errorMessage: "reason is required",
      },
      {
        name: "destination",
        type: "text",
        label: "Destination",
        required: true,
        errorMessage: "destination is required",
      },
      {
        name: "reason",
        type: "textarea",
        label: "Reason",
        takeFullWidth: true,
        required: true,
        errorMessage: "reason is required",
      }
    ],
  };

  return (
    <div>
      {
        employees ? <DynamicFormDialog config={createTripConfig} /> : <CustomLoader />
      }
    </div>
  )
}

export default CreateTrips