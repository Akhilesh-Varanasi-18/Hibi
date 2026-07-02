import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

const DataTable = ({ payloadData, loading }) => {
    const parentRef = useRef(null);
    const scrollRef = useRef(null);
    const [scrollAreaWidth, setScrollAreaWidth] = useState(undefined);
    const [search, setSearch] = useState("");
    const [searchValue, setSearchValue] = useState("");

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => setSearch(searchValue), 300);
        return () => clearTimeout(handler);
    }, [searchValue]);

    // Function to update width
    const updateWidth = useCallback(() => {
        if (parentRef.current) {
            setScrollAreaWidth(parentRef.current.offsetWidth - 200);
        }
    }, []);

    // On mount and resize, update width
    useEffect(() => {
        updateWidth();
        const handleResize = debounce(updateWidth, 100);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateWidth]);

    // Also update if parent ref changes (e.g. on mobile orientation change)
    useEffect(() => {
        if (!parentRef.current) return;
        const observer = new window.ResizeObserver(() => {
            updateWidth();
        });
        observer.observe(parentRef.current);
        return () => observer.disconnect();
    }, [updateWidth]);

    // Columns logic
    const columns = useMemo(() => {
        console.log(payloadData)
        if (loading && payloadData) {
            return payloadData.columns || (payloadData.data && payloadData.data.length > 0 && Object.keys(payloadData.data[0])) || Array.from({ length: 5 }, (_, i) => `Column ${i + 1}`);
        }
        if (payloadData && (payloadData.columns || (payloadData.data && payloadData.data.length > 0))) {
            return payloadData.columns || Object.keys(payloadData.data[0]);
        }
        return Array.from({ length: 5 }, (_, i) => `Column ${i + 1}`);
    }, [payloadData, loading]);

    // Filtered data logic
    const filteredData = useMemo(() => {
        if (!payloadData || !payloadData.data) return [];
        if (!search) return payloadData.data;
        // Search in all columns, case-insensitive
        return payloadData.data.filter(row =>
            columns.some(col => {
                // Handle LO/LOP mapping in search
                const value = row[col] !== undefined ? row[col] : (col === "LO" && row["LOP"] !== undefined ? row["LOP"] : "");
                return String(value).toLowerCase().includes(search.toLowerCase());
            })
        );
    }, [payloadData, columns, search]);

    const fixedWidth = 80 + 140; // First two columns total width

    // Show loading skeletons if loading is true
    if (loading) {
        return (
            <div className="w-full" ref={parentRef}>
                <div className="flex justify-end p-1">
                    <Input
                        placeholder="Search..."
                        disabled={loading}
                        className="w-full"
                    />
                </div>
                <div className="relative flex w-full rounded-md">
                    {/* Fixed first 4 columns - Loading */}
                    <div className="flex-shrink-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {columns.slice(0, 4).map((col, idx) => (
                                        <TableHead
                                            key={col}
                                            className={cn(
                                                "whitespace-nowrap text-xs font-bold bg-muted",
                                                idx === 0 && "min-w-[80px]",
                                                idx === 1 && "min-w-[140px]",
                                                idx === 2 && "min-w-[100px]",
                                                idx === 3 && "min-w-[100px]"
                                            )}
                                        >
                                            <Skeleton className="h-4 w-20" />
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(10)].map((_, rowIdx) => (
                                    <TableRow key={rowIdx}>
                                        {columns.slice(0, 4).map((col, idx) => (
                                            <TableCell
                                                key={col}
                                                className={cn(
                                                    "whitespace-nowrap text-xs bg-background",
                                                    idx === 0 && "min-w-[80px]",
                                                    idx === 1 && "min-w-[140px]",
                                                    idx === 2 && "min-w-[100px]",
                                                    idx === 3 && "min-w-[100px]"
                                                )}
                                                style={{
                                                    fontWeight:
                                                        idx === 0
                                                            ? 600
                                                            : idx === 1
                                                            ? 500
                                                            : idx === 2
                                                            ? 500
                                                            : idx === 3
                                                            ? 500
                                                            : undefined,
                                                }}
                                            >
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Scrollable remaining columns - Loading */}
                    <div
                        className="overflow-x-auto"
                        style={{
                            width: scrollAreaWidth ? `${scrollAreaWidth - (80 + 140 + 100 + 100)}px` : "100%",
                        }}
                        ref={scrollRef}
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {columns.slice(4).map((col) => (
                                        <TableHead
                                            key={col}
                                            className="whitespace-nowrap text-xs font-bold bg-muted min-w-[100px]"
                                        >
                                            <Skeleton className="h-4 w-20" />
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(10)].map((_, rowIdx) => (
                                    <TableRow key={rowIdx}>
                                        {columns.slice(4).map((col) => (
                                            <TableCell
                                                key={col}
                                                className="whitespace-nowrap text-xs min-w-[100px]"
                                            >
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        );
    }

    // If the API returns an error or status false
    if (!payloadData || payloadData?.status === false || (!payloadData?.data && !payloadData?.columns)) {
        return (
            <div className="text-center text-muted-foreground py-8" ref={parentRef}>
                No payroll data found.
            </div>
        );
    }

    // If no data rows
    if (!payloadData.data || payloadData.data.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8" ref={parentRef}>
                No payroll data found.
            </div>
        );
    }

    return (
        <div
            className="w-full overflow-x-hidden"
            ref={parentRef}
            style={{ maxWidth: "100%" , maxHeight : "60vh" }}
        >
            <div className="flex justify-end p-1">
                <Input
                    placeholder="Search..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className="w-full"
                />
            </div>
            <div className="relative flex w-full rounded-md">
                {/* Fixed first 2 columns */}
                <div className="flex-shrink-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.slice(0, 2).map((col, idx) => (
                                    <TableHead
                                        key={col}
                                        className={cn(
                                            "whitespace-nowrap text-xs font-bold bg-muted",
                                            idx === 0 && "min-w-[80px]",
                                            idx === 1 && "min-w-[140px]"
                                        )}
                                    >
                                        {col === "LO" ? "LOP" : col}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                        No payroll data found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((row, rowIdx) => (
                                    <TableRow key={rowIdx}>
                                        {columns.slice(0, 2).map((col, idx) => (
                                            <TableCell
                                                key={col}
                                                className={cn(
                                                    "whitespace-nowrap text-xs bg-background",
                                                    idx === 0 && "min-w-[80px]",
                                                    idx === 1 && "min-w-[140px]"
                                                )}
                                                style={{
                                                    fontWeight: idx === 0 ? 600 : idx === 1 ? 500 : undefined,
                                                }}
                                            >
                                                {row[col] !== undefined
                                                    ? String(row[col])
                                                    : col === "LO" && row["LOP"] !== undefined
                                                        ? String(row["LOP"])
                                                        : ""}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Scrollable remaining columns */}
                <div
                    className="overflow-x-auto"
                    style={{
                        width: scrollAreaWidth ? `${scrollAreaWidth - fixedWidth}px` : "100%",
                    }}
                    ref={scrollRef}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.slice(2).map((col) => (
                                    <TableHead
                                        key={col}
                                        className="whitespace-nowrap text-xs font-bold bg-muted min-w-[100px]"
                                    >
                                        {col === "LO" ? "LOP" : col}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length - 2} className="text-center text-muted-foreground py-8">
                                        No payroll data found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((row, rowIdx) => (
                                    <TableRow key={rowIdx}>
                                        {columns.slice(2).map((col) => (
                                            <TableCell
                                                key={col}
                                                className="whitespace-nowrap text-xs min-w-[100px]"
                                            >
                                                {row[col] !== undefined
                                                    ? String(row[col])
                                                    : col === "LO" && row["LOP"] !== undefined
                                                        ? String(row["LOP"])
                                                        : ""}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default DataTable