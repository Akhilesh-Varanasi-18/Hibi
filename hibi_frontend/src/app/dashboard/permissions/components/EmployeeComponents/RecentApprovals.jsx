"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

import SingleRecentsCard from './SingleRecentsCard';

// Helper to map API status to label and component

const RecentApprovals = ({ data, refresh, statusTypes, wfhData }) => {
    const [MergedData , setMergedData] = useState([])
    
    useEffect(() => {

        console.log("RecentApprovals data or wfhData changed:", { data, wfhData }); 
        // Sort permission approvals by startTime ascending (oldest first)
    const sortedPermissions = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        : [];

    // Sort WFH approvals by startDate ascending (oldest first)
    const sortedWFH = Array.isArray(wfhData)
        ? [...wfhData].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        : [];

    // Merge and sort both arrays by their respective date fields (descending, most recent first)
    // We'll use startTime for permissions, startDate for WFH, and add a type field for rendering
    const merged = [
        ...sortedPermissions.map(item => ({
            ...item,
            _type: "PERMISSION",
            _sortDate: item.startTime ? new Date(item.startTime) : new Date(0),
        })),
        ...sortedWFH.map(item => ({
            ...item,
            _type: "WFH",
            _sortDate: item.startDate ? new Date(item.startDate) : new Date(0),
        })),
    ]
        .sort((a, b) => b._sortDate - a._sortDate) // Most recent first

        setMergedData(merged)
    }, [data, wfhData])

    return (
        <Card
            className={
                " w-full max-w-full sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] " +
                "mx-auto rounded-xl shadow-sm " +
                "flex flex-col"
            }
        >
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Recent Approvals
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    {/* Last 10 permission and WFH decisions */}
                </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto px-2 sm:px-4">
                <div className="space-y-2 sm:space-y-3">
                    {MergedData?.length === 0 ? (
                        <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 py-4 text-center">
                            No recent approvals found.
                        </div>
                    ) : (
                        MergedData?.map((approval, i) =>
                            approval._type === "PERMISSION" ? (
                                <SingleRecentsCard
                                    approval={approval}
                                    key={`perm-${approval._id || i}`}
                                    refresh={refresh}
                                    statusTypes={statusTypes}
                                />
                            ) : (
                                <SingleRecentsCard
                                    approval={approval}
                                    key={`wfh-${approval._id || i}`}
                                    refresh={refresh}
                                    statusTypes={statusTypes}
                                    isWFH={true}
                                />
                            )
                        )
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 px-4 py-3 sm:px-6 sm:py-4">
                {/* <Button variant="ghost" className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300">
                    View Approval History
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-neutral-200 dark:border-neutral-800">
                    <Download className="mr-2 h-3 w-3" />
                    Export Data
                </Button> */}
            </CardFooter>
        </Card>
    );
};

export default RecentApprovals