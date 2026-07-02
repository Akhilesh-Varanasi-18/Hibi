"use client"
import TeamManagementApi from '@/Apis/TeamManagementApi'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle, Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

import React, { useEffect } from 'react'
import { useState } from 'react'
import { RxCross2 } from 'react-icons/rx'
import { TiTick } from 'react-icons/ti'

const ChangeTeam = ({ openChangeTeam, setopenChangeTeam, Team, employee, onSuccess }) => {


    const [loader, setloader] = useState(false);
    const [teams, setTeams] = useState();
    const [selectTeam, setSelectedTeam] = useState("");
    const { toast } = useToast();
    // console.log(Team.teamName)
    // console.log(Team._id, employee._id);

    const getTeamData = async () => {
        const res = await TeamManagementApi.getTeamswithName();
        if (res.success) {
            console.log(res?.data?.teams);
            setTeams(res?.data?.teams.filter((e)=>e._id!=Team._id));
        }
    }

    useEffect(() => {
        getTeamData();
    }, [])
    const handleChangeTeam = async () => {
        setloader(true);
        const res = await TeamManagementApi.changeTeam({
            "currentTeamId": Team?._id,
            "employeeId": employee?._id,
            "newTeamId": selectTeam
        })
        if (res.success) {
            toast({
                title: (
                    <div className="flex gap-2 items-center">
                        <div className="text-white bg-green-500 rounded-full text-lg">
                            <TiTick />
                        </div>
                        <span>{res?.data?.message}</span>
                    </div>
                ),
            });
            onSuccess();
        }
        else {
            toast({
                title: (
                    <div className="flex gap-2 items-center">
                        <div className="text-white bg-red-500 rounded-full text-lg">
                            <RxCross2 />
                        </div>
                        <span>{res?.data || "An error occurred"}</span>
                    </div>
                ),
            });
        }
        setloader(false);
    }


    return (
        <Dialog open={openChangeTeam} onOpenChange={setopenChangeTeam} className="w-11/12 md:w-1/3">

            <DialogContent>
                <DialogHeader className="w-full">
                    <DialogTitle >Change Team</DialogTitle>
                    <DialogDescription >
                        Change the team of the employee
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <label className='text-sm font-medium'>Current Team</label>
                    <Input
                        value={Team?.teamName}
                        disabled
                    />
                </div>
                <div>
                    <label className='text-sm font-medium'>Employee</label>
                    <Input
                        value={employee?.firstName + " " + employee?.lastName}
                        disabled
                    />
                </div>
                <div>
                    <label className='text-sm font-medium'>Select Team</label>
                    <Select onValueChange={setSelectedTeam} >
                        <SelectTrigger className="w-full border rounded-md p-2 mt-1">
                            <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                            {teams?.map((team) => (
                                <SelectItem key={team?._id} value={team?._id}>
                                    {team?.teamName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className='flex justify-end items-center gap-4' >
                    <Button onClick={() => setopenChangeTeam(false)} variant="outline">
                        Cancel
                    </Button>
                    <Button disabled={loader || !selectTeam} onClick={handleChangeTeam} variant="default">
                        {
                            loader ? "Changing..." : "Change Team"
                        }
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ChangeTeam