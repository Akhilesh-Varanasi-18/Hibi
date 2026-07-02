"use client"
import React, { useContext, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import SinglePendingBox from './SinglePendingBox';
import WFHTakeActionWithInlineDialogs from './WFHTakeAction';
import { CommonDataContext } from '@/app/dashboard/context/CommonDataContext';
import { CustomActionDialog } from '@/app/components/ReusableComponents/CustomActionDialog';
import { ApproveConfig, EscalateConfig, RejectConfig } from '@/utils/ProcessRequestsConfig';
import { useToast } from '@/hooks/use-toast';
import { TiTick } from 'react-icons/ti';
import { RxCross2 } from 'react-icons/rx';
import permissionsAPI from '@/Apis/Permissions_APIs';
import WFHApis from '@/Apis/WFHApis';
import { FilterStatusTypesForCEOandCOO, FilterStatusTypesForProcessing } from '@/utils/FilterStatusTypes';

// shows list of pending approvals (permissions + WFH)
const PendingParent = ({ data, refresh, wfhData, hideEscalated }) => {
  const { statusTypes } = useContext(CommonDataContext);
  const [openProcessRequestDialog, setOpenProcessRequestDialog] = useState(false);
  const [config, setConfig] = useState(null);
  const { toast } = useToast();

  // open approve/reject/escalate dialog
  const handleProcessRequestDialogOpen = async (statusLabel, statusId, requestId, isWFH) => {
    setConfig(getConfigData(statusLabel, statusId, requestId, isWFH));
    setOpenProcessRequestDialog(true);
  }

  // this sets up dialog config for action types and target request
  const getConfigData = (type, statusId, requestId, isWFH) => {
    let config;
    if (type === "ACCEPTED") {
      config = ApproveConfig;
    } else if (type === "ESCALATED") {
      config = EscalateConfig;
    } else if (type === "REJECTED") {
      config = RejectConfig;
    } else {
      config = {};
    }
    // attach correct extra values and handler
    if (isWFH) {
      config.ExtraValues = { wfhRequestId: requestId, statusId };
      config.onSubmit = HandleProcessWFH;
    } else {
      config.ExtraValues = { permissionRequestId: requestId, statusId };
      config.onSubmit = HandleProcessRequest;
    }
    return config;
  }

  // processes regular permission request (approve/reject/etc)
  const HandleProcessRequest = async (data) => {
    const res = await permissionsAPI.processPermissionRequest(data);
    if (res.success) {
      refresh();
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-green-500 rounded-full text-lg">
              <TiTick />
            </div>
            <span>{res?.message || "Request Processed Successfully"}</span>
          </div>
        ),
      });
      setOpenProcessRequestDialog(false);
    } else {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg ">
              <RxCross2 />
            </div>
            <span>{res?.error}</span>
          </div>
        ),
      });
    }
  }

  // processes WFH type request
  const HandleProcessWFH = async (data) => {
    const res = await WFHApis.ProcessWFHRequest(data);
    if (res.success) {
      refresh();
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-green-500 rounded-full text-lg">
              <TiTick />
            </div>
            <span>{res?.message || "Request Processed Successfully"}</span>
          </div>
        ),
      });
      setOpenProcessRequestDialog(false);
    } else {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg ">
              <RxCross2 />
            </div>
            <span>{res?.error}</span>
          </div>
        ),
      });
    }
  }

  return (
    <Card className="md:col-span-2 w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Pending Approvals
        </CardTitle>
        <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
          {data.length + wfhData?.length} requests awaiting your action
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {/* nothing to take action on */}
        {data.length === 0 && (!wfhData || wfhData.length === 0) ? (
          <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-6">
            No pending approvals.
          </div>
        ) : (
          <>
            {/* show normal pending requests */}
            {data.map((item, i) => (
              <SinglePendingBox
                refresh={refresh}
                item={item}
                key={`pending-${i}`}
                statusTypes={hideEscalated ? FilterStatusTypesForCEOandCOO(statusTypes) : FilterStatusTypesForProcessing(statusTypes)}
                onOpenDialog={handleProcessRequestDialogOpen}
              />
            ))}
            {/* show WFH pending requests */}
            {wfhData && wfhData.map((wfhItem, j) => (
              <WFHTakeActionWithInlineDialogs
                key={`wfh-${j}`}
                item={wfhItem}
                refresh={refresh}
                statusTypes={hideEscalated ? FilterStatusTypesForCEOandCOO(statusTypes) : FilterStatusTypesForProcessing(statusTypes)}
                onOpenDialog={handleProcessRequestDialogOpen}
              />
            ))}
          </>
        )}
      </CardContent>
      {/* dialog for requesting approve/reject/etc */}
      {config && (
        <CustomActionDialog
          open={openProcessRequestDialog}
          setOpen={setOpenProcessRequestDialog}
          config={config}
        />
      )}
    </Card>
  );
}

export default PendingParent