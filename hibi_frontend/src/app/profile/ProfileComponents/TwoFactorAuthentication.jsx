"use client"
import React, { useContext, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import MFA_api from '@/Apis/twofactor'
import { UsersContext } from '../../context/UserContext'
import { useToast } from '@/hooks/use-toast'
import { TiTick } from 'react-icons/ti'
import { RxCross2 } from 'react-icons/rx'

// Import shadcn OTP component
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import CustomAlert from '../../components/ReusableComponents/CustomAlert'

const TwoFactor = () => {
  const { user } = useContext(UsersContext);
  const [isEnabled, setIsEnabled] = useState(user?.twofaInfo)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isSetupStep, setIsSetupStep] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const { toast } = useToast();

  const handle2FA = async () => {
    setIsLoading(true);

    try {
      const data = {
        enable: !isEnabled,
        otp: otp
      }

      if (otp.length !== 6) {
        toast({
          title: <div className='flex gap-2 items-center'>
            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
            <span>Please enter a valid 6-digit verification code</span>
          </div>,
        });
        setIsLoading(false);
        return;
      }

      const res = await MFA_api.toggle_2fa(data);
      
      if (res.success) {
        setIsEnabled(!isEnabled);
        setOtp('');
        setIsDialogOpen(false);
        toast({
          title: <div className='flex gap-2 items-center'>
            <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> 
            <span>{res?.message}</span>
          </div>,
        });
      } else {
        toast({
          title: <div className='flex gap-2 items-center'>
            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
            <span>{res?.error || 'Something went wrong'}</span>
          </div>,
        });
      }
    } catch (error) {
      toast({
        title: <div className='flex gap-2 items-center'>
          <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
          <span>An error occurred while updating 2FA settings</span>
        </div>,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggle2FA = async () => {
    if (!isEnabled) {
      // Enable 2FA immediately -> fetch QR code
      setIsLoading(true);
      try {
        const res = await MFA_api.toggle_2fa({ enable: true });
        if (res.setup) {
          setQrCodeDataUrl(res.data.qrCodeDataUrl);
          setIsSetupStep(true);
          setIsScanned(false);
          setOtp('');
          setIsDialogOpen(true);
        } else if (res.success) {
          setIsEnabled(true);
          toast({
            title: <div className='flex gap-2 items-center'>
              <div className='text-white bg-green-500 rounded-full text-lg'><TiTick /></div> 
              <span>{res?.message}</span>
            </div>,
          });
        }
      } catch (err) {
        toast({
          title: <div className='flex gap-2 items-center'>
            <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
            <span>An error occurred while initiating 2FA setup</span>
          </div>,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // For disabling, open dialog to collect OTP
      setIsSetupStep(false);
      setIsScanned(false);
      setQrCodeDataUrl('');
      setOtp('');
      setIsDialogOpen(true);
    }
  }

  const handleDialogConfirm = () => {
    if (otp.length !== 6) {
      toast({
        title: <div className='flex gap-2 items-center'>
          <div className='text-white bg-red-500 rounded-full text-lg'><RxCross2 /></div> 
          <span>Please enter a valid 6-digit verification code</span>
        </div>,
      });
      return;
    }
    handle2FA();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="2fa-status" className="text-base">
                Status
              </Label>
              <div className="text-sm text-muted-foreground">
                {isEnabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  Inactive
                </div>
              )}
              <Button
                variant={isEnabled ? "destructive" : "default"}
                onClick={handleToggle2FA}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Processing...
                  </>
                ) : (
                  isEnabled ? 'Disable 2FA' : 'Enable 2FA'
                )}
              </Button>
            </div>
          </div>

          {isEnabled && (
            // <Alert className="bg-green-50 border-green-200">
            //   <CheckCircle2 className="h-4 w-4 text-green-600" />
            //   <AlertDescription className="text-green-800">
            //   </AlertDescription>
            // </Alert>
            <CustomAlert text={"Your account is protected with two-factor authentication. You'll need to enter a verification code from your authenticator app when signing in."} type="normalalert"/>)}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {isSetupStep ? 'Enable Two-Factor Authentication' : 'Disable Two-Factor Authentication'}
            </DialogTitle>
            <DialogDescription>
              {isSetupStep 
                ? (isScanned ? 'Enter the verification code from your authenticator app to enable two-factor authentication.' : 'Scan the QR code with your authenticator app to set up two-factor authentication.') 
                : 'Enter the verification code from your authenticator app to disable two-factor authentication.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isSetupStep && !isScanned ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48 border rounded-lg" />
                ) : (
                  <div className="w-48 h-48 border rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
                  </div>
                )}
                <Button onClick={() => setIsScanned(true)} variant="default" className="w-full sm:w-auto mt-2">
                  I have scanned the QR code
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {(!isSetupStep || isScanned) && (
              <Button
                onClick={handleDialogConfirm}
                disabled={isLoading || otp.length !== 6}
                variant={isSetupStep ? "default" : "destructive"}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Verifying...
                  </>
                ) : (
                  isSetupStep ? 'Enable 2FA' : 'Disable 2FA'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TwoFactor