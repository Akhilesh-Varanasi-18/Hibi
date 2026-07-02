"use client";
import { motion } from "framer-motion";
import React from "react";

export default function BarChartComponent({
  data,
  total,
  statusConfig,
  onBarClick,
  animateOnRender = true,
}) {
  if (!data || total === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const maxCount = Math.max(...Object.values(data).filter((val) => typeof val === "number"));

  return (
    <div className="w-full space-y-4 py-4">
      {Object.entries(statusConfig).map(([type, config]) => {
        const count = data[type] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const barPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

        const barStyle = config.barColor ? { backgroundColor: config.barColor } : {};

        return (
          <div
            key={type}
            className="flex items-center gap-4 cursor-pointer group transition-all duration-200"
            onClick={() => {
              if (onBarClick) onBarClick(type);
            }}
          >
            <div className="flex items-center gap-3 w-40 min-w-[160px]">
              <span className="text-sm font-medium whitespace-nowrap">{config.label}</span>
            </div>
            <div className="w-12 text-right">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {count}
              </span>
            </div>
            <div className="flex-1 relative">
              <div className="flex items-center h-8">
                <div className="absolute inset-0 h-8 rounded-r-lg -z-10" />
                <motion.div
                  className={`h-8 rounded-r-lg transition-all duration-500 ease-out flex items-center justify-end pr-3 group-hover:opacity-90`}
                  style={barStyle}
                  initial={animateOnRender ? { width: 0 } : false}
                  animate={{ width: `${barPercentage}%` }}
                  transition={animateOnRender ? { duration: 0.8, ease: "easeOut" } : { duration: 0 }}
                >
                  {count > 0 && barPercentage > 30 && (
                    <motion.span
                      className="text-xs font-bold text-white whitespace-nowrap"
                      initial={animateOnRender ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      transition={animateOnRender ? { delay: 0.5 } : { duration: 0 }}
                    >
                      {Math.round(percentage)}%
                    </motion.span>
                  )}
                </motion.div>
                {count > 0 && barPercentage <= 30 && (
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-2 whitespace-nowrap">
                    {Math.round(percentage)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
