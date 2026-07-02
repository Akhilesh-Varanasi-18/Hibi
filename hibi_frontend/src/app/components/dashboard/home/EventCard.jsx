"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ColorOpacityChange } from "@/utils/CustomColorPalettes";


const EventCard = ({ icon, title, desc, color = "#0B7B4B", highlight = false }) => {
  // Highlighted style
  const cardStyle = highlight
    ? {
        background: ColorOpacityChange(color, 0.13),
        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
        transition: "all 0.2s ease",
      }
    : {
        background: "var(--card, #f6f6f6)",
        transition: "all 0.2s ease",
      };

  const badgeStyle = {
    background: color,
    color: "#fff",
    fontSize: 10,
    padding: "0 6px",
    borderRadius: 6,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  };

  return (
    <Card className="w-full rounded-lg hover:shadow-md" style={cardStyle}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {icon && <div style={{ color }}>{icon}</div>}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm text-foreground/90 capitalize">
                {title?.toLowerCase()}
              </h3>
              {highlight && (
                <Badge style={badgeStyle} className="text-[10px] px-1 py-0 border-0 shadow-none">
                  Today
                </Badge>
              )}
            </div>
            <p className="text-xs text-foreground/60 capitalize">{desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
