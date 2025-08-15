import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// HRMS Dashboard
export function useHrmsDashboard() {
  return useQuery({
    queryKey: ["/api/hrms/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hrms/dashboard");
      return res.json(); // object with totals, attendanceRate, etc.
    },
    staleTime: 30000,
  });
}

// Departments with employee counts
export function useHrmsDepartments() {
  return useQuery({
    queryKey: ["/api/hrms/departments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hrms/departments");
      return res.json(); // array of { department: {...}, employeeCount }
    },
    staleTime: 60000,
  });
}

// Employees list with pagination and filters
export function useHrmsEmployees(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  department?: number;
  status?: string;
  employmentType?: string;
}) {
  return useQuery({
    queryKey: ["/api/hrms/employees", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
        });
      }
      const url = `/api/hrms/employees${params.toString() ? `?${params}` : ""}`;
      const res = await apiRequest("GET", url);
      return res.json(); // { employees, pagination }
    },
  });
}

// Attendance records
export function useHrmsAttendance(filters?: {
  employeeId?: number;
  date?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["/api/hrms/attendance", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
        });
      }
      const url = `/api/hrms/attendance${params.toString() ? `?${params}` : ""}`;
      const res = await apiRequest("GET", url);
      return res.json(); // { attendanceRecords }
    },
  });
}

// Attendance summary for dashboard
export function useHrmsAttendanceSummary(date?: string) {
  return useQuery({
    queryKey: ["/api/hrms/attendance/summary", date],
    queryFn: async () => {
      const url = `/api/hrms/attendance/summary${date ? `?date=${date}` : ""}`;
      const res = await apiRequest("GET", url);
      return res.json(); // { present, absent, onLeave, avgHoursWorked }
    },
  });
}

// Leave types
export function useHrmsLeaveTypes() {
  return useQuery({
    queryKey: ["/api/hrms/leave-types"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hrms/leave-types");
      return res.json();
    },
    staleTime: 60000,
  });
}

// Leave requests
export function useHrmsLeaveRequests(filters?: { employeeId?: number; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["/api/hrms/leave-requests", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
        });
      }
      const url = `/api/hrms/leave-requests${params.toString() ? `?${params}` : ""}`;
      const res = await apiRequest("GET", url);
      return res.json(); // { leaveRequests }
    },
  });
}

// Payroll
export function useHrmsPayroll(filters?: { employeeId?: number; payPeriod?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["/api/hrms/payroll", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
        });
      }
      const url = `/api/hrms/payroll${params.toString() ? `?${params}` : ""}`;
      const res = await apiRequest("GET", url);
      return res.json(); // { payrollRecords }
    },
  });
}