"use client"
import React, { useState, useEffect, useContext } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Pencil, Trash2, Search, UserCog } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import TeamManagementApi from "@/Apis/TeamManagementApi"
import { DeleteTeamDialog } from "./Dialogues/deleteTeam"
import { DeleteTeamMemberDialog } from "./Dialogues/deleteTeamMember"
import { Skeleton } from "@/components/ui/skeleton"
import Comparing from "@/utils/CommonFunctionality"
import { ChangeRoleDialog } from "./Dialogues/changeRole"
import ChangeTeam from "./Dialogues/changeTeam"
import { MdChangeCircle, MdChangeHistory } from "react-icons/md"
import { CgArrowsExchange } from "react-icons/cg"
import { UsersContext } from "@/app/context/UserContext"
import { EditTeamDialog } from "./Dialogues/editTeam"

export default function TeamTable() {
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [teams, setTeams] = useState([])
  const [allTeams, setAllTeams] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [managerFilter, setManagerFilter] = useState("")
  const [teamLeadFilter, setTeamLeadFilter] = useState("")
  const [managers, setManagers] = useState([])
  const [teamLeads, setTeamLeads] = useState([])
  const { role, user } = useContext(UsersContext);
  const [loader, setloder] = useState(false);
  const [changeTeamDialogOpen, setChangeTeamDialogOpen] = useState(false);
  const [selectedMemberForChangeTeam, setSelectedMemberForChangeTeam] = useState(null);

  // State for dialog management
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [ismanager, setIsManager] = useState(false);

  // State for role change dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState(null);
  const [selectedUserRole, setSelectedUserRole] = useState("");

  const toggleExpand = (teamId) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId)
  }

  const fetchTeams = async () => {
    setloder(true);
    let response = await TeamManagementApi.fetchTeams()
    if (response.success && user) {
      console.log(response.data);


      response.data = response.data.map(item => ({
        ...item,
        employees: [
          ...item.employeesGroup.Employees,
          ...item.employeesGroup.Interns
        ]
      }));
  
      // console.log(response.data)
      setTeams(response.data || [])
      setAllTeams(response.data || [])

      const uniqueManagers = []
      const uniqueTeamLeads = []
      const managerIds = new Set()
      const teamLeadIds = new Set()

      response.data.forEach(team => {
        if (team.managers && team.managers.length > 0) {
          team.managers.forEach(manager => {
            if (manager && !managerIds.has(manager._id)) {
              managerIds.add(manager._id)
              uniqueManagers.push(manager)
            }
          })
        }

        if (team.teamLeads && team.teamLeads.length > 0) {
          team.teamLeads.forEach(lead => {
            if (lead && !teamLeadIds.has(lead._id)) {
              teamLeadIds.add(lead._id)
              uniqueTeamLeads.push(lead)
            }
          })
        }
      })

      setManagers(uniqueManagers)
      setTeamLeads(uniqueTeamLeads)
    } else {
      console.error("Failed to fetch teams:", response.error)
    }
    setloder(false);
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, managerFilter, teamLeadFilter, allTeams])

  const applyFilters = () => {
    let filteredTeams = [...allTeams]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filteredTeams = filteredTeams.filter(team => {
        const hasManagerMatch = team.managers?.some(manager =>
          manager?.firstName?.toLowerCase().includes(term) ||
          manager?.lastName?.toLowerCase().includes(term)
        )

        const hasTeamLeadMatch = team.teamLeads?.some(lead =>
          lead?.firstName?.toLowerCase().includes(term) ||
          lead?.lastName?.toLowerCase().includes(term)
        )

        const hasEmployeeMatch = team.employees?.some(employee =>
          employee?.firstName?.toLowerCase().includes(term) ||
          employee?.lastName?.toLowerCase().includes(term)
        )

        return (
          team.teamName.toLowerCase().includes(term) ||
          hasManagerMatch ||
          hasTeamLeadMatch ||
          hasEmployeeMatch
        )
      })
    }

    if (managerFilter) {
      filteredTeams = filteredTeams.filter(team =>
        team.managers?.some(manager => manager?._id === managerFilter)
      )
    }

    if (teamLeadFilter) {
      filteredTeams = filteredTeams.filter(team =>
        team.teamLeads?.some(lead => lead?._id === teamLeadFilter)
      )
    }

    setTeams(filteredTeams)
  }

  const handleDeleteTeam = async (teamId) => {
    setTeams(prevTeams => prevTeams.filter(team => team._id !== teamId))
    setAllTeams(prevTeams => prevTeams.filter(team => team._id !== teamId))
    setDeleteDialogOpen(false);
    setSelectedTeam(null);
  }

  const HandleTeamedit = async () => {
    fetchTeams()
    setEditDialogOpen(false);
    setSelectedTeam(null);
  }

  const handleChangeTeamDialog = (team, member) => {
    setSelectedTeam(team);
    setSelectedMemberForChangeTeam(member)
    setChangeTeamDialogOpen(true);
    console.log(team, member)
  }

  const handleTeamMember = async (teamId, memberId, isLead = false, isManager = false) => {
    setTeams(prevTeams =>
      prevTeams.map(team => {
        if (team._id === teamId) {
          if (isLead) {
            return {
              ...team,
              teamLeads: team.teamLeads.filter(lead => lead._id !== memberId),
            }
          } else if (isManager) {
            return {
              ...team,
              managers: team.managers.filter(manager => manager._id !== memberId),
            }
          } else {
            return {
              ...team,
              employees: team.employees.filter(member => member._id !== memberId),
            }
          }
        }
        return team
      })
    )
    setDeleteMemberDialogOpen(false);
    setSelectedTeam(null);
    setSelectedMember(null);
    setIsTeamLead(false);
    setIsManager(false);
  }

  const handleRoleChangeSuccess = (userId, newRole) => {
    // Refetch teams to get updated data
    fetchTeams();
  }

  // Handler functions for opening dialogs
  const openEditDialog = (team) => {
    setSelectedTeam(team);
    setEditDialogOpen(true);
  }

  const openDeleteDialog = (team) => {
    setSelectedTeam(team);
    setDeleteDialogOpen(true);
  }

  const openDeleteMemberDialog = (team, member, isLead = false, isManager = false) => {
    setSelectedTeam(team);
    setSelectedMember(member);
    setIsTeamLead(isLead);
    setDeleteMemberDialogOpen(true);
    setIsManager(isManager)
  }

  const openRoleDialog = (team, user, currentRole) => {
    setSelectedUserForRoleChange(user);
    setSelectedUserRole(currentRole);
    setSelectedTeam(team);
    setRoleDialogOpen(true);
  }

  const successChangeTeam = () => {
    setSelectedTeam(null);
    setSelectedMemberForChangeTeam(null);
    setChangeTeamDialogOpen(false);
    fetchTeams();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 ">
        {/* Filter Controls */}

        {
          (Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "hr") || Comparing.compareStrings(role, "coo")) && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teams, managers, leads or members..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  value={managerFilter === "all" ? undefined : managerFilter}
                  onValueChange={(value) => setManagerFilter(value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={"all"}>All Managers</SelectItem>
                    {managers.map(manager => (
                      <SelectItem key={manager._id} value={manager._id}>
                        {manager.firstName} {manager.lastName} ({manager.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={teamLeadFilter === "all" ? undefined : teamLeadFilter}
                  onValueChange={(value) => setTeamLeadFilter(value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Team Lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={"all"}>All Team Leads</SelectItem>
                    {teamLeads.map(lead => (
                      <SelectItem key={lead._id} value={lead._id}>
                        {lead.firstName} {lead.lastName} ({lead.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setManagerFilter("")
                    setTeamLeadFilter("")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          )
        }


        {/* Teams Table */}
        <Card className="p-4">
          {
            loader ? (
              <Table className="flex flex-col gap-1">{
                [...Array(3)].map((_, i) => (
                  <TableRow>
                    <Skeleton key={i} className="h-[50px] w-full" />
                  </TableRow>
                ))
              }
              </Table>
            ) :
              (<Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Team</TableHead>
                    <TableHead>Team Leads</TableHead>
                    <TableHead>Managers</TableHead>
                    {role && (Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "hr") || Comparing.compareStrings(role, "Manager") || Comparing.compareStrings(role, "coo") || Comparing.compareStrings(role, "teamlead")) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams && teams.length > 0 ? (
                    teams.map(team => (
                      <React.Fragment key={team._id}>
                        <TableRow>
                          <TableCell className="font-medium" onClick={() => toggleExpand(team._id)}>{team.teamName}</TableCell>
                          <TableCell onClick={() => toggleExpand(team._id)}>
                            {team.teamLeads && team.teamLeads.length > 0 ? (
                              team.teamLeads.map((lead, index) => (
                                <div key={lead._id}>
                                  {lead.firstName} {lead.lastName} ({lead.employeeCode})
                                  {index < team.teamLeads.length - 1 && ', '}
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">No team leads</span>
                            )}
                          </TableCell>
                          <TableCell onClick={() => toggleExpand(team._id)}>
                            {team.managers && team.managers.length > 0 ? (
                              team.managers.map((manager, index) => (
                                <div key={manager._id}>
                                  {manager.firstName} {manager.lastName} ({manager.employeeCode})
                                  {index < team.managers.length - 1 && ', '}
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">No managers</span>
                            )}
                          </TableCell>
                          <TableCell className="flex justify-end gap-2" onClick={() => toggleExpand(team._id)}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleExpand(team._id)}
                              aria-label={expandedTeam === team._id ? "Collapse team" : "Expand team"}
                            >
                              {expandedTeam === team._id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            {role && (Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "hr") || Comparing.compareStrings(role, "Manager") || Comparing.compareStrings(role, "teamlead") || Comparing.compareStrings(role, "coo")) && (
                              <div className="flex">
                                {role && (Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "hr") || Comparing.compareStrings(role, "Manager") || Comparing.compareStrings(role, "teamlead") || Comparing.compareStrings(role, "coo")) &&
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(team)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }

                                {
                                  role && (Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "hr") || Comparing.compareStrings(role, "Manager") || Comparing.compareStrings(role, "coo")) &&
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => openDeleteDialog(team)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                }
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedTeam === team._id && (
                          <TableRow>
                            <TableCell colSpan={4} className="p-0">
                              <div className="p-4 pl-12 bg-muted/50">
                                {/* Team Leads Section */}
                                <h4 className="font-medium mb-2">
                                  Managers ({team.managers?.length || 0})
                                </h4>
                                {team.managers && team.managers.length > 0 ? (
                                  <div className="space-y-2 mb-4">
                                    {team.managers.map(lead => (
                                      <Card key={lead._id} className="flex items-center justify-between p-3">
                                        <div>
                                          <p className="font-medium">
                                            {lead.firstName} {lead.lastName} ({lead.employeeCode})
                                          </p>
                                        </div>
                                        <div className="flex gap-2">
                                          {role && (Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "hr") || Comparing.compareStrings(role, "coo")) && (
                                            <div className="flex items-center gap-1">
                                              <Button variant="outline" size="sm" onClick={() => handleChangeTeamDialog(team, lead)} className="flex items-center gap-1" >
                                                <CgArrowsExchange />
                                                Change Team
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openRoleDialog(team, lead, "Manager")}
                                                className="flex items-center gap-1"
                                              >
                                                <UserCog className="h-3 w-3" />
                                                Change Role
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => openDeleteMemberDialog(team, lead, false, true)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground mb-4"> No Managers</p>
                                )}

                                <h4 className="font-medium mb-2">Team Leads ({team.teamLeads?.length || 0})</h4>
                                {team.teamLeads && team.teamLeads.length > 0 ? (
                                  <div className="space-y-2 mb-4">
                                    {team.teamLeads.map(lead => (
                                      <Card key={lead._id} className="flex items-center justify-between p-3">
                                        <div>
                                          <p className="font-medium">
                                            {lead.firstName} {lead.lastName} ({lead.employeeCode})
                                          </p>
                                        </div>
                                        <div className="flex gap-2">
                                          {role && (Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "hr") || Comparing.compareStrings(role, "Manager") || Comparing.compareStrings(role, "coo")) && (
                                            <div className="flex items-center gap-1">
                                              <Button variant="outline" size="sm" onClick={() => handleChangeTeamDialog(team, lead)} className="flex items-center gap-1" >
                                                <CgArrowsExchange />
                                                Change Team
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openRoleDialog(team, lead, "TeamLead")}
                                                className="flex items-center gap-1"
                                              >
                                                <UserCog className="h-3 w-3" />
                                                Change Role
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => openDeleteMemberDialog(team, lead, true, false)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground mb-4">No team leads</p>
                                )}

                                {/* Team Members Section */}
                                <h4 className="font-medium mb-2">Team Members ({team.employees?.length || 0})</h4>
                                {team.employees && team.employees.length > 0 ? (
                                  <div className="space-y-2">
                                    {team.employees.map(employee => (
                                      <Card key={employee._id} className="flex items-center justify-between p-3">
                                        <div>
                                          <p className="font-medium">
                                            {employee.firstName} {employee.lastName} ({employee.employeeCode})
                                          </p>
                                        </div>
                                        <div className="flex gap-2">
                                          {role && (Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "hr") || Comparing.compareStrings(role, "Manager") || Comparing.compareStrings(role, "coo") || Comparing.compareStrings(role, "teamLEad")) && (
                                            <div className="flex items-center gap-1">
                                              <Button variant="outline" size="sm" onClick={() => handleChangeTeamDialog(team, employee)} className="flex items-center gap-1" >
                                                <CgArrowsExchange />
                                                Change Team
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openRoleDialog(team, employee, employee.roleInfo.name)}
                                                className="flex items-center gap-1"
                                              >
                                                <UserCog className="h-3 w-3" />
                                                Change Role
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => openDeleteMemberDialog(team, employee, false)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">No team members</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No teams found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>)
          }
        </Card>
      </div>

      {/* Single instance of dialogs */}
      {selectedTeam && editDialogOpen && (
        <EditTeamDialog
          team={selectedTeam}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onTeamUpdated={HandleTeamedit}
        />
      )}

      {selectedTeam && deleteDialogOpen && (
        <DeleteTeamDialog
          teamName={selectedTeam.teamName}
          teamId={selectedTeam._id}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteTeam}
        />
      )}

      {selectedTeam && selectedMember && (
        <DeleteTeamMemberDialog
          open={deleteMemberDialogOpen}
          onOpenChange={setDeleteMemberDialogOpen}
          onConfirm={() => handleTeamMember(selectedTeam._id, selectedMember._id, isTeamLead, ismanager)}
          teamName={selectedTeam.teamName}
          teamId={selectedTeam._id}
          memberId={selectedMember._id}
          memberName={`${selectedMember.firstName} ${selectedMember.lastName}`}
        />
      )}

      {selectedUserForRoleChange && roleDialogOpen && (
        <ChangeRoleDialog
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          onSuccess={handleRoleChangeSuccess}
          user={selectedUserForRoleChange}
          currentRole={selectedUserRole}
          teamId={selectedTeam._id}
          ManagerLength={selectedTeam.managers.length}
        />
      )}


      {selectedMemberForChangeTeam && changeTeamDialogOpen && (
        <ChangeTeam
          openChangeTeam={changeTeamDialogOpen}
          setopenChangeTeam={setChangeTeamDialogOpen}
          employee={selectedMemberForChangeTeam}
          Team={selectedTeam}
          onSuccess={successChangeTeam}
        />
      )}


    </div>
  )
}