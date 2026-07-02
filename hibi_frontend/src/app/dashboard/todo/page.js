"use client"
import { ToDoApis } from '@/Apis/ToDoApis'
import CreateToDo from '@/app/components/dashboard/todo/CreateToDo'
import ToDosList from '@/app/components/dashboard/todo/ToDosList'
import { UsersContext } from '@/app/context/UserContext'
import { Skeleton } from '@/components/ui/skeleton'
import Comparing from '@/utils/CommonFunctionality'
import React, { useContext, useEffect, useState } from 'react'

// Options for task priority with mapped IDs and descriptive names
export const priorityOptions = [
  { _id: "LOW", name: "Low" },
  { _id: "MEDIUM", name: "Medium" },
  { _id: "HIGH", name: "High" },
];

export const Page = () => {
  // State to trigger UI refresh for child components
  const [refresh, setRefresh] = useState(0);
  const { previlege } = useContext(UsersContext);

  // State to store the formatted employee list and loading state for employees
  const [employees, setEmployees] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Fetches employee data and transforms it for dropdowns or selectors
  const getEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await ToDoApis.getEmployees();
      if (res.success) {
        const convertedToRequiredFormat = res?.data?.data?.map((item, i) => {
          return { _id: item?._id, name: item?.employeeName }
        })
        // Log transformed employee data for verification
        console.log(convertedToRequiredFormat)
        setEmployees(convertedToRequiredFormat)
      }
    } finally {
      setLoadingEmployees(false);
    }
  }

  // Runs employee fetching logic on the first render
  useEffect(() => {
    getEmployees()
  }, [])

  // Skeleton UI for CreateToDo button
  const CreateToDoSkeleton = (
    <div className="w-36 h-9 flex items-center">
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );

  // Skeleton UI for ToDosList section
  // You can adjust the height, count etc. as needed
  const ToDosListSkeleton = (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-5 w-1/3 rounded" />
          <Skeleton className="h-5 w-1/5 rounded" />
          <Skeleton className="h-5 w-8 rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className='px-4 '>
      <div className='flex justify-between items-center pb-6'>
        {/* Main heading for the Todo management section */}
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Todo Management
        </h1>
        {/* Button or form to add new tasks; triggers a refresh on successful creation */}
        {(Comparing.compareStrings(previlege, "ADMIN") || Comparing.compareStrings(previlege, "SUPERADMIN")) && (
          loadingEmployees ?
            CreateToDoSkeleton : (
              <CreateToDo
                priorityOptions={priorityOptions}
                employees={employees}
                refresh={() => setRefresh(prev => prev + 1)}
              />
            )
        )}
      </div>
      {/* Displays list of todos; listens for refresh to update the content. Delete is also there in this Page  */}
      {loadingEmployees ? (
        ToDosListSkeleton
      ) : (
        <ToDosList
          priorityOptions={priorityOptions}
          employees={employees}
          refresh={refresh}
        />
      )}
    </div>
  )
}

export default Page;