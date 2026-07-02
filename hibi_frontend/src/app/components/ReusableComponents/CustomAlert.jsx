import { Alert, AlertDescription } from '@/components/ui/alert'
import Comparing from '@/utils/CommonFunctionality'
import { CheckCircle2, InfoIcon } from 'lucide-react'
import React from 'react'

const CustomAlert = ({ type = "highlaert", text }) => {
    return (
        <div>
            {
                Comparing.compareStrings(type, "lowalert") ?
                    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                        <InfoIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-800 dark:text-amber-300">
                            {text}
                        </AlertDescription>
                    </Alert>

                    : Comparing.compareStrings(type, "normalalert") ?
                        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertDescription className="text-green-800 dark:text-green-300">
                                {text}
                            </AlertDescription>
                        </Alert>
                        :
                        <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
                            <InfoIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <AlertDescription className="text-red-800 dark:text-red-300">
                                {text}
                            </AlertDescription>
                        </Alert>
            }

        </div>
    )
}

export default CustomAlert