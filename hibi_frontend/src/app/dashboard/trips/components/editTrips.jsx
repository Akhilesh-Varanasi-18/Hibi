import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { ToDoApis } from '@/Apis/ToDoApis'
import MultipleDateSelector from '@/app/components/ReusableComponents/MultipleDateSelector'
import TripApi from '@/Apis/TripsApi'
import { useToast } from '@/hooks/use-toast'
import { TiTick } from 'react-icons/ti'
import { RxCross2 } from 'react-icons/rx'

const EditTrips = ({ propsData, open, setOpen,onSuccess }) => {
    console.log(propsData);
    const [employees, setEmployees] = useState([]);
    const [loader, setloader] = useState(false);
    const [data, setData] = useState(propsData);
    const [errors, seterrors] = useState({});
    const { toast } = useToast();
    const [dateRange, setdateRange] = useState({
        from: new Date(),
        to: new Date()
    })

    const getEmployees = async () => {
        // Replace ToDoApis with your actual API
        const res = await ToDoApis.getEmployees();
        if (res.success) {
            const convertedToRequiredFormat = res?.data?.data?.map((item, i) => {
                return {
                    _id: item?._id,
                    name: item?.employeeName,
                    value: item?._id
                }
            })
            console.log(convertedToRequiredFormat)
            setEmployees(convertedToRequiredFormat)
        }
    }

    function HandleDateInput(dateString) {
        return new Date(dateString.split("-").reverse().join("-"))
    }

    useEffect(() => {
        getEmployees();
        setdateRange({
            from: HandleDateInput(data.fromDate) || new Date(),
            to: HandleDateInput(data.toDate) || new Date()
        })
        setData((prev) => ({ ...prev, ["tripHeadId"]: prev?.tripHeadInfo?._id }))
    }, [])

    const handleInputChange = (field, value) => {
        setData(prev => ({
            ...prev,
            [field]: value
        }))

        // Clear error when user starts typing
    }

    const validate = () => {
        const newErrors = {};

        // Trip Title validation (required, min 3 characters)
        if (!data?.tripTitle?.trim()) {
            newErrors.tripTitle = 'Trip title is required';
        } else if (data.tripTitle.trim().length < 3) {
            newErrors.tripTitle = 'Trip title must be at least 3 characters long';
        }

        if (!data?.tripType?.trim()) {
            newErrors.tripType = 'Trip type is required';
        } else if (data.tripType.trim().length < 3) {
            newErrors.tripType = 'Trip type must be at least 3 characters long';
        }

        // Trip Head validation (required)
        if (!data?.tripHeadId) {
            newErrors.tripHeadId = 'Trip head is required';
        }

        // Trip Participants validation (required, at least one participant)
        if (!data?.tripParticipants || data.tripParticipants.length === 0) {
            newErrors.tripParticipants = 'At least one trip participant is required';
        }

        // Destination validation (required, 3-50 characters)
        if (!data?.destination?.trim()) {
            newErrors.destination = 'Destination is required';
        } else if (data.destination.trim().length < 3) {
            newErrors.destination = 'Destination must be at least 3 characters long';
        } else if (data.destination.trim().length > 50) {
            newErrors.destination = 'Destination cannot exceed 50 characters';
        }

        // Reason validation (required, 5-200 characters)
        if (!data?.reason?.trim()) {
            newErrors.reason = 'Reason is required';
        } else if (data.reason.trim().length < 5) {
            newErrors.reason = 'Reason must be at least 5 characters long';
        } else if (data.reason.trim().length > 200) {
            newErrors.reason = 'Reason cannot exceed 200 characters';
        }

        // Date validation
        if (!dateRange?.from || !dateRange?.to) {
            newErrors.dateRange = 'Trip period is required';
        } else if (dateRange.from > dateRange.to) {
            newErrors.dateRange = 'End date cannot be before start date';
        }

        // Advance Amount validation (optional, but if provided must be non-negative)
        if (data?.advanceAmount && data.advanceAmount < 0) {
            newErrors.advanceAmount = 'Advance amount cannot be negative';
        }

        seterrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    useEffect(() => {
        validate()
    }, [data, dateRange]);

    function changeDateFormat(dataString){
        const date=new Date(dataString);
        return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) {
            return; // Stop submission if validation fails
        }

        const formData = {...data};
        formData.fromDate = changeDateFormat(dateRange?.from);
        formData.toDate = changeDateFormat(dateRange?.to);
        formData.statusId = data?.status?._id;
        const Dummy=data?.tripParticipants;
        const FilterPariticipates = Dummy?.map((ele) => ele._id);
        formData.tripParticipants = FilterPariticipates;
        formData.tripId = data?._id;
        setloader(true);
        // console.log(formData);
        const res = await TripApi.updateTrip(formData);
        if (res.success) {
            toast?.({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                    <span>{res?.data?.message ?? "Team created successfully"}</span>
                </div>,
            });
            onSuccess();
            setOpen(false);
        }
        else {
            toast?.({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>{res?.error ?? "Failed to update trip"}</span>
                </div>,
            });
        }
        setloader(false);
        // console.log(data);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-white h-[90%] overflow-scroll">
                <DialogHeader>
                    <DialogTitle className="text-black dark:text-white">
                        Edit Trip Details
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-white">
                        You are editing the trip details
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Trip Title */}
                    <div className="space-y-2">
                        <Label htmlFor="tripTitle" className="text-black dark:text-white">
                            Trip Title
                        </Label>
                        <Input
                            id="tripTitle"
                            value={data?.tripTitle || ''}
                            onChange={(e) => handleInputChange('tripTitle', e.target.value)}
                            className={`border-gray-300 focus:border-black ${errors.tripTitle ? 'border-red-500' : ''
                                }`}
                            placeholder="Enter trip title (min. 3 characters)"
                        />
                        {errors?.tripTitle && (
                            <p className="text-red-500 text-sm">{errors.tripTitle}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tripTitle" className="text-black dark:text-white">
                            Trip Type
                        </Label>
                        <Input
                            id="tripTitle"
                            value={data?.tripType || ''}
                            onChange={(e) => handleInputChange('tripType', e.target.value)}
                            className={`border-gray-300 focus:border-black ${errors.tripTitle ? 'border-red-500' : ''
                                }`}
                            placeholder="Enter trip title (min. 3 characters)"
                        />
                        {errors?.tripType && (
                            <p className="text-red-500 text-sm">{errors.tripType}</p>
                        )}
                    </div>


                    {/* Trip Period */}
                    <div className='space-y-2'>
                        <Label className="text-black dark:text-white">
                            Trip Period
                        </Label>
                        <MultipleDateSelector
                            dateRange={dateRange}
                            setDateRange={setdateRange}
                            showUpcoming={true}
                        />
                        {errors?.dateRange && (
                            <p className="text-red-500 text-sm">{errors.dateRange}</p>
                        )}
                    </div>

                    {/* Trip Head */}
                    <div className="space-y-2">
                        <Label htmlFor="tripHeadId" className="text-black dark:text-white">
                            Trip Head
                        </Label>
                        <Select
                            value={data?.tripHeadId || data?.tripHeadInfo?._id || ''}
                            onValueChange={(value) => handleInputChange('tripHeadId', value)}
                        >
                            <SelectTrigger className={`border-gray-300 focus:border-black ${errors.tripHeadId ? 'border-red-500' : ''
                                }`}>
                                <SelectValue placeholder="Select trip head" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {employees.map((employee) => (
                                    <SelectItem
                                        key={employee?._id}
                                        value={employee?._id}
                                        className="text-black"
                                    >
                                        {employee?.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.tripHeadId && (
                            <p className="text-red-500 text-sm">{errors.tripHeadId}</p>
                        )}
                    </div>

                    {/* Trip Participants */}
                    <div className="space-y-2">
                        <Label htmlFor="tripParticipants" className="text-black dark:text-white">
                            Trip Participants
                        </Label>
                        <Select
                            onValueChange={(value) => {
                                const newParticipants = [...(data?.tripParticipants || [])]
                                if (!newParticipants?.find(p => p._id === value)) {
                                    const selectedEmployee = employees?.find(emp => emp._id === value)
                                    if (selectedEmployee) {
                                        newParticipants.push({
                                            _id: selectedEmployee._id,
                                            fullName: selectedEmployee?.name
                                        })
                                        handleInputChange('tripParticipants', newParticipants)
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className={`border-gray-300 dark:text-white focus:border-black ${errors.tripParticipants ? 'border-red-500' : ''
                                }`}>
                                <SelectValue placeholder="Add participants" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {employees?.map((employee) => (
                                    <SelectItem
                                        key={employee._id}
                                        value={employee._id}
                                        className="text-black"
                                    >
                                        {employee.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Selected Participants */}
                        {data?.tripParticipants?.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <Label className="text-sm text-gray-600 dark:text-white">Selected Participants:</Label>
                                <div className="flex flex-wrap gap-2">
                                    {data?.tripParticipants?.map((participant) => (
                                        <div
                                            key={participant?._id}
                                            className="bg-gray-100 px-3 py-1 rounded-full text-sm text-black flex items-center gap-2"
                                        >
                                            {participant?.fullName}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updatedParticipants = data?.tripParticipants?.filter(
                                                        p => p._id !== participant._id
                                                    )
                                                    handleInputChange('tripParticipants', updatedParticipants)
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {errors?.tripParticipants && (
                            <p className="text-red-500 text-sm">{errors.tripParticipants}</p>
                        )}
                    </div>

                    {/* Destination */}
                    <div className="space-y-2">
                        <Label htmlFor="destination" className="text-black dark:text-white">
                            Destination
                        </Label>
                        <Input
                            id="destination"
                            value={data?.destination || ''}
                            onChange={(e) => handleInputChange('destination', e.target.value)}
                            className={`border-gray-300 focus:border-black ${errors.destination ? 'border-red-500' : ''
                                }`}
                            placeholder="Enter destination (3-50 characters)"
                        />
                        {errors?.destination && (
                            <p className="text-red-500 text-sm">{errors.destination}</p>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-black dark:text-white">
                            Reason
                        </Label>
                        <Textarea
                            id="reason"
                            value={data?.reason || ''}
                            onChange={(e) => handleInputChange('reason', e.target.value)}
                            className={`border-gray-300 focus:border-black min-h-[100px] ${errors.reason ? 'border-red-500' : ''
                                }`}
                            placeholder="Enter the reason for the trip (5-200 characters)..."
                        />
                        <div className="flex justify-between text-sm text-gray-500 dark:text-white">
                            <span>{data?.reason?.length || 0}/200 characters</span>
                            {errors?.reason && (
                                <span className="text-red-500">{errors.reason}</span>
                            )}
                        </div>
                    </div>

                    {/* Advance Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="advanceAmount" className="text-black dark:text-white">
                            Advance Amount (Optional)
                        </Label>
                        <Input
                            id="advanceAmount"
                            type="number"
                            value={data?.advanceAmount || ''}
                            onChange={(e) => handleInputChange('advanceAmount', parseInt(e.target.value) || 0)}
                            className={`border-gray-300 focus:border-black ${errors.advanceAmount ? 'border-red-500' : ''
                                }`}
                            placeholder="Enter advance amount (optional)"
                            min="0"
                        />
                        {errors?.advanceAmount && (
                            <p className="text-red-500 text-sm">{errors.advanceAmount}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="border-gray-300 text-black dark:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className=""
                            disabled={loader || Object.entries(errors)?.length !== 0}
                        >
                            {loader ? "Saving Changes" : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditTrips