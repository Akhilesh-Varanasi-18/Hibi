"use client";
import { useState, useContext, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UsersContext } from "@/app/context/UserContext";
import StatisticsCard from "./statusticsCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, User, Clock, Calendar, ChevronLeft, Users, X } from "lucide-react";

const AttendanceDialog = ({ data, summary }) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activePanel, setActivePanel] = useState(null);
    const { theme } = useContext(UsersContext);

    const overallPercentage = summary.totalEmployees > 0 ?
        Math.round((summary.present / summary.totalEmployees) * 100) : 0;

    // Combine all employees with their status for the employee list
    const allEmployees = useMemo(() => {
        const employees = [];

        // Add present employees
        summary.presentNames?.forEach(name => {
            employees.push({ name, status: 'present', statusLabel: 'Present' });
        });

        // Add absent employees
        summary.absentNames?.forEach(name => {
            employees.push({ name, status: 'absent', statusLabel: 'Absent' });
        });

        // Add leave employees
        summary.leaveNames?.forEach(name => {
            employees.push({ name, status: 'leave', statusLabel: 'Leave' });
        });

        // Add permission employees
        summary.permissionNames?.forEach(name => {
            employees.push({ name, status: 'permission', statusLabel: 'Permission' });
        });

        // Add WFH employees
        summary.wfhNames?.forEach(name => {
            employees.push({ name, status: 'wfh', statusLabel: 'WFH' });
        });

        return employees;
    }, [summary]);

    // Filter employees based on search term
    const filteredEmployees = useMemo(() => {
        if (!searchTerm.trim()) return allEmployees;

        return allEmployees.filter(employee =>
            employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.statusLabel.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allEmployees, searchTerm]);

    const getPercentageColor = (percentage) => {
        return percentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
            percentage >= 60 ? 'text-amber-600 dark:text-amber-400' :
                'text-rose-600 dark:text-rose-400';
    };

    const getProgressColor = (percentage) => {
        return percentage >= 80 ? 'bg-emerald-500' :
            percentage >= 60 ? 'bg-amber-500' :
                'bg-rose-500';
    };

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

    const getStatusBackgroundColor = (type) => {
        const colors = {
            present: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
            absent: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
            leave: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
            permission: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
            wfh: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
            default: "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
        };
        return colors[type] || colors.default;
    };

    const StatusCard = ({ type, count, names, label }) => {
        const hasEmployees = count > 0 && names?.length > 0;

        const handleClick = () => {
            if (hasEmployees) {
                setActivePanel(type);
            }
        };

        const getBackgroundColor = (type) => {
            const colors = {
                present: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
                absent: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
                leave: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
                permission: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                wfh: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
                default: "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
            };
            return colors[type] || colors.default;
        };

        const getHoverColor = (type) => {
            if (!hasEmployees) return "";
            const colors = {
                present: "hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer",
                absent: "hover:bg-rose-100 dark:hover:bg-rose-900/30 cursor-pointer",
                leave: "hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer",
                permission: "hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer",
                wfh: "hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer",
                default: "hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
            };
            return colors[type] || colors.default;
        };

        return (
            <div
                className={`text-center p-3 rounded-lg border transition-all duration-200 ${getBackgroundColor(type)} ${getHoverColor(type)} ${!hasEmployees ? 'opacity-60' : 'group relative'
                    }`}
                onClick={handleClick}
            >
                <div className={`text-xl font-bold ${hasEmployees ? getStatusColor(type) : 'text-neutral-400 dark:text-neutral-600'}`}>
                    {count}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center justify-center gap-1">
                    {label}
                    {hasEmployees && (
                        <ChevronLeft className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    )}
                </div>

                {/* Modern indicator dot for clickable cards */}
                {hasEmployees && (
                    <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusColor(type).replace('text-', 'bg-')} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                )}
            </div>
        );
    };

    const StatusPanel = () => {
        if (!activePanel) return null;

        const panelConfig = {
            present: { label: "Present", names: summary.presentNames, count: summary.present },
            absent: { label: "Absent", names: summary.absentNames, count: summary.absent },
            leave: { label: "Leave", names: summary.leaveNames, count: summary.leave },
            permission: { label: "Permission", names: summary.permissionNames, count: summary.permission },
            wfh: { label: "WFH", names: summary.wfhNames, count: summary.wfh }
        };

        const config = panelConfig[activePanel];
        if (!config) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
                <div className="w-full max-w-md bg-white dark:bg-neutral-900 h-full flex flex-col">
                    {/* Header - Fixed height */}
                    <div className={`p-6 border-b ${getStatusBackgroundColor(activePanel)} flex-shrink-0`}>
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActivePanel(null)}
                                className="p-2 h-auto rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${getStatusBackgroundColor(activePanel)}`}>
                                    <Users className={`h-6 w-6 ${getStatusColor(activePanel)}`} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {config.label} Employees
                                    </h2>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {config.count} {config.count === 1 ? 'employee' : 'employees'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employee List - Flexible height */}
                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            <div className="space-y-3">
                                {config.names.map((name, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200"
                                    >
                                        <div className={`p-2 rounded-full ${getStatusBackgroundColor(activePanel)}`}>
                                            <User className={`h-4 w-4 ${getStatusColor(activePanel)}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm truncate">
                                                {name}
                                            </h3>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                Employee
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activePanel)} ${getStatusBackgroundColor(activePanel)} whitespace-nowrap`}>
                                            {config.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
        );
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                         variant="outline"
                         size="sm"
                         className="w-full"
                    >
                        View All Teams ({data.length})
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                        <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            Attendance Overview
                        </DialogTitle>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </DialogHeader>
                    
                    <ScrollArea className="h-[calc(90vh-120px)] px-6">
                        {activePanel && <StatusPanel />}

                        <div className="space-y-6 py-4">
                            {/* Modern Summary */}
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                        {data.length > 1 ? "All Teams Overview" : "Team Overview"}
                                    </h4>
                                    <div className={`text-lg font-bold ${getPercentageColor(overallPercentage)}`}>
                                        {overallPercentage}%
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                        <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                            {summary.totalEmployees}
                                        </div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Total</div>
                                    </div>
                                    <StatusCard
                                        type="present"
                                        count={summary.present}
                                        names={summary.presentNames}
                                        label="Present"
                                    />
                                    <StatusCard
                                        type="absent"
                                        count={summary.absent}
                                        names={summary.absentNames}
                                        label="Absent"
                                    />
                                    <StatusCard
                                        type="leave"
                                        count={summary.leave}
                                        names={summary.leaveNames}
                                        label="Leave"
                                    />
                                    <StatusCard
                                        type="permission"
                                        count={summary.permission}
                                        names={summary.permissionNames}
                                        label="Permission"
                                    />
                                    <StatusCard
                                        type="wfh"
                                        count={summary.wfh}
                                        names={summary.wfhNames}
                                        label="WFH"
                                    />
                                </div>

                                {/* Progress Section */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                            Overall Attendance
                                        </span>
                                        <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                                            {summary.present} / {summary.totalEmployees}
                                        </span>
                                    </div>
                                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(overallPercentage)}`}
                                            style={{ width: `${overallPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Team-wise breakdown */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                        All Team Performance
                                    </h4>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
                                        {data.length} teams
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {data.map((item, index) => (
                                        <StatisticsCard
                                            key={item.teamName || item.date || index}
                                            data={item}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AttendanceDialog;