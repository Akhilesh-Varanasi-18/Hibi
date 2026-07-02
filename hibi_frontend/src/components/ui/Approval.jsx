"use client"
import React from 'react'
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { MdAccessTime } from "react-icons/md";
import { CgArrowsExchange } from "react-icons/cg";
import { Badge } from 'lucide-react';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react"

export const Approved = ({ label }) => {
  return (
    <div className='flex gap-2 items-center border px-4 py-1 rounded-lg text-xs w-28 justify-between'>
      <div className=''>
        <IconCircleCheckFilled className="w-4 h-4 fill-green-500 dark:fill-green-400" />
      </div>
      {label}
    </div>
  )
}
export const Escalated = ({ label }) => {
  return (
    <div className='flex gap-2 items-center border border-zinc-300 dark:border-zinc-800 px-4 py-1 rounded-lg text-xs w-28 justify-between'>
      <div className='text-white bg-indigo-500 rounded-full text-xs'><CgArrowsExchange /></div> {label}
    </div>
  )
}
export const Rejected = ({ label }) => {
  return (
    <div className='flex gap-2 items-center border border-zinc-300 dark:border-zinc-800 px-4 py-1 rounded-lg text-xs w-28 justify-between'>
      <div className='text-white bg-red-500 rounded-full text-xs '><RxCross2 /></div> {label}
    </div>
  )
}
export const Pending = ({ label }) => {
  return (
    <div className='flex gap-2 items-center border px-4 py-1 rounded-lg text-xs w-28 justify-between'>
      <div className=''>
        <IconLoader className="w-4 h-4" />
      </div>
      {label}
    </div>
  )
}
export const Cancelled = ({ label }) => {
  return (
    <div className='flex gap-2 items-center border border-zinc-300 dark:border-zinc-800 px-4 py-1 rounded-lg text-xs w-28 justify-between'>
      <div className='text-white bg-gray-400 rounded-full text-xs'>
        <RxCross2 />
      </div>
      {label}
    </div>
  )
}

// label should be one of: "APPROVED", "REJECTED", "ESCALATED", "CANCELLED", "PENDING"
export const StatusBadge = ({ label }) => {
  const status = label ? label.toString().toUpperCase() : "";
  switch (status) {
    case "ACCEPTED":
      case "APPROVED":
      return <Approved label={label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : label} />;
    case "REJECTED":
      return <Rejected label={label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : label} />;
    case "ESCALATED":
      return <Escalated label={label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : label} />;
    case "CANCELLED":
    case "CANCELED":
      return <Cancelled label={label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : label} />;
    case "PENDING":
      return <Pending label={label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : label} />;
    default:
      return <span className="text-xs text-muted-foreground">{label}</span>;
  }
};

