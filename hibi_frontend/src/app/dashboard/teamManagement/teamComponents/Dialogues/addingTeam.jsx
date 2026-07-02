"use client";

import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash } from "lucide-react";
import { Card } from "@/components/ui/card";
import TeamManagementApi from "@/Apis/TeamManagementApi";
import { UsersContext } from "@/app/context/UserContext";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useToast } from "@/hooks/use-toast"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
import Comparing from "@/utils/CommonFunctionality";
import CustomAlert from "@/app/components/ReusableComponents/CustomAlert";

export function AddTeamDialog({ CallBack }) {
    // State management for dialog and form data
    const [open, setOpen] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [managerId, setManagerId] = useState("");
    const [selectedTeamLead, setSelectedTeamLead] = useState("");
    const [teamLeads, setTeamLeads] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [employees, setEmployees] = useState([]);

    // Context with null safety
    const { role, user } = useContext(UsersContext) ?? {};

    const [loader, setloader] = useState(true);
    const [error, seterror] = useState("");

    // Data from APIs with safe defaults
    const [managers, setManagers] = useState([]);
    const [availableTeamLeads, setAvailableTeamLeads] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [managerCan, setManagercan] = useState(true);

    // Toast with null safety
    const { toast } = useToast() ?? {};

    // Fetch unassigned team members from API
    const UnassignedTeamDate = async () => {
        try {
            const response = await TeamManagementApi?.unassignedTeamMembers?.() ?? {};

            if (response?.success) {
                // Get employees data with safe array access
                const employeesData = response?.data?.find(emp => emp?._id === "EMPLOYEE") ?? {};
                const internData = response?.data?.find(emp => emp?._id === "INTERN") ?? {};

                const EmployeeAllData = [
                    ...(employeesData?.employees ?? []),
                    ...(internData?.employees ?? [])
                ];

                if (EmployeeAllData?.length > 0) {
                    setAllEmployees(EmployeeAllData);
                } else {
                    setAllEmployees([]);
                }

                // Get HR data
                const hrData = response?.data?.find(emp => emp?._id === "HR") ?? {};

                // Get team leads from multiple possible role names
                const teamLeadData1 = response?.data?.find(emp => emp?._id === "TEAM LEAD") ?? {};
                const teamLeadData2 = response?.data?.find(emp => emp?._id === "TEAMLEAD") ?? {};
                const teamLeadsData = [
                    ...(teamLeadData1?.employees ?? []),
                    ...(teamLeadData2?.employees ?? []),
                    ...(hrData?.employees ?? [])
                ];

                if (teamLeadsData?.length > 0) {
                    setAvailableTeamLeads(teamLeadsData);
                } else {
                    setAvailableTeamLeads([]);
                }

                // Get managers and CEO data
                const managersData = response?.data?.find(emp => emp?._id === "MANAGER") ?? {};
                const ceoData = response?.data?.find(emp => emp?._id === "CEO") ?? {};

                if (managersData || ceoData || hrData) {
                    const managerData = [
                        ...(managersData?.employees ?? []),
                        ...(ceoData?.employees ?? []),
                        ...(hrData?.employees ?? [])
                    ];
                    setManagers(managerData);
                } else {
                    setManagers([]);
                }

                if (Comparing?.compareStrings?.(role, "manager")) {
                    setTimeout(() => {
                        setManagerId(user?._id ?? "");
                        if (managersData?.employees?.filter(val => val?._id == user?._id)?.length > 0) {
                            setManagercan(true);
                            console.log("manager can");
                        } else {
                            setManagercan(false);
                            console.log("manager Can't")
                        }
                        console.log(managersData?.employees?.filter(val => val?._id == user?._id)?.length)
                    }, 500);
                }
                
            } else {
                console.log("Failed to fetch unassigned team members:", response?.error ?? "Unknown error");
            }
        } catch (err) {
            console.error("Error fetching unassigned team members:", err);
        }
    }

    // Add employee to team with null checks
    const addEmployee = () => {
        if (selectedEmployee && !employees?.some(e => e?._id === selectedEmployee)) {
            const employee = allEmployees?.find(e => e?._id === selectedEmployee);
            if (employee) {
                setEmployees([...employees, employee]);
                setSelectedEmployee("");
            }
        }
    };

    // Remove employee from team
    const removeEmployee = (employeeId) => {
        setEmployees(employees?.filter(e => e?._id !== employeeId) ?? []);
    };

    // Add team lead with null checks
    const addTeamLead = () => {
        if (selectedTeamLead && !teamLeads?.some(tl => tl?._id === selectedTeamLead)) {
            const teamLead = availableTeamLeads?.find(tl => tl?._id === selectedTeamLead);
            if (teamLead) {
                setTeamLeads([...teamLeads, teamLead]);
                setSelectedTeamLead("");
            }
        }
    };

    // Remove team lead
    const removeTeamLead = (teamLeadId) => {
        setTeamLeads(teamLeads?.filter(tl => tl?._id !== teamLeadId) ?? []);
    };

    // Validate team name length
    useEffect(() => {
        if (teamName?.trim()?.length > 4) {
            seterror("")
        }
    }, [teamName])

    // Handle form submission with validation
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Create request body with safe array operations
        const body = {
            teamName: teamName?.trim() ?? "",
            employeeIds: employees?.map(e => e?._id)?.filter(Boolean) ?? []
        };

        // Add team leads if any selected
        if (teamLeads?.length > 0) {
            body.teamLeadIds = teamLeads?.map(tl => tl?._id)?.filter(Boolean) ?? [];
        }

        // Add manager if selected
        if (managerId) {
            body.managerIds = [managerId]
        }

        // Validate team name length
        if (teamName?.trim()?.length < 4) {
            seterror("Enter the Team Name More Than 3 Characters");
            return;
        }

        setIsLoading(true);

        try {
            const response = await TeamManagementApi?.AddTeam?.(body) ?? {};

            if (response?.success) {
                setIsLoading(false);
                resetForm();
                setOpen(false);
                CallBack?.(); // Safe callback invocation

                // Show success toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                        <span>{response?.data ?? "Team created successfully"}</span>
                    </div>,
                });
            } else {
                setIsLoading(false);

                // Show error toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>{response?.error ?? "Failed to create team"}</span>
                    </div>,
                });
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error creating team:", err);

            // Show generic error toast
            toast?.({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>An error occurred while creating the team</span>
                </div>,
            });
        }
    };

    // Reset form to initial state
    const resetForm = () => {
        setTeamName("");
        setManagerId("");
        setSelectedTeamLead("");
        setTeamLeads([]);
        setSelectedEmployee("");
        setEmployees([]);
    };

    // Filter out already selected employees
    const availableEmployees = allEmployees?.filter(
        employee => !employees?.some(e => e?._id === employee?._id)
    ) ?? [];

    // Filter out already selected team leads
    const availableTeamLeadsFiltered = availableTeamLeads?.filter(
        teamLead => !teamLeads?.some(tl => tl?._id === teamLead?._id)
    ) ?? [];

    // Handle dialog open/close with data fetching
    const handleDialogOpen = async (open) => {
        setOpen(open);

        if (open) {
            resetForm();
            await UnassignedTeamDate();
            setloader(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="default">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Team
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto" onInteractOutside={(event) => event.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                        Add Team to this Organization
                    </DialogDescription>

                    {!managerCan &&
                        <CustomAlert text="You Are Already in a Team, you Can't Create Your Team" />
                    }

                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Team Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Team Name</label>
                        <Input
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter team name with minimum 4 letters"
                            required
                        />
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Manager Selection with Simple Select */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Manager</label>
                            <Select
                                value={managerId}
                                onValueChange={setManagerId}
                                disabled={loader || managers?.length === 0 || Comparing?.compareStrings?.(role, "manager")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={
                                        managerCan
                                            ? managers?.length !== 0
                                                ? "Select manager"
                                                : "No Managers to Assign"
                                            : "You are already in a Team"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {managers?.length > 0 ? (
                                        managers?.map((manager) => (
                                            <SelectItem key={manager?._id} value={manager?._id}>
                                                {manager?.firstName} {manager?.lastName} ({manager?.employeeCode})
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                            No managers available
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Team Leads Selection with Simple Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Add Team Leads</label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Select
                                    value={selectedTeamLead}
                                    onValueChange={setSelectedTeamLead}
                                    disabled={loader || availableTeamLeadsFiltered?.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            availableTeamLeadsFiltered?.length !== 0
                                                ? "Select team lead"
                                                : "No Team Leads To Assign"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTeamLeadsFiltered?.length > 0 ? (
                                            availableTeamLeadsFiltered?.map((teamLead) => (
                                                <SelectItem key={teamLead?._id} value={teamLead?._id}>
                                                    {teamLead?.firstName} {teamLead?.lastName} ({teamLead?.employeeCode})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                                No team leads available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={addTeamLead}
                                disabled={!selectedTeamLead}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Selected Team Leads Table */}
                    {teamLeads?.length > 0 && (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Team Lead Name</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamLeads?.map((teamLead) => (
                                        <TableRow key={teamLead?._id}>
                                            <TableCell>
                                                {teamLead?.firstName} {teamLead?.lastName} ({teamLead?.employeeCode})
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeTeamLead(teamLead?._id)}
                                                >
                                                    <Trash className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Team Members Selection with Simple Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Add Team Members</label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Select
                                    value={selectedEmployee}
                                    onValueChange={setSelectedEmployee}
                                    disabled={loader || availableEmployees?.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            availableEmployees?.length !== 0
                                                ? "Select employee"
                                                : "No Employees to Assign"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEmployees?.length > 0 ? (
                                            availableEmployees?.map((employee) => (
                                                <SelectItem key={employee?._id} value={employee?._id}>
                                                    {employee?.firstName} {employee?.lastName} ({employee?.employeeCode})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                                No employees available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={addEmployee}
                                disabled={!selectedEmployee}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Selected Employees Table */}
                    {employees?.length > 0 && (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees?.map((employee) => (
                                        <TableRow key={employee?._id}>
                                            <TableCell>
                                                {employee?.firstName} {employee?.lastName} ({employee?.employeeCode})
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeEmployee(employee?._id)}
                                                >
                                                    <Trash className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Dialog Footer with Actions */}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                (managerId === "" && teamLeads?.length === 0) ||
                                employees?.length === 0 ||
                                isLoading || !managerCan
                            }
                            className="flex items-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Team"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}