import React, { useContext, useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Clock, AlertCircle, LogIn, LogOut, Hourglass, Home } from 'lucide-react';
import { Approved, Rejected } from '@/components/ui/Approval';
import moment from "moment-timezone";
import { formatDate, GetDateFormatInDateMonth } from '@/utils/DateFunctions';
import { CommonDataContext } from '@/app/dashboard/context/CommonDataContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getPermissionIconAndBg, getStatusComponent, getWFHIconAndBg } from '@/utils/PermissionsIcons';
import { FilterStatusTypesForDropdown } from '@/utils/FilterStatusTypes';



const DEFAULT_WFH_STATUSES = [
  { label: "All WFH", value: "WFH_ALL" }
];

const HistoryParent = ({ data, wfhData }) => {
  // Maintain state for allData to ensure all data is shown reliably
  const [allData, setAllData] = useState([]);
  const { statusTypes } = useContext(CommonDataContext);

  // Filter state
  const [filter, setFilter] = useState("ALL");

  // Get status dropdown options
  const statusFilterOptions = [
    { label: "All Statuses", value: "ALL" },
    ...(Array.isArray(statusTypes)
      ? statusTypes.map((item) => ({
        label: item.statusType.charAt(0).toUpperCase() + item.statusType.slice(1).toLowerCase(),
        value: item.statusType.toUpperCase()
      }))
      : []),
    ...DEFAULT_WFH_STATUSES
  ];

  // Preprocess and merge permission and WFH data
  useEffect(() => {
    // Prepare permission data
    const permissionData = Array.isArray(data)
      ? [...data].map(item => ({
        ...item,
        _type: "PERMISSION",
        _sortTime: item.startTime ? new Date(item.startTime).getTime() : 0
      }))
      : [];

    // Prepare WFH data
    const wfhDataArr = Array.isArray(wfhData)
      ? [...wfhData].map(item => ({
        ...item,
        _type: "WFH",
        _sortTime: item.startDate ? new Date(item.startDate).getTime() : 0
      }))
      : [];

    const merged = [...permissionData, ...wfhDataArr].sort((a, b) => b._sortTime - a._sortTime);
    setAllData(merged);
  }, [data, wfhData]);

  // Filtered items logic
  const getFilteredData = () => {
    if (filter === "ALL") {
      return allData;
    }
    if (filter === "WFH_ALL") {
      return allData.filter(item => item._type === "WFH");
    }
    // Permissions only, match on statusType (case-insensitive)
    return allData.filter(item =>
      item._type === "PERMISSION"
      && item.Status
      && String(item.Status).toUpperCase() === filter
    );
  };

  const filteredData = getFilteredData();

  return (
    <Card className={`w-full overflow-y-auto`}>
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <div>
            <CardTitle className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Recent Approvals</CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400"></CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4 whitespace-nowrap min-w-[110px]">
                {
                  statusFilterOptions.find(opt => opt.value === filter)
                    ? statusFilterOptions.find(opt => opt.value === filter).label
                    : "All Statuses"
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[50]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              {FilterStatusTypesForDropdown(statusFilterOptions)?.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={filter === opt.value ? "bg-neutral-100 dark:bg-neutral-800" : ""}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="space-y-3">
          {filteredData.length === 0 ? (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 py-4 text-center">
              No recent permission decisions.
            </div>
          ) : (
            filteredData.map(item => {
              if (item._type === "PERMISSION") {
                const { icon, bg } = getPermissionIconAndBg(item.permissionType);
                return (
                  <div key={item._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex items-center space-x-3">
                      {getPermissionIconAndBg(item.permissionType)}
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item?.employee || item?.requestedBy}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {GetDateFormatInDateMonth(item?.startTime)}
                          {GetDateFormatInDateMonth(item?.endTime) && (
                            <>
                              {" "}
                              <span className="mx-1 text-neutral-300 dark:text-neutral-600">→</span>{" "}
                              {GetDateFormatInDateMonth(item?.endTime)}
                            </>
                          )}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">{item.permissionReason}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {item.totalHours} hour{item.totalHours > 1 ? "s" : ""}
                          </span>
                          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {item.isFirstHalf ? "First Half" : "Second Half"}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 py-2">{item?.actionedBy && ` Action Taken By : ${item?.actionedBy}`}</p>
                      </div>
                    </div>
                    <div className="ml-2">{getStatusComponent(item?.Status)}</div>
                  </div>
                );
              } else if (item._type === "WFH") {
                return (
                  <div key={item._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex items-center space-x-3">
                      {getWFHIconAndBg()}
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item?.employee || item?.requestedBy}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Work From Home &bull; {formatDate(item.startDate)}
                          {item.startDate !== item.endDate && item.endDate ? ` - ${formatDate(item.endDate)}` : ""}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">{item.wfhReason}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {item.totalDays} day{item.totalDays > 1 ? "s" : ""}
                          </span>
                          {item.isHalfDay && item.halfDayPeriod && (
                            <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {item.halfDayPeriod === "FIRST" ? "First Half" : item.halfDayPeriod === "SECOND" ? "Second Half" : item.halfDayPeriod}
                            </span>
                          )}
                        </div>
                        {item.actionReason && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            <span className="font-medium">Action Remark:</span> {item.actionReason}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 py-2">{item?.actionedBy && ` Action Taken By : ${item?.actionedBy}`}</p>
                      </div>
                    </div>
                    <div className="ml-2">{getStatusComponent(item.Status)}</div>
                  </div>
                );
              }
              return null;
            })
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {/* <Button variant="ghost" className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300">View Approval History</Button> */}
      </CardFooter>
    </Card>
  );
};

export default HistoryParent