import { executeQuery, getConnection } from '../config/database';
import { logDatabase } from '../utils/logger';
import { Employee, Expense, ExpenseStats, CategoryBreakdown, ExpenseFilters, ExpenseCategory } from '../types';

export class ExpenseModel {

  // Convert database row to Expense object
  private static mapDatabaseToExpense(dbExpense: any): Expense {
    return {
      id: dbExpense.id,
      title: dbExpense.title,
      amount: dbExpense.amount,
      category: dbExpense.category as ExpenseCategory,
      date: dbExpense.date,
      description: dbExpense.description || dbExpense.title, // Add description field
      billUrl: dbExpense.bill_url,
      notes: dbExpense.notes,
      employeeId: dbExpense.employee_id,
      employeeName: dbExpense.employee_name,
      createdAt: dbExpense.created_at,
      updatedAt: dbExpense.updated_at
    };
  }

  // Convert database row to Employee object
  private static mapDatabaseToEmployee(dbEmployee: any): Employee {
    return {
      id: dbEmployee.id,
      name: dbEmployee.name,
      role: dbEmployee.role,
      monthlySalary: dbEmployee.monthly_salary,
      dateAdded: dbEmployee.date_added,
      isActive: dbEmployee.is_active,
      createdAt: dbEmployee.created_at,
      updatedAt: dbEmployee.updated_at
    };
  }

  // Get all expenses with optional filtering and pagination
  static async getAll(filters: ExpenseFilters = {}): Promise<{
    data: Expense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number
  }> {
    try {
      logDatabase.connection('Getting all expenses with filters', filters);

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const whereConditions: string[] = [];
      const params: any[] = [];

      if (filters.month && filters.month !== 'all') {
        whereConditions.push('MONTH(date) = ?');
        params.push(filters.month);
      }

      if (filters.year && filters.year !== 'all') {
        whereConditions.push('YEAR(date) = ?');
        params.push(filters.year);
      }

      if (filters.category && filters.category !== 'all') {
        whereConditions.push('category = ?');
        params.push(filters.category);
      }

      if (filters.search) {
        whereConditions.push('(title LIKE ? OR notes LIKE ? OR category LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM expenses ${whereClause}`;
      const countResult = await executeQuery<{ total: number }>(countQuery, params);
      const total = countResult[0]?.total || 0;

      // Get paginated data
      const dataQuery = `
        SELECT e.*, emp.name as employee_name 
        FROM expenses e 
        LEFT JOIN employees emp ON e.employee_id = emp.id 
        ${whereClause}
        ORDER BY e.date DESC, e.id DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `;

      const dbExpenses = await executeQuery<any>(dataQuery, params);

      // Convert to Expense objects
      const expenses = dbExpenses.map(this.mapDatabaseToExpense);

      const totalPages = Math.ceil(total / limit);

      logDatabase.success('Retrieved expenses successfully', {
        count: expenses.length,
        total,
        page,
        limit,
        totalPages
      });

      return {
        data: expenses,
        total,
        page,
        limit,
        totalPages
      };

    } catch (error) {
      logDatabase.error('Failed to get all expenses', error);
      throw error;
    }
  }

  // Get expense by ID
  static async getById(id: number): Promise<Expense | null> {
    try {
      logDatabase.connection('Getting expense by ID', { id });

      const query = `
        SELECT e.*, emp.name as employee_name 
        FROM expenses e 
        LEFT JOIN employees emp ON e.employee_id = emp.id 
        WHERE e.id = ?
      `;
      const dbExpenses = await executeQuery<any>(query, [id]);

      if (dbExpenses.length === 0) {
        logDatabase.success('Expense not found', { id });
        return null;
      }

      const expense = this.mapDatabaseToExpense(dbExpenses[0]);

      logDatabase.success('Retrieved expense successfully', { id });

      return expense;

    } catch (error) {
      logDatabase.error('Failed to get expense by ID', error);
      throw error;
    }
  }

  // Create new expense
  static async create(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
    try {
      logDatabase.connection('Creating new expense', { title: expenseData.title });

      const query = `
        INSERT INTO expenses (
          title, amount, category, date, description, bill_url, notes, employee_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        expenseData.title,
        expenseData.amount,
        expenseData.category,
        expenseData.date,
        expenseData.description,
        expenseData.billUrl || null,
        expenseData.notes || null,
        expenseData.employeeId || null
      ];

      const connection = await getConnection();
      let newId: number;
      try {
        const [result] = await connection.execute(query, params);
        newId = (result as any).insertId;

        if (!newId) {
          throw new Error('Failed to get insert ID');
        }
      } finally {
        connection.release();
      }

      // Get the created expense
      const createdExpense = await this.getById(newId);

      if (!createdExpense) {
        throw new Error('Failed to retrieve created expense');
      }

      logDatabase.success('Expense created successfully', {
        id: newId,
        title: expenseData.title
      });

      return createdExpense;

    } catch (error) {
      logDatabase.error('Failed to create expense', error);
      throw error;
    }
  }

  // Update expense
  static async update(id: number, updates: Partial<Expense>): Promise<Expense | null> {
    try {
      logDatabase.connection('Updating expense', { id, updates });

      // Check if expense exists
      const existingExpense = await this.getById(id);
      if (!existingExpense) {
        logDatabase.success('Expense not found for update', { id });
        return null;
      }

      // Build SET clause
      const setFields: string[] = [];
      const params: any[] = [];

      if (updates.title !== undefined) {
        setFields.push('title = ?');
        params.push(updates.title);
      }

      if (updates.amount !== undefined) {
        setFields.push('amount = ?');
        params.push(updates.amount);
      }

      if (updates.category !== undefined) {
        setFields.push('category = ?');
        params.push(updates.category);
      }

      if (updates.date !== undefined) {
        setFields.push('date = ?');
        params.push(updates.date);
      }

      if (updates.description !== undefined) {
        setFields.push('description = ?');
        params.push(updates.description);
      }

      if (updates.billUrl !== undefined) {
        setFields.push('bill_url = ?');
        params.push(updates.billUrl);
      }

      if (updates.notes !== undefined) {
        setFields.push('notes = ?');
        params.push(updates.notes);
      }

      if (updates.employeeId !== undefined) {
        setFields.push('employee_id = ?');
        params.push(updates.employeeId);
      }

      if (setFields.length === 0) {
        logDatabase.success('No updates to apply', { id });
        return existingExpense;
      }

      // Add updated_at timestamp
      setFields.push('updated_at = CURRENT_TIMESTAMP');

      const query = `UPDATE expenses SET ${setFields.join(', ')} WHERE id = ?`;
      params.push(id);

      await executeQuery(query, params);

      // Get updated expense
      const updatedExpense = await this.getById(id);

      logDatabase.success('Expense updated successfully', { id });

      return updatedExpense;

    } catch (error) {
      logDatabase.error('Failed to update expense', error);
      throw error;
    }
  }

  // Delete expense
  static async delete(id: number): Promise<boolean> {
    try {
      logDatabase.connection('Deleting expense', { id });

      // Check if expense exists
      const existingExpense = await this.getById(id);
      if (!existingExpense) {
        logDatabase.success('Expense not found for deletion', { id });
        return false;
      }

      const query = 'DELETE FROM expenses WHERE id = ?';
      await executeQuery(query, [id]);

      logDatabase.success('Expense deleted successfully', { id });

      return true;

    } catch (error) {
      logDatabase.error('Failed to delete expense', error);
      throw error;
    }
  }

  // Get expense statistics
  static async getStats(filters: {
    month?: string;
    year?: string;
    category?: string;
  } = {}): Promise<ExpenseStats> {
    try {
      logDatabase.connection('Getting expense statistics', filters);

      // Build WHERE clause
      const whereConditions: string[] = [];
      const params: any[] = [];

      if (filters.month && filters.month !== 'all') {
        whereConditions.push('MONTH(date) = ?');
        params.push(filters.month);
      }

      if (filters.year && filters.year !== 'all') {
        whereConditions.push('YEAR(date) = ?');
        params.push(filters.year);
      }

      if (filters.category && filters.category !== 'all') {
        whereConditions.push('category = ?');
        params.push(filters.category);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total stats
      const statsQuery = `
        SELECT 
          COUNT(*) as totalEntries,
          COALESCE(SUM(amount), 0) as monthlyTotal,
          COALESCE(AVG(amount), 0) as averageExpense
        FROM expenses 
        ${whereClause}
      `;

      const statsResult = await executeQuery<any>(statsQuery, params);
      const stats = statsResult[0] || {
        totalEntries: 0,
        monthlyTotal: 0,
        averageExpense: 0
      };

      // Get category breakdown
      const categoryQuery = `
        SELECT 
          category,
          COUNT(*) as entryCount,
          COALESCE(SUM(amount), 0) as totalAmount
        FROM expenses 
        ${whereClause}
        GROUP BY category
        ORDER BY totalAmount DESC
      `;

      const categoryResults = await executeQuery<any>(categoryQuery, params);

      const categoryBreakdown: CategoryBreakdown[] = categoryResults.map((cat: any) => ({
        category: cat.category,
        totalAmount: cat.totalAmount,
        entryCount: cat.entryCount,
        percentage: stats.monthlyTotal > 0 ? (cat.totalAmount / stats.monthlyTotal) * 100 : 0
      }));

      const result: ExpenseStats = {
        monthlyTotal: stats.monthlyTotal,
        filteredEntries: stats.totalEntries,
        averageExpense: stats.averageExpense,
        categoryBreakdown
      };

      logDatabase.success('Retrieved expense statistics successfully', result);

      return result;

    } catch (error) {
      logDatabase.error('Failed to get expense statistics', error);
      throw error;
    }
  }

  // Get all employees
  static async getAllEmployees(): Promise<Employee[]> {
    try {
      logDatabase.connection('Getting all employees');

      const query = 'SELECT * FROM employees WHERE is_active = true ORDER BY name';
      const dbEmployees = await executeQuery<any>(query);

      const employees = dbEmployees.map(this.mapDatabaseToEmployee);

      logDatabase.success('Retrieved employees successfully', {
        count: employees.length
      });

      return employees;

    } catch (error) {
      logDatabase.error('Failed to get employees', error);
      throw error;
    }
  }

  // Create new employee
  static async createEmployee(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
    try {
      logDatabase.connection('Creating new employee', { name: employeeData.name });

      const query = `
        INSERT INTO employees (
          name, role, monthly_salary, date_added, is_active
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const params = [
        employeeData.name,
        employeeData.role,
        employeeData.monthlySalary,
        employeeData.dateAdded,
        true
      ];

      const connection = await getConnection();
      let newId: number;
      try {
        const [result] = await connection.execute(query, params);
        newId = (result as any).insertId;

        if (!newId) {
          throw new Error('Failed to get insert ID');
        }
      } finally {
        connection.release();
      }

      // Get the created employee
      const createdEmployee = await this.getEmployeeById(newId);

      if (!createdEmployee) {
        throw new Error('Failed to retrieve created employee');
      }

      logDatabase.success('Employee created successfully', {
        id: newId,
        name: employeeData.name
      });

      return createdEmployee;

    } catch (error) {
      logDatabase.error('Failed to create employee', error);
      throw error;
    }
  }

  // Get employee by ID
  static async getEmployeeById(id: number): Promise<Employee | null> {
    try {
      logDatabase.connection('Getting employee by ID', { id });

      const query = 'SELECT * FROM employees WHERE id = ?';
      const dbEmployees = await executeQuery<any>(query, [id]);

      if (dbEmployees.length === 0) {
        logDatabase.success('Employee not found', { id });
        return null;
      }

      const employee = this.mapDatabaseToEmployee(dbEmployees[0]);

      logDatabase.success('Retrieved employee successfully', { id });

      return employee;

    } catch (error) {
      logDatabase.error('Failed to get employee by ID', error);
      throw error;
    }
  }

  // Update employee
  static async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee | null> {
    try {
      logDatabase.connection('Updating employee', { id, updates });

      // Check if employee exists
      const existingEmployee = await this.getEmployeeById(id);
      if (!existingEmployee) {
        logDatabase.success('Employee not found for update', { id });
        return null;
      }

      // Build SET clause
      const setFields: string[] = [];
      const params: any[] = [];

      if (updates.name !== undefined) {
        setFields.push('name = ?');
        params.push(updates.name);
      }

      if (updates.role !== undefined) {
        setFields.push('role = ?');
        params.push(updates.role);
      }

      if (updates.monthlySalary !== undefined) {
        setFields.push('monthly_salary = ?');
        params.push(updates.monthlySalary);
      }

      if (updates.dateAdded !== undefined) {
        setFields.push('date_added = ?');
        params.push(updates.dateAdded);
      }

      if (updates.isActive !== undefined) {
        setFields.push('is_active = ?');
        params.push(updates.isActive);
      }

      if (setFields.length === 0) {
        logDatabase.success('No updates to apply', { id });
        return existingEmployee;
      }

      // Add updated_at timestamp
      setFields.push('updated_at = CURRENT_TIMESTAMP');

      const query = `UPDATE employees SET ${setFields.join(', ')} WHERE id = ?`;
      params.push(id);

      await executeQuery(query, params);

      // Get updated employee
      const updatedEmployee = await this.getEmployeeById(id);

      logDatabase.success('Employee updated successfully', { id });

      return updatedEmployee;

    } catch (error) {
      logDatabase.error('Failed to update employee', error);
      throw error;
    }
  }

  // Delete employee (soft delete)
  static async deleteEmployee(id: number): Promise<boolean> {
    try {
      logDatabase.connection('Deleting employee', { id });

      // Check if employee exists
      const existingEmployee = await this.getEmployeeById(id);
      if (!existingEmployee) {
        logDatabase.success('Employee not found for deletion', { id });
        return false;
      }

      // Soft delete by setting is_active to false
      const query = 'UPDATE employees SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(query, [id]);

      logDatabase.success('Employee deleted successfully', { id });

      return true;

    } catch (error) {
      logDatabase.error('Failed to delete employee', error);
      throw error;
    }
  }
}