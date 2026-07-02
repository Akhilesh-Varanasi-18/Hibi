"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react'

const CustomAvatar = ({ url, label, showTooltip, toolTipContent }) => {
    if (showTooltip) {
        return (
            <Tooltip>
                <TooltipTrigger>
                    <Avatar className="h-10 w-10 rounded-full cursor-pointer">
                        <AvatarImage src={url} alt={label} />
                        <AvatarFallback className="rounded-lg bg-accent">{label && label[0]}</AvatarFallback>
                    </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                    {toolTipContent || label}
                </TooltipContent>
            </Tooltip>
        )
    }
    // No tooltip shown, just avatar
    return (
        <Avatar className="h-10 w-10 rounded-full cursor-pointer">
            <AvatarImage src={url} alt={label} />
            <AvatarFallback className="rounded-lg bg-accent">{label && label[0]}</AvatarFallback>
        </Avatar>
    )
}

export default CustomAvatar;