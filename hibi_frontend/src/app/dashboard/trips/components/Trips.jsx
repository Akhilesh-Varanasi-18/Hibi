"use client"
import { useContext, useEffect, useState } from 'react'
import TripApi from '@/Apis/TripsApi'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Calendar,
    MapPin,
    Users,
    User,
    IndianRupee,
    FileText,
    Edit,
    Trash2
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import EditTrips from './editTrips'
import DeleteTrip from './deleteTrip'
import { CommonDataContext } from '../../context/CommonDataContext'
import { useToast } from '@/hooks/use-toast'
import { TiTick } from 'react-icons/ti'
import { RxCross2 } from 'react-icons/rx'
import Comparing from '@/utils/CommonFunctionality'
import { UsersContext } from '@/app/context/UserContext'
import CreateTrips from './CreateTrips'

const Trips = () => {
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true);
    const [editopen, seteditopen] = useState(false);
    const [selectedTrip, setselectedTrip] = useState(null);
    const [deleteopen, setdeleteopen] = useState(false);
    const { statusTypes } = useContext(CommonDataContext);
    const { previlege,role,user } = useContext(UsersContext);

    const { toast } = useToast();


    useEffect(() => {
        getData()
    }, [])

    async function getData() {
        setLoading(true);
        try {
            const res = await TripApi.getTrips();
            console.log(res);
            setTrips(res.data?.activeTrips || res.data || res)
        } catch (error) {
            console.error('Error fetching trips:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        return dateString
    }

    const getStatusVariant = (statusType) => {
        return statusType === 'ACTIVE' ? 'default' : 'secondary'
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    function HandleEdit(trip) {
        setselectedTrip(trip);
        seteditopen(true);
    }

    function HandleDelete(trip) {
        setdeleteopen(true);
        setselectedTrip(trip);
    }

    async function HandleProcceding(Status, tripId) {
        const StatusID = statusTypes.find((ele) => ele?.statusType == Status);
        console.log(StatusID, tripId);
        const res = await TripApi.updateStatus({
            "tripId": tripId,
            "statusId": StatusID._id
        })
        if (res.success) {
            toast?.({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                    <span>{res?.data?.message ?? "Team created successfully"}</span>
                </div>,
            });
            getData();
        }
        else {
            toast?.({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>{res?.error ?? "Failed to create team"}</span>
                </div>,
            });
        }

    }
    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-1 w-1" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Card className="">
                    {/* <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                    </CardHeader> */}
                    <CardContent>
                        <div className="space-y-4 mt-2">
                            {[...Array(2)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    function HandleRefresh() {
        getData();
    }

    return (
        <div className="w-full mx-auto px-6 space-y-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-wrap flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className='w-full'>
                    <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Business Trips</h1>
                    <p className="text-foreground/60 mt-2">
                        Manage and track all business trips and travel requests
                    </p>
                </div>
                {(Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "coo") || Comparing.compareStrings(role, "hr")) &&
                    <div className='w-full flex justify-end'>
                        <CreateTrips onSuccess={() => { HandleRefresh() }} />
                    </div>
                }
            </div>
            {/* Trips Table */}
            <Card className="">
                <CardHeader>
                    <CardTitle className="text-black dark:text-white">All Trips</CardTitle>
                    <CardDescription className="text-foreground/60">
                        List of all business trips with their details and status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table className="">
                        <TableHeader>
                            <TableRow className="">
                                <TableHead className="text-black font-semibold dark:text-white">Trip Details</TableHead>
                                <TableHead className="text-black font-semibold dark:text-white">Reason</TableHead>
                                <TableHead className="text-black font-semibold dark:text-white">Destination</TableHead>
                                <TableHead className="text-black font-semibold dark:text-white">Start Date</TableHead>
                                <TableHead className="text-black font-semibold dark:text-white">End Date</TableHead>
                                <TableHead className="text-black font-semibold dark:text-white">Participants</TableHead>
                                <TableHead className="text-black font-semibold dark:text-white">Trip Head</TableHead>
                                <TableHead className="text-black font-semibold dark:text-white">Advance</TableHead>
                                <TableHead className="text-black font-semibold dark:text-white">Status</TableHead>
                                {(Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "coo") || Comparing.compareStrings(role, "hr")) &&
                                    <TableHead className="text-black font-semibold dark:text-white">Actions</TableHead>
                                }
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trips.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                        No trips found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                trips.map((trip) => (
                                    <TableRow key={trip._id} className=" border-b border-gray-100">
                                        <TableCell>
                                            <div>
                                                <Badge>{trip.tripType}</Badge>
                                                <p className="font-medium text-black dark:text-white">{trip.tripTitle}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-gray-600 dark:text-white mt-1">{trip.reason}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center dark:text-white">
                                                {/* <MapPin className="w-4 h-4 mr-2 text-gray-600 dark:text-white" /> */}
                                                <span className="text-black dark:text-white">{trip.destination}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                {/* <Calendar className="w-4 h-4 mr-2 text-gray-600 dark:text-white" /> */}
                                                <div>
                                                    <p className="text-black text-sm dark:text-white">{formatDate(trip.fromDate)}</p>
                                                    {/* <p className="text-black text-sm dark:text-white">to {formatDate(trip.toDate)}</p> */}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                {/* <Calendar className="w-4 h-4 mr-2 text-gray-600 dark:text-white" /> */}
                                                <div>
                                                    {/* <p className="text-black text-sm dark:text-white">{formatDate(trip.fromDate)}</p> */}
                                                    <p className="text-black text-sm dark:text-white"> {formatDate(trip.toDate)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                {/* <Users className="w-4 h-4 mr-2 text-gray-600 dark:text-white" /> */}
                                                <div>
                                                    {trip.tripParticipants?.slice(0, 2).map((participant, index) => (
                                                        <p key={participant._id} className="text-black text-sm dark:text-white">
                                                            {participant.fullName}
                                                            {index === 0 && trip.tripParticipants.length > 2 && (
                                                                <span className="text-gray-500 ml-1 dark:text-white">
                                                                    +{trip.tripParticipants.length - 1} more
                                                                </span>
                                                            )}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                {/* <User className="w-4 h-4 mr-2 text-gray-600 dark:text-white" /> */}
                                                <span className="text-black text-sm dark:text-white">
                                                    {trip.tripHeadInfo?.fullname}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                {/* <IndianRupee className="w-4 h-4 mr-1 text-gray-600 dark:text-white" /> */}
                                                <span className="text-black font-medium dark:text-white">
                                                    {formatCurrency(trip.advanceAmount || 0)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getStatusVariant(trip.status?.statusType)}
                                                className={
                                                    trip.status?.statusType === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800 border-green-200'
                                                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                }
                                            >
                                                {trip.status?.statusType}
                                            </Badge>
                                        </TableCell>
                                        {(Comparing.compareStrings(role, "ceo") || Comparing.compareStrings(role, "coo") || Comparing.compareStrings(role, "hr") || trip.tripHeadInfo?._id==user?._id)&&
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    {
                                                        trip?.status?.statusType == "ACTIVE" && <Button
                                                            variant="outline"

                                                            size="sm"
                                                            className="border-gray-300 hover:bg-gray-100 hover:text-black"
                                                            onClick={() => { HandleProcceding("PROCESSING", trip._id) }}
                                                        >
                                                            In Process
                                                        </Button>
                                                    }
                                                    {trip?.status?.statusType == "PROCESSING" &&
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-gray-300 hover:bg-gray-100 hover:text-black"
                                                            onClick={() => { HandleProcceding("COMPLETED", trip._id) }}
                                                        >
                                                            Complete
                                                        </Button>
                                                    }
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-gray-300 hover:bg-gray-100 hover:text-black"
                                                        onClick={() => { HandleEdit(trip) }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-300 hover:bg-red-50 hover:text-red-700 text-red-600"
                                                        onClick={() => { HandleDelete(trip) }}

                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>

                                                </div>
                                            </TableCell>
                                        }
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {
                editopen && selectedTrip && <EditTrips propsData={selectedTrip} open={editopen} setOpen={seteditopen} onSuccess={() => { HandleRefresh() }} />
            }

            {
                deleteopen && selectedTrip && <DeleteTrip data={selectedTrip} open={deleteopen} setOpen={setdeleteopen} onSuccess={() => { HandleRefresh() }} />
            }

        </div>
    )
}

export default Trips