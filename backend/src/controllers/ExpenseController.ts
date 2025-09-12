import { Request, Response } from 'express';
import { ExpenseModel } from '../models/ExpenseModel';
import { logApi } from '../utils/logger';
import { Expense, Employee, ExpenseStats, ExpenseFilters, ExpenseCategory } from '../types';

export class ExpenseController {

  // GET /api/expenses - Get all expenses with pagination and filtering
  static async getAll(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

      const {
        page = 1,
        limit = 50,
        month,
        year,
        category,
        search
      } = req.query;

      const filters: ExpenseFilters = {
        page: Number(page),
        limit: Number(limit),
        month: month as string,
        year: year as string,
        category: category as string,
        search: search as string
      };

      const result = await ExpenseModel.getAll(filters);

      const response = {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve expenses',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/expenses/:id - Get expense by ID
  static async getById(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

      const { id } = req.params;
      const expenseId = Number(id);

      if (isNaN(expenseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid expense ID',
          message: 'Expense ID must be a valid number'
        });
        return;
      }

      const expense = await ExpenseModel.getById(expenseId);

      if (!expense) {
        res.status(404).json({
          success: false,
          error: 'Expense not found',
          message: `Expense with ID ${expenseId} not found`
        });
        return;
      }

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);

      res.json({
        success: true,
        data: expense
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve expense',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/expenses - Create new expense
  static async create(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

      /* -------------- 1.  build body -------------- */
      let body: any;
      if (req.is('multipart/form-data')) {
        body = {
          title: req.body.title,
          amount: Number(req.body.amount),
          category: req.body.category,
          date: req.body.date,          // YYYY-MM-DD
          description: req.body.description,
          notes: req.body.notes,
          employeeId: req.body.employeeId ? Number(req.body.employeeId) : null
        };
        if (req.file) {
          const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://render-f67c.onrender.com'
            : 'http://localhost:3001';
          body.billUrl = `${baseUrl}/bills/${req.file.filename}`;
        }
      } else {
        body = req.body;   // classic JSON call
      }

      /* -------------- 2.  same validation you already had -------------- */
      const required = ['title', 'amount', 'category', 'date', 'description'];
      const missing = required.filter(f => !body[f]);
      if (missing.length) {
        res.status(400).json({ success: false, error: 'Missing fields', message: missing.join(', ') });
        return;
      }
      if (isNaN(body.amount) || body.amount < 0) {
        res.status(400).json({ success: false, error: 'Invalid amount' }); return;
      }
      const validCats: ExpenseCategory[] = ['Materials', 'Tools', 'Rent', 'Utilities', 'Transportation', 'Marketing', 'Staff Salaries', 'Office Supplies', 'Maintenance', 'Professional Services', 'Insurance', 'Miscellaneous'];
      if (!validCats.includes(body.category)) {
        res.status(400).json({ success: false, error: 'Invalid category' }); return;
      }

      /* -------------- 3.  create -------------- */
      const created = await ExpenseModel.create(body);

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 201, duration);
      res.status(201).json({ success: true, data: created, message: 'Expense created' });
    } catch (err) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, err);
      res.status(500).json({ success: false, error: 'Failed to create expense', message: (err as Error).message });
    }
  }

  // PUT /api/expenses/:id  (multipart or JSON)
  static async update(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      logApi.request(req.method, req.url, req.ip ?? 'unknown', req.get('User-Agent') ?? 'unknown');

      const expenseId = Number(req.params.id);
      if (isNaN(expenseId)) {
        res.status(400).json({ success: false, error: 'Invalid expense ID' });
        return;
      }

      /* ---------- build updates object (same as create) ---------- */
      let updates: any;
      if (req.is('multipart/form-data')) {
        updates = {
          title: req.body.title,
          amount: req.body.amount ? Number(req.body.amount) : undefined,
          category: req.body.category,
          date: req.body.date,
          description: req.body.description,
          notes: req.body.notes,
          employeeId: req.body.employeeId ? Number(req.body.employeeId) : undefined
        };
        // new bill file supplied?
        if (req.file) {
          const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://render-f67c.onrender.com'
            : 'http://localhost:3001';
          updates.billUrl = `${baseUrl}/bills/${req.file.filename}`;
        }
      } else {
        updates = req.body;   // classic JSON call
      }

      /* ---------- identical validation to create ---------- */
      if (updates.amount !== undefined && (isNaN(updates.amount) || updates.amount < 0)) {
        res.status(400).json({ success: false, error: 'Amount must be ≥ 0' }); return;
      }
      const validCats: ExpenseCategory[] = ['Materials', 'Tools', 'Rent', 'Utilities', 'Transportation', 'Marketing', 'Staff Salaries', 'Office Supplies', 'Maintenance', 'Professional Services', 'Insurance', 'Miscellaneous'];
      if (updates.category && !validCats.includes(updates.category)) {
        res.status(400).json({ success: false, error: `Category must be one of: ${validCats.join(', ')}` }); return;
      }

      const updated = await ExpenseModel.update(expenseId, updates);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Expense not found' }); return;
      }

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      res.json({ success: true, data: updated, message: 'Expense updated successfully' });
    } catch (err) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, err);
      res.status(500).json({ success: false, error: 'Failed to update expense', message: (err as Error).message });
    }
  }

  // DELETE /api/expenses/:id - Delete expense
  static async delete(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

      const { id } = req.params;
      const expenseId = Number(id);

      if (isNaN(expenseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid expense ID',
          message: 'Expense ID must be a valid number'
        });
        return;
      }

      const deleted = await ExpenseModel.delete(expenseId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Expense not found',
          message: `Expense with ID ${expenseId} not found`
        });
        return;
      }

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);

      res.json({
        success: true,
        message: 'Expense deleted successfully'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);

      res.status(500).json({
        success: false,
        error: 'Failed to delete expense',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/expenses/stats - Get expense statistics
  static async getStats(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

      const { month, year, category } = req.query;

      const filters = {
        month: month as string,
        year: year as string,
        category: category as string
      };

      const stats = await ExpenseModel.getStats(filters);

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/expenses/employees - Get all employees
  static async getEmployees(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

      const employees = await ExpenseModel.getAllEmployees();

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);

      res.json({
        success: true,
        data: employees
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve employees',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/expenses/employees - Create new employee
  static async createEmployee(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

      const employeeData = req.body;

      // Validate required fields
      const requiredFields = ['name', 'role', 'monthlySalary', 'dateAdded'];
      const missingFields = requiredFields.filter(field => !employeeData[field]);

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: `Required fields missing: ${missingFields.join(', ')}`
        });
        return;
      }

      // Validate salary
      if (isNaN(Number(employeeData.monthlySalary)) || Number(employeeData.monthlySalary) < 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid salary',
          message: 'Monthly salary must be a valid number greater than or equal to 0'
        });
        return;
      }

      const createdEmployee = await ExpenseModel.createEmployee(employeeData);

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 201, duration);

      res.status(201).json({
        success: true,
        data: createdEmployee,
        message: 'Employee created successfully'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);

      res.status(500).json({
        success: false,
        error: 'Failed to create employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/expenses/employees/:id - Update employee
  static async updateEmployee(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

      const { id } = req.params;
      const employeeId = Number(id);

      if (isNaN(employeeId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
          message: 'Employee ID must be a valid number'
        });
        return;
      }

      const updates = req.body;

      // Validate salary if provided
      if (updates.monthlySalary && (isNaN(Number(updates.monthlySalary)) || Number(updates.monthlySalary) < 0)) {
        res.status(400).json({
          success: false,
          error: 'Invalid salary',
          message: 'Monthly salary must be a valid number greater than or equal to 0'
        });
        return;
      }

      const updatedEmployee = await ExpenseModel.updateEmployee(employeeId, updates);

      if (!updatedEmployee) {
        res.status(404).json({
          success: false,
          error: 'Employee not found',
          message: `Employee with ID ${employeeId} not found`
        });
        return;
      }

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);

      res.json({
        success: true,
        data: updatedEmployee,
        message: 'Employee updated successfully'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);

      res.status(500).json({
        success: false,
        error: 'Failed to update employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE /api/expenses/employees/:id - Delete employee
  static async deleteEmployee(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

      const { id } = req.params;
      const employeeId = Number(id);

      if (isNaN(employeeId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
          message: 'Employee ID must be a valid number'
        });
        return;
      }

      const deleted = await ExpenseModel.deleteEmployee(employeeId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Employee not found',
          message: `Employee with ID ${employeeId} not found`
        });
        return;
      }

      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);

      res.json({
        success: true,
        message: 'Employee deleted successfully'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);

      res.status(500).json({
        success: false,
        error: 'Failed to delete employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}