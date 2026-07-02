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
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import TeamManagementApi from "@/Apis/TeamManagementApi";
import { UsersContext } from "@/app/context/UserContext";
import { useToast } from "@/hooks/use-toast"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
import Comparing from "@/utils/CommonFunctionality";

export function EditTeamDialog({ team, onTeamUpdated, open, onOpenChange }) {
    // State for form fields and data
    const [teamName, setTeamName] = useState("");
    const [managerId, setManagerId] = useState("");
    const [selectedTeamLead, setSelectedTeamLead] = useState("");
    const [teamLeads, setTeamLeads] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [employees, setEmployees] = useState([]);

    // Context with null safety
    const { role } = useContext(UsersContext) ?? {};
    const { toast } = useToast() ?? {};

    const [error, seterror] = useState("Enter Team Name More than 3 Characters");

    // Data from APIs with safe defaults
    const [managers, setManagers] = useState([]);
    const [availableTeamLeads, setAvailableTeamLeads] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch unassigned team members and combine with current team data
    const UnassignedTeamDate = async () => {
        try {
            const response = await TeamManagementApi.unassignedTeamMembers() ?? {};

            if (response?.success) {
                // Get employees data with safe array access - combine EMPLOYEE and INTERN
                const employeesData = response?.data?.find(emp => emp?._id === "EMPLOYEE") ?? {};
                const internData = response?.data?.find(emp => emp?._id === "INTERN") ?? {};

                // Combine unassigned employees/interns with current team employees
                const unassignedEmployeeData = [
                    ...(employeesData?.employees ?? []),
                    ...(internData?.employees ?? [])
                ];

                // Merge with current team employees, removing duplicates
                const allEmployeeData = [
                    ...new Map(
                        [...unassignedEmployeeData, ...(team?.employees ?? [])].map(emp => [emp?._id, emp])
                    ).values()
                ];

                if (allEmployeeData?.length > 0) {
                    setAllEmployees(allEmployeeData);
                } else {
                    setAllEmployees([]);
                }

                // Get HR data
                const hrData = response?.data?.find(emp => emp?._id === "HR") ?? {};

                // Get team leads from multiple possible role names
                const teamLeadData1 = response?.data?.find(emp => emp?._id === "TEAM LEAD") ?? {};
                const teamLeadData2 = response?.data?.find(emp => emp?._id === "TEAMLEAD") ?? {};
                const unassignedTeamLeadsData = [
                    ...(teamLeadData1?.employees ?? []),
                    ...(teamLeadData2?.employees ?? []),
                    ...(hrData?.employees ?? [])
                ];

                // Merge with current team leads, removing duplicates
                const allTeamLeadsData = [
                    ...new Map(
                        [...unassignedTeamLeadsData, ...(team?.teamLeads ?? [])].map(emp => [emp?._id, emp])
                    ).values()
                ];

                if (allTeamLeadsData?.length > 0) {
                    console.log("Team Leads only:", allTeamLeadsData);
                    setAvailableTeamLeads(allTeamLeadsData);
                } else {
                    setAvailableTeamLeads([]);
                }

                // Get managers and CEO data
                const managersData = response?.data?.find(emp => emp?._id === "MANAGER") ?? {};
                const ceoData = response?.data?.find(emp => emp?._id === "CEO") ?? {};

                // Combine unassigned managers with current team managers
                const unassignedManagerData = [
                    ...(managersData?.employees ?? []),
                    ...(ceoData?.employees ?? []),
                    ...(hrData?.employees ?? [])
                ];

                // Merge with current team managers, removing duplicates
                const allManagerData = [
                    ...new Map(
                        [...unassignedManagerData, ...(team?.managers ?? [])].map(emp => [emp?._id, emp])
                    ).values()
                ];

                if (allManagerData?.length > 0) {
                    console.log("Managers only:", allManagerData);
                    setManagers(allManagerData);

                    // Set the first manager as selected if none is selected and team has managers
                    if (!managerId && team?.managers?.length > 0) {
                        setManagerId(team?.managers[0]?._id ?? "");
                    }
                } else {
                    setManagers([]);

                    // Set manager ID from team if available
                    if (!managerId && team?.managers?.length > 0) {
                        setManagerId(team?.managers[0]?._id ?? "");
                    }
                }
            } else {
                console.log("Failed to fetch unassigned team members:", response?.error ?? "Unknown error");
            }
        } catch (err) {
            console.error("Error fetching unassigned team members:", err);
        }
    }

    // Validate team name length
    useEffect(() => {
        if (teamName?.trim()?.length < 4) {
            seterror("Enter the Team Name More Than 3 Characters");
        } else {
            seterror("");
        }
    }, [teamName]);

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

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Create request body with safe array operations
        const body = {
            teamId: team?._id ?? "",
            teamName: teamName?.trim() ?? "",
            managerIds: [managerId]?.filter(Boolean) ?? [], // Send as array with null safety
            teamLeadIds: teamLeads?.map(tl => tl?._id)?.filter(Boolean) ?? [],
            employeeIds: employees?.map(e => e?._id)?.filter(Boolean) ?? []
        };

        try {
            const response = await TeamManagementApi.updateTeam(body) ?? {};

            if (response?.success) {
                // Call success callback
                onTeamUpdated?.();

                // Show success toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                        <span>{response?.data ?? "Team updated successfully"}</span>
                    </div>,
                });
            } else {
                // Show error toast
                toast?.({
                    title: <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>{response?.error ?? "Failed to update team"}</span>
                    </div>,
                });
            }
        } catch (error) {
            console.error("Error updating team:", error);

            // Show generic error toast
            toast?.({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>An error occurred while updating the team</span>
                </div>,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Filter out already selected employees
    const availableEmployees = allEmployees?.filter(
        employee => !employees?.some(e => e?._id === employee?._id)
    ) ?? [];

    // Filter out already selected team leads
    const availableTeamLeadsFiltered = availableTeamLeads?.filter(
        teamLead => !teamLeads?.some(tl => tl?._id === teamLead?._id)
    ) ?? [];

    // Initialize form when dialog opens
    const handleDialogOpen = async (open) => {
        if (open && team) {
            setTeamName(team?.teamName ?? "");

            if (team?.managers?.length > 0) {
                setManagerId(team?.managers[0]?._id ?? "");
            }

            setTeamLeads(team?.teamLeads ?? []);
            setEmployees(team?.employees ?? []);
            setAllEmployees(team?.employees ?? []);
            setAvailableTeamLeads(team?.teamLeads ?? []);
            setManagers(team?.managers ?? []);
            await UnassignedTeamDate();
        }
    };

    // Initialize form when dialog opens
    useEffect(() => {
        handleDialogOpen(open);
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[600px] max-h-[90vh] overflow-auto" onInteractOutside={(event) => event.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex capitalize">Edit Team:
                        <p className="capitalize">{team?.teamName?.toLowerCase() || "Team"} </p></DialogTitle>
                    <DialogDescription>
                        Update team details, manager, team leads, and members
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Team Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Team Name</label>
                        <Input
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter team name"
                            required
                            aria-label="Team name"
                            disabled={Comparing.compareStrings(role, "teamlead")}
                        />
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Manager Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Manager</label>
                        <Select
                            disabled={Comparing.compareStrings(role, "MANAGER") || Comparing.compareStrings(role, "teamlead")}
                            value={managerId}
                            onValueChange={setManagerId}
                            required
                            aria-label="Select manager"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                            <SelectContent>
                                {managers?.map((manager) => (
                                    <SelectItem key={manager?._id} value={manager?._id}>
                                        {manager?.firstName} {manager?.lastName} ({manager?.employeeCode})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Team Leads Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Add Team Leads</label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedTeamLead}
                                onValueChange={setSelectedTeamLead}
                                aria-label="Select team lead to add"
                                disabled={Comparing.compareStrings(role, "teamlead")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team lead" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTeamLeadsFiltered?.map((lead) => (
                                        <SelectItem key={lead?._id} value={lead?._id}>
                                            {lead?.firstName} {lead?.lastName} ({lead?.employeeCode})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={addTeamLead}
                                aria-label="Add team lead"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Selected Team Leads Table */}
                    {teamLeads?.length > 0 && (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Team Lead Name</TableHead>
                                        <TableHead>Employee Code</TableHead>
                                        {Comparing.NotEqual(role, "teamlead") &&
                                            <TableHead>Action</TableHead>
                                        }
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamLeads?.map((teamLead) => (
                                        <TableRow key={teamLead?._id}>
                                            <TableCell>
                                                {teamLead?.firstName} {teamLead?.lastName}
                                            </TableCell>
                                            <TableCell>
                                                {teamLead?.employeeCode}
                                            </TableCell>
                                            <TableCell>
                                                {
                                                    Comparing.NotEqual(role, "teamlead") &&
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeTeamLead(teamLead?._id)}
                                                        aria-label={`Remove ${teamLead?.firstName}`}
                                                    >
                                                        <Trash className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                }

                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}

                    {/* Team Members Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Team Members</label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedEmployee}
                                onValueChange={setSelectedEmployee}
                                aria-label="Select employee to add"
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableEmployees?.map((employee) => (
                                        <SelectItem key={employee?._id} value={employee?._id}>
                                            {employee?.firstName} {employee?.lastName} ({employee?.employeeCode})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={addEmployee}
                                aria-label="Add employee"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Selected Employees Table */}
                    {employees?.length > 0 && (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Employee Code</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees?.map((employee) => (
                                        <TableRow key={employee?._id}>
                                            <TableCell>
                                                {employee?.firstName} {employee?.lastName}
                                            </TableCell>
                                            <TableCell>
                                                {employee?.employeeCode}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeEmployee(employee?._id)}
                                                    aria-label={`Remove ${employee?.firstName}`}
                                                >
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}

                    {/* Dialog Footer with Actions */}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange?.(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !teamName || (!managerId && teamLeads?.length < 1) || employees?.length < 1 || error}
                            className="flex items-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Team"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}