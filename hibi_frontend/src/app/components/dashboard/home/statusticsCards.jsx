import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/utils/DateFunctions";

const StatisticsCard = ({ data }) => {
    console.log(data);
    const presentPercentage = data.totalEmployees > 0 ? (data.present / data.totalEmployees) * 100 : 0;

    const getStatusColor = (type) => {
        const colors = {
            present: "text-emerald-600 dark:text-emerald-400",
            absent: "text-rose-600 dark:text-rose-400",
            leave: "text-amber-600 dark:text-amber-400",
            permission: "text-blue-600 dark:text-blue-400",
            wfh: "text-purple-600 dark:text-purple-400",
            default: "text-neutral-600 dark:text-neutral-400"
        };
        return colors[type] || colors.default;
    };

    const StatusWithPopover = ({ type, count, names, label }) => {
        if (count === 0 || names?.length==0) {
            return (
                <div className="text-center">
                    <div className="text-lg font-bold text-neutral-400 dark:text-neutral-600">
                        {count}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
                </div>
            );
        }

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                        <div className={`text-lg font-bold ${getStatusColor(type)}`}>
                            {count}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="center">
                    <h4 className="font-semibold text-sm mb-2 capitalize">{label} Employees</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto w-64">
                        {names.map((name, index) => (
                            <div key={index} className="text-sm text-neutral-700 dark:text-neutral-300 py-1 truncate">
                                {name}
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        );
    };

    return (
        <Card className="p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex gap-2">
                        <h5 className="font-semibold flex justify-between text-sm text-neutral-900 dark:text-neutral-100">
                            {data.teamName || 'Team Overview'}
                        </h5>

                        {data.holiday && <Badge>Holiday</Badge>}
                        {data.sunday && <Badge>Sunday</Badge>}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {
                            formatDate(data.date)
                        }
                    </p>
                </div>

                {/* Attendance Rate Badge */}
                <div className="text-right">
                    <div className={`text-sm font-semibold ${presentPercentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                        presentPercentage >= 60 ? 'text-amber-600 dark:text-amber-400' :
                            'text-rose-600 dark:text-rose-400'
                        }`}>
                        {Math.round(presentPercentage)}%
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Rate</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="flex overflow-x-auto gap-3 mb-3">
                <div className="text-center">
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {data.totalEmployees}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Total</div>
                </div>

                
                <StatusWithPopover 
                    type="present"
                    count={data.present}
                    names={data.presentNames || []}
                    label="Present"
                />
                
                <StatusWithPopover 
                    type="absent"
                    count={data.absent}
                    names={data.absentNames || []}
                    label="Absent"
                />
                
                <StatusWithPopover 
                    type="leave"
                    count={data.leave}
                    names={data.leaveNames || []}
                    label="Leave"
                />
                
                <StatusWithPopover 
                    type="permission"
                    count={data.permission}
                    names={data.permissionNames || []}
                    label="Permission"
                />
                <StatusWithPopover 
                    type="wfh"
                    count={data.wfh}
                    names={data.wfhNames || []}
                    label="WFH"
                />
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400">Attendance Progress</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {data.present}/{data.totalEmployees}
                    </span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-2 rounded-full transition-all duration-500 ${presentPercentage >= 80 ? 'bg-emerald-500' :
                            presentPercentage >= 60 ? 'bg-amber-500' :
                                'bg-rose-500'
                            }`}
                        style={{ width: `${presentPercentage}%` }}
                    />
                </div>
            </div>

            {/* Additional status indicators */}
            <div className="mt-2 space-y-1">
                {data.permission > 0 && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <span>•</span>
                        {data.permission} on permission
                    </div>
                )}
                {data.wfh > 0 && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <span>•</span>
                        {data.wfh} working from home
                    </div>
                )}
            </div>
        </Card>
    );
}

export default StatisticsCard;