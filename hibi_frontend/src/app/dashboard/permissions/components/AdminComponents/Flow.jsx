"use client"
import permissionsAPI from '@/Apis/Permissions_APIs';
import { ArrowUpRight, CheckCircle2, Clock, User, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react'

const Flow = ({ id }) => {
    const [flow, setFlow] = useState([]);
    // Fetch the approval flow for this request
    useEffect(() => {
        const getFlow = async () => {
            const res = await permissionsAPI.getPermissionRequestFlow(id);
            console.log(res);
            if (res && res.success && Array.isArray(res.data)) {
                setFlow(res.data);
            } else {
                setFlow([]);
            }
        };
        getFlow();
    }, []);


    // Modern status icon for flow
    const statusIcon = (status) => {
        switch (status) {
            case "ACCEPTED":
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "REJECTED":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "ESCALATED":
                return <ArrowUpRight className="h-4 w-4 text-amber-500" />;
            case "PENDING":
                return <Clock className="h-4 w-4 text-blue-400" />;
            default:
                return <User className="h-4 w-4 text-neutral-400" />;
        }
    };

    const statusLabel = (status) => {
        switch (status) {
            case "ACCEPTED":
                return "Approved";
            case "REJECTED":
                return "Rejected";
            case "ESCALATED":
                return "Escalated";
            case "PENDING":
                return "Pending";
            default:
                return status;
        }
    };

    const statusBgColor = (status) => {
        switch (status) {
            case "ACCEPTED":
                return "bg-green-500";
            case "REJECTED":
                return "bg-red-500";
            case "ESCALATED":
                return "bg-amber-500";
            case "PENDING":
                return "bg-blue-500";
            default:
                return "bg-neutral-400";
        }
    };

    const statusColor = (status) => {
        switch (status) {
            case "ACCEPTED":
                return "text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
            case "REJECTED":
                return "text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
            case "ESCALATED":
                return "text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800";
            case "PENDING":
                return "text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800";
            default:
                return "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700";
        }
    };

    return (
        <div className="mt-4">
            {
                flow.length > 0 &&
                <>
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                        Approval Flow
                    </div>
                    <div className="flex flex-col gap-3">
                        {flow.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                {/* Step number with status indicator */}
                                <div className="flex flex-col items-center">
                                    <div className={`
                        flex items-center justify-center h-7 w-7 rounded-full 
                        ${statusBgColor(step.status)} text-white
                        text-xs font-bold relative
                        ${idx < flow.length - 1 ? statusBgColor(step.status) : 'bg-neutral-300 dark:bg-neutral-600'}
                      `}>
                                        {idx + 1}
                                        {/* Status indicator dot */}
                                        <div className={`
                          absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white dark:border-neutral-950
                          ${step.status === 'PENDING' ? 'bg-blue-400' :
                                                step.status === 'ACCEPTED' ? 'bg-green-500' :
                                                    step.status === 'REJECTED' ? 'bg-red-500' :
                                                        step.status === 'ESCALATED' ? 'bg-amber-500' : 'bg-neutral-400'}
                        `} />
                                    </div>
                                    {/* Connecting line between steps */}
                                    {idx < flow.length - 1 && (
                                        <div className={`h-8 w-0.5 my-1 ${statusBgColor(step.status)}/30`}></div>
                                    )}
                                </div>

                                {/* Step content */}
                                <div className={`
                      flex-1 p-3 rounded-xl border
                      ${statusColor(step.status)}
                      transition-all hover:shadow-sm
                    `}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            {statusIcon(step.status)}
                                            <span className="text-xs font-semibold capitalize">{statusLabel(step.status)}</span>
                                        </div>
                                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                            {step.sendAt ? new Date(step.sendAt).toLocaleString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true
                                            }) : "Pending"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <User className="h-3.5 w-3.5 text-neutral-400" />
                                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                            {step.actionedBy || "Waiting for action"}
                                        </span>
                                    </div>

                                    {step.actionReason && step.actionReason.trim() !== "" && (
                                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 p-2 bg-white dark:bg-neutral-900/40 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                            "{step.actionReason}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>}
        </div>
    )
}

export default Flow