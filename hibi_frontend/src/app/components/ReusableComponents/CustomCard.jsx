import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

const CustomCard = ({ title, desc, content, footerContent, rightSection }) => {
    return (
        <Card className="relative overflow-hidden  flex flex-col gap-0 border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-xl min-h-80 h-full bg-card">
            <CardHeader className="p-0 pr-2 flex justify-between items-center flex-row w-full mb-0 pb-0">
                <div className={`rounded-t-lg px-4 py-4 pb-2`}>
                    <CardTitle className="flex items-center justify-between text-base font-semibold text-neutral-800 dark:text-neutral-100">
                        <span>{title}</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                        {desc}
                    </CardDescription>
                </div>
                <div>{rightSection}</div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 pt-3 pb-5 px-6 max-h-52 overflow-y-auto">
                {
                    content
                }
            </CardContent>
            {footerContent && (
                <CardFooter>
                    {footerContent}
                </CardFooter>
            )}
        </Card>
    )
}

export default CustomCard