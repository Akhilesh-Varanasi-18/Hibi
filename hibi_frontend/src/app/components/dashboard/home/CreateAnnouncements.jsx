'use client'
import React, { useState, useCallback, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Plus, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Announcements_Apis } from '@/Apis/Announcements_Apis'
import { useToast } from "@/hooks/use-toast"
import { TiTick } from 'react-icons/ti'
import { RxCross2 } from 'react-icons/rx'
import { cropImageTo16x5, cropImageTo16x9 } from '@/utils/UseFulFunctions'

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes



const CreateAnnouncements = ({ refresh }) => {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [image, setImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [expiresIn, setExpiresIn] = useState(undefined)
    const [openCalendar, setOpenCalendar] = useState(false)
    const [loading, setLoading] = useState(false)
    const [fileError, setFileError] = useState('')
    const [isCropping, setIsCropping] = useState(false)
    const fileInputRef = useRef(null)

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const handleDateSelect = useCallback((date) => {
        setExpiresIn(date);
        if (date) {
            setOpenCalendar(false);
        }
    }, [])

    const handleFileChange = async (e) => {
        const file = e.target.files ? e.target.files[0] : null;
        
        if (!file) {
            setFileError('');
            setImage(null);
            setImagePreview(null);
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            setFileError('File size must be less than 5 MB.');
            setImage(null);
            setImagePreview(null);
            return;
        }

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            setFileError('Please select a valid image file.');
            setImage(null);
            setImagePreview(null);
            return;
        }

        setIsCropping(true);
        setFileError('');

        try {
            // Create temporary preview for original image
            const tempPreviewUrl = URL.createObjectURL(file);
            setImagePreview(tempPreviewUrl);

            // Crop image to 16:9 ratio
            const result = await cropImageTo16x5(file);
            
            // Check cropped file size
            if (result.file.size > MAX_FILE_SIZE) {
                setFileError('Cropped image size exceeds 5 MB limit. Please try with a smaller image.');
                setImage(null);
                setImagePreview(null);
                // Clean up temporary URL
                URL.revokeObjectURL(tempPreviewUrl);
            } else {
                setImage(result.file);
                setImagePreview(result.previewUrl);
                setFileError('');
                // Clean up temporary URL since we have the cropped preview
                URL.revokeObjectURL(tempPreviewUrl);
            }
        } catch (error) {
            console.error('Error cropping image:', error);
            setFileError('Failed to process image. Please try another image.');
            setImage(null);
            setImagePreview(null);
        } finally {
            setIsCropping(false);
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
        setFileError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resetState = useCallback(() => {
        setTitle('');
        setDescription('');
        setImage(null);
        setImagePreview(null);
        setExpiresIn(undefined);
        setFileError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>Title is required.</span>
                    </div>
                ),
            })
            return;
        }

        // Check file size before submission (final check)
        if (image && image.size > MAX_FILE_SIZE) {
            setFileError('File size must be less than 5 MB.');
            return;
        }

        setLoading(true);

        try {
            const announcements = [{ title: title.trim() }];
            const expiresAt = expiresIn ? format(expiresIn, 'yyyy-MM-dd') : null;
            const desc = description.trim();

            const formData = new FormData();

            formData.append('announcements', JSON.stringify(announcements));
            formData.append('description', desc);
            formData.append('expiresAt', expiresAt);

            if (image) {
                formData.append('images', image);
            }

            console.log('--- Create Announcement Submit Output (Console Log) ---');
            console.log('Announcements:', JSON.stringify(announcements, null, 2));
            console.log('Description:', desc);
            console.log('Expires At:', expiresAt);
            console.log('Image File Object (16:5 Cropped):', image);
            console.log('Image Size:', image ? `${(image.size / 1024 / 1024).toFixed(2)} MB` : 'No image');

            console.log('FormData Contents:');
            for (let pair of formData.entries()) {
                if (pair[1] instanceof File) {
                    console.log(`- FormData: ${pair[0]} = [File] ${pair[1].name} (${pair[1].type}, ${(pair[1].size / 1024 / 1024).toFixed(2)} MB)`);
                } else {
                    console.log(`- FormData: ${pair[0]} = ${pair[1]}`);
                }
            }
            console.log('-----------------------------------------------------------');

            const res = await Announcements_Apis.createAnnouncement(formData);
            console.log('API Response:', res)
            
            if(res.success){
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                            <span>Announcement created successfully.</span>
                        </div>
                    ),
                })
                if (typeof refresh === 'function') {
                    refresh();
                }
                setOpen(false);
                resetState();
            } else {
                toast({
                    title: (
                        <div className='flex gap-2 items-center'>
                            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                            <span>{res?.error || "Announcement creation failed."}</span>
                        </div>
                    ),
                })
                console.error('Error creating announcement:', res.error);
            }
        } catch (err) {
            toast({
                title: (
                    <div className='flex gap-2 items-center'>
                        <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                        <span>Unexpected error occurred.</span>
                    </div>
                ),
            })
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleDialogOpenChange = (isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
            resetState();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className='h-4 w-4 mr-2' />
                    Create Announcement
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-md max-h-[90%] overflow-scroll">
                <DialogHeader>
                    <DialogTitle>Create New Announcement</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Title Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="title-input">Title <span className="text-red-500">*</span></Label>
                        <Input
                            id="title-input"
                            type="text"
                            placeholder="e.g. System Maintenance Scheduled"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Description Textarea */}
                    <div className="grid gap-2">
                        <Label htmlFor="desc-input">Description </Label>
                        <Textarea
                            id="desc-input"
                            placeholder="Provide a short description..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            disabled={loading}
                        />
                    </div>

                    {/* Expires In Date Picker */}
                    <div className="grid gap-2">
                        <Label htmlFor="expires-date">Expires On *</Label>
                        <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                            <PopoverTrigger asChild>
                                <Button
                                    id="expires-date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !expiresIn && "text-muted-foreground"
                                    )}
                                    disabled={loading}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiresIn ? format(expiresIn, "PPP") : <span>Pick a future date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={expiresIn}
                                    onSelect={(date) => handleDateSelect(date)}
                                    disabled={(date) => date < today || loading}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Image File Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="image-input">Image *</Label>
                        <Input
                            id="image-input"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                            disabled={loading || isCropping}
                            required={true}
                        />
                        <div className="text-xs text-muted-foreground">
                            {isCropping ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-3 w-3" />
                                    Cropping image to 16:5 ratio...
                                </span>
                            ) : (
                                "Image will be automatically cropped to 16:5 ratio (max 5MB)"
                            )}
                        </div>
                        {fileError && (
                            <span className="text-sm text-red-500">{fileError}</span>
                        )}
                        {image && !fileError && !isCropping && (
                            <span className="text-sm text-green-600">
                                ✓ Image ready (16:5 ratio, {(image.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                        )}
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="relative border rounded-lg p-2 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <Label className="text-sm font-medium">Preview (16:5 Ratio)</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={removeImage}
                                    disabled={loading || isCropping}
                                    className="h-6 w-6 p-0 hover:bg-red-100"
                                >
                                    <X className="h-3 w-3 text-red-500" />
                                </Button>
                            </div>
                            <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-md overflow-hidden border">
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="mt-2 text-xs text-center text-muted-foreground">
                                This is how your image will appear (cropped to 16:5)
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter className="pt-2">
                        <Button type="submit" disabled={loading || isCropping}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Creating...
                                </span>
                            ) : (
                                "Create Announcement"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateAnnouncements