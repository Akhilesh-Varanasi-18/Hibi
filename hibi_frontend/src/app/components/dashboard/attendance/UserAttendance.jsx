"use client"
import React, { useEffect, useState } from 'react'
import { Attendance_Apis } from '@/Apis/Attendance_Apis'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Filter, Download, Clock, User, FileText, Loader2, Search, X, Calendar } from "lucide-react"
import { format } from "date-fns"
import * as XLSX from 'xlsx';
import { Input } from '@/components/ui/input'
import BgIcon from '@/app/components/BgIcon'
import MultipleDateSelector from '../../ReusableComponents/MultipleDateSelector'
import { getDDMMYYDate, getFirstOfMonth_ddmmyy } from '@/utils/DateFunctions'

const UserAttendance = () => {
    const [statuses, setStatuses] = useState([])
    const [attendanceData, setAttendanceData] = useState([])
    const [filteredData, setFilteredData] = useState([])
    const [loading, setLoading] = useState(false)
    const [exportLoading, setExportLoading] = useState(false)
    const [dateRange, setDateRange] = useState({
        from: new Date(getFirstOfMonth_ddmmyy()),
        to: new Date()
    })
    const [selectedStatus, setSelectedStatus] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')


    useEffect(() => {
        AttendenceStatus();
        getAttendance();

    }, [])

    // Filter data based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredData(attendanceData);
        } else {
            const filtered = attendanceData.filter(record =>
                record?.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record?.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                formatDateTime(record?.logInTime)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                formatDateTime(record?.logOutTime)?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, attendanceData]);

    async function AttendenceStatus() {
        try {
            const res = await Attendance_Apis.getAttendenceStatus();
            if (res?.success) {
                setStatuses(res?.data || []);
            }
        } catch (error) {
            console.error("Error fetching statuses:", error);
        }
    }

    async function getAttendance() {
        // console.log(dateRange)
        setLoading(true);
        try {
            const data = {
                fromDate: getDDMMYYDate(dateRange.from),
                toDate: getDDMMYYDate(dateRange.to),
                statusId: selectedStatus || ""
            }
            const res = await Attendance_Apis.getAttendance(data);
            const resData=res.data.reverse()
            if (res?.success) {
                setAttendanceData(resData || []);
                setFilteredData(resData || []);
                // console.log(res.data.reverse());

            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        } finally {
            setLoading(false);
        }
    }



    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            const isoString = date.toISOString();
            const [datePart, timePart] = isoString.split("T");
            return ` ${timePart.split(".")[0]}`
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'N/A';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const isoString=date.toISOString().split("T")[0].split("-").reverse().join("-");
            return isoString;
        }
        catch (error) {
            console.error("Error formatting date:", error);
            return 'N/A';
        }
    }

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'PRESENT': return 'default';
            case 'FULL DAY': return 'secondary';
            case 'FIRST HALF': return 'outline';
            case 'SECOND HALF': return 'outline';
            case 'PUBLIC HOLIDAY': return 'secondary';
            case 'WEEKLY OFF': return 'secondary';
            default: return 'outline';
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e?.target?.value || '');
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    // Excel Export Function with filtered data
    const exportToExcel = async () => {
        setExportLoading(true);
        try {
            // Use filteredData for export if search is active, otherwise use attendanceData
            const dataToExport = searchTerm ? filteredData : attendanceData;

            if (!dataToExport || dataToExport.length === 0) {
                alert('No data to export');
                return;
            }

            const exportData = dataToExport.map(record => ({
                'Employee Name': record?.employeeName || 'N/A',
                "Date":record?.date || "N/A",
                'Login Time': formatDateTime(record?.logInTime),
                'Logout Time': formatDateTime(record?.logOutTime),
                'Status': record?.status || 'N/A',
                'Late In': record?.lateIn ? 'Yes' : 'No',
                'Early Out': record?.earlyOut ? 'Yes' : 'No',
                'Login Time Only': formatDateTime(record?.logInTime)?.split(' ')[1] || 'N/A',
                'Logout Time Only': record?.logOutTime ? formatDateTime(record?.logOutTime)?.split(' ')[1] || 'N/A' : 'N/A'
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, "Attendance Records");

            const fromDateStr = format(dateRange.from, 'yyyy-MM-dd');
            const toDateStr = format(dateRange.to, 'yyyy-MM-dd');
            const searchSuffix = searchTerm ? `_search_${searchTerm.substring(0, 10)}` : '';
            const fileName = `Attendance_Records_${fromDateStr}_to_${toDateStr}${searchSuffix}.xlsx`;

            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert('Error exporting data. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };



    return (
        <div className="min-h-screen p-6">
            <div className="w-full mx-auto">
                {/* Header */}
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                    Attendance dashboard
                </h1>

                {/* Filters Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BgIcon icon={Filter} />
                            Filters
                        </CardTitle>
                        <CardDescription>Select date range and status to filter attendance records</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium">Date Range</label>
                                <MultipleDateSelector setDateRange={setDateRange} dateRange={dateRange} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>
                                            All
                                        </SelectItem>
                                        {statuses.map(status => (
                                            <SelectItem key={status._id} value={status._id}>
                                                {status.name} ({status.shortName})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className='flex w-full justify-end'>
                                <Button
                                    onClick={getAttendance}
                                    disabled={loading}
                                    className="mt-6 items-end"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Filter className="mr-2 h-4 w-4" />
                                            Apply Filters
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Card */}
                <Card>
                    <CardHeader className="flex flex-col space-y-4 pb-2">
                        {/* Search Input */}
                        <div className="relative w-full ">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by status, or time..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-10 pr-10"
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BgIcon icon={FileText} color={"#059669"} />
                                    Attendance Records
                                </CardTitle>
                                <CardDescription>
                                    {/* {filteredData.length} of {attendanceData.length} records found */}
                                    {searchTerm && ` matching "${searchTerm}"`}
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportToExcel}
                                disabled={exportLoading || filteredData.length === 0}
                                className="sm:self-start"
                            >
                                {exportLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="text-center">
                                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                                    <p className="mt-4 text-muted-foreground">Loading attendance data...</p>
                                </div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="text-center">
                                    <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-medium text-foreground">
                                        {searchTerm ? 'No matching records found' : 'No records found'}
                                    </h3>
                                    <p className="mt-2 text-muted-foreground">
                                        {searchTerm ? 'Try a different search term or adjust your filters' : 'Try adjusting your filters to see more results.'}
                                    </p>
                                    {searchTerm && (
                                        <Button
                                            variant="outline"
                                            onClick={clearSearch}
                                            className="mt-4"
                                        >
                                            Clear Search
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {/* <TableHead className="w-[250px]">
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                Employee
                                            </div>
                                        </TableHead> */}
                                        <TableHead >
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Date
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                Login Time
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                Logout Time
                                            </div>
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((record,ind) => (
                                        record.employeeName ?
                                            <TableRow key={ind}>
                                                {/* <TableCell className="font-medium">
                                                    {record.employeeName}
                                                </TableCell> */}
                                                <TableCell>{formatDate(record.date)}</TableCell>
                                                <TableCell>{formatDateTime(record.logInTime)}</TableCell>
                                                <TableCell>{record.logOutTime ? formatDateTime(record.logOutTime) : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(record.status)}>
                                                        {
                                                            record.status != "PRESENT" ? `${record.status} (A)` : `${record.status}`
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {record.lateIn && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-b from-yellow-100 to-yellow-200 text-yellow-800 border-0 shadow-sm font-semibold text-xs"
                                                            >
                                                                <Clock className="h-3 w-3 text-yellow-500" />
                                                                Late In
                                                            </Badge>
                                                        )}
                                                        {record.earlyOut && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-b from-red-100 to-red-200 text-red-800 border-0 shadow-sm font-semibold text-xs"
                                                            >
                                                                <Clock className="h-3 w-3 text-red-500" />
                                                                Early Out
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            : (
                                                <TableRow key={ind}>
                                                    <TableCell colSpan={6} className=" text-sm w-full text-center text-zinc-500 ">
                                                        {record.status + " ( " + formatDate(record.date) + " )"}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default UserAttendance;