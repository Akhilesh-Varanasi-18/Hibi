"use client";
/**
 * CreateOrganizationDialog.jsx
 * 
 * This component provides a dialog/modal for creating a new organization.
 * It allows the user to add an organization either automatically (using GST verification)
 * or manually (by entering details directly).
 * 
 * Main Features:
 * - Uses shadcn/ui Dialog for modal behavior.
 * - Uses react-hook-form for form state management.
 * - Provides two modes: "Auto (GST)" and "Manual", switchable via tabs.
 * - Resets form state when dialog is closed.
 * - Passes form and dialog state to child components for handling submission.
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import AutoAddComponent from './AutoAddForm';
import ManualAddComponent from './ManualAddForm';

/**
 * Dialog component for creating a new organization.
 * 
 * Props:
 * - onSuccess: callback when organization is successfully created (not used directly here, but can be passed to children)
 * - refresh: callback to refresh parent data after creation
 */
export function CreateOrganizationDialog({ onSuccess, refresh }) {
  // Initialize react-hook-form with default values for the organization fields.
  const form = useForm({
    defaultValues: {
      mode: "auto",      // "auto" (GST) or "manual"
      gstNumber: "",
      name: "",
      address: "",
      status: "",
      regDate: ""
    }
  });

  // Destructure helpers from form
  const { reset, setValue, watch } = form;

  // State to control dialog open/close
  const [open, setOpen] = useState(false);

  // State to indicate if organization creation is in progress (used for loading UI)
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Watch the current mode ("auto" or "manual") to control which tab is active
  const mode = watch("mode");

  /**
   * Effect: Reset the form fields to default values whenever the dialog is closed.
   * This ensures a fresh form each time the dialog is opened.
   */
  useEffect(() => {
    if (!open) {
      reset({
        mode: "auto",
        gstNumber: "",
        name: "",
        address: "",
        status: "",
        regDate: ""
      });
    }
  }, [open, reset]);

  /**
   * Handler to close the dialog.
   * Passed to child components so they can close the dialog after successful creation.
   */
  const handleCloseDialog = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Button to open the dialog */}
      <DialogTrigger asChild>
        <Button className="h-8 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Organization</span>
        </Button>
      </DialogTrigger>

      {/* Dialog content: form for creating organization */}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Add a new organization manually or automatically using GST verification.
          </DialogDescription>
        </DialogHeader>

        {/* Form context provided to child components */}
        <Form {...form}>
          {/* Tabs to switch between Auto (GST) and Manual modes */}
          <Tabs 
            defaultValue="auto" 
            value={mode} 
            onValueChange={(value) => setValue("mode", value)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Auto (GST)</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            
            {/* Auto (GST) mode: uses AutoAddComponent */}
            <TabsContent value="auto" className="mt-4">
              <AutoAddComponent 
                form={form}
                refresh={refresh}
                creatingOrg={creatingOrg}
                setCreatingOrg={setCreatingOrg}
                handleCloseDialog={handleCloseDialog}
              />
            </TabsContent>
            
            {/* Manual mode: uses ManualAddComponent */}
            <TabsContent value="manual" className="mt-4">
              <ManualAddComponent 
                form={form}
                refresh={refresh}
                creatingOrg={creatingOrg}
                setCreatingOrg={setCreatingOrg}
                handleCloseDialog={handleCloseDialog}
              />
            </TabsContent>
          </Tabs>
        </Form>
        
        {/* DialogFooter is present for layout consistency, but empty here */}
        <DialogFooter className="sm:justify-start">
          {/* (No footer buttons; actions are handled in child components) */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateOrganizationDialog;