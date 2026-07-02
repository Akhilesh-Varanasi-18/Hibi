"use client";
/**
 * AutoAddComponent.jsx
 * 
 * This component provides a form for automatically adding an organization by verifying its GST number.
 * 
 * Main Features:
 * - Allows user to input a GST number and verify it via an external API.
 * - On successful verification, auto-fills organization details (name, address, status, regDate) from GST data.
 * - Displays GST details for user confirmation.
 * - Allows user to submit the form to create the organization.
 * - Shows loading and error states for GST verification and organization creation.
 * - Uses react-hook-form for form state management and validation.
 * - Uses shadcn/ui components for UI consistency.
 */

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from 'lucide-react';
import OrganizationApi from '@/Apis/Organization_Management';
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage
} from "@/components/ui/form";

/**
 * AutoAddComponent
 * 
 * @param {object} props
 *   - form: react-hook-form instance for managing form state
 *   - refresh: callback to refresh parent data after successful creation
 *   - creatingOrg: boolean indicating if organization creation is in progress
 *   - setCreatingOrg: function to set creatingOrg state
 *   - handleCloseDialog: function to close the dialog/modal
 */
function AutoAddComponent({ form, refresh, creatingOrg, setCreatingOrg, handleCloseDialog }) {
    // Destructure helpers from react-hook-form
    const { control, setError, clearErrors, getValues, setValue } = form;
    // Toast for notifications
    const { toast } = useToast();

    // Local state for GST verification and data
    const [loadingGST, setLoadingGST] = useState(false);      // Loading state for GST verification
    const [gstData, setGstData] = useState(null);             // Holds GST details after verification
    const [gstVerified, setGstVerified] = useState(false);    // Whether GST is verified
    const [autoGstError, setAutoGstError] = useState("");     // Error message for GST verification

    /**
     * Checks if the GST data object is valid and contains required fields.
     * @param {object|null} data - GST API response data
     * @returns {boolean} - true if valid, false otherwise
     */
    const isValidGstData = (data) => {
        return (
            data && typeof data === "object" &&
            typeof data.tradeNam === "string" &&
            data.tradeNam.trim().length > 0
        );
    };

    /**
     * Fetches GST details from the backend API and updates form fields if valid.
     * Handles loading, error, and success states.
     * @param {string} gstin - GST identification number (should be 15 characters)
     */
    const fetchGSTDetails = async (gstin) => {
        try {
            setLoadingGST(true);         // Start loading spinner
            setGstData(null);            // Reset previous GST data
            setGstVerified(false);       // Reset verified state
            clearErrors("gstNumber");    // Clear previous errors
            setAutoGstError("");         // Clear error message

            // Validate GSTIN length
            if (typeof gstin !== "string" || gstin.length !== 15) {
                setError("gstNumber", { message: "GST Number must be 15 characters" });
                setAutoGstError("GST Number must be 15 characters");
                setLoadingGST(false);
                return;
            }

            // Call backend API to verify GST
            const result = await OrganizationApi.GstChecking(gstin);

            // Check if API response is valid and GST data is present
            if (
                result &&
                typeof result === "object" &&
                result.data &&
                typeof result.data === "object" &&
                result.data.flag === true &&
                isValidGstData(result.data.data)
            ) {
                // Extract GST data object
                const gstObj = result.data.data;
                setGstData(gstObj);          // Save GST data to state
                setGstVerified(true);        // Mark as verified
                clearErrors("gstNumber");    // Clear any GST errors
                setAutoGstError("");         // Clear error message

                // Auto-fill form fields with GST data
                setValue("name", typeof gstObj.tradeNam === "string" ? gstObj.tradeNam : "");
                setValue(
                    "address",
                    gstObj.pradr && typeof gstObj.pradr === "object" && typeof gstObj.pradr.adr === "string"
                        ? gstObj.pradr.adr
                        : ""
                );
                setValue("status", typeof gstObj.sts === "string" ? gstObj.sts : "");
                setValue("regDate", typeof gstObj.rgdt === "string" ? gstObj.rgdt : "");
            } else {
                // Invalid GST or not found
                setError("gstNumber", { message: "Invalid GST Number" });
                setAutoGstError("Invalid GST Number");
            }
        } catch (err) {
            // API/network error
            setError("gstNumber", { message: "Failed to verify GST" });
            setAutoGstError("Failed to verify GST");
        } finally {
            setLoadingGST(false);    // Stop loading spinner
        }
    };

    /**
     * Handles the submission of the auto-add form.
     * Prepares payload from form values and calls backend API to create organization.
     * Shows toast notifications for success or failure.
     */
    const handleAutoSubmit = async () => {
        // Get all form values
        const formData = form.getValues();

        // Prepare payload for API
        const payload = {
            gstNumber: typeof formData.gstNumber === "string" ? formData.gstNumber : "",
            name: typeof formData.name === "string" ? formData.name : "",
            address: typeof formData.address === "string" ? formData.address : "",
            status: typeof formData.status === "string" ? formData.status : "",
            regDate: typeof formData.regDate === "string" ? formData.regDate : "",
            organizationEmail: typeof formData.organizationEmail === "string" ? formData.organizationEmail : "",
            organizationAppPassword: typeof formData.organizationAppPassword === "string" ? formData.organizationAppPassword : "",
        };

        setCreatingOrg(true); // Set loading state for organization creation
        try {
            // Call backend API to create organization
            const data = await OrganizationApi.createOrganization(payload);
            if (data && data.success) {
                // On success: close dialog, show success toast, refresh parent data
                handleCloseDialog();
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-green-500 rounded-full text-lg">
                                <TiTick />
                            </div>
                            <span>{data?.message || "Organization created successfully"}</span>
                        </div>
                    ),
                });
                refresh();
            } else {
                // On failure: show error toast
                toast({
                    title: (
                        <div className="flex gap-2 items-center">
                            <div className="text-white bg-red-500 rounded-full text-lg">
                                <RxCross2 />
                            </div>
                            <span>{(data && data.error) || "Organization creation failed"}</span>
                        </div>
                    ),
                });
            }
        } catch (err) {
            // Optionally log error (not shown to user)
        } finally {
            setCreatingOrg(false); // Reset loading state
        }
    };

    return (
        <div className="space-y-4">
            {/* GST Verification Field */}
            <FormField
                control={control}
                name="gstNumber"
                rules={{
                    pattern: {
                        value: /^[0-9A-Z]{15}$/,
                        message: "Invalid GST format",
                    },
                }}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs sm:text-sm" htmlFor="gstNumber">
                            GST Number
                        </FormLabel>
                        <div className="flex gap-2">
                            <FormControl>
                                <Input
                                    id="gstNumber"
                                    {...field}
                                    placeholder="07AAPCA6346P1ZX"
                                    className="h-8 text-xs sm:h-10 sm:text-sm"
                                    autoComplete="off"
                                />
                            </FormControl>
                            {/* Button to trigger GST verification */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const gstin = getValues("gstNumber");
                                    if (typeof gstin === "string" && gstin.length === 15) {
                                        fetchGSTDetails(gstin);
                                    } else {
                                        setAutoGstError("GST Number must be 15 characters");
                                        setError("gstNumber", { message: "GST Number must be 15 characters" });
                                    }
                                }}
                                disabled={
                                    loadingGST ||
                                    gstVerified ||
                                    creatingOrg ||
                                    typeof getValues("gstNumber") !== "string" ||
                                    getValues("gstNumber").length !== 15
                                }
                                className="h-8 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm"
                            >
                                {/* Button content changes based on loading/verified state */}
                                {loadingGST ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-1" />
                                        Verifying...
                                    </>
                                ) : gstVerified ? (
                                    <span className="flex items-center gap-1">
                                        <Check className="h-4 w-4 text-white bg-green-600 rounded-full p-1" />
                                        <span className="hidden xs:inline">Verified</span>
                                    </span>
                                ) : (
                                    "Verify"
                                )}
                            </Button>
                        </div>
                        {/* Show error message if GST verification fails */}
                        {autoGstError && (
                            <FormMessage>
                                <span className="text-xs sm:text-sm text-red-500 mt-1">
                                    {autoGstError}
                                </span>
                            </FormMessage>
                        )}
                    </FormItem>
                )}
            />

            {/* Organization Email Field */}
            <FormField
                control={control}
                name="organizationEmail"
                rules={{
                    required: "Organization email is required",
                    pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email address",
                    },
                }}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs sm:text-sm" htmlFor="organizationEmail">
                            Organization Email
                        </FormLabel>
                        <FormControl>
                            <Input
                                id="organizationEmail"
                                {...field}
                                placeholder="Enter organization email"
                                className="h-8 text-xs sm:h-10 sm:text-sm"
                                autoComplete="off"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Organization App Password Field */}
            <FormField
                control={control}
                name="organizationAppPassword"
                rules={{
                    required: "App password is required",
                }}
                defaultValue="jygb szag gxwz nmti"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs sm:text-sm" htmlFor="organizationAppPassword">
                            Organization App Password
                        </FormLabel>
                        <FormControl>
                            <Input
                                id="organizationAppPassword"
                                {...field}
                                placeholder="Enter app password"
                                className="h-8 text-xs sm:h-10 sm:text-sm"
                                autoComplete="off"
                                type="text"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* GST Details Display (shown only if GST is valid and verified) */}
            {isValidGstData(gstData) && (
                <div className="p-2 sm:p-3 border rounded-md bg-muted">
                    <h4 className="font-semibold text-sm sm:text-base">
                        {typeof gstData.tradeNam === "string" ? gstData.tradeNam : ""}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        {(gstData.pradr && typeof gstData.pradr === "object" && typeof gstData.pradr.adr === "string")
                            ? gstData.pradr.adr
                            : ""}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                        Status: {typeof gstData.sts === "string" ? gstData.sts : ""}
                    </p>
                </div>
            )}

            {/* Action Buttons: Cancel and Create Organization */}
            <div className='flex items-center gap-4 justify-end w-full'>
                {/* Cancel button closes the dialog */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                >
                    Cancel
                </Button>
                {/* Create Organization button, enabled only if GST is verified and not loading */}
                <Button
                    type="button"
                    onClick={handleAutoSubmit}
                    className="h-8 px-3 flex items-center gap-2"
                    disabled={creatingOrg || !gstVerified}
                >
                    {creatingOrg ? (
                        <>
                            <Loader2 className="animate-spin h-4 w-4" />
                            <span>Creating Organization...</span>
                        </>
                    ) : (
                        "Create Organization"
                    )}
                </Button>
            </div>
        </div>
    );
}

export default AutoAddComponent;