"use client";
import React, { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis } from "recharts";

import BarChartComponent from "../../ReusableComponents/BarChartComponent";
import { statusConfig } from "./dummyChartData";
import { showToast } from "@/lib/ToastService";
import { UsersContext } from "@/app/context/UserContext";
import { defaultColorPalettes } from "@/app/ColorPalettes";
import { AssetsAPI } from "@/Apis/AssetsApi";

// for palette color customization, listing fields
const paletteFields = [
  { key: "mainColor", label: "Button Main Color" },
  { key: "graphBg", label: "Main Graphs Color" },
  { key: "graphPresent", label: "Graph Present Color" },
  { key: "graphAbsent", label: "Graph Absent Color" },
  { key: "graphLeave", label: "Graph Leave Color" },
  { key: "graphPermission", label: "Graph Permission Color" },
  { key: "graphWFH", label: "Graph Work From Home (WFH) Color" },
  { key: "textOnMainColor", label: "Text on Button Color" },
  { key: "todayHolidayColor", label: "Today's Holiday Color" },
  { key: "todayBirthdayColor", label: "Today's Birthday Color" },
];

// some fake counts for demo purpose for our BarChartComponent
const dummyBarChartCounts = {
  present: 45,
  absent: 10,
  leave: 6,
  permission: 5,
  wfh: 15,
};

function mergePalette(initial) {
  // making sure we fill all color keys, with fallback to default colors
  return { ...defaultColorPalettes, ...(typeof initial === "object" && initial !== null ? initial : {}) };
}

// bar graph extra demo data, for preview
const simpleBarChartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

export default function ThemeStudio() {
  const { user, colorPalettesFromBackend, setColorPalettesFromBackend } = useContext(UsersContext);

  // -> getting initial colors and showing them
  const orgPaletteRaw = colorPalettesFromBackend || user?.orgId?.colorpalette;
  let orgPaletteParsed;
  if (!orgPaletteRaw) {
    orgPaletteParsed = { ...defaultColorPalettes };
  } else if (typeof orgPaletteRaw === "string") {
    try {
      orgPaletteParsed = mergePalette(JSON.parse(orgPaletteRaw));
    } catch {
      orgPaletteParsed = { ...defaultColorPalettes };
    }
  } else {
    orgPaletteParsed = mergePalette(orgPaletteRaw);
  }

  // creating local state to edit and show colors live
  const [palette, setPalette] = useState(orgPaletteParsed);

  // update palette when organization palette changes (on user/org switch)
  useEffect(() => {
    setPalette(orgPaletteParsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.orgId?.colorPalette, user?.orgId?.colorpalette]);

  // total headcount for stats
  const total =
    Object.values(dummyBarChartCounts).reduce((sum, v) => sum + Number(v), 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPalette((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -> after push to database , updating locally inorder to avoid page refresh or unwanted API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("colorPalette", JSON.stringify(palette)); // using current edited palette for API
    console.log(palette);
    try {
      const res = await AssetsAPI.UpdateAssets(formData);
      if (res?.success) {
        showToast(res?.message || "Console logged successfully", "success");
        setColorPalettesFromBackend(palette)
      }
    } catch (error) {
      showToast("Failed to update color palette.", "error");
    }
  };

  // build bar status config with latest colors
  const statusConfigWithColors = statusConfig.map((status) => ({
    ...status,
    barColor: palette[status.colorKey] || status.defaultColor,
  }));

  const dummyData = { ...dummyBarChartCounts, totalEmployees: total };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-10 gap-10 items-start justify-center">
      {/* left: pick and edit color theme, see preview instantly */}
      <motion.div
        className="w-full lg:w-1/3 flex items-center"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="w-full bg-transparent border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Theme Studio 🎨</CardTitle>
            <CardDescription>
              Change your Organization palette . 
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-wrap gap-4">
                {paletteFields.map((field) => (
                  <div key={field.key} className="flex flex-col items-center w-52">
                    <Input
                      id={field.key}
                      type="color"
                      name={field.key}
                      value={palette?.[field.key] || "#cccccc"}
                      className="w-8 h-8 bg-transparent border-none p-0 mb-1"
                      style={{ minWidth: 32, minHeight: 32, maxWidth: 32, maxHeight: 32 }}
                      onChange={handleChange}
                    />
                    <Label
                      className="text-xs text-center"
                      htmlFor={field.key}
                      style={{
                        maxWidth: "180px",
                        whiteSpace: "normal",
                        overflow: "visible",
                        textOverflow: "clip",
                        wordBreak: "break-word",
                        lineHeight: 1.2,
                      }}
                    >
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
              <Button
                type="submit"
                className="mt-4 px-6 py-2 rounded-lg text-base font-semibold bg-primary"
              >
                Save Palette
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* right: live preview - button and charts with picked theme */}
      <motion.div
        className="w-full lg:w-2/3 flex flex-col justify-center items-start gap-10"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="w-full flex flex-col items-center gap-5">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Live Preview 👇</CardTitle>
          </CardHeader>
          <CardContent className="w-full flex flex-col items-center gap-8">
            <div className="w-full flex flex-col gap-4">
              {/* button preview with your current color settings */}
              <Button
                style={{
                  backgroundColor: palette?.mainColor || "#267C57",
                  color: palette?.textOnMainColor || "#ffffff",
                  transition: "all 0.3s ease",
                }}
                className="px-8 py-3 rounded-xl text-lg font-medium shadow-md hover:scale-105"
              >
                Preview Button
              </Button>

              {/* status bar chart preview */}
              <div className="w-full min-h-64">
                <h1 className="text-xl font-semibold tracking-tighter">Attendance Graph :</h1>
                <BarChartComponent
                  data={dummyData}
                  total={total}
                  statusConfig={statusConfigWithColors.reduce((acc, cur) => {
                    acc[cur.key] = cur;
                    return acc;
                  }, {})}
                  animateOnRender={true}
                />
                {/* legend for the bar chart */}
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {statusConfigWithColors.map((status) => (
                    <span className="flex items-center gap-1" key={status.key}>
                      <span
                        className="inline-block w-4 h-4 rounded"
                        style={{ background: status.barColor }}
                      />
                      <span className="text-xs">{status.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* regular bar chart preview, colored using your settings */}
              <div className="w-full flex justify-center items-center mt-2" style={{ minHeight: 210 }}>
              <h1 className="text-xl font-semibold tracking-tighter">Other Graphs :</h1>
                <BarChart
                  width={380}
                  height={210}
                  data={simpleBarChartData}
                  style={{
                    borderRadius: 12,
                    padding: 10,
                    boxSizing: "border-box",
                    width: "100%",
                    maxWidth: 440
                  }}
                >
                  <CartesianGrid vertical={false} stroke={palette?.graphBg || "#267C57"} opacity={0.1} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={() => ""}
                  />
                  <Bar dataKey="desktop" fill={palette?.graphBg || "#267C57"} radius={8} />
                </BarChart>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
