import React from 'react'
import TeamManagementApi from '@/Apis/TeamManagementApi'
import { useState, useEffect } from 'react'
const TeamAttendence = () => {
    const [teams,setTeams]=useState([]);
    const [loader,setloder]=useState(false);
    const fetchTeams = async () => {
        setloder(true);
        let response = await TeamManagementApi.fetchTeams()
        if (response.success) {
            console.log(response.data);
            setTeams(response.data || [])
        } else {
            console.error("Failed to fetch teams:", response.error)
        }
        setloder(false);
    }
    useEffect(() => {
        fetchTeams()
    }, [])
    return (
        <div>TeamAttendence</div>
    )
}

export default TeamAttendence