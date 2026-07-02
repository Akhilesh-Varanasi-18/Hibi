"use client"
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Banknote, CreditCard, Edit, Plus, FileText, Download } from 'lucide-react';
import ProfileAPi from '@/Apis/Profile_Api';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from 'react-icons/ti';
import { RxCross2 } from 'react-icons/rx';
import { BankDetailsDialog } from './Dialogues/bankDetailsDialog';

export default function BankDetails() {
    const [data, setBankDetails] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [loader, setLoader] = useState(false);
    const { toast } = useToast();

    // Fetch bank details on mount
    useEffect(() => {
        fetchBankDetails();
    }, []);

    async function fetchBankDetails() {
        const response = await ProfileAPi.getbankDetails();
        if (response.success && response.data) {
            setBankDetails(response?.data?.bankDetails || {});
        }
    }

    const handleSaveBankDetails = async (formData, selectedFile) => {
        setLoader(true);

        if (data?._id) {
            await updateBankDetails(formData, selectedFile);
        } else {
            await addBankDetails(formData, selectedFile);
        }
    };

    const addBankDetails = async (formData, selectedFile) => {
        const formDataToSend = new FormData();
        formDataToSend.append("bankName", formData.bankName);
        formDataToSend.append("accountHolderName", formData.accountHolderName);
        formDataToSend.append("accountNumber", formData.accountNumber);
        formDataToSend.append("ifscCode", formData.ifscCode);

        if (selectedFile) {
            formDataToSend.append("bankPassBookFile", selectedFile);
        }

        const response = await ProfileAPi.AddBankDetails(formDataToSend);
        if (response.success) {
            setIsEditing(false);
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                    <span>{response?.data?.message}</span>
                </div>,
            })
            await fetchBankDetails();
        } else {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>{response?.error}</span>
                </div>,
            })
        }
        setLoader(false);
    };

    const updateBankDetails = async (formData, selectedFile) => {
        const formDataToSend = new FormData();
        formDataToSend.append("bankName", formData.bankName);
        formDataToSend.append("accountHolderName", formData.accountHolderName);
        formDataToSend.append("accountNumber", formData.accountNumber);
        formDataToSend.append("ifscCode", formData.ifscCode);

        if (selectedFile) {
            formDataToSend.append("bankPassBookFile", selectedFile);
        }

        const response = await ProfileAPi.updateBankDetails(formDataToSend);
        if (response.success) {
            setIsEditing(false);
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div>
                    <span>{response?.data?.message}</span>
                </div>,
            })
            fetchBankDetails();
        } else {
            toast({
                title: <div className='flex gap-2 items-center'>
                    <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div>
                    <span>{response?.error}</span>
                </div>,
            })
        }
        setLoader(false);
    };

    const handleDownloadPassbook = () => {
        if (data.bankPassBookUrl) {
            const link = document.createElement('a');
            link.href = data.bankPassBookUrl;
            link.target = '_blank';
            link.download = `passbook_${data.bankName}_${data.accountNumber?.slice(-4)}`;
            link.click();
        }
    };

    const hasBankData = data && Object.keys(data).length !== 0;

    return (
        <Card className="bg-neutral-50 dark:bg-neutral-950">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                        <Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Bank Details</CardTitle>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setIsEditing(true)}
                >
                    {hasBankData ? (
                        <>
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                        </>
                    ) : (
                        <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Details</span>
                        </>
                    )}
                </Button>
            </CardHeader>

            {/* Dialog Component */}
            <BankDetailsDialog
                open={isEditing}
                onOpenChange={setIsEditing}
                data={data}
                onSave={handleSaveBankDetails}
                isLoading={loader}
            />

            {/* Bank Details Display */}
            {hasBankData ? (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                        <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                            <Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-medium text-muted-foreground">Bank Information</h3>
                            <p className="font-medium">{data.bankName}</p>
                            <p className="text-sm text-muted-foreground">
                                {data.accountHolderName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                        <div className="p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/20">
                            <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-medium text-muted-foreground">Account Details</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm">Account:</span>
                                    <Badge variant="secondary" className="px-2 py-0.5 text-xs font-mono">
                                        {data?.accountNumber}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm">IFSC:</span>
                                    <Badge variant="secondary" className="px-2 py-0.5 text-xs font-mono">
                                        {data.ifscCode}
                                    </Badge>
                                </div>
                            </div>
                            {data.bankPassBookUrl && (
                                <div className="flex items-center gap-2 mt-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={handleDownloadPassbook}
                                        className="h-auto p-0 text-sm"
                                    >
                                        View Passbook
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            ) : (
                <CardContent className="text-center p-6">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-full bg-muted/30">
                            <CreditCard className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No bank details added yet</p>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}