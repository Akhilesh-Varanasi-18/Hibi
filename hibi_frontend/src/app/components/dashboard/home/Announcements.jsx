"use client"
import React, { useEffect, useState } from 'react'
import { Announcements_Apis } from '@/Apis/Announcements_Apis'
import AnnouncementsCarousel from './AnnouncementsCarousel'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const Announcements = ({ refresh }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [deleteRefresh, setDeleteRefresh] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnnouncements();
    }, [refresh, deleteRefresh]);

    const getAnnouncements = async () => {
        setLoading(true);
        const res = await Announcements_Apis.getAnnouncements();
        if (res.success) {
            // Map the API data to a flat array of announcement objects with required fields
            const mapped = (res.data || []).flatMap(item =>
                (item.announcements || []).map(ann => ({
                    title: ann.title,
                    imageUrl: ann.imageUrl,
                    desc: item.description,
                    expiresIn: item.expiresAt,
                    createdBy: item.createdBy?.name || "",
                    createdAt: item.createdAt,
                    _id: item._id,
                }))
            );
            setAnnouncements(mapped);
            // console.log("Mapped Announcements:", mapped);
        }
        setLoading(false);
    }


    return (
        <div className='w-full'>
            {loading ? (
                <div className="w-full">
                    <Card className="h-40 w-full mb-4 flex flex-col justify-center">
                        <CardContent className="p-3 flex flex-col justify-center h-full">
                            <div className="flex justify-between flex-wrap-reverse gap-4 mb-2">
                                <Skeleton className="h-6 w-1/3 rounded" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-2/3 mb-2 rounded" />
                            <Skeleton className="h-3 w-1/2 rounded" />
                        </CardContent>
                    </Card>
                </div>
            ) : (
                announcements.length > 0 ? (
                    <AnnouncementsCarousel announcements={announcements} refresh={() => setDeleteRefresh(prev => prev + 1)} />
                ) : (
                    <div className='w-full h-full flex justify-center items-center'>
                        {/* <p className='text-muted-foreground'>No announcements found</p> */}
                    </div>
                )
            )}
        </div>
    )
}

export default Announcements;