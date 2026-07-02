import { Button } from '@/components/ui/button';
import React, { useState, useRef } from 'react';

const DownloadButton = ({ employee, payrollData }) => {
    const [loader, setLoader] = useState(false);
    const iframeRef = useRef(null);

    const formatNumber = (num) => {
        return num ? num.toFixed(2) : '0.00';
    };

    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero';
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' And ' + numberToWords(num % 100) : '');
        if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
        if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
        return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
    };

    const getMonthName = (month) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1] || '';
    };

    const generateHTMLContent = () => {
        let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pay Slip - ${getMonthName(payrollData[0].month)} ${payrollData[0].year}</title>
  <style>
    @media print {
        @page {
            size: A4;
            margin: 15mm;
        }
        body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .container {
            page-break-after: always;
            page-break-inside: avoid;
        }
        .print-controls {
            display: none;
        }
    }
    
    @media screen {
        body {
            margin: 20px;
            background: #f5f5f5;
        }
        .print-controls {
            display: block;
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        .print-btn {
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .print-btn:hover {
            background: #0056b3;
        }
    }

    body {
      font-family: Arial, sans-serif;
      background: #fff;
      margin: 0;
      padding: 0;
    }

    .container {
      width: 210mm;
      margin: 20px auto;
      border: 1px solid #d1d5db;
      padding: 20px;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 10px;
      position: relative;
      margin-top: 100px;
    }

    .header img {
      width: 200px;
      height:200px;
      object-fit: contain;
      margin-bottom: 5px;
      position: absolute;
      top:-120px;
      left: 0px;
    }

    h2 {
      margin: 5px 0;
      font-size: 22px;
    }

    p {
      margin: 2px 0;
      font-size: 18px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin-top: 10px;
    }
    
    td {
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
    }

    th {
      text-align: center;
      border: 0px;
    }

    .section-title {
      font-weight: bold;
      margin-top: 15px;
      width: 45%;
      justify-content: space-between;
    }

    .totals {
      font-weight: bold;
    }

    .signature {
      text-align: left;
      margin-top: 40px;
      position: relative;
    }

    .signature img {
      width: 200px;
      height: auto;
      opacity: 0.7;
    }

    .right-align {
      text-align: right;
    }

    h3{
        text-align: left;
    }
    
    .net-salary-container {
      width: 100%; 
      display: flex; 
      justify-content: end;
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="print-btn" onclick="window.print()">🖨️ Print Payslip</button>
  </div>
`;

        payrollData.forEach((payroll, index) => {
            const payslip = payroll.paySlip;
            const monthYear = `${getMonthName(payroll.month)} - ${payroll.year}`;

            if (payslip) {
                htmlContent += `
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="https://hrms-bucket-thub.s3.ap-south-1.amazonaws.com/staging/organization/Aditya+University+Logo-01+(2).png" alt="Aditya University Logo">
      <h2>${employee.orgName || 'ADITYA UNIVERSITY'}</h2>
      <p>${employee.orgAdress || 'Aditya Nagar, ADB Road, Surampalem, E.G. Dist, A.P, 533437'}</p>
      <h3>Pay Slip for the Month of ${monthYear}</h3>
    </div>

    <!-- Employee Details -->
    <table width="100%">
      <tr>
        <td>Employee Name</td> <td> ${employee.employeeName || 'N/A'}</td>
        <td>Bank A/C No</td> <td>${employee.accountNumber || 'N/A'}</td>
      </tr>
      <tr>
        <td>Employee ID</td><td> ${employee.employeeCode || 'N/A'}</td>
        <td>Bank Name</td> <td>${employee.bankName || 'N/A'}</td>
      </tr>
      <tr>
        <td>Designation</td><td> ${employee.designation || 'N/A'}</td>
        <td>EPFO No</td><td> ${employee.pfNumber || 'N/A'}</td>
      </tr>
      <tr>
        <td>Department</td><td> ${employee.department || 'N/A'}</td>
        <td>ESIC No</td><td> ${employee.esicNumber || 'N/A'}</td>
      </tr>
    </table>

    <!-- Earnings and Deductions -->
    <table>
      <tr>
        <th colspan="2">Earnings</th>
        <th colspan="2">Deductions</th>
      </tr>
      <tr>
        <td>Basic Pay</td><td>${formatNumber(payslip.basicSalary)}</td>
        <td>Loss of Pay</td><td>${formatNumber(payslip.lossOfPay)}</td>
      </tr>
      <tr>
        <td>DA</td><td>${formatNumber(payslip.da)}</td>
        <td>Professional Tax</td><td>${formatNumber(payslip.professionalTax)}</td>
      </tr>
      <tr>
        <td>House Rent Allowance</td><td>${formatNumber(payslip.houseRentAllowance)}</td>
        <td>EPFO</td><td>${formatNumber(payslip.epf)}</td>
      </tr>
      <tr>
        <td>Others</td><td>${formatNumber(payslip.earningsOthers)}</td>
        <td>Group Insurance</td><td>${formatNumber(payslip.groupInsurance)}</td>
      </tr>
      <tr>
        <td></td><td></td>
        <td>Canteen</td><td>${formatNumber(payslip.canteen || 0)}</td>
      </tr>
      <tr>
        <td></td><td></td>
        <td>Advance</td><td>${formatNumber(payslip.advance || 0)}</td>
      </tr>
      <tr>
        <td></td><td></td>
        <td>TDS</td><td>${formatNumber(payslip.tds || 0)}</td>
      </tr>
      <tr>
        <td></td><td></td>
        <td>Contribution</td><td>${formatNumber(payslip.contribution)}</td>
      </tr>
      <tr>
        <td></td><td></td>
        <td>ESIC</td><td>${formatNumber(payslip.esic)}</td>
      </tr>
      <tr>
        <td></td><td></td>
        <td>Others</td><td>${formatNumber(payslip.deductionsOthers)}</td>
      </tr>
      <tr class="totals">
        <td>Total Earnings</td><td>${formatNumber(payslip.totalEarnings)}</td>
        <td>Total Deductions</td><td>${formatNumber(payslip.totalDeductions)}</td>
      </tr>
    </table>

    <!-- Net Salary -->
    <div class="net-salary-container">
      <p class="section-title">Net Salary: <span style="font-weight: bold; margin-left: 50%;">${formatNumber(payslip.netSalary)}</span></p>
    </div>

    <p><strong>In Words:</strong> ${numberToWords(Math.floor(payslip.netSalary))} Rupees Only</p>

    <!-- Signature -->
    <div class="signature">
      <img src="https://hrms-bucket-thub.s3.ap-south-1.amazonaws.com/staging/organization/image.jpeg" alt="Signature"/>
    </div>
  </div>
`;
            }
        });

        htmlContent += `</body></html>`;
        return htmlContent;
    };

    const cleanupIframe = () => {
        if (iframeRef.current && document.body.contains(iframeRef.current)) {
            document.body.removeChild(iframeRef.current);
            iframeRef.current = null;
        }
        setLoader(false);
    };

    const printDirectly = () => {
        // Cleanup any existing iframe first
        cleanupIframe();

        setLoader(true);

        const htmlContent = generateHTMLContent();

        // Create iframe with ref
        const iframe = document.createElement('iframe');
        iframeRef.current = iframe;

        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';

        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Wait for iframe to load completely
        iframe.onload = () => {
            // Add beforeprint and afterprint event listeners
            iframe.contentWindow.addEventListener('beforeprint', () => {
                console.log('Print dialog opened');
            });

            iframe.contentWindow.addEventListener('afterprint', () => {
                console.log('Print dialog closed');
                cleanupIframe();
            });

            // Focus and trigger print
            iframe.contentWindow.focus();

            // Use matchMedia as fallback for older browsers
            const mediaQueryList = iframe.contentWindow.matchMedia('print');
            mediaQueryList.addListener((mql) => {
                if (!mql.matches) {
                    // Print dialog closed
                    setTimeout(cleanupIframe, 100);
                }
            });

            // Trigger print
            setTimeout(() => {
                iframe.contentWindow.print();
            }, 500);

            // Ultimate fallback cleanup
            setTimeout(cleanupIframe, 10000); // Cleanup after 10 seconds no matter what
        };

        // Fallback for iframe onload
        setTimeout(() => {
            if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();

                // Fallback cleanup
                setTimeout(cleanupIframe, 3000);
            } else {
                // If iframe never loads, cleanup
                setTimeout(cleanupIframe, 5000);
            }
        }, 2000);
    };

    return (
        <Button onClick={printDirectly} disabled={loader}>
            {loader ? "Preparing Print..." : " Print Payslip"}
        </Button>
    );
};

export default DownloadButton;