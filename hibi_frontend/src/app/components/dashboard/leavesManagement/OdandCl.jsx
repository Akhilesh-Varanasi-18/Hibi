"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import LeaveManagementApi from "@/Apis/LeaveManagement";
import { Skeleton } from "@/components/ui/skeleton";

const OdandCl = () => {
    const [odandcl, setodAndCl] = useState(null);
    const [loader, setLoader] = useState(false);

    async function getOdandCls() {
        setLoader(true);
        const res = await LeaveManagementApi.getOdandCl();
        // console.log(res)
        if (res.success) {
            setodAndCl(res?.data?.data)
        }
        setLoader(false);
    }
    useEffect(() => {
        getOdandCls();
    }, []);

    return (
        <div>
            {(loader || !odandcl) ? (
                <Card className="w-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
                            {/* CL Skeleton */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <Skeleton className="h-5 w-8 rounded" />
                                    <Skeleton className="h-4 w-20 rounded" />
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <Skeleton className="h-14 w-full rounded-md" />
                                    <Skeleton className="h-14 w-full rounded-md" />
                                </div>
                            </div>
                            {/* OD Skeleton */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <Skeleton className="h-5 w-8 rounded" />
                                    <Skeleton className="h-4 w-20 rounded" />
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <Skeleton className="h-14 w-full rounded-md" />
                                    <Skeleton className="h-14 w-full rounded-md" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="w-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-md font-semibold flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Credit Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
                            {/* CL Box */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="px-1 text-[10px]">CL</Badge>
                                    <span className="text-[11px] font-medium">Casual Leave</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                    <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded-md text-center border">
                                        <div className="text-base font-bold text-green-600 dark:text-green-400">
                                            {odandcl.CLs?.find(x => x._id === "ACTIVE")?.Count || 0}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">Active</div>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md text-center border">
                                        <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                                            {odandcl.CLs?.find(x => x._id === "PROCESSING")?.Count || 0}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">Processing</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded-md text-center border">
                                        <div className="text-base font-bold text-green-600 dark:text-green-400">
                                            {odandcl.CLs?.find(x => x._id === "INACTIVE")?.Count || 0}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">Completed</div>
                                    </div>
                                </div>
                            </div>

                            {/* OD Box */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="px-1 text-[10px]">OD</Badge>
                                    <span className="text-[11px] font-medium">On Duty</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                    <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded-md text-center border">
                                        <div className="text-base font-bold text-green-600 dark:text-green-400">
                                            {odandcl.ODs?.find(x => x._id === "ACTIVE")?.Count || 0}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">Active</div>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md text-center border">
                                        <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                                            {odandcl.ODs?.find(x => x._id === "PROCESSING")?.Count || 0}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">Processing</div>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-green-950/20 p-2 rounded-md text-center border">
                                        <div className="text-base font-bold text-green-600 dark:text-green-400">
                                            {odandcl.ODs?.find(x => x._id === "INACTIVE")?.Count || 0}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">Completed</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default OdandCl