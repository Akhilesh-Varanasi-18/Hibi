'use client'

import React, { useContext, useMemo, useRef, useState } from 'react'
import { format, isFuture, isPast } from 'date-fns'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'

import {
    Card,
    CardContent,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/autoplay'
import { UsersContext } from '@/app/context/UserContext'
import DeleteAnnouncement from './DeleteAnnouncement'

import Comparing from '@/utils/CommonFunctionality'
import CustomImageDialog from '../../ReusableComponents/CustomImageDialog'
// import Image from 'next/image' // Not needed for now

const AnnouncementsCarousel = ({ announcements = [], refresh }) => {
    const { role, previlege } = useContext(UsersContext);
    // Ref to hold the Swiper instance
    const swiperRef = useRef(null)

    // State to track slide position for disabling navigation buttons
    const [isBeginning, setIsBeginning] = useState(true)
    const [isEnd, setIsEnd] = useState(false)

    const activeAnnouncements = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return (announcements || []).filter(announcement => {
            if (!announcement?.expiresIn) return true
            const expiryDate = new Date(announcement?.expiresIn)
            // Ensure we include announcements that expire *today*
            expiryDate.setHours(23, 59, 59, 999)
            return isFuture(expiryDate) || expiryDate.getTime() === today.getTime()
        })
    }, [announcements])

    // Only show title and description, card height reduced, image commented out

    // Handle case where no active announcements exist
    if (activeAnnouncements.length === 0) {
        return (
            <div className="w-full mx-auto py-8">
                <h2 className="text-2xl font-bold mb-6 text-left">Announcements</h2>
                <Card className="p-6 text-center mx-4 sm:mx-6">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No active announcements right now.</p>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full mx-auto py-2 relative overflow-hidden">
            {/* <h2 className="text-2xl font-bold mb-6 text-left">Announcements</h2> */}

            <div className="relative w-full px-1">
                <Swiper
                    // Capture Swiper instance and update slide state
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper
                        setIsBeginning(swiper.isBeginning)
                        setIsEnd(swiper.isEnd)
                    }}
                    // Update state on slide change to enable/disable buttons
                    onSlideChange={(swiper) => {
                        setIsBeginning(swiper.isBeginning)
                        setIsEnd(swiper.isEnd)
                    }}

                    modules={[Autoplay, Pagination, Navigation]}
                    spaceBetween={30}
                    slidesPerView={1}
                    loop={false} // Set to false to allow isBeginning/isEnd logic to work
                    autoplay={{
                        delay: 4500,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                    }}
                    pagination={{
                        clickable: true,
                        dynamicBullets: true,
                    }}
                    className="mySwiper w-full h-40 pb-8"
                    breakpoints={{
                        0: { slidesPerView: 1, spaceBetween: 20 },
                        640: { slidesPerView: 1, spaceBetween: 20 },
                        768: { slidesPerView: 1, spaceBetween: 30 },
                        1024: { slidesPerView: 1, spaceBetween: 30 },
                    }}
                    // Ensure overflow is visible so the buttons are not clipped
                    style={{ overflow: 'visible', maxWidth: '100%' }}
                >
                    {activeAnnouncements.map((announcement, i) => (
                        <SwiperSlide
                            key={announcement?._id || i}
                            className="!flex !items-stretch !w-full"
                        >
                            <Card className="h-40 w-full flex flex-col overflow-hidden justify-center">
                                {/* Image banner - commented out for now */}
                                {/*
                                {announcement?.imageUrl && (
                                    <div className="w-full flex-shrink-0" style={{ height: '55%' }}>
                                        <img
                                            src={announcement?.imageUrl}
                                            alt={announcement?.title || "Announcement Image"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                */}
                                {/* Only show title and description */}
                                {(announcement?.title || announcement?.desc) && (
                                    <CardContent className="p-3 flex flex-col justify-center h-full ">

                                        <div className='flex justify-between flex-wrap-reverse gap-4'>
                                            {announcement?.title && (
                                                <CardTitle
                                                    className="text-base sm:text-lg leading-snug mb-1 break-words"
                                                    title={announcement?.title}
                                                >
                                                    {announcement?.title}
                                                </CardTitle>
                                            )}
                                            <div className='flex gap-3 flex-wrap'>
                                                <CustomImageDialog url={announcement?.imageUrl} label="View Poster"
                                                    content={<div className=''>
                                                        <CardTitle
                                                            className="text-base sm:text-lg leading-snug break-words"
                                                            title={announcement?.title}
                                                        >
                                                            {announcement?.title}
                                                        </CardTitle>
                                                        {announcement?.desc && (
                                                            <CardDescription
                                                                className="text-xs sm:text-sm break-words whitespace-pre-line overflow-y-auto text-muted-foreground/60"
                                                                title={announcement?.desc.length > 200 && announcement?.desc}
                                                            >
                                                                {announcement?.desc}
                                                            </CardDescription>
                                                        )}
                                                    </div>}
                                                />
                                                                                                {
                                                    (Comparing.compareStrings(previlege , "SUPERADMIN") || Comparing.compareStrings(previlege , "ADMIN")) && <DeleteAnnouncement id={announcement?._id || ""} refresh={refresh} />
                                                }
                                            </div>
                                        </div>

                                        {announcement?.desc && (
                                            <CardDescription
                                                className="mt-1 text-xs sm:text-sm break-words whitespace-pre-line overflow-y-auto text-muted-foreground/60"
                                                title={announcement?.desc.length > 200 && announcement?.desc}
                                            >
                                                {announcement?.desc}
                                            </CardDescription>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    )
}

export default AnnouncementsCarousel