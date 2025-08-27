import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc, asc, ilike, or, gte, lte, between } from 'drizzle-orm';
import { WSService } from '../../websocket';

const router = Router();

// Middleware to get user ID
const getUserId = (req: Request): number => {
  return (req.user as any)?.id || 1; // Fallback for development
};

// Get HRMS dashboard metrics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const metricsQuery = sql`
      SELECT 
        COUNT(CASE WHEN e.status = 'active' THEN 1 END) as total_employees,
        COUNT(CASE WHEN e.status = 'active' AND e.employment_type = 'full-time' THEN 1 END) as full_time_employees,
        COUNT(CASE WHEN e.status = 'active' AND e.employment_type = 'part-time' THEN 1 END) as part_time_employees,
        COUNT(CASE WHEN e.status = 'active' AND e.employment_type = 'contract' THEN 1 END) as contract_employees,
        COUNT(DISTINCT d.id) as total_departments,
        COUNT(CASE WHEN a.check_in_time::date = CURRENT_DATE THEN 1 END) as present_today,
        COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending_leave_requests
      FROM ${schema.employees} e
      LEFT JOIN ${schema.departments} d ON e.department_id = d.id
      LEFT JOIN ${schema.attendance} a ON e.id = a.employee_id
      LEFT JOIN ${schema.leaveRequests} lr ON e.id = lr.employee_id
      WHERE e.user_id = ${userId}
    `;
    
    const [metrics] = await db.execute(metricsQuery as any);
    
    // Calculate additional metrics
    const attendanceRate = metrics.total_employees > 0 
      ? ((Number(metrics.present_today) / Number(metrics.total_employees)) * 100).toFixed(1)
      : '0';
    
    const result = {
      totalEmployees: Number(metrics.total_employees) || 0,
      fullTimeEmployees: Number(metrics.full_time_employees) || 0,
      partTimeEmployees: Number(metrics.part_time_employees) || 0,
      contractEmployees: Number(metrics.contract_employees) || 0,
      totalDepartments: Number(metrics.total_departments) || 0,
      presentToday: Number(metrics.present_today) || 0,
      pendingLeaveRequests: Number(metrics.pending_leave_requests) || 0,
      attendanceRate: Number(attendanceRate),
      averageSalary: 75000, // This would be calculated from payroll data
      newHiresThisMonth: 3, // This would be calculated from hire dates
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching HRMS dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all employees with pagination and filtering
router.get('/employees', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, search, department, status, employmentType } = req.query;
    
    let query = db
      .select({
        employee: schema.employees,
        department: {
          id: schema.departments.id,
          name: schema.departments.name,
          code: schema.departments.code
        },
        position: {
          id: schema.positions.id,
          title: schema.positions.title
        }
      })
      .from(schema.employees)
      .leftJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id))
      .leftJoin(schema.positions, eq(schema.employees.positionId, schema.positions.id))
      .where(eq(schema.employees.userId, userId));
    
    // Add filters
    if (search) {
      query = query.where(
        or(
          ilike(schema.employees.firstName, `%${search}%`),
          ilike(schema.employees.lastName, `%${search}%`),
          ilike(schema.employees.email, `%${search}%`),
          ilike(schema.employees.employeeId, `%${search}%`)
        )
      );
    }
    
    if (department) {
      query = query.where(eq(schema.employees.departmentId, parseInt(department as string)));
    }
    
    if (status) {
      query = query.where(eq(schema.employees.status, status as string));
    }
    
    if (employmentType) {
      query = query.where(eq(schema.employees.employmentType, employmentType as string));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const employees = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.employees.createdAt));
    
    // Get total count for pagination
    const totalQuery = db.select({ count: sql`count(*)` }).from(schema.employees).where(eq(schema.employees.userId, userId));
    const [{ count }] = await totalQuery;
    
    res.json({
      employees,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Create new employee
router.post('/employees', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const employeeData = { ...req.body, userId };
    
    const [newEmployee] = await db.insert(schema.employees).values(employeeData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('hrms', 'employees', 'employee_created', newEmployee);
    
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update employee
router.put('/employees/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const employeeId = parseInt(req.params.id);
    
    const [updatedEmployee] = await db
      .update(schema.employees)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.userId, userId)))
      .returning();
    
    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('hrms', 'employees', 'employee_updated', updatedEmployee);
    
    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Get all departments
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const departments = await db
      .select({
        department: schema.departments,
        employeeCount: sql`COUNT(${schema.employees.id}) as employee_count`
      })
      .from(schema.departments)
      .leftJoin(schema.employees, eq(schema.departments.id, schema.employees.departmentId))
      .where(eq(schema.departments.userId, userId))
      .groupBy(schema.departments.id)
      .orderBy(asc(schema.departments.name));
    
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Create new department
router.post('/departments', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const departmentData = { ...req.body, userId };
    
    const [newDepartment] = await db.insert(schema.departments).values(departmentData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('hrms', 'departments', 'department_created', newDepartment);
    
    res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Get all positions
router.get('/positions', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { departmentId } = req.query;
    
    let query = db
      .select({
        position: schema.positions,
        department: {
          id: schema.departments.id,
          name: schema.departments.name
        },
        employeeCount: sql`COUNT(${schema.employees.id}) as employee_count`
      })
      .from(schema.positions)
      .leftJoin(schema.departments, eq(schema.positions.departmentId, schema.departments.id))
      .leftJoin(schema.employees, eq(schema.positions.id, schema.employees.positionId))
      .where(eq(schema.positions.userId, userId))
      .groupBy(schema.positions.id, schema.departments.id);
    
    if (departmentId) {
      query = query.where(eq(schema.positions.departmentId, parseInt(departmentId as string)));
    }
    
    const positions = await query.orderBy(asc(schema.positions.title));
    
    res.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Create new position
router.post('/positions', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const positionData = { ...req.body, userId };
    
    const [newPosition] = await db.insert(schema.positions).values(positionData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('hrms', 'positions', 'position_created', newPosition);
    
    res.status(201).json(newPosition);
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ error: 'Failed to create position' });
  }
});

// Get attendance records
router.get('/attendance', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { employeeId, date, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    let query = db
      .select({
        attendance: schema.attendance,
        employee: {
          id: schema.employees.id,
          firstName: schema.employees.firstName,
          lastName: schema.employees.lastName,
          employeeId: schema.employees.employeeId
        }
      })
      .from(schema.attendance)
      .innerJoin(schema.employees, eq(schema.attendance.employeeId, schema.employees.id))
      .where(eq(schema.employees.userId, userId));
    
    if (employeeId) {
      query = query.where(eq(schema.attendance.employeeId, parseInt(employeeId as string)));
    }
    
    if (date) {
      query = query.where(sql`DATE(${schema.attendance.checkInTime}) = ${date}`);
    }
    
    if (startDate && endDate) {
      query = query.where(
        between(
          sql`DATE(${schema.attendance.checkInTime})`,
          startDate as string,
          endDate as string
        )
      );
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const attendanceRecords = await query
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(schema.attendance.checkInTime));
    
    res.json({ attendanceRecords });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Clock in/out
router.post('/attendance/clock', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { employeeId, type, geoLocation } = req.body; // type: 'in' or 'out'
    
    if (type === 'in') {
      // Check if already clocked in today
      const existingRecord = await db
        .select()
        .from(schema.attendance)
        .where(
          and(
            eq(schema.attendance.employeeId, employeeId),
            sql`DATE(${schema.attendance.checkInTime}) = CURRENT_DATE`,
            sql`${schema.attendance.checkOutTime} IS NULL`
          )
        )
        .limit(1);
      
      if (existingRecord.length > 0) {
        return res.status(400).json({ error: 'Already clocked in today' });
      }
      
      // Create new attendance record
      const [attendance] = await db
        .insert(schema.attendance)
        .values({
          employeeId,
          checkInTime: new Date(),
          geoLocation,
          status: 'present'
        })
        .returning();
      
      // Broadcast real-time update
      const wsService = req.app.locals.wsService as WSService;
      wsService.broadcastToResource('hrms', 'attendance', 'clocked_in', attendance);
      
      res.json(attendance);
    } else if (type === 'out') {
      // Find today's attendance record
      const [attendance] = await db
        .update(schema.attendance)
        .set({
          checkOutTime: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(schema.attendance.employeeId, employeeId),
            sql`DATE(${schema.attendance.checkInTime}) = CURRENT_DATE`,
            sql`${schema.attendance.checkOutTime} IS NULL`
          )
        )
        .returning();
      
      if (!attendance) {
        return res.status(400).json({ error: 'No clock-in record found for today' });
      }
      
      // Broadcast real-time update
      const wsService = req.app.locals.wsService as WSService;
      wsService.broadcastToResource('hrms', 'attendance', 'clocked_out', attendance);
      
      res.json(attendance);
    } else {
      res.status(400).json({ error: 'Invalid clock type' });
    }
  } catch (error) {
    console.error('Error processing clock in/out:', error);
    res.status(500).json({ error: 'Failed to process clock in/out' });
  }
});

// Get leave types
router.get('/leave-types', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const leaveTypes = await db
      .select()
      .from(schema.leaveTypes)
      .where(and(eq(schema.leaveTypes.userId, userId), eq(schema.leaveTypes.isActive, true)))
      .orderBy(asc(schema.leaveTypes.name));
    
    res.json(leaveTypes);
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ error: 'Failed to fetch leave types' });
  }
});

// Get leave requests
router.get('/leave-requests', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { employeeId, status, page = 1, limit = 20 } = req.query;
    
    let query = db
      .select({
        leaveRequest: schema.leaveRequests,
        employee: {
          id: schema.employees.id,
          firstName: schema.employees.firstName,
          lastName: schema.employees.lastName,
          employeeId: schema.employees.employeeId
        },
        leaveType: {
          id: schema.leaveTypes.id,
          name: schema.leaveTypes.name,
          colorCode: schema.leaveTypes.colorCode
        }
      })
      .from(schema.leaveRequests)
      .innerJoin(schema.employees, eq(schema.leaveRequests.employeeId, schema.employees.id))
      .innerJoin(schema.leaveTypes, eq(schema.leaveRequests.leaveTypeId, schema.leaveTypes.id))
      .where(eq(schema.employees.userId, userId));
    
    if (employeeId) {
      query = query.where(eq(schema.leaveRequests.employeeId, parseInt(employeeId as string)));
    }
    
    if (status) {
      query = query.where(eq(schema.leaveRequests.status, status as string));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const leaveRequests = await query
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(schema.leaveRequests.createdAt));
    
    res.json({ leaveRequests });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Create leave request
router.post('/leave-requests', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leaveRequestData = { ...req.body };
    
    const [newLeaveRequest] = await db.insert(schema.leaveRequests).values(leaveRequestData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('hrms', 'leave-requests', 'leave_request_created', newLeaveRequest);
    
    res.status(201).json(newLeaveRequest);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// Approve/reject leave request
router.put('/leave-requests/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leaveRequestId = parseInt(req.params.id);
    const { status, rejectionReason } = req.body; // status: 'approved' | 'rejected'
    
    const updateData: any = {
      status,
      approvedBy: userId,
      approvedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    const [updatedLeaveRequest] = await db
      .update(schema.leaveRequests)
      .set(updateData)
      .where(eq(schema.leaveRequests.id, leaveRequestId))
      .returning();
    
    if (!updatedLeaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('hrms', 'leave-requests', 'leave_request_status_updated', updatedLeaveRequest);
    
    res.json(updatedLeaveRequest);
  } catch (error) {
    console.error('Error updating leave request status:', error);
    res.status(500).json({ error: 'Failed to update leave request status' });
  }
});

// Get leave balances for an employee
router.get('/leave-balances/:employeeId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const employeeId = parseInt(req.params.employeeId);
    
    const leaveBalances = await db
      .select({
        balance: schema.leaveBalances,
        leaveType: {
          id: schema.leaveTypes.id,
          name: schema.leaveTypes.name,
          colorCode: schema.leaveTypes.colorCode,
          isPaid: schema.leaveTypes.isPaid
        }
      })
      .from(schema.leaveBalances)
      .innerJoin(schema.leaveTypes, eq(schema.leaveBalances.leaveTypeId, schema.leaveTypes.id))
      .innerJoin(schema.employees, eq(schema.leaveBalances.employeeId, schema.employees.id))
      .where(
        and(
          eq(schema.leaveBalances.employeeId, employeeId),
          eq(schema.employees.userId, userId)
        )
      )
      .orderBy(asc(schema.leaveTypes.name));
    
    res.json(leaveBalances);
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    res.status(500).json({ error: 'Failed to fetch leave balances' });
  }
});

// Get payroll records
router.get('/payroll', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { employeeId, payPeriod, page = 1, limit = 20 } = req.query;
    
    let query = db
      .select({
        payroll: schema.payroll,
        employee: {
          id: schema.employees.id,
          firstName: schema.employees.firstName,
          lastName: schema.employees.lastName,
          employeeId: schema.employees.employeeId
        }
      })
      .from(schema.payroll)
      .innerJoin(schema.employees, eq(schema.payroll.employeeId, schema.employees.id))
      .where(eq(schema.payroll.userId, userId));
    
    if (employeeId) {
      query = query.where(eq(schema.payroll.employeeId, parseInt(employeeId as string)));
    }
    
    if (payPeriod) {
      // Assuming payPeriod is in format "YYYY-MM"
      query = query.where(sql`TO_CHAR(${schema.payroll.payPeriodStart}, 'YYYY-MM') = ${payPeriod}`);
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const payrollRecords = await query
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(schema.payroll.payDate));
    
    res.json({ payrollRecords });
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
});

// Create payroll record
router.post('/payroll', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const payrollData = { ...req.body, userId };
    
    const [newPayroll] = await db.insert(schema.payroll).values(payrollData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('hrms', 'payroll', 'payroll_created', newPayroll);
    
    res.status(201).json(newPayroll);
  } catch (error) {
    console.error('Error creating payroll record:', error);
    res.status(500).json({ error: 'Failed to create payroll record' });
  }
});

// Get attendance summary for dashboard
router.get('/attendance/summary', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const summaryQuery = sql`
      SELECT 
        COUNT(CASE WHEN a.check_in_time IS NOT NULL THEN 1 END) as present,
        COUNT(CASE WHEN a.check_in_time IS NULL AND e.status = 'active' THEN 1 END) as absent,
        COUNT(CASE WHEN lr.status = 'approved' AND ${date} BETWEEN lr.start_date AND lr.end_date THEN 1 END) as on_leave,
        AVG(CASE 
          WHEN a.check_out_time IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (a.check_out_time - a.check_in_time)) / 3600 
          END
        ) as avg_hours_worked
      FROM ${schema.employees} e
      LEFT JOIN ${schema.attendance} a ON e.id = a.employee_id AND DATE(a.check_in_time) = ${sql`${date}::date` }
      LEFT JOIN ${schema.leaveRequests} lr ON e.id = lr.employee_id
      WHERE e.user_id = ${userId} AND e.status = 'active'
    `;
    
    const [summary] = await db.execute(summaryQuery as any);
    
    res.json({
      present: Number(summary.present) || 0,
      absent: Number(summary.absent) || 0,
      onLeave: Number(summary.on_leave) || 0,
      avgHoursWorked: Number(summary.avg_hours_worked) || 0,
    });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

// Department headcount for main dashboard
router.get('/department-headcount', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const rows = await db
      .select({
        id: schema.departments.id,
        name: schema.departments.name,
        code: schema.departments.code,
        headcount: sql`COUNT(${schema.employees.id})`
      })
      .from(schema.departments)
      .leftJoin(schema.employees, eq(schema.employees.departmentId, schema.departments.id))
      .where(eq(schema.departments.userId, userId))
      .groupBy(schema.departments.id)
      .orderBy(asc(schema.departments.name));
    res.json(rows.map(r => ({ id: r.id, name: r.name, code: r.code, headcount: Number((r as any).headcount) })));
  } catch (error) {
    console.error('Error fetching department headcount:', error);
    res.status(500).json({ message: 'Failed to fetch department headcount' });
  }
});

// Attendance trends (last 7 days) for main dashboard
router.get('/attendance-trends', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const days = 7;
    const today = new Date();
    const data: Array<{ date: string; present: number; absent: number; onLeave: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const row = await db.execute(sql`
        SELECT 
          COUNT(CASE WHEN a.check_in_time IS NOT NULL THEN 1 END) as present,
          COUNT(CASE WHEN a.check_in_time IS NULL AND e.status = 'active' THEN 1 END) as absent,
          COUNT(CASE WHEN lr.status = 'approved' AND ${sql`${dateStr}::date`} BETWEEN lr.start_date AND lr.end_date THEN 1 END) as on_leave
        FROM ${schema.employees} e
        LEFT JOIN ${schema.attendance} a ON e.id = a.employee_id AND DATE(a.check_in_time) = ${sql`${dateStr}::date`}
        LEFT JOIN ${schema.leaveRequests} lr ON e.id = lr.employee_id
        WHERE e.user_id = ${userId} AND e.status = 'active'
      ` as any);
      const r: any = Array.isArray(row) ? row[0] : row;
      data.push({
        date: dateStr,
        present: Number(r?.present || 0),
        absent: Number(r?.absent || 0),
        onLeave: Number(r?.on_leave || 0),
      });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching attendance trends:', error);
    res.status(500).json({ message: 'Failed to fetch attendance trends' });
  }
});

// Upcoming leaves for dashboard list (next 30 days)
router.get('/upcoming-leaves', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);
    const sample = [
      { id: 1, employee: 'John Smith', department: 'Engineering', from: now.toISOString().slice(0,10), to: in30.toISOString().slice(0,10), status: 'Approved' },
      { id: 2, employee: 'Emily Johnson', department: 'Design', from: now.toISOString().slice(0,10), to: now.toISOString().slice(0,10), status: 'Pending' },
    ];
    res.json(sample);
  } catch (error) {
    console.error('Error fetching upcoming leaves:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming leaves' });
  }
});

// Get leave types
router.get('/leave-types', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leaveTypes = await db
      .select()
      .from(schema.leaveTypes)
      .where(and(eq(schema.leaveTypes.userId, userId), eq(schema.leaveTypes.isActive, true)))
      .orderBy(asc(schema.leaveTypes.name));
    res.json(leaveTypes);
  } catch (error) {
    console.error('Error fetching leave types:', error);

    res.status(500).json({ error: 'Failed to fetch leave types' });

  }

});



// Get leave requests

router.get('/leave-requests', async (req: Request, res: Response) => {

  try {

    const userId = getUserId(req);

    const { employeeId, status, page = 1, limit = 20 } = req.query;

    

    let query = db

      .select({

        leaveRequest: schema.leaveRequests,

        employee: {

          id: schema.employees.id,

          firstName: schema.employees.firstName,

          lastName: schema.employees.lastName,

          employeeId: schema.employees.employeeId

        },

        leaveType: {

          id: schema.leaveTypes.id,

          name: schema.leaveTypes.name,

          colorCode: schema.leaveTypes.colorCode

        }

      })

      .from(schema.leaveRequests)

      .innerJoin(schema.employees, eq(schema.leaveRequests.employeeId, schema.employees.id))

      .innerJoin(schema.leaveTypes, eq(schema.leaveRequests.leaveTypeId, schema.leaveTypes.id))

      .where(eq(schema.employees.userId, userId));

    

    if (employeeId) {

      query = query.where(eq(schema.leaveRequests.employeeId, parseInt(employeeId as string)));

    }

    

    if (status) {

      query = query.where(eq(schema.leaveRequests.status, status as string));

    }

    

    const offset = (Number(page) - 1) * Number(limit);

    const leaveRequests = await query

      .limit(Number(limit))

      .offset(offset)

      .orderBy(desc(schema.leaveRequests.createdAt));

    

    res.json({ leaveRequests });

  } catch (error) {

    console.error('Error fetching leave requests:', error);

    res.status(500).json({ error: 'Failed to fetch leave requests' });

  }

});



// Create leave request

router.post('/leave-requests', async (req: Request, res: Response) => {

  try {

    const userId = getUserId(req);

    const leaveRequestData = { ...req.body };

    

    const [newLeaveRequest] = await db.insert(schema.leaveRequests).values(leaveRequestData).returning();

    

    // Broadcast real-time update

    const wsService = req.app.locals.wsService as WSService;

    wsService.broadcastToResource('hrms', 'leave-requests', 'leave_request_created', newLeaveRequest);

    

    res.status(201).json(newLeaveRequest);

  } catch (error) {

    console.error('Error creating leave request:', error);

    res.status(500).json({ error: 'Failed to create leave request' });

  }

});



// Approve/reject leave request

router.put('/leave-requests/:id/status', async (req: Request, res: Response) => {

  try {

    const userId = getUserId(req);

    const leaveRequestId = parseInt(req.params.id);

    const { status, rejectionReason } = req.body; // status: 'approved' | 'rejected'

    

    const updateData: any = {

      status,

      approvedBy: userId,

      approvedAt: new Date(),

      updatedAt: new Date()

    };

    

    if (status === 'rejected' && rejectionReason) {

      updateData.rejectionReason = rejectionReason;

    }

    

    const [updatedLeaveRequest] = await db

      .update(schema.leaveRequests)

      .set(updateData)

      .where(eq(schema.leaveRequests.id, leaveRequestId))

      .returning();

    

    if (!updatedLeaveRequest) {

      return res.status(404).json({ error: 'Leave request not found' });

    }

    

    // Broadcast real-time update

    const wsService = req.app.locals.wsService as WSService;

    wsService.broadcastToResource('hrms', 'leave-requests', 'leave_request_status_updated', updatedLeaveRequest);

    

    res.json(updatedLeaveRequest);

  } catch (error) {

    console.error('Error updating leave request status:', error);

    res.status(500).json({ error: 'Failed to update leave request status' });

  }

});



// Get leave balances for an employee

router.get('/leave-balances/:employeeId', async (req: Request, res: Response) => {

  try {

    const userId = getUserId(req);

    const employeeId = parseInt(req.params.employeeId);

    

    const leaveBalances = await db

      .select({

        balance: schema.leaveBalances,

        leaveType: {

          id: schema.leaveTypes.id,

          name: schema.leaveTypes.name,

          colorCode: schema.leaveTypes.colorCode,

          isPaid: schema.leaveTypes.isPaid

        }

      })

      .from(schema.leaveBalances)

      .innerJoin(schema.leaveTypes, eq(schema.leaveBalances.leaveTypeId, schema.leaveTypes.id))

      .innerJoin(schema.employees, eq(schema.leaveBalances.employeeId, schema.employees.id))

      .where(

        and(

          eq(schema.leaveBalances.employeeId, employeeId),

          eq(schema.employees.userId, userId)

        )

      )

      .orderBy(asc(schema.leaveTypes.name));

    

    res.json(leaveBalances);

  } catch (error) {

    console.error('Error fetching leave balances:', error);

    res.status(500).json({ error: 'Failed to fetch leave balances' });

  }

});



// Get payroll records

router.get('/payroll', async (req: Request, res: Response) => {

  try {

    const userId = getUserId(req);

    const { employeeId, payPeriod, page = 1, limit = 20 } = req.query;

    

    let query = db

      .select({

        payroll: schema.payroll,

        employee: {

          id: schema.employees.id,

          firstName: schema.employees.firstName,

          lastName: schema.employees.lastName,

          employeeId: schema.employees.employeeId

        }

      })

      .from(schema.payroll)

      .innerJoin(schema.employees, eq(schema.payroll.employeeId, schema.employees.id))

      .where(eq(schema.payroll.userId, userId));

    

    if (employeeId) {

      query = query.where(eq(schema.payroll.employeeId, parseInt(employeeId as string)));

    }

    

    if (payPeriod) {

      // Assuming payPeriod is in format "YYYY-MM"

      query = query.where(sql`TO_CHAR(${schema.payroll.payPeriodStart}, 'YYYY-MM') = ${payPeriod}`);

    }

    

    const offset = (Number(page) - 1) * Number(limit);

    const payrollRecords = await query

      .limit(Number(limit))

      .offset(offset)

      .orderBy(desc(schema.payroll.payDate));

    

    res.json({ payrollRecords });

  } catch (error) {

    console.error('Error fetching payroll records:', error);

    res.status(500).json({ error: 'Failed to fetch payroll records' });

  }

});



// Create payroll record

router.post('/payroll', async (req: Request, res: Response) => {

  try {

    const userId = getUserId(req);

    const payrollData = { ...req.body, userId };

    

    const [newPayroll] = await db.insert(schema.payroll).values(payrollData).returning();

    

    // Broadcast real-time update

    const wsService = req.app.locals.wsService as WSService;

    wsService.broadcastToResource('hrms', 'payroll', 'payroll_created', newPayroll);

    

    res.status(201).json(newPayroll);

  } catch (error) {

    console.error('Error creating payroll record:', error);

    res.status(500).json({ error: 'Failed to create payroll record' });

  }

});



// Get attendance summary for dashboard

router.get('/attendance/summary', async (req: Request, res: Response) => {

  try {

    const userId = getUserId(req);

    const { date = new Date().toISOString().split('T')[0] } = req.query;

    

    const summaryQuery = sql`

      SELECT 

        COUNT(CASE WHEN a.check_in_time IS NOT NULL THEN 1 END) as present,

        COUNT(CASE WHEN a.check_in_time IS NULL AND e.status = 'active' THEN 1 END) as absent,

        COUNT(CASE WHEN lr.status = 'approved' AND ${date} BETWEEN lr.start_date AND lr.end_date THEN 1 END) as on_leave,

        AVG(CASE 

          WHEN a.check_out_time IS NOT NULL THEN 

            EXTRACT(EPOCH FROM (a.check_out_time - a.check_in_time)) / 3600 

          END

        ) as avg_hours_worked

      FROM ${schema.employees} e

      LEFT JOIN ${schema.attendance} a ON e.id = a.employee_id AND DATE(a.check_in_time) = ${sql`${date}::date` }

      LEFT JOIN ${schema.leaveRequests} lr ON e.id = lr.employee_id

      WHERE e.user_id = ${userId} AND e.status = 'active'

    `;

    

    const [summary] = await db.execute(summaryQuery as any);

    

    res.json({

      present: Number(summary.present) || 0,

      absent: Number(summary.absent) || 0,

      onLeave: Number(summary.on_leave) || 0,

      avgHoursWorked: Number(summary.avg_hours_worked) || 0,

    });

  } catch (error) {

    console.error('Error fetching attendance summary:', error);

    res.status(500).json({ error: 'Failed to fetch attendance summary' });

  }

});



// Department headcount for main dashboard

router.get('/department-headcount', async (req: Request, res: Response) => {

  try {

    const userId = getUserId(req);

    const rows = await db

      .select({

        id: schema.departments.id,

        name: schema.departments.name,

        code: schema.departments.code,

        headcount: sql`COUNT(${schema.employees.id})`

      })

      .from(schema.departments)

      .leftJoin(schema.employees, eq(schema.employees.departmentId, schema.departments.id))

      .where(eq(schema.departments.userId, userId))

      .groupBy(schema.departments.id)

      .orderBy(asc(schema.departments.name));

    res.json(rows.map(r => ({ id: r.id, name: r.name, code: r.code, headcount: Number((r as any).headcount) })));

  } catch (error) {

    console.error('Error fetching department headcount:', error);

    res.status(500).json({ message: 'Failed to fetch department headcount' });

  }

});



// Attendance trends (last 7 days) for main dashboard

router.get('/attendance-trends', async (req: Request, res: Response) => {

  try {

    const userId = getUserId(req);

    const days = 7;

    const today = new Date();

    const data: Array<{ date: string; present: number; absent: number; onLeave: number }> = [];

    for (let i = days - 1; i >= 0; i--) {

      const d = new Date(today);

      d.setDate(today.getDate() - i);

      const dateStr = d.toISOString().split('T')[0];

      const row = await db.execute(sql`

        SELECT 

          COUNT(CASE WHEN a.check_in_time IS NOT NULL THEN 1 END) as present,

          COUNT(CASE WHEN a.check_in_time IS NULL AND e.status = 'active' THEN 1 END) as absent,

          COUNT(CASE WHEN lr.status = 'approved' AND ${sql`${dateStr}::date`} BETWEEN lr.start_date AND lr.end_date THEN 1 END) as on_leave

        FROM ${schema.employees} e

        LEFT JOIN ${schema.attendance} a ON e.id = a.employee_id AND DATE(a.check_in_time) = ${sql`${dateStr}::date`}

        LEFT JOIN ${schema.leaveRequests} lr ON e.id = lr.employee_id

        WHERE e.user_id = ${userId} AND e.status = 'active'

      ` as any);

      const r: any = Array.isArray(row) ? row[0] : row;

      data.push({

        date: dateStr,

        present: Number(r?.present || 0),

        absent: Number(r?.absent || 0),

        onLeave: Number(r?.on_leave || 0),

      });

    }

    res.json(data);

  } catch (error) {

    console.error('Error fetching attendance trends:', error);

    res.status(500).json({ message: 'Failed to fetch attendance trends' });

  }

});



export default router;
