import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

const FiltersCard = ({title , icon , cnt}) => {
    return (
        <Card className={` hover:shadow-md transition-shadow duration-200`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-neutral-600 dark:text-neutral-300">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    {cnt}
                </div>
            </CardContent>
        </Card>
    )
}

export default FiltersCard