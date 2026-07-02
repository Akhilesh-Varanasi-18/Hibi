"use client"
import React, { useState, useContext } from 'react';
import TeamTable from "./teamComponents/ShowingTeams";
import Comparing from "@/utils/CommonFunctionality";
import { UsersContext } from "../../context/UserContext";
import { AddTeamDialog } from './teamComponents/Dialogues/addingTeam';

const Page = () => {
  // State to trigger re-render when a new team is added
  const [team, setTeam] = useState(0);
  
  // Get user role from context with null safety
  const { role } = useContext(UsersContext) ?? {};
  
  // Callback function to refresh team list after adding new team
  const handleTeamAdded = () => {
    setTeam(prev => prev + 1);
  };

  return (
    <div className="px-6 pb-10 space-y-6 min-h-screen dark:bg-neutral-950">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between flex-wrap pb-4 gap-2">
          {/* Page title */}
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Team Management
          </h1>
          
          {/* Conditionally render Add Team button based on user role */}
          {role && (Comparing.compareStrings(role, "Ceo") || 
                   Comparing.compareStrings(role, "hr") || 
                   Comparing.compareStrings(role, "manager") || Comparing.compareStrings(role, "coo")) && (
            <div className="w-full flex justify-end">
              <AddTeamDialog CallBack={handleTeamAdded} />
            </div>
          )}
        </div>
        
        {/* Team table with key to force re-render when teams change */}
        <TeamTable key={team} />
      </div>
    </div>
  );
};

export default Page;