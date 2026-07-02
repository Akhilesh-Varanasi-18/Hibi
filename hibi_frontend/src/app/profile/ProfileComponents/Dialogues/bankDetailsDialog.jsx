"use client"
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from 'react-icons/ti';
import { RxCross2 } from 'react-icons/rx';

export function BankDetailsDialog({ 
  open, 
  onOpenChange, 
  data, 
  onSave,
  isLoading = false 
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData(data || {});
      setSelectedFile(null);
      setFilePreview(data?.bankPassBookUrl || null);
      setErrors({});
    }
  }, [open, data]);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.bankName?.trim()) newErrors.bankName = 'Bank name is required';
    else if (!/^[A-Za-z\s]{3,50}$/.test(formData.bankName)) newErrors.bankName="Bank name is Invalid."
    if (!formData.accountHolderName?.trim()) newErrors.accountHolderName = 'Account holder name is required';
    else if (!/^[A-Za-z\s]{3,50}$/.test(formData.accountHolderName)) newErrors.accountHolderName = 'Account holder name is Invalid'

    // Account number validation
    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{9,18}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 9-18 digits';
    }

    // IFSC code validation
    if (!formData.ifscCode) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
      newErrors.ifscCode = 'IFSC code must be 11 characters (e.g., ABCD0123456)';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/') && file.type !== 'application/pdf') {
      setErrors({ ...errors, file: 'Please upload an image or PDF file' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, file: 'File size must be less than 5MB' });
      return;
    }

    setSelectedFile(file);
    setErrors({ ...errors, file: '' });

    // Create preview for images
    if (file.type.includes('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    // If there was an existing file, mark it for removal
    if (data?.bankPassBookUrl) {
      setFormData(prev => ({ ...prev, removePassbook: true }));
    }
  };

  const handleDownloadPassbook = () => {
    if (data?.bankPassBookUrl) {
      const link = document.createElement('a');
      link.href = data.bankPassBookUrl;
      link.target = '_blank';
      link.download = `passbook_${data.bankName}_${data.accountNumber?.slice(-4)}`;
      link.click();
    }
  };

  const handleSave = () => {
    if (!isFormValid) return;
    onSave(formData, selectedFile);
  };

  const isEditMode = data?._id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditMode ? 'Edit' : 'Add'} Bank Details
          </DialogTitle>
          <DialogDescription className="text-sm">
            Update your secure banking information
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              name="bankName"
              value={formData?.bankName || ''}
              onChange={handleChange}
              className="bg-muted/50"
            />
            {errors.bankName && (
              <p className="text-sm text-red-500">{errors.bankName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account Holder *</Label>
            <Input
              id="accountHolderName"
              name="accountHolderName"
              value={formData?.accountHolderName || ''}
              onChange={handleChange}
              className="bg-muted/50"
            />
            {errors.accountHolderName && (
              <p className="text-sm text-red-500">{errors.accountHolderName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                type="text"
                inputMode="numeric"
                value={formData?.accountNumber || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                  handleChange({ target: { name: 'accountNumber', value } });
                }}
                className="bg-muted/50 font-mono"
              />
              {errors.accountNumber && (
                <p className="text-sm text-red-500">{errors.accountNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code *</Label>
              <Input
                id="ifscCode"
                name="ifscCode"
                value={formData?.ifscCode || ''}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                  handleChange({ target: { name: 'ifscCode', value } });
                }}
                className="bg-muted/50 font-mono uppercase"
              />
              {errors.ifscCode && (
                <p className="text-sm text-red-500">{errors.ifscCode}</p>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-3">
            <Label htmlFor="bankPassBookUrl">Passbook/Statement</Label>
            <div className="space-y-3">
              <Input
                id="bankPassBookUrl"
                name="bankPassBookUrl"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="bg-muted/50"
              />
              {errors.file && (
                <p className="text-sm text-red-500">{errors.file}</p>
              )}

              {/* File Preview */}
              {(filePreview || selectedFile) && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {selectedFile ? selectedFile.name : 'Current Passbook'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedFile ? selectedFile.type : 'Uploaded file'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {data?.bankPassBookUrl && !selectedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPassbook}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {filePreview && filePreview.includes('data:image') && (
                <div className="mt-2">
                  <img
                    src={filePreview}
                    alt="Passbook preview"
                    className="max-w-32 max-h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a clear image or PDF of your bank passbook or statement (Max 5MB)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto"
            disabled={!isFormValid || isLoading}
          >
            {isLoading
              ? "Saving..."
              : isEditMode
                ? "Update Details"
                : "Add Details"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}