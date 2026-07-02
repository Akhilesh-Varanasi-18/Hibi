import { payrollApis } from '@/Apis/Payroll_Apis';
import { showToast } from '@/lib/ToastService';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RefreshCcw } from 'lucide-react';

const RefreshAttendence = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);

  // Months data
  const months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' }
  ];

  // Generate years (current year and previous 5 years)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  const getDateRange = (month, year) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // Check if selected month/year is the current month/year
    const isCurrentMonth = month === currentMonth && year === currentYear;

    // Start date is always the 1st of the selected month
    const fromDate = new Date(year, month,1);
    fromDate.setDate(fromDate.getDate()+1);

    // End date: if current month, use today's date, otherwise use last day of the month
    let toDate;
    if (isCurrentMonth) {
      toDate = new Date(year, month, currentDay+1);
    } else {
      toDate = new Date(year, month + 1, 1); // Last day of the selected month
    }

    return {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      isCurrentMonth: isCurrentMonth
    };
  };

  const formatDateForDisplay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const refresh = async () => {
    setIsLoading(true);
    try {
      const dateRange = getDateRange(selectedMonth, selectedYear);
      console.log(dateRange);
      
      const res = await payrollApis.RefreshAttendence({
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
      });
      
      if (res.success) {
        showToast(res.data.message);
        setIsOpen(false);
      } else {
        showToast(res.error, "error");
      }
    } catch (error) {
      showToast("An error occurred while refreshing attendance", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const currentDateRange = getDateRange(selectedMonth, selectedYear);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><RefreshCcw /> Attendence</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Refresh Attendance</DialogTitle>
          <DialogDescription>
            Select the month and year for which you want to refresh attendance data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">
              Month
            </Label>
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-sm text-muted-foreground">
              Date Range
            </Label>
            <div className="col-span-3 text-sm">
              {formatDateForDisplay(currentDateRange.fromDate)} - {formatDateForDisplay(currentDateRange.toDate)}
              {currentDateRange.isCurrentMonth && (
                <div className="text-xs text-green-600 mt-1">
                  (Current month - using today's date as end date)
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={refresh}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Attendance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefreshAttendence;