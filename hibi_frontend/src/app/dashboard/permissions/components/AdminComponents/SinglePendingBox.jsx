"use client"
import { Clock, Zap } from 'lucide-react'
import React from 'react'
import Flow from './Flow'
import { FilterStatusTypesForProcessing } from '@/utils/FilterStatusTypes'
import { GetDateFormatInDateMonth } from '@/utils/DateFunctions'
import ProcessRequestIcon from '@/components/ui/ProcessRequestIcon'
import { getPermissionIconAndBg } from '@/utils/PermissionsIcons'

// just one row for one pending permission
const SinglePendingBox = ({ item, statusTypes, onOpenDialog }) => {
  return (
    <div className="
      group border border-neutral-200 dark:border-neutral-800
      rounded-2xl shadow-sm p-5
      transition-all hover:shadow-md 
      flex flex-col md:flex-row justify-between gap-5
      text-sm
    ">
      {/* info left side */}
      <div className="flex flex-row gap-4 flex-1 min-w-0 items-start">
        {getPermissionIconAndBg(item?.permissionType)}
        <div className="flex flex-col flex-1 min-w-0 gap-1">
          {/* name + perm type */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm lowercase font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {item?.employee || item?.requestedBy}
            </h3>
            <span className="text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
              {item?.permissionType}
            </span>
          </div>
          {/* time/block info */}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-1">
            <span>
              {GetDateFormatInDateMonth(item?.startTime)}
              {GetDateFormatInDateMonth(item?.endTime) && (
                <>
                  {" "}
                  <span className="mx-1 text-neutral-300 dark:text-neutral-600">→</span>{" "}
                  {GetDateFormatInDateMonth(item?.endTime)}
                </>
              )}
            </span>
            {item?.totalHours && (
              <>
                <span className="hidden sm:inline text-neutral-300 dark:text-neutral-600">|</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {item?.totalHours} hrs
                </span>
              </>
            )}
          </div>
          {/* show the reason if any */}
          {item?.permissionReason && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-0">
                Reason :
              </p>
              <p className="text-xs font-medium text-neutral-800 dark:text-neutral-100 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-2 py-1 rounded-lg shadow-inner">
                {item.permissionReason}
              </p>
            </div>
          )}
          {/* only shows for org heads */}
          {item?.notifyTo && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-0">
                Notify To :
              </p>
              <p className="text-xs font-medium lowercase text-neutral-800 dark:text-neutral-100 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-2 py-1 rounded-lg shadow-inner">
                {(Array.isArray(item?.notifyTo)) &&
                  item?.notifyTo?.join(", ")
                }
              </p>
            </div>
          )}
          {/* tiny flow line */}
          <Flow id={item?._id} />
        </div>
      </div>
      {/* actions/buttons */}
      {FilterStatusTypesForProcessing(statusTypes)?.map((ele, i) => (
        <div key={ele._id || i} onClick={() => onOpenDialog(ele.statusType, ele._id, item._id)} >
          <ProcessRequestIcon label={ele.statusType} />
        </div>
      ))}
    </div>
  )
}

export default SinglePendingBox