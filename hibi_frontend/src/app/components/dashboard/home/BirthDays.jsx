"use client";
import React, { useState, useEffect, useContext } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import homePageApi from "@/Apis/HomePageApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogHeader,
    DialogDescription,
} from "@/components/ui/dialog";
import EventCard from "./EventCard";
import { UsersContext } from "@/app/context/UserContext";
import CustomCard from "../../ReusableComponents/CustomCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventDescription, isTodayInRange } from "@/utils/DateFunctions";
import CustomAvatar from "../../ReusableComponents/CustomAvatar";
import UserCard from "../../ReusableComponents/UserCard";

const Birthdays = () => {
    const { colorPalettesFromBackend } = useContext(UsersContext);
    const [birthday, setBirthDays] = useState([]);
    const [open, setOpen] = useState(false);
    const [loader, setloader] = useState(false);

    useEffect(() => {
        fetchBirthdays();
    }, []);

    async function fetchBirthdays() {
        setloader(true);
        const res = await homePageApi.Birthdays();
        if (res.success) {
            setBirthDays(res.data);
        }
        setloader(false);
    }

    const initialBirthdays = birthday.slice(0, 2);

    return (
        <>
            <CustomCard
                title={
                    <span className="flex items-center">
                        Upcoming Birthdays
                    </span>
                }
                rightSection={<Badge variant="secondary" className="ml-2">
                    Celebrate
                </Badge>}
                desc={"Send your best wishes"}
                content={
                    <div>
                        {loader ? <div className="flex flex-col rounded-xl gap-2">
                            <Skeleton className="w-full h-20" />
                            <Skeleton className="w-full h-20" />
                        </div> :
                            <div className="flex-1 rounded-xl">
                                {initialBirthdays.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-10 text-center text-muted-foreground">
                                        <span className="text-lg font-medium">No birthdays this month.</span>
                                        <span className="text-sm mt-1">Check back next month for more celebrations.</span>
                                    </div>
                                ) : (
                                    <ul className="flex flex-col gap-2">
                                        {initialBirthdays.map((employee, index) => (
                                            <li key={employee.employeeCode || employee.employeeId || index}>
                                                {console.log(employee)}
                                                <UserCard
                                                    name={employee.employeeName}
                                                    desc={getEventDescription(employee.dateOfBirth, employee.dateOfBirth)}
                                                    url={employee?.profileImage}
                                                    showTooltip={false}
                                                    employeeId={employee?._id}
                                                    highlight={isTodayInRange(employee.dateOfBirth, employee.dateOfBirth)}
                                                    color={colorPalettesFromBackend?.todayBirthdayColor || "#0B617A"}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>}
                    </div>
                }
                footerContent={
                    birthday.length > 2 ? (
                        <div className="absolute w-[90%] bottom-3 left-1/2 -translate-x-1/2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => setOpen(true)}
                            >
                                View All Birthdays ({birthday.length})
                            </Button>
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogContent className="sm:max-w-lg lg:max-w-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl ">
                                    <DialogHeader className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center justify-between">
                                            <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-neutral-800 dark:text-neutral-100">
                                                <Sparkles className="h-5 w-5 " style={{ color: colorPalettesFromBackend?.todayBirthdayColor || "#0B617A" }} />
                                                Upcoming Birthdays
                                            </DialogTitle>
                                        </div>
                                        <DialogDescription className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                            Send your best wishes to colleagues
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="h-[55vh] overflow-y-auto pr-2 py-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {/* {console.log(birthday)} */}
                                            {birthday.map((employee, index) => (
                                                <UserCard
                                                    name={employee.employeeName}
                                                    desc={getEventDescription(employee.dateOfBirth, employee.dateOfBirth)}
                                                    url={employee?.profileImage}
                                                    showTooltip={false}
                                                    highlight={isTodayInRange(employee.dateOfBirth, employee.dateOfBirth)}
                                                    employeeId={employee?._id}
                                                    color={colorPalettesFromBackend?.todayBirthdayColor || "#0B617A"}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : null
                }
            />
        </>
    );
};

export default Birthdays;