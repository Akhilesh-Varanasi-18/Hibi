import React from "react";

const SampleTemplate = () => {
  const formatNumber = (num) => {
    return num ? num.toFixed(2) : "0.00";
  };

  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";
    if (num < 20) return ones[num];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] +
        (num % 10 !== 0 ? " " + ones[num % 10] : "")
      );
    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 !== 0 ? " And " + numberToWords(num % 100) : "")
      );
    if (num < 100000)
      return (
        numberToWords(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        numberToWords(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "")
      );
    return (
      numberToWords(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "")
    );
  };

  const employee = {
    _id: "68bbfccb06e9159927029415",
    employeeCode: "4299",
    esicNumber: "12345654345",
    pfNumber: "432325345",
    employeeName: "JONATHAN PETERS",
    orgName: "Technical Hub",
    orgAdress:
      "D No.86-4-12/3, G V S Apparao street, Tilak Road, VL Puram, RAJAHMUNDRY, East Godavari, Andhra Pradesh, 533101",
    orglogo: "",
    orgstamp:
      "https://hrms-bucket-thub.s3.ap-south-1.amazonaws.com/staging/organization/image.jpeg",
    designation: "NETWORK ADMINSTRATOR",
    department: "IT",
    accountNumber: "712712712712",
    bankName: "MEDGE BURKE",
  };

  const payslip = {
    _id: "68ef3798a194e8656396a9c2",
    employeeId: "68bbfccb06e9159927029415",
    basicSalary: 8000,
    da: 5000,
    houseRentAllowance: 50000,
    earningsOthers: 11222,
    lossOfPay: 5150,
    professionalTax: 5150,
    epf: 510,
    groupInsurance: 51000,
    canteen: 51115,
    advance: 5154,
    tds: 51155,
    contribution: 154845,
    esi: 154512,
    others: 151521,
    totalEarnings: 80000,
    totalDeductions: 5205,
    netSalary: 76150,
    month: 9,
    year: 2025,
  };

  const monthYear = `${payslip.month}-${payslip.year}`;

  const earnings = [
    { label: "Basic Pay", value: payslip.basicSalary },
    { label: "DA", value: payslip.da },
    { label: "House Rent Allowance", value: payslip.houseRentAllowance },
    { label: "Others", value: payslip.earningsOthers },
    { label: "Total Earnings", value: payslip.totalEarnings, bold: true },
  ];

  const deductions = [
    { label: "Loss of Pay", value: payslip.lossOfPay },
    { label: "Professional Tax", value: payslip.professionalTax },
    { label: "EPFO", value: payslip.epf },
    { label: "Group Insurance", value: payslip.groupInsurance },
    { label: "Canteen", value: payslip.canteen },
    { label: "Advance", value: payslip.advance },
    { label: "TDS", value: payslip.tds },
    { label: "Contribution", value: payslip.contribution },
    { label: "ESIC", value: payslip.esi },
    { label: "Others", value: payslip.others },
    { label: "Total Deductions", value: payslip.totalDeductions, bold: true },
  ];

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        width: "210mm",
        background: "white",
        border: "1px solid #d1d5db",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <img
          src={employee.orglogo || ""}
          alt="Logo"
          style={{
            width: "60px",
            height: "60px",
            objectFit: "contain",
            marginBottom: "0px",
          }}
        />
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bolder" }}>
          {employee.orgName}
        </h2>
        <p style={{ margin: "2px 0", fontSize: "10px" }}>
          {employee.orgAdress}
        </p>
        <h3 style={{ marginTop: "8px", fontSize: "12px", fontWeight: "bold",textAlign:"start" }}>
          Pay Slip for the Month of {monthYear}
        </h3>
      </div>

      {/* Employee Details */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "10px",
          marginBottom: "15px",
        }}
      >
        <tbody>
          <tr>
            <td style={tdLabel}>Employee Name</td>
            <td style={tdValue}>{employee.employeeName}</td>
            <td style={tdLabel}>Bank A/c No</td>
            <td style={tdValue}>{employee.accountNumber}</td>
          </tr>
          <tr>
            <td style={tdLabel}>Employee ID</td>
            <td style={tdValue}>{employee.employeeCode}</td>
            <td style={tdLabel}>Bank Name</td>
            <td style={tdValue}>{employee.bankName}</td>
          </tr>
          <tr>
            <td style={tdLabel}>Designation</td>
            <td style={tdValue}>{employee.designation}</td>
            <td style={tdLabel}>EPFO No</td>
            <td style={tdValue}>{employee.pfNumber}</td>
          </tr>
          <tr>
            <td style={tdLabel}>Department</td>
            <td style={tdValue}>{employee.department}</td>
            <td style={tdLabel}>ESIC No</td>
            <td style={tdValue}>{employee.esicNumber}</td>
          </tr>
        </tbody>
      </table>

      {/* Earnings and Deductions */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "10px",
          marginBottom: "10px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle} colSpan={2}>Earnings</th>
            <th style={thStyle} colSpan={2}>Deductions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdInner}>Basic Pay</td>
            <td style={tdInner}>{payslip?.basicSalary}</td>
            <td style={tdInner}>Loss of Pay</td>
            <td style={tdInner}>{payslip.lossOfPay}</td>
          </tr>
          <tr>
            <td style={tdInner}>DA</td>
            <td style={tdInner}>{payslip?.da}</td>
            <td style={tdInner}>Professional Tax</td>
            <td style={tdInner}>{payslip.professionalTax}</td>
          </tr>
          <tr>
            <td style={tdInner}>House Rent Allowance</td>
            <td style={tdInner}>{payslip.houseRentAllowance}</td>
            <td style={tdInner}>EPFO</td>
            <td style={tdInner}>{payslip.epf}</td>
          </tr>
          <tr>
            <td style={tdInner}>Others</td>
            <td style={tdInner}>{payslip.earningsOthers}</td>
            <td style={tdInner}>Group Insurance</td>
            <td style={tdInner}>{payslip.groupInsurance}</td>
          </tr>
          <tr>
            <td style={tdInner}></td>
            <td style={tdInner}></td>
            <td style={tdInner}>Canteen</td>
            <td style={tdInner}>{payslip.canteen}</td>
          </tr>
          <tr>
            <td style={tdInner}></td>
            <td style={tdInner}></td>
            <td style={tdInner}>Advance</td>
            <td style={tdInner}>{payslip.advance}</td>
          </tr>
          <tr>
            <td style={tdInner}></td>
            <td style={tdInner}></td>
            <td style={tdInner}>TDS</td>
            <td style={tdInner}>{payslip.tds}</td>
          </tr>
          <tr>
            <td style={tdInner}></td>
            <td style={tdInner}></td>
            <td style={tdInner}>Contribution</td>
            <td style={tdInner}>{payslip.contribution}</td>
          </tr>
          <tr>
            <td style={tdInner}></td>
            <td style={tdInner}></td>
            <td style={tdInner}>ESIC</td>
            <td style={tdInner}>{payslip.esi}</td>
          </tr>
          <tr>
            <td style={tdInner}></td>
            <td style={tdInner}></td>
            <td style={tdInner}>Others</td>
            <td style={tdInner}>{payslip.others}</td>
          </tr>
          <tr>
            <td style={tdBold}>Total Earnings</td>
            <td style={tdBold}>{payslip.totalEarnings}</td>
            <td style={tdBold}>Total Deductions</td>
            <td style={tdBold}>{payslip.totalDeductions}</td>
          </tr>
          <td colSpan={2}></td>
            <td style={{ fontWeight: "bold" }}>Net Salary</td>
            <td style={{ textAlign: "right", fontWeight: "bold" }}>
              {formatNumber(payslip.netSalary)}
            </td>
        </tbody>
      </table>

      {/* Net Salary */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "11px",
          marginTop: "10px",
        }}
      >
        <tbody>
          <tr>
            
          </tr>
          <tr>
            <td colSpan="2" style={{ fontSize: "10px" }}>
              <strong>In Words:</strong>{" "}
              {numberToWords(Math.floor(payslip.netSalary))} Rupees Only
            </td>
          </tr>
        </tbody>
      </table>

      {/* Stamp */}
      <div style={{ marginTop: "30px", textAlign: "left",fontSize:"10px" }}>
          <img src={employee.orgstamp} width={200} height={200}/>
      </div>
    </div>
  );
};

// Common Styles
const tdLabel = {
  border: "1px solid #000",
  padding: "4px",
  // fontWeight: "bold",
};
const tdValue = {
  border: "1px solid #000",
  padding: "4px",
};
const tdBox = {
  verticalAlign: "top",
  border: "1px solid #000",
  padding: "0",
};
const tdInner = {
  border: "1px solid #000",
  padding: "4px",
};
const thStyle = {
  // border: "1px solid #000",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "12px",
  // background: "#f3f4f6",
  padding: "5px",
};
const tdBold={
  fontWeight:"bold",
  border: "1px solid #000",
  padding: "4px",
}

export default SampleTemplate;
