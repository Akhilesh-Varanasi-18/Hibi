// "use client";
// import React from "react";
// import { RxCross2 } from "react-icons/rx";
// import { CgArrowsExchange } from "react-icons/cg";
// import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { TiTick } from "react-icons/ti";

// const ProcessRequestIcon = ({ label }) => {
//   const getConfig = () => {
//     const lowerLabel = label?.toLowerCase() || "";
    
//     if (lowerLabel === "accepted") {
//       return {
//         icon: <TiTick className="w-6 h-6" />,
//         text: "Accepted",
//         bgClass: "bg-emerald-500 text-white",
//         shadowClass: "shadow-emerald-500/50"
//       };
//     }
//     if (lowerLabel === "rejected" || lowerLabel === "cancelled") {
//       return {
//         icon: <RxCross2 className="w-6 h-6 stroke-[2.5]" />,
//         text: "Rejected / Cancelled",
//         bgClass: "bg-gradient-to-br from-rose-500 to-rose-600",
//         shadowClass: "shadow-rose-500/50"
//       };
//     }
//     if (lowerLabel === "escalated") {
//       return {
//         icon: <CgArrowsExchange className="w-6 h-6" />,
//         text: "Escalated",
//         bgClass: "bg-gradient-to-br from-indigo-500 to-indigo-600",
//         shadowClass: "shadow-indigo-500/50"
//       };
//     }
//     return {
//       icon: <IconLoader className="w-6 h-6 animate-spin" />,
//       text: "Pending",
//       bgClass: "bg-gradient-to-br from-amber-500 to-amber-600",
//       shadowClass: "shadow-amber-500/50"
//     };
//   };

//   const config = getConfig();

//   return (
//     <TooltipProvider delayDuration={200}>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <div className={`flex items-center justify-centerw-10 w-5 h-5 rounded-lg ${config.bgClass} text-white shadow-2xl ${config.shadowClass} cursor-pointer transition-all duration-300 hover:shadow-3xl hover:scale-105 hover:-translate-y-1`}>
//             {config.icon}
//           </div>
//         </TooltipTrigger>
//         <TooltipContent>
//           <p className="font-medium">{config.text}</p>
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   );
// };

// export default ProcessRequestIcon;

import React from "react";
import { Button } from "@/components/ui/button";

const ProcessRequestIcon = ({ label }) => {
  const lowerLabel = label?.toLowerCase() || "";

  let variant = "default";
  let buttonText = label;

  if (lowerLabel === "escalated") {
    variant = "outline";
    buttonText = "Escalate";
  } else if (lowerLabel === "rejected") {
    variant = "destructive";
    buttonText = "Reject";
  } else if (  lowerLabel === "cancelled") {
    variant = "destructive";
    buttonText = "cancel";
  } else if (lowerLabel === "accepted") {
    variant = "default";
    buttonText = "Accept";
  } else {
    variant = "secondary";
    buttonText = "Pending";
  }

  return (
    <Button variant={variant} className="px-4 py-2 text-xs rounded-md">
      {buttonText}
    </Button>
  );
};

export default ProcessRequestIcon;