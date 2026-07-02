import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const PermissionTrends = ({ data, wfhData }) => {
  // count by type
  const typeCounts = {};
  let total = 0;
  if (Array.isArray(data)) {
    data.forEach((item) => {
      const type = item.permissionType;
      if (!type || type === "Unknown") return; // skip unknown
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      total += 1;
    });
  }

  // add WFH
  let wfhCount = Array.isArray(wfhData) ? wfhData.length : 0;
  if (wfhCount > 0) {
    typeCounts["Work From Home"] = wfhCount;
    total += wfhCount;
  }

  // make stat list
  const stats = Object.entries(typeCounts).map(([type, count]) => {
    // demo: up trend if >50%, down <20%
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    let trend = "stable";
    if (percentage > 50) trend = "up";
    else if (percentage < 20) trend = "down";
    return {
      type,
      count,
      trend,
      percentage,
    };
  });

  return (
    <Card className={" w-full"}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Permission Trends
        </CardTitle>
        <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {stats.length === 0 ? (
          <div className="text-xs text-neutral-500 dark:text-neutral-400">No data available.</div>
        ) : (
          stats.map((stat) => (
            <div key={stat.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{stat?.type?.toUpperCase()}</span>
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">{stat.count}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress
                  className=" h-2"
                  value={stat.percentage}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionTrends