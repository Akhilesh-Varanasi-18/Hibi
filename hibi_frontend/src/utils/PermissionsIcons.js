import { Clock, AlertCircle, LogIn, LogOut, Home,  } from 'lucide-react';
import { Approved, Escalated, Pending, Rejected } from '@/components/ui/Approval';
import { cn } from '@/lib/utils';

export const getPermissionIconAndBg = (type) => {
  let icon, bg;
  if (!type) {
    icon = <Clock className="h-4 w-4 text-blue-600" />;
    bg = "bg-blue-100 dark:bg-blue-900/30";
  } else {
    switch (type.toUpperCase()) {
      case "EMERGENCY":
        icon = <AlertCircle className="h-4 w-4 text-red-600" />;
        bg = "bg-red-100 dark:bg-red-900/30";
        break;
      case "LATEIN":
        icon = <LogIn className="h-4 w-4 text-blue-600" />;
        bg = "bg-blue-100 dark:bg-blue-900/30";
        break;
      case "EARLYOUT":
        icon = <LogOut className="h-4 w-4 text-purple-600" />;
        bg = "bg-purple-100 dark:bg-purple-900/30";
        break;
      case "GENERAL":
        icon = <Clock className="h-4 w-4 text-green-600" />;
        bg = "bg-green-100 dark:bg-green-900/30";
        break;
      default:
        icon = <Clock className="h-4 w-4 text-blue-600" />;
        bg = "bg-blue-100 dark:bg-blue-900/30";
        break;
    }
  }
  return (
    <div className={cn(`flex items-center justify-center h-8 w-8 rounded-lg shadow-sm ${bg}`)}>
      {icon}
    </div>
  );
};

export const getWFHIconAndBg = () => (
  <div className="flex items-center justify-center h-8 w-8 rounded-lg shadow-sm bg-indigo-100 dark:bg-indigo-900/30">
    <Home className="h-4 w-4 text-indigo-600" />
  </div>
);
  export const getStatusComponent = s => {
    switch (s?.toUpperCase()) {
      case "ACCEPTED": return <Approved label="Accepted" />;
      case "REJECTED": return <Rejected label="Rejected" />;
      case "CANCELLED": return <Rejected label="Cancelled" />;
      case "ESCALATED": return <Escalated label="Escalated" />;
      case "PENDING": return <Pending label="Pending" />;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{s}</span>;
    }
  };