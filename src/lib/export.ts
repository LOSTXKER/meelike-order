/**
 * Export data to CSV file
 */
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(","));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return "";
      }
      
      // Handle dates
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      // Handle objects/arrays
      if (typeof value === "object") {
        return JSON.stringify(value).replace(/"/g, '""');
      }
      
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(",") ? `"${escaped}"` : escaped;
    });
    
    csvRows.push(values.join(","));
  }
  
  // Create blob and download
  const csvContent = csvRows.join("\n");
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export cases to CSV
 */
export function exportCasesToCSV(cases: any[]) {
  const exportData = cases.map((c) => ({
    "เลขเคส": c.caseNumber,
    "หัวข้อ": c.title,
    "สถานะ": c.status,
    "ความรุนแรง": c.severity,
    "ประเภท": c.caseType?.name || "",
    "ลูกค้า": c.customerName || "",
    "ผู้รับผิดชอบ": c.owner?.name || "ไม่มี",
    "Provider": c.provider?.name || "",
    "สร้างเมื่อ": c.createdAt ? new Date(c.createdAt).toLocaleString("th-TH") : "",
    "แก้ไขเมื่อ": c.resolvedAt ? new Date(c.resolvedAt).toLocaleString("th-TH") : "",
  }));
  
  const timestamp = new Date().toISOString().split("T")[0];
  exportToCSV(exportData, `cases-export-${timestamp}`);
}

/**
 * Export reports to CSV
 */
export function exportReportsToCSV(data: any, type: "monthly" | "providers" | "team") {
  let exportData: any[] = [];
  let filename = "";
  
  switch (type) {
    case "monthly":
      exportData = data.monthlyTrend.map((item: any) => ({
        "เดือน": item.month,
        "เคสทั้งหมด": item.total,
        "แก้ไขแล้ว": item.resolved,
        "อัตราแก้ไข (%)": item.total > 0 ? ((item.resolved / item.total) * 100).toFixed(1) : "0",
      }));
      filename = "monthly-trend";
      break;
      
    case "providers":
      exportData = data.topProviders.map((item: any) => ({
        "Provider": item.name,
        "เคสทั้งหมด": item.totalCases,
        "แก้ไขแล้ว": item.resolvedCases,
        "อัตราแก้ไข (%)": item.totalCases > 0 ? ((item.resolvedCases / item.totalCases) * 100).toFixed(1) : "0",
        "Refund Rate (%)": item.refundRate?.toFixed(2) || "0",
      }));
      filename = "providers-performance";
      break;
      
    case "team":
      exportData = data.teamPerformance.map((item: any) => ({
        "ชื่อ": item.name,
        "บทบาท": item.role,
        "เคสเดือนนี้": item.casesThisMonth,
        "เคสทั้งหมด": item.totalCases || 0,
      }));
      filename = "team-performance";
      break;
  }
  
  const timestamp = new Date().toISOString().split("T")[0];
  exportToCSV(exportData, `${filename}-${timestamp}`);
}


