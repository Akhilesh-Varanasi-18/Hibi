import { Attendance_Apis } from '@/Apis/Attendance_Apis';
import { payrollApis } from '@/Apis/Payroll_Apis';
import CustomDialog from '@/app/components/ReusableComponents/CustomDialog';
import CustomDialogWithOpenControl from '@/app/components/ReusableComponents/CustomDialogWithOpenControl';
import { StatusBadge } from '@/components/ui/Approval';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showToast } from '@/lib/ToastService';
import ExcelJS from 'exceljs';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AiOutlineLoading } from 'react-icons/ai';

const SalaryStatementGenerator = ({ data, loading, payload }) => {
    // console.log(data);
    // console.log(payload);
    const [open, setOpen] = useState(false);
    const [pendingData, setPendingData] = useState(null)
    const [downloadLoading, setdownloadLoading] = useState(false)
    // const [payloadData, setPayloadData] = useState(data)


    // useEffect(() => {
    //     setPayloadData(data);
    // }, []);


    function formatDate(dateString) {
        const date = dateString.split("-").reverse().join("-");
        return date
    }


    function getName() {
        const date = new Date(payload.startDate);

        // Get month name and year
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();

        // Construct filename
        const fileName = `${month} ${year} SALARY STATEMENT.xlsx`;

        return fileName;
    }

    const generateExcel = async (payloadData) => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Worksheet');

            // Add logo/header section (you can skip this if not needed)
            worksheet.mergeCells('A1:C7');
            const logoCell = worksheet.getCell('A1');
            logoCell.value = 'ADITYA\nUNIVERSITY';
            logoCell.alignment = { horizontal: 'center', vertical: 'middle' };
            logoCell.font = { bold: true, size: 10 };

            // Add Technical Hub header
            worksheet.mergeCells('D1:AE7');
            const headerCell = worksheet.getCell('D1');
            headerCell.value = 'TECHNICAL HUB';
            headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
            headerCell.font = { bold: true, size: 24, color: { argb: 'FF00B050' } };

            // Add date range header
            worksheet.mergeCells('AF1:AQ7');
            const dateCell = worksheet.getCell('AF1');
            dateCell.value = `${formatDate(payload.startDate)}  ${formatDate(payload.endDate)}`;
            dateCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            dateCell.font = { bold: true, size: 14 };

            // Define column headers
            const headerRow = worksheet.getRow(8);
            //    [
            //         'Sl.No', 'Emp.Code', 'Emp.Name', 'Designation', 'Account Number',
            //         '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
            //         '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
            //         '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', 'WO',
            //         'No.of Days', 'No.of working Days', 'OD\'s', 'PH', 'CL Used', 'VACATION',
            //         'Working / Present', 'LOP', 'Payable Days'
            //     ];

            const headers = ["S no", ...payloadData.columns];

            headerRow.values = headers;

            // Style header row
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' }  // Light grey background
                };
                cell.font = { bold: true, color: { argb: 'FF000000' }, size: 10 };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Color mappings for fonts only (no fill)
            const colorMap = {
                'P': { font: 'FF305496' },      // Blue font
                'PH': { font: 'FFFF0000' },     // Red font
                'WO': { font: 'FFFF0000' },     // Red font
                'CL': { font: 'FF305496' },     // Blue font
                'OD': { font: 'FF000000' },     // Black font
                'AB': { font: 'FF305496' },     // Blue font
                'FH': { font: 'FFFF0000' },     // Red font
                'SH': { font: 'FFFF0000' },     // Red font
                'VAC': { font: 'FFFF0000' },    // Red font
            };

            // Add employee data
            payloadData.data.forEach((employee, index) => {
                const rowNum = index + 9;
                const row = worksheet.getRow(rowNum);

                // Basic employee info
                const rowData = [
                    index + 1,
                    employee["Emp.Code"],
                    employee['Emp.Name'],
                    employee['Designation'] || '############',
                    employee['Account Number'] || '############',
                ];

                // Add daily attendance (days 1-30)
                for (let day = 1; day <= employee["No.of Days"]; day++) {
                    const dayKey = day.toString().padStart(2, '0');
                    rowData.push(employee[dayKey] || '');
                }

                // Add summary columns
                rowData.push(
                    employee['WO'] || 0,
                    employee['No.of Days'] || 0,
                    employee["OD's"] || 0,
                    employee['CL Used'] || 0,
                    employee["WFH"] || 0,
                    employee['PH'] || 0,
                    employee['No.of Working Days'] || 0,
                    employee['Payble Days'] || 0,
                    employee['LOP'] || 0,
                    // employee['VACATION'] || 0,
                    // employee['Working'] || 0,
                );

                row.values = rowData;
                row.height = 20;

                // Style all cells
                row.eachCell((cell, colNumber) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };

                    // Apply font colors to daily attendance columns (6-35 for days 1-30)
                    if (colNumber >= 6 && colNumber <= 35) {
                        const dayIndex = colNumber - 5;
                        const dayKey = dayIndex.toString().padStart(2, '0');
                        const cellValue = employee[dayKey] || '';

                        if (cellValue) {
                            // Handle combined values like "P/CL"
                            const values = cellValue.split('/');
                            const primaryValue = values[0].trim();

                            if (colorMap[primaryValue]) {
                                cell.font = {
                                    color: { argb: colorMap[primaryValue].font }
                                };
                            }
                        }
                    }

                    // Apply specific font colors to summary columns
                    if (colNumber === 37) { // No.of Days (column 37)
                        cell.font = { color: { argb: 'FF305496' } }; // Blue
                    }
                    if (colNumber === 38) { // No.of working Days (column 38)
                        cell.font = { color: { argb: 'FF305496' } }; // Blue
                    }
                    if (colNumber === 39) { // OD's (column 39)
                        cell.font = { color: { argb: 'FF305496' } }; // Blue
                    }
                    if (colNumber === 40) { // PH (column 40)
                        cell.font = { color: { argb: 'FF00B050' } }; // Green
                    }
                    if (colNumber === 44) { // LOP (column 44)
                        cell.font = { color: { argb: 'FF305496' } }; // Blue
                    }
                    if (colNumber === 45) { // Payable Days (column 45)
                        cell.font = { color: { argb: 'FF92D050' } }; // Light green
                    }
                });
            });

            // Find last data row
            const lastRow = worksheet.lastRow.number + 2;

            // Remarks section title
            worksheet.mergeCells(`A${lastRow}:B${lastRow}`);
            const remarksTitle = worksheet.getCell(`A${lastRow}`);
            remarksTitle.value = 'Remarks:';
            remarksTitle.font = { bold: true, color: { argb: 'FFFF0000' }, size: 12 };
            remarksTitle.alignment = { vertical: 'top' };

            // Left remarks list
            const leftRemarks = [
                '• FH - First Half',
                '• SH - Second Half',
                '• WO - Week OFF',
                '• V - VACATION'
            ];
            leftRemarks.forEach((text, i) => {
                const cell = worksheet.getCell(`C${lastRow + i}`);
                cell.value = text;
                cell.font = { size: 11 };
            });

            // Right remarks list
            const rightRemarks = [
                '• CL - Casual Leave',
                '• ML - Marriage Leave',
                '• P - Present',
                '• AB - Absent/LOP'
            ];
            rightRemarks.forEach((text, i) => {
                const cell = worksheet.getCell(`I${lastRow + i}`);
                cell.value = text;
                cell.font = { size: 11 };
            });

            // CEO Signature section
            const signatureRow = lastRow + rightRemarks.length + 2;
            worksheet.mergeCells(`J${signatureRow}:N${signatureRow}`);
            const ceoCell = worksheet.getCell(`J${signatureRow}`);
            ceoCell.value = 'Signature of CEO';
            ceoCell.font = { size: 12, bold: true };
            ceoCell.alignment = { horizontal: 'right' };

            // Set column widths
            const columnWidths = [
                { width: 6 },   // A: Sl.No
                { width: 10 },  // B: Emp.Code
                { width: 25 },  // C: Emp.Name
                { width: 20 },  // D: Designation
                { width: 18 },  // E: Account Number
            ];

            // Days 1-30 (compact columns)
            for (let i = 0; i < 30; i++) {
                columnWidths.push({ width: 4 });
            }

            // Summary columns
            columnWidths.push(
                { width: 4 },   // WO
                { width: 8 },   // No.of Days
                { width: 12 },  // No.of working Days
                { width: 5 },   // OD's
                { width: 4 },   // PH
                { width: 8 },   // CL Used
                { width: 10 },  // VACATION
                { width: 12 },  // Working / Present
                { width: 5 },   // LOP
                { width: 10 }   // Payable Days
            );

            columnWidths.forEach((width, index) => {
                worksheet.getColumn(index + 1).width = width.width;
            });

            // Generate and download the file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = getName();
            link.click();
            window.URL.revokeObjectURL(url);

            console.log('Excel generated successfully!');
        } catch (error) {
            console.error('Error generating Excel:', error);
            alert('Failed to generate Excel file. Please try again.');
        }
    };


    const getPendingRequests = async () => {
        setdownloadLoading(true);
        const res = await payrollApis.GetPendingRequests(payload);
        if (res.success) {
            // showToast("Success, check console", "success")
            setPendingData(prev => res?.data?.data)
            console.log(res.data)
            if (
                res?.data?.data &&
                (!res?.data?.data.leavesData || res?.data?.data.leavesData.length == 0) &&
                (!res?.data?.data.wfhsData || res?.data?.data.wfhsData.length == 0) &&
                (!res?.data?.data.permissionsData || res?.data?.data.permissionsData.length == 0) &&
                (!res?.data?.data.thumbsData || res?.data?.data.thumbsData.length == 0)
            ) {
                const resProcessAttendancePunches = await Attendance_Apis.ProcessAttendancePunches({ fromDate: payload.startDate, toDate: payload.endDate });
                const res = await payrollApis.GetPayrollReports(payload);
                // console.log(res)
                // setPayloadData(res.data);
                generateExcel(res.data);
            } else {
                setOpen(true)
                showToast("There are steps required before download. Please review pending approvals.", "error", true);
            }
        } else {
            showToast("Failed", "error")
        }
        setdownloadLoading(false)
        console.log(res)
    }

    return (
        <div className="ml-2 text-xs text-muted-foreground flex items-center gap-2">
            <Button
                onClick={getPendingRequests}
                disabled={loading || downloadLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
            >
                {loading || downloadLoading ? <span className="flex items-center gap-2">
                    <AiOutlineLoading className="animate-spin" />
                </span> : <Download />}
            </Button>

            <CustomDialogWithOpenControl open={open} setOpen={setOpen} label={"Pending Approvals"}

                content={
                    <div className="w-full">
                        <Tabs defaultValue="leaves" className="w-full">
                            <TabsList className="grid grid-cols-4 w-full mb-4">
                                <TabsTrigger value="leaves">Leaves ({pendingData?.leavesData?.length})</TabsTrigger>
                                <TabsTrigger value="wfhs">WFHs ({pendingData?.wfhsData?.length}) </TabsTrigger>
                                <TabsTrigger value="permissions">Permissions ({pendingData?.permissionsData?.length})</TabsTrigger>
                                <TabsTrigger value="thumbs">Thumbs ({pendingData?.thumbsData?.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent className="max-h-[60vh] overflow-y-auto " value="leaves">
                                <div className="space-y-5">
                                    {(pendingData?.leavesData?.length > 0) ? pendingData.leavesData.map(item => {
                                        const startDate = item.startDate?.split('T')[0] || "-";
                                        const endDate = item.endDate?.split('T')[0] || "-";
                                        return (
                                            <Card key={item._id} className="rounded-2xl shadow-md px-6 py-5 transition hover:shadow-lg">
                                                <div className="flex items-start justify-between mb-2 gap-2">
                                                    <div>
                                                        <div className="text-lg font-semibold flex items-center gap-2">
                                                            {item.leaveType}
                                                            <StatusBadge label={item.Status} />
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            {startDate} <span className="mx-1">→</span> {endDate}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end text-right space-y-0.5">
                                                        <div className="font-medium text-xs text-gray-600">Requested By</div>
                                                        <div className="text-base text-foreground">{item.requestedBy}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-gray-500">Reason:</span>
                                                        <span>{item.leaveReason || <span className="text-muted-foreground">-</span>}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-gray-500">Total Days:</span>
                                                        <span>{item.totalDays}</span>
                                                        <span className="px-1 text-gray-400">|</span>
                                                        <span className="font-semibold text-gray-500">Actual Working:</span>
                                                        <span>{item.actualWorkingDays}</span>
                                                    </div>
                                                    {item.isHalfDay && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-gray-500">Half Day Period:</span>
                                                            <span>{item.halfDayPeriod}</span>
                                                        </div>
                                                    )}
                                                    {item.actionedBy && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-gray-500">Actioned By:</span>
                                                            <span>{item.actionedBy}</span>
                                                        </div>
                                                    )}
                                                    {item.actionReason && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-gray-500">Action Reason:</span>
                                                            <span>{item.actionReason}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap text-xs opacity-80 gap-4 mt-3 pt-2 border-t border-gray-100">
                                                    <div>
                                                        <span className="font-medium text-gray-500">Consideration:</span> {item.consideration}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-500">Notify:</span> {item.notifyTo?.join(', ') || <span className="text-muted-foreground">-</span>}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    }) : (
                                        <div className="text-center text-muted-foreground py-8">No Pending Leaves.</div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent className="max-h-[60vh] overflow-y-auto " value="wfhs">
                                <div className="space-y-5">
                                    {(pendingData?.wfhsData?.length > 0) ? pendingData.wfhsData.map(item => {
                                        const startDate = item.startDate?.split('T')[0] || "-";
                                        const endDate = item.endDate?.split('T')[0] || "-";
                                        return (
                                            <Card key={item._id} className="rounded-2xl shadow-md px-6 py-5 transition hover:shadow-lg">
                                                <div className="flex items-start justify-between mb-2 gap-2">
                                                    <div>
                                                        <div className="text-lg font-semibold flex items-center gap-2">
                                                            WFH
                                                            <StatusBadge label={item.Status} />
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            {startDate} <span className="mx-1">→</span> {endDate}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end text-right space-y-0.5">
                                                        <div className="font-medium text-xs text-gray-600">Requested By</div>
                                                        <div className="text-base text-foreground">{item.requestedBy}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-gray-500">Reason:</span>
                                                        <span>{item.wfhReason || <span className="text-muted-foreground">-</span>}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-gray-500">Total Days:</span>
                                                        <span>{item.totalDays}</span>
                                                    </div>
                                                    {item.isHalfDay && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-gray-500">Half Day Period:</span>
                                                            <span>{item.halfDayPeriod}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap text-xs opacity-80 gap-4 mt-3 pt-2 border-t border-gray-100">
                                                    <div>
                                                        <span className="font-medium text-gray-500">Notify:</span> {item.notifyTo?.join(', ') || <span className="text-muted-foreground">-</span>}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    }) : (
                                        <div className="text-center text-muted-foreground py-8">No Pending WFHs.</div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent className="max-h-[60vh] overflow-y-auto " value="permissions">
                                <div className="space-y-5">
                                    {(pendingData?.permissionsData?.length > 0) ? pendingData.permissionsData.map(item => {
                                        const startTime = item.startTime?.split('T')[0] + " " + (item.startTime?.split('T')[1]?.slice(0, 5) || "") || "-";
                                        const endTime = item.endTime?.split('T')[0] + " " + (item.endTime?.split('T')[1]?.slice(0, 5) || "") || "-";
                                        return (
                                            <Card key={item._id} className="rounded-2xl shadow-md px-6 py-5 transition hover:shadow-lg">
                                                <div className="flex items-start justify-between mb-2 gap-2">
                                                    <div>
                                                        <div className="text-lg font-semibold flex items-center gap-2">
                                                            {item.permissionType}
                                                            <StatusBadge label={item.Status} />
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            {startTime} <span className="mx-1">→</span> {endTime}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end text-right space-y-0.5">
                                                        <div className="font-medium text-xs text-gray-600">Requested By</div>
                                                        <div className="text-base text-foreground">{item.requestedBy}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-gray-500">Reason:</span>
                                                        <span>{item.permissionReason || <span className="text-muted-foreground">-</span>}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-gray-500">Total Hours:</span>
                                                        <span>{item.totalHours}</span>
                                                    </div>
                                                    {typeof item.isFirstHalf === "boolean" && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-gray-500">Is First Half:</span>
                                                            <span>{item.isFirstHalf ? "Yes" : "No"}</span>
                                                        </div>
                                                    )}
                                                    {item.actionedBy && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-gray-500">Actioned By:</span>
                                                            <span>{item.actionedBy}</span>
                                                        </div>
                                                    )}
                                                    {item.actionReason && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-gray-500">Action Reason:</span>
                                                            <span>{item.actionReason}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap text-xs opacity-80 gap-4 mt-3 pt-2 border-t border-gray-100">
                                                    <div>
                                                        <span className="font-medium text-gray-500">Notify:</span> {item.notifyTo?.join(', ') || <span className="text-muted-foreground">-</span>}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    }) : (
                                        <div className="text-center text-muted-foreground py-8">No Pending Permissions.</div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent className="max-h-[60vh] overflow-y-auto " value="thumbs">
                                <div className="space-y-5">
                                    {(pendingData?.thumbsData?.length > 0) ? pendingData.thumbsData.map(item => (
                                        <Card key={item._id || Math.random()} className="rounded-2xl shadow-md px-6 py-5 transition hover:shadow-lg">
                                            <div className="flex items-start justify-between mb-2 gap-2">
                                                <div>
                                                    <div className="text-lg font-semibold flex items-center gap-2">
                                                        {item.punchType || "Thumb"}
                                                        <StatusBadge label={item.status} />
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        {item.thumbDate ? item.thumbDate.split('T')[0] : "-"}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end text-right space-y-0.5">
                                                    <div className="font-medium text-xs text-gray-600">Requested By</div>
                                                    <div className="text-base text-foreground">{item.requestedBy}</div>
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="font-semibold text-gray-500">Request For:</span>
                                                    <span>{item.requestFor}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="font-semibold text-gray-500">Reason:</span>
                                                    <span>{item.reason || <span className="text-muted-foreground">-</span>}</span>
                                                </div>

                                                {item.actionedBy && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-gray-500">Actioned By:</span>
                                                        <span>{item.actionedBy}</span>
                                                    </div>
                                                )}
                                                {item.actionReason && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-gray-500">Action Reason:</span>
                                                        <span>{item.actionReason}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap text-xs opacity-80 gap-4 mt-3 pt-2 border-t border-gray-100">
                                                <div>
                                                    <span className="font-medium text-gray-500">Notify:</span> {item.notifyTo?.join(', ') || <span className="text-muted-foreground">-</span>}
                                                </div>
                                            </div>
                                        </Card>
                                    )) : (
                                        <div className="text-center text-muted-foreground py-8">No Pending Thumbs Data.</div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                }

            />
        </div>
    );
};

export default SalaryStatementGenerator;