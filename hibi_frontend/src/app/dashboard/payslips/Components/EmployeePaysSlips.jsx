"use client";

import * as React from "react";
import {
    Building,
    CreditCard,
    FileText,
    X,
    Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import payslipApi from "@/Apis/paySlips";
import DownloadButton from "./DowloadButton";
import Comparing from "@/utils/CommonFunctionality";
import { UsersContext } from "@/app/context/UserContext";
import BulkPayslipUpload from "./BuldUploadPaySlips";
import { useToast } from "@/hooks/use-toast";
import { RxCross2 } from "react-icons/rx";
import { Skeleton } from "@/components/ui/skeleton";

const EmployeePaysSlipss = () => {
    const [selectedMonths, setSelectedMonths] = React.useState([]);
    const [startYear, setStartYear] = React.useState(new Date().getFullYear());
    const [startMonth, setStartMonth] = React.useState((new Date().getMonth() + 1).toString());
    const [endYear, setEndYear] = React.useState(new Date().getFullYear());
    const [endMonth, setEndMonth] = React.useState((new Date().getMonth() + 1).toString());
    const [loading, setLoading] = React.useState(false);
    const [payrollData, setPayrollData] = React.useState(null);
    const [employee, setEmployee] = React.useState(null);
    const { previlege } = React.useContext(UsersContext)
    const { toast } = useToast();

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];

    const years = [];
    for (let i = 2024; i <= currentYear; i++) {
        years.push(i);
    }

    const getAvailableMonths = (year) => {
        if (year < currentYear) return months;
        if (year === currentYear)
            return months.filter((m) => parseInt(m.value) <= currentMonth);
        return [];
    };

    const generateMonthRange = () => {
        if (!startMonth || !endMonth || !startYear || !endYear) {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> <span>Needed All Fileds</span>
                </div>,
            })
            return;
        }

        const startDate = new Date(startYear, parseInt(startMonth) - 1);
        const endDate = new Date(endYear, parseInt(endMonth) - 1);

        if (startDate > endDate) {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> <span>Please select a valid date range first</span>
                </div>,
            })
            return;
        }

        const monthsInRange = [];
        let current = new Date(startDate);

        while (current <= endDate) {
            const year = current.getFullYear();
            const month = current.getMonth() + 1;
            const monthKey = `${year}-${month}`;

            // Check if the month is available (not in future)
            const availableMonths = getAvailableMonths(year);
            const isAvailable = availableMonths.some(m => parseInt(m.value) === month);

            if (isAvailable && !monthsInRange.includes(monthKey)) {
                monthsInRange.push(monthKey);
            }

            current.setMonth(current.getMonth() + 1);
        }

        setSelectedMonths(monthsInRange);
        return monthsInRange;
    };

    const removeMonth = (monthKey) =>
        setSelectedMonths((prev) => prev.filter((key) => key !== monthKey));

    const clearAll = () => {
        setSelectedMonths([]);
        setStartMonth((new Date().getMonth() + 1).toString());
        setEndMonth((new Date().getMonth() + 1).toString());
    };

    const getMonthDisplay = (monthKey) => {
        const [year, month] = monthKey.split("-");
        const monthName = months.find((m) => m.value === month)?.label;
        return `${monthName} ${year}`;
    };

    const startAvailableMonths = getAvailableMonths(startYear);
    const endAvailableMonths = getAvailableMonths(endYear);

    async function getPayrolls() {
        // Auto-generate month range if not already generated
        let monthsToUse = generateMonthRange();
        if (!monthsToUse) return;
        if (monthsToUse?.length === 0) {
            monthsToUse = generateMonthRange() || [];
            if (monthsToUse?.length === 0) {
                alert("Please select a valid date range first");
                return;
            }
        }

        setLoading(true);
        const periodList = monthsToUse?.map((ele) => {
            const [year, month] = ele.split("-");
            return { month: parseInt(month), year: parseInt(year) };
        });

        try {
            const res = await payslipApi.getPayslips({ periodList });
            if (res.success) {
                setPayrollData(res.data?.results || null);
                setEmployee(res.data.employee);
            } else {
                setPayrollData(null);
                setEmployee(null);
            }
        } catch (error) {
            console.error("Error fetching payroll data:", error);
            setPayrollData(null);
            setEmployee(null);
        }
        setLoading(false);
    }

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount || 0);

    const getMonthName = (monthNumber) =>
        months.find((m) => m.value === monthNumber.toString())?.label || "";

    return (
        <div className="min-h-screen">
            <div className="max-w-full mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="w-full">
                        <h1 className="text-2xl font-bold tracking-tight">Pay Slips</h1>
                        <p className="text-sm text-muted-foreground">
                            View and manage your salary slips
                        </p>
                    </div>
                    {Comparing.compareStrings(previlege, "superadmin") &&
                        <div className='w-full flex justify-end'>
                            <BulkPayslipUpload />
                        </div>}
                </div>

                {/* Period Selector */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Calendar className="h-4 w-4" /> Select Date Range
                        </CardTitle>
                        <CardDescription>
                            Choose a range of months to generate payslips
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            {/* Start Date */}
                            <div>
                                <h4 className="text-sm font-medium mb-2">From</h4>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Select
                                        value={startYear.toString()}
                                        onValueChange={(value) => setStartYear(parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={startMonth}
                                        onValueChange={setStartMonth}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {startAvailableMonths.length ? (
                                                startAvailableMonths.map((month) => (
                                                    <SelectItem key={month.value} value={month.value}>
                                                        {month.label}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>
                                                    No months available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* End Date */}
                            <div>
                                <h4 className="text-sm font-medium mb-2">To</h4>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Select
                                        value={endYear.toString()}
                                        onValueChange={(value) => setEndYear(parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={endMonth}
                                        onValueChange={setEndMonth}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {endAvailableMonths.length ? (
                                                endAvailableMonths.map((month) => (
                                                    <SelectItem key={month.value} value={month.value}>
                                                        {month.label}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>
                                                    No months available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                onClick={getPayrolls}
                                disabled={!startMonth || !endMonth || startAvailableMonths.length === 0 || endAvailableMonths.length === 0}
                                className="w-full"
                            >
                                {loading ? "Loading..." : "Generate Payslips"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {loading && <div className="flex flex-col gap-5">
                    <Skeleton className={"w-full h-60"} />
                    <div className="w-full flex justify-end">
                        <Skeleton className={"w-32 h-10"}/>
                    </div>
                    <Skeleton className={"w-full h-80"} />
                </div>}

                {/* Employee + Payslip Section */}
                {employee && !loading && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Building className="h-4 w-4" /> Employee Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {[
                                    { label: "Employee Code", value: employee.employeeCode },
                                    { label: "Name", value: employee.employeeName },
                                    { label: "Bank Account", value: employee.accountNumber },
                                    { label: "PF Number", value: employee.pfNumber },
                                    { label: "ESIC Number", value: employee.esicNumber },
                                ].map((item, i) => (
                                    <div key={i}>
                                        <p className="text-xs text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <p className="font-medium break-all">
                                            {item.value || "N/A"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {employee && !loading && payrollData && (
                    <div className="w-full justify-end flex">
                        <DownloadButton employee={employee} payrollData={payrollData} />
                    </div>
                )}

                {/* Payslip List */}
                {payrollData && !loading &&
                    <ScrollArea className="h-[calc(100vh-220px)] rounded-md border p-2">
                        <div className="space-y-4">
                            {payrollData.map((paySlip, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <FileText className="h-4 w-4" />
                                                    {getMonthName(paySlip.month)} {paySlip.year}
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    Salary breakdown and deductions
                                                </CardDescription>
                                            </div>
                                            {paySlip?.paySlip && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Net: {formatCurrency(paySlip.paySlip.netSalary)}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {paySlip?.paySlip ? (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Earnings */}
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                                            <CreditCard className="h-3 w-3" />
                                                            Earnings
                                                        </h4>
                                                        <div className="space-y-1 text-sm">
                                                            {[
                                                                { label: "Basic Salary", value: paySlip.paySlip.basicSalary },
                                                                { label: "Dearness Allowance", value: paySlip.paySlip.da },
                                                                { label: "House Rent Allowance", value: paySlip.paySlip.houseRentAllowance },
                                                                { label: "Other Earnings", value: paySlip.paySlip.earningsOthers },
                                                            ].map((item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex justify-between"
                                                                >
                                                                    <span className="text-muted-foreground">{item.label}</span>
                                                                    <span className="font-medium">{formatCurrency(item.value)}</span>
                                                                </div>
                                                            ))}
                                                            <Separator />
                                                            <div className="flex justify-between font-medium">
                                                                <span>Total Earnings</span>
                                                                <span>{formatCurrency(paySlip.paySlip.totalEarnings)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Deductions */}
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                                            <FileText className="h-3 w-3" />
                                                            Deductions
                                                        </h4>
                                                        <div className="space-y-1 text-sm">
                                                            {[
                                                                { label: "Loss of Pay", value: paySlip.paySlip.lossOfPay },
                                                                { label: "Professional Tax", value: paySlip.paySlip.professionalTax },
                                                                { label: "EPF", value: paySlip.paySlip.epf },
                                                                { label: "Group Insurance", value: paySlip.paySlip.groupInsurance },
                                                                { label: "Canteen", value: paySlip.paySlip.canteen },
                                                                { label: "Advance", value: paySlip.paySlip.advance },
                                                                { label: "TDS", value: paySlip.paySlip.tds },
                                                                { label: "Contribution", value: paySlip.paySlip.contribution },
                                                                { label: "ESI", value: paySlip.paySlip.esi },
                                                                { label: "Other Deductions", value: paySlip.paySlip.others },
                                                            ]
                                                                .filter((i) => i.value > 0)
                                                                .map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between">
                                                                        <span className="text-muted-foreground">
                                                                            {item.label}
                                                                        </span>
                                                                        <span className="font-medium">
                                                                            {formatCurrency(item.value)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            <Separator />
                                                            <div className="flex justify-between font-medium">
                                                                <span>Total Deductions</span>
                                                                <span>{formatCurrency(paySlip.paySlip.totalDeductions)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Net Salary */}
                                                <div className="p-3 rounded-md border bg-muted/10">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                                        <div>
                                                            <h4 className="font-medium">Net Salary Payable</h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                {getMonthName(paySlip.month)} {paySlip.year}
                                                            </p>
                                                        </div>
                                                        <p className="text-lg sm:text-xl font-bold mt-2 sm:mt-0">
                                                            {formatCurrency(paySlip.paySlip.netSalary)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No payroll data available
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                }
            </div>
        </div>
    );
};

export default EmployeePaysSlipss;