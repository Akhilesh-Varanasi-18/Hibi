"use client";
import React, { useState, useRef } from "react";
import axiosInstance from "@/config/axiosConfig";
import bulkUploadApis from "@/Apis/BulkUpload";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Download,
    Upload,
    X,
    FileText,
    FileSpreadsheet,
    AlertCircle,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
import payslipApi from "@/Apis/paySlips";
import CustomAlert from "@/app/components/ReusableComponents/CustomAlert";

const BulkPayslipUpload = ({ onSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("upload");
    const [errors, setErrors] = useState([]);
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    // Handle file selection
    function handleFileUpload(event) {
        const file = event.target.files[0];
        setSelectedFile(file);
        setUploadStatus("");
        setUploadProgress(0);
        setErrors([]); // Clear previous errors when new file is selected
    }

    // Remove selected file
    function handleRemoveFile() {
        setSelectedFile(null);
        setUploadStatus("");
        setUploadProgress(0);
        setErrors([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    // Upload file to backend
    async function handleSubmit() {
        if (!selectedFile) {
            setUploadStatus("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        try {
            setUploadStatus("Uploading...");
            setErrors([]);

            const response = await axiosInstance.post(
                "/api/pay-slips/upload-payslips",
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            if (response.data.success) {
                setUploadStatus("✅ File uploaded successfully!");
                setTimeout(() => {
                    setIsDialogOpen(false);
                    setSelectedFile(null);
                    setUploadProgress(0);
                    setErrors([]);
                }, 2000);
                // onSuccess();
                toast({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> <span> success fully submitted</span>
                    </div>,
                })
            } else {
                setUploadStatus("❌ Upload completed with errors. Please review the issues below.");
                toast({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> <span>Upload completed with errors. Please review the issues below.</span>
                    </div>,
                })
                setErrors(response.data.errors || []);
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploadStatus("⚠️ Something went wrong. Please check your file format.");
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            if (error.response.data.message) {
                setUploadStatus(`❌ ${error.response.data.message}`);
            }
        }
    }

    // Download files
    async function downloadExcel(apiCall, filename) {
        try {
            const response = await apiCall({ responseType: "arraybuffer" });

            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Error downloading ${filename}:`, error);
            alert(`Failed to download ${filename}. Please try again.`);
        }
    }

    async function downloadTemplate() {
        await downloadExcel(payslipApi.getTemplate, "PaySlip_Template.xlsx");
    }

    // Function to parse error messages
    const parseErrorMessages = (errorString) => {
        if (!errorString) return [];

        // Split by period and filter out empty strings
        return errorString.split('. ')
            .filter(msg => msg.trim().length > 0)
            .map(msg => msg.trim() + (msg.endsWith('.') ? '' : '.'));
    };

    const HandleDialogue = (open) => {
        if (open) {
            setSelectedFile(null);
            setUploadStatus("");
            setUploadProgress(0);
            setActiveTab("upload");
            setErrors([]);
        }
        setIsDialogOpen(open);
    }
    return (
        <Dialog open={isDialogOpen} onOpenChange={HandleDialogue}>
            <DialogTrigger asChild>
                <Button variant="" className="gap-2">
                    <Upload size={16} className="h-4 w-4" />
                    Bulk Payslip Upload
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <FileSpreadsheet className="h-6 w-6" />
                        Bulk PaySlip Management
                    </DialogTitle>
                    <DialogDescription>
                        Upload Payslip data or download templates
                        <CustomAlert text={"This action requires careful consideration as it cannot be reversed."}/>
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <Upload size={16} />
                            Upload Data
                        </TabsTrigger>
                        <TabsTrigger value="download" className="flex items-center gap-2">
                            <Download size={16} />
                            Download Resources
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="file-upload">Select File</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                    className="cursor-pointer"
                                    ref={fileInputRef}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setActiveTab("download")}
                                    title="Get templates"
                                >
                                    <FileText size={16} />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Supported formats: .xlsx, .xls, .csv
                            </p>
                        </div>

                        {selectedFile && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm">Selected File</CardTitle>
                                        <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                                            <X size={16} />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <FileText size={20} className="text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {uploadProgress > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        )}

                        {uploadStatus && (
                            <div className={`p-3 rounded-md text-sm ${uploadStatus.includes("✅")
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : uploadStatus.includes("❌") || uploadStatus.includes("⚠️")
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}>
                                {uploadStatus}
                            </div>
                        )}

                        {/* Error Display Section */}
                        {errors.length > 0 && (
                            <Card className="border-destructive">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-destructive flex items-center gap-2">
                                        <AlertCircle size={18} />
                                        Validation Errors
                                    </CardTitle>
                                    <CardDescription>
                                        Please fix the following issues in your Excel file and try again.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {errors.map((errorObj, index) => (
                                            <AccordionItem key={index} value={`item-${index}`}>
                                                <AccordionTrigger className="text-left">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-secondary">
                                                            Row {errorObj.row}
                                                        </Badge>
                                                        <span className="text-sm font-medium">
                                                            {parseErrorMessages(errorObj.error)[0] || "Multiple errors"}
                                                        </span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-medium text-sm mb-1">Error Details:</h4>
                                                            <ul className="text-sm text-destructive list-disc list-inside space-y-1">
                                                                {parseErrorMessages(errorObj.error).map((errorMsg, i) => (
                                                                    <li key={i}>{errorMsg}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {errorObj.data && Object.keys(errorObj.data).length > 0 && (
                                                            <div>
                                                                <h4 className="font-medium text-sm mb-1">Row Data:</h4>
                                                                <div className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                                                    <pre>{JSON.stringify(errorObj.data, null, 2)}</pre>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        )}

                        <DialogFooter>
                            <Button
                                onClick={handleSubmit}
                                disabled={!selectedFile || uploadStatus.includes("Uploading")}
                                className="w-full sm:w-auto"
                            >
                                {uploadStatus.includes("Uploading") ? (
                                    <>Uploading... {uploadProgress}%</>
                                ) : (
                                    <>Upload PaySlips Data</>
                                )}
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="download" className="space-y-4 mt-4">
                        <div className="grid gap-4">
                            <Card
                                className="cursor-pointer transition-all hover:shadow-md hover:border-primary"
                                onClick={downloadTemplate}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-md">
                                            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle>Template File</CardTitle>
                                            <CardDescription>
                                                Download the template with the correct format for employee data
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        <Download size={16} className="mr-2" />
                                        Download Template
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">📋 Instructions</h4>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• Use the template for the correct data format</li>
                                <li>• Refer to the reference file for guidelines</li>
                                <li>• Ensure all required fields are filled</li>
                                <li>• File size should not exceed 10MB</li>
                                <li>• Required Fileds : employeeCode , basicSalary ,da , houseRentAllowance, earningsOthers, lossOfPay,	professionalTax, epf, groupInsurance, canteen, advance, tds, contribution, esi, others, totalEarnings, totalDeductions,	netSalary, month, year</li>
                            </ul>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default BulkPayslipUpload;