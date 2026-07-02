import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, LogIn, LogOut, Timer } from "lucide-react";
import React from 'react'
import ApplyPermissionDialog from './ApplyPermissionDialog'
import { getPermissionIconAndBg } from "@/utils/PermissionsIcons";


const formatPermissionType = (type) => {
    if (!type) return "";
    switch (type.toUpperCase()) {
        case "EMERGENCY":
            return "Emergency";
        case "LATEIN":
            return "Late In";
        case "EARLYOUT":
            return "Early Out";
        case "GENERAL":
            return "General";
        default:
            // Capitalize first letter, rest lowercase
            return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }
};

const PermissionCard = ({ card, refresh, /* notifyTo, */ shiftDetails }) => {
    const { icon, bg } = getPermissionIconAndBg(card.permissionType);
    return (
        <Card className={`hover:shadow-sm transition-shadow`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {formatPermissionType(card.permissionType)}
                    </CardTitle>
                    {getPermissionIconAndBg(card.permissionType)}
                </div>
                <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                    Request permission for {formatPermissionType(card?.permissionType)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ApplyPermissionDialog
                    shiftDetails={shiftDetails}
                    id={card?._id}
                    // notifyTo={notifyTo}
                    refresh={refresh}   
                    permissionType={card?.permissionType}
                />
            </CardContent>
        </Card>
    )
}

export default PermissionCard