import { HomeIcon } from 'lucide-react'
import React from 'react'
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { FilterStatusTypesForProcessing } from '@/utils/FilterStatusTypes';
import ProcessRequestIcon from '@/components/ui/ProcessRequestIcon';
import { getWFHIconAndBg } from '@/utils/PermissionsIcons';

// config for MM/DD/YY style pretty dates
const dateOptions = { month: "short", day: "numeric", year: "numeric" };


// Main card for WFH pending requests
const WFHTakeActionWithInlineDialogs = ({ item, statusTypes, refresh, onOpenDialog }) => {
    const { toast } = useToast();

    // format date strings
    const formattedStartDate = item?.startDate
        ? new Date(item.startDate.split('T')[0]).toLocaleDateString("en-US", dateOptions)
        : '';
    const formattedEndDate = item?.endDate
        ? new Date(item.endDate.split('T')[0]).toLocaleDateString("en-US", dateOptions)
        : '';
    const isSingleDay = formattedStartDate === formattedEndDate;


    return (
        <div
            className="
                group
                border border-neutral-200 dark:border-neutral-800
                rounded-2xl shadow-sm p-5
                transition-all hover:shadow-md 
                flex flex-col md:flex-row justify-between gap-5
                text-sm
            "
        >
            {/* left: info & details */}
            <div className="flex flex-row gap-4 flex-1 min-w-0 items-start">
                {getWFHIconAndBg()}

                <div className="flex flex-col flex-1 min-w-0 gap-1">
                    {/* Who requested */}
                    <div className='flex gap-2 flex-wrap'>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {item?.employee || item?.requestedBy}
                        </h3>
                        <Badge variant={"outline"} className={"w-fit"}>WFH</Badge>
                    </div>

                    {/* Dates */}
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {isSingleDay ? formattedStartDate :
                            <>
                                {formattedStartDate}
                                <span className="mx-1">→</span>
                                {formattedEndDate}
                            </>
                        }
                        {item?.isHalfDay && (
                            <span className="ml-2 text-amber-600 font-medium">(Half Day{item?.halfDayPeriod ? ` - ${item.halfDayPeriod}` : ""})</span>
                        )}
                    </div>

                    {/* Duration */}
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item?.totalDays === 1 ? "1 day" : `${item?.totalDays} days`}
                    </div>

                    {/* WFH Reason */}
                    {item?.wfhReason && (
                        <p className="text-xs text-neutral-800 dark:text-neutral-100 mt-2">
                            Reason: {item.wfhReason}
                        </p>
                    )}

                    {/* Only shows for org heads when "notify to" is present */}
                    {item?.notifyTo && (
                        <div className="mt-2 flex items-center gap-2">
                            <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-0">
                                Notify To :
                            </p>
                            <p className="text-xs font-medium lowercase text-neutral-800 dark:text-neutral-100 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-2 py-1 rounded-lg shadow-inner">
                                {Array.isArray(item?.notifyTo) && item?.notifyTo?.join(", ")}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* right: action icons */}
            <div className="flex gap-4">
                {/* shortcut action buttons for all statuses to be shown */}
                {FilterStatusTypesForProcessing(statusTypes)?.map((ele, i) => (
                    <div
                        key={ele._id || i}
                        // This opens the actual action dialog/modal with the right config , the last true is to specify it is for work from home so that the handle submit function will change based on this prop -> for permissions we are not passing it
                        onClick={() => { onOpenDialog(ele.statusType, ele._id, item._id, true) }}
                        className="lowercase"
                    >
                        <ProcessRequestIcon label={ele.statusType} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WFHTakeActionWithInlineDialogs;