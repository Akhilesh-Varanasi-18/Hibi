"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, X } from "lucide-react";

export default function EmployeePanel({ type, count, names, onClose, statusConfig }) {
  const config = statusConfig[type];
  const Icon = config?.icon;
  const [search, setSearch] = useState("");

  const filteredNames = names?.filter((n) => n.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 shadow-2xl border-l bg-accent"
    >
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-accent">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${config?.bgColor}`}>
            <Icon className={`h-5 w-5 ${config?.textColor}`} />
          </div>
          <div>
            <h3 className="font-semibold">{config?.label} Employees</h3>
            <p className="text-sm text-muted-foreground">{count} total</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 border-b dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-lg"
          />
        </div>
      </div>

      <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-4">
        {filteredNames?.length ? (
          <div className="space-y-2">
            {filteredNames.map((name, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800">
                  <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="font-medium">{name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="font-semibold mb-2">No employees found</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {search ? "Try another search term" : "No employees in this category today"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
