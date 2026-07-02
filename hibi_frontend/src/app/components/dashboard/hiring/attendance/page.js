"use client";

import { Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

export default function page() {
    function onDownload() {
        // Placeholder for download logic
    }
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
    const years = [
        { value: "2023", label: "2023" },
        { value: "2024", label: "2024" },
        { value: "2025", label: "2025" },
    ];
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDownload = () => {
        setProcessing(true);
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setProcessing(false);
                    if (onDownload) onDownload(month, year);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    };

    return (
        <div className="px-6 pb-10">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight pb-6">Payroll Attendance</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="text-neutral-950 dark:text-neutral-50">Attendance Report</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-4">
                            <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {processing && (
                            <div className="space-y-2">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Generating attendance report...
                                </p>
                                <Progress value={progress} className="h-2" />
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleDownload} disabled={processing}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}