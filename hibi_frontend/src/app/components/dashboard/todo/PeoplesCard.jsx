import React from 'react'
import CustomAvatar from '../../ReusableComponents/CustomAvatar'
import CustomDialog from '../../ReusableComponents/CustomDialog'
import {
    Card,
    CardContent,
    CardTitle,
} from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'

// Displays card list of peoples with avatar (left) and label (right) on dialog open; label prop is shown near avatars in trigger
const PeoplesCard = ({ label, peoplesArray = [], showDialog = false }) => {
    return (
        <div>
            {
                showDialog ?
                    <CustomDialog
                        label={
                            <div className='flex gap-2 items-center flex-wrap'>
                                {/* Optional main label if provided */}
                                {label && (
                                    <div className='text-foreground/80 text-xs'>{label}</div>
                                )}
                                {/* Avatars inline */}
                                <div className='flex -gap-4 items-center max-w-sm overflow-x-auto'>
                                    {Array.isArray(peoplesArray) && peoplesArray.length > 0 &&
                                        peoplesArray.map((item, i) => (
                                            <Tooltip className="z-[9999999] bg-foreground text-background" key={i}>
                                                <TooltipTrigger>
                                                    <CustomAvatar url={item?.url} label={item?.label} />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{item?.label}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))
                                    }
                                </div>
                            </div>
                        }
                        content={
                            <div>
                                <div className="mb-4 text-base font-semibold">People in this todo</div>
                                <div className="flex flex-col gap-4 items-start justify-start p-0 max-h-[60vh] overflow-y-auto">
                                    {Array.isArray(peoplesArray) && peoplesArray.length > 0 ? (
                                        peoplesArray.map((item, i) => (
                                            <a href={`/userProfile/${item?._id || item?.label}`} target='_blank' className='w-full'>
                                            <Card key={i} className="shadow-none border-muted-foreground/10 flex flex-row items-center p-2 w-full">
                                                <CustomAvatar url={item?.url} label={item?.label} />
                                                <div className='flex flex-col ml-4 justify-center items-start'>
                                                    <span className="text-sm text-foreground/80 capitalize">{item?.label?.toLowerCase()}</span>
                                                    <span className="text-sm text-foreground/60 capitalize">{item?.desc?.toLowerCase()}</span>
                                                </div>
                                            </Card>
                                            </a>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No people assigned.</div>
                                    )}
                                </div>
                            </div>
                        }
                    />
                    :
                    <div className='flex gap-2 items-center flex-wrap'>
                        {/* Optional main label if provided */}
                        {label && (
                            <div className='text-foreground/80 text-xs'>{label}</div>
                        )}
                        {/* Avatars inline */}
                        <div className='flex -gap-4 items-center max-w-sm overflow-x-auto'>
                            {Array.isArray(peoplesArray) && peoplesArray.length > 0 &&
                                peoplesArray.map((item, i) => (
                                    <Tooltip className="z-[9999999] bg-foreground text-background" key={i}>
                                        <TooltipTrigger>
                                            <CustomAvatar url={item?.url} label={item?.label} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{item?.label}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))
                            }
                        </div>
                    </div>
            }

        </div>
    )
}

export default PeoplesCard