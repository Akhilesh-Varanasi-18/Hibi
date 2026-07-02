import CarrierApi from '@/Apis/CarrierHistory';
import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Building2, User, Edit, Trash2, ChevronRight, Dot, MoreVertical } from 'lucide-react';
import CarrierHistoryDialog from './Dialogues/carrierHistoryDialog';
import DeleteHistory from './Dialogues/DeleteHistory';
import { Skeleton } from '@/components/ui/skeleton';

const HistoryComponent = () => {
    const [data, setData] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [EditOpen, setEditOpen] = useState(false);
    const [deleteOpen, setdeleteOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [loader, setloader] = useState(false);

    const getData = async () => {
        setloader(true);
        const res = await CarrierApi.getHistory();
        if (res.success) {
            // Sort data by start date (newest first)
            const sortedData = res.data.data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            setData(sortedData);
        }
        setloader(false);
    }

    useEffect(() => {
        getData();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTimelineDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateDuration = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.floor(diffDays / 30);
        const years = Math.floor(months / 12);

        if (years > 0) {
            return `${years} year${years > 1 ? 's' : ''} ${months % 12} month${months % 12 > 1 ? 's' : ''}`;
        }
        return `${months} month${months > 1 ? 's' : ''}`;
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setEditOpen(true);
    };

    const handleDelete = async (item) => {
        setSelectedItem(item);
        setdeleteOpen(true);
    };


    function handleRefresh()
    {   
        getData();
    }

    if(loader)
    {
        return(
            <div className='min-h-screen p-6 bg-background'>
                <div className='max-w-4xl mx-auto flex gap-4 flex-col'>
                    <Skeleton className={"w-full h-24"}/>
                    <Skeleton className={"w-full h-24"}/>
                    <Skeleton className={"w-full h-24"}/>

                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 bg-background">
            <div className="max-w-4xl mx-auto">

                {data.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <p className="text-muted-foreground text-lg">No career history records found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="relative">
                        {/* Vertical timeline line */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border transform -translate-x-1/2"></div>

                        <div className="space-y-12">
                            {data.map((item, index) => (
                                <div key={item._id} className="relative flex items-center">
                                    {/* Timeline dot */}
                                    <div className="absolute left-8 w-4 h-4 rounded-full bg-primary border-4 border-background transform -translate-x-1/2 z-10 shadow-sm"></div>

                                    {/* Date Display */}
                                    <div className="ml-16 flex-1">
                                        <div className="w-full flex items-start p-4 h-auto border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                                            <div className="flex-1">
                                                <div className='flex items-center gap-2 mb-2'>
                                                    <h3 className="font-bold text-foreground text-lg">
                                                        {item.organizationName}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                                    <div className="text-left">
                                                        <div className="font-semibold text-foreground">
                                                            {formatTimelineDate(item.startDate)} - {formatTimelineDate(item.endDate)}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            {calculateDuration(item.startDate, item.endDate)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* MoreVertical button for popover */}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-background"
                                                    >
                                                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-0" align="end">
                                                    <Card>
                                                        <CardContent className="p-6">
                                                            {/* Header with Actions */}
                                                            <div className="flex justify-between items-start mb-4">
                                                                <Badge variant="secondary">
                                                                    {calculateDuration(item.startDate, item.endDate)}
                                                                </Badge>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(item)}
                                                                        className="h-8 w-8 p-0 hover:bg-accent"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(item)}
                                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Date Range */}
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                                                <Calendar className="w-4 h-4" />
                                                                <span className="font-medium">{formatDate(item.startDate)}</span>
                                                                <ChevronRight className="w-4 h-4" />
                                                                <span className="font-medium">{formatDate(item.endDate)}</span>
                                                            </div>

                                                            {/* Organization */}
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Building2 className="w-4 h-4 text-primary" />
                                                                <h3 className="font-bold text-foreground text-lg">
                                                                    {item.organizationName}
                                                                </h3>
                                                            </div>

                                                            {/* Role */}
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <User className="w-4 h-4 text-muted-foreground" />
                                                                <span className="text-foreground font-semibold">
                                                                    {item.role}
                                                                </span>
                                                            </div>

                                                            {/* Description */}
                                                            <div className="border-t border-border pt-3">
                                                                <p className="text-muted-foreground text-sm leading-relaxed">
                                                                    {item.description}
                                                                </p>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {
                EditOpen && selectedItem && (
                    <CarrierHistoryDialog open={EditOpen} setOpen={setEditOpen} data={selectedItem} onSave={()=>{handleRefresh()}} />
                )
            }
            {
                deleteOpen && selectedItem && (
                    <DeleteHistory open={deleteOpen} setOpen={setdeleteOpen} data={selectedItem} onSucess={()=>{handleRefresh()}}/>
                )
            }
        </div>
    );
}

export default HistoryComponent;