import mysql from 'mysql2/promise';
import { logDatabase } from '../utils/logger';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'zonixtech@111',
  database: process.env.DB_NAME || 'cobbler_db',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
};

// Create connection pool
let pool: mysql.Pool;

export const initializeDatabase = async (): Promise<void> => {
  try {
    logDatabase.connection('Initializing database connection pool', dbConfig);
    
    const dbName = dbConfig.database;
    const createDbConfig = {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      connectionLimit: dbConfig.connectionLimit,
      acquireTimeout: dbConfig.acquireTimeout,
      timeout: dbConfig.timeout,
      reconnect: dbConfig.reconnect,
      charset: dbConfig.charset,
      collation: dbConfig.collation
    };
    
    const tempPool = mysql.createPool(createDbConfig);
    const tempConnection = await tempPool.getConnection();
    
    try {
      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      logDatabase.success(`Database '${dbName}' created/verified successfully`);
    } catch (dbError) {
      logDatabase.error(`Failed to create database '${dbName}'`, dbError);
      throw dbError;
    } finally {
      tempConnection.release();
      await tempPool.end();
    }
    
    pool = mysql.createPool(dbConfig);
    
    // Test the connection
    const connection = await pool.getConnection();
    logDatabase.connection('Database connection pool created successfully');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    logDatabase.success('Database connection test successful', { result: rows });
    
    connection.release();
    
  } catch (error) {
    logDatabase.error('Failed to initialize database connection pool', error);
    throw error;
  }
};

export const getConnection = async (): Promise<mysql.PoolConnection> => {
  try {
    const connection = await pool.getConnection();
    logDatabase.connection('Database connection acquired from pool');
    return connection;
  } catch (error) {
    logDatabase.error('Failed to get database connection from pool', error);
    throw error;
  }
};

export const executeQuery = async <T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> => {
  const startTime = Date.now();
  
  try {
    logDatabase.query(query, params);
    
    const [rows] = await pool.execute(query, params);
    const duration = Date.now() - startTime;
    
    logDatabase.success('Query executed successfully', { 
      rowCount: Array.isArray(rows) ? rows.length : 0,
      duration: `${duration}ms`
    });
    
    return rows as T[];
  } catch (error) {
    const duration = Date.now() - startTime;
    logDatabase.error('Query execution failed', { 
      query, 
      params, 
      duration: `${duration}ms`,
      error 
    });
    throw error;
  }
};

export const executeTransaction = async <T = any>(
  queries: Array<{ query: string; params?: any[] }>
): Promise<T[]> => {
  const connection = await getConnection();
  
  try {
    logDatabase.connection('Starting database transaction');
    await connection.beginTransaction();
    
    const results: T[] = [];
    
    for (const { query, params = [] } of queries) {
      logDatabase.query(query, params);
      const [rows] = await connection.execute(query, params);
      results.push(rows as T);
    }
    
    await connection.commit();
    logDatabase.success('Database transaction committed successfully', { 
      queryCount: queries.length 
    });
    
    return results;
  } catch (error) {
    logDatabase.error('Database transaction failed, rolling back', error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    logDatabase.connection('Database connection released after transaction');
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (pool) {
      await pool.end();
      logDatabase.connection('Database connection pool closed successfully');
    }
  } catch (error) {
    logDatabase.error('Failed to close database connection pool', error);
    throw error;
  }
};

// Database schema creation
export const createTables = async (): Promise<void> => {
  try {
    logDatabase.connection('Creating database tables...');
    
    const tables = [
      // Core Enquiry table
      `CREATE TABLE IF NOT EXISTS enquiries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        message TEXT NOT NULL,
        inquiry_type ENUM('Instagram', 'Facebook', 'WhatsApp', 'Phone', 'Walk-in', 'Website') NOT NULL,
        product ENUM('Bag', 'Shoe', 'Wallet', 'Belt', 'All type furniture') NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        date DATE NOT NULL,
        status ENUM('new', 'contacted', 'converted', 'closed', 'lost') DEFAULT 'new',
        contacted BOOLEAN DEFAULT FALSE,
        contacted_at DATETIME NULL,
        assigned_to VARCHAR(255) NULL,
        notes TEXT NULL,
        current_stage ENUM('enquiry', 'pickup', 'service', 'billing', 'delivery', 'completed') DEFAULT 'enquiry',
        quoted_amount DECIMAL(10,2) NULL,
        final_amount DECIMAL(10,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_current_stage (current_stage),
        INDEX idx_date (date),
        INDEX idx_customer_name (customer_name)
      )`,
      
      // Pickup stage details - Enhanced for proper pickup workflow
      `CREATE TABLE IF NOT EXISTS pickup_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        enquiry_id INT NOT NULL,
        status ENUM('scheduled', 'assigned', 'collected', 'received') NOT NULL DEFAULT 'scheduled',
        scheduled_time DATETIME NULL,
        assigned_to VARCHAR(100) NULL,
        collection_notes TEXT NULL,
        collected_at DATETIME NULL,
        pin VARCHAR(10) NULL,
        collection_photo_id INT NULL,
        received_photo_id INT NULL,
        received_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
        INDEX idx_enquiry_id (enquiry_id),
        INDEX idx_status (status),
        INDEX idx_assigned_to (assigned_to)
      )`,
      
      // Service stage details - Enhanced for proper service workflow
      `CREATE TABLE IF NOT EXISTS service_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        enquiry_id INT NOT NULL,
        estimated_cost DECIMAL(10,2) NULL,
        actual_cost DECIMAL(10,2) NULL,
        work_notes TEXT NULL,
        completed_at DATETIME NULL,
        received_photo_id INT NULL,
        received_notes TEXT NULL,
        overall_before_photo_id INT NULL,
        overall_after_photo_id INT NULL,
        overall_before_notes TEXT NULL,
        overall_after_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
        INDEX idx_enquiry_id (enquiry_id)
      )`,
      
      // Service types for each enquiry
      `CREATE TABLE IF NOT EXISTS service_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        enquiry_id INT NOT NULL,
        service_type ENUM('Sole Replacement', 'Zipper Repair', 'Cleaning & Polish', 'Stitching', 'Leather Treatment', 'Hardware Repair') NOT NULL,
        status ENUM('pending', 'in-progress', 'done') DEFAULT 'pending',
        department VARCHAR(255) NULL,
        assigned_to VARCHAR(255) NULL,
        started_at DATETIME NULL,
        completed_at DATETIME NULL,
        work_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
        INDEX idx_enquiry_id (enquiry_id),
        INDEX idx_status (status)
      )`,
      
      // Photos storage - Enhanced with proper constraints and types
      `CREATE TABLE IF NOT EXISTS photos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        enquiry_id INT NOT NULL,
        stage ENUM('pickup', 'service', 'delivery', 'billing') NOT NULL,
        photo_type ENUM('before_photo', 'after_photo', 'overall_before', 'overall_after', 'collection_proof', 'received_condition') NOT NULL,
        photo_data LONGTEXT NOT NULL,
        notes TEXT NULL,
        service_type_id INT NULL,
        service_detail_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
        FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE,
        FOREIGN KEY (service_detail_id) REFERENCES service_details(id) ON DELETE CASCADE,
        INDEX idx_enquiry_id (enquiry_id),
        INDEX idx_stage (stage),
        INDEX idx_photo_type (photo_type),
        INDEX idx_service_type_id (service_type_id),
        INDEX idx_service_detail_id (service_detail_id)
      )`,
      
      // Delivery stage details
      `CREATE TABLE IF NOT EXISTS delivery_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        enquiry_id INT NOT NULL,
        status ENUM('ready', 'scheduled', 'out-for-delivery', 'delivered') DEFAULT 'ready',
        delivery_method ENUM('customer-pickup', 'home-delivery') DEFAULT 'customer-pickup',
        scheduled_time DATETIME NULL,
        assigned_to VARCHAR(255) NULL,
        delivery_address TEXT NULL,
        customer_signature LONGTEXT NULL,
        delivery_notes TEXT NULL,
        delivered_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
        INDEX idx_enquiry_id (enquiry_id),
        INDEX idx_status (status)
      )`,
      
      // Billing details - Updated to match current BillingDetails structure
      `CREATE TABLE IF NOT EXISTS billing_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        enquiry_id INT NOT NULL,
        final_amount DECIMAL(10,2) NOT NULL,
        gst_included BOOLEAN DEFAULT TRUE,
        gst_rate DECIMAL(5,2) DEFAULT 18.00,
        gst_amount DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        invoice_number VARCHAR(50) NULL,
        invoice_date DATE NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        business_info JSON NULL,
        notes TEXT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
        INDEX idx_enquiry_id (enquiry_id),
        INDEX idx_invoice_number (invoice_number)
      )`,
      
      // Billing items
      `CREATE TABLE IF NOT EXISTS billing_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        billing_id INT NOT NULL,
        service_type VARCHAR(255) NOT NULL,
        original_amount DECIMAL(10,2) NOT NULL,
        discount_value DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(10,2) NOT NULL,
        final_amount DECIMAL(10,2) NOT NULL,
        gst_rate DECIMAL(5,2) DEFAULT 18.00,
        gst_amount DECIMAL(10,2) NOT NULL,
        description TEXT NULL,
        FOREIGN KEY (billing_id) REFERENCES billing_details(id) ON DELETE CASCADE,
        INDEX idx_billing_id (billing_id)
      )`,
      
      // Simple authentication table
      `CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_token (token)
      )`,
      
      // Inventory management tables - Added for backend API integration
      `CREATE TABLE IF NOT EXISTS inventory_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        min_stock INT NOT NULL DEFAULT 5,
        unit VARCHAR(50) NOT NULL,
        purchase_price DECIMAL(10,2) NOT NULL,
        selling_price DECIMAL(10,2) NOT NULL,
        last_updated DATE NOT NULL,
        last_updated_by VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_category (category),
        INDEX idx_quantity (quantity),
        INDEX idx_min_stock (min_stock)
      )`,
      
      // Inventory update history tracking - Added for backend API integration
      `CREATE TABLE IF NOT EXISTS inventory_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        inventory_item_id INT NOT NULL,
        action ENUM('Created', 'Updated') NOT NULL,
        quantity_change INT NOT NULL,
        new_quantity INT NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
        INDEX idx_inventory_item_id (inventory_item_id),
        INDEX idx_action (action),
        INDEX idx_updated_at (updated_at)
      )`,
      
      // Stock alerts for dashboard low stock alerts - Added for DashboardModel support
      `CREATE TABLE IF NOT EXISTS stock_alerts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        item_name VARCHAR(255) NOT NULL,
        units_in_stock INT NOT NULL DEFAULT 0,
        min_stock_level INT NOT NULL DEFAULT 5,
        alert_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_item_name (item_name),
        INDEX idx_units_in_stock (units_in_stock),
        INDEX idx_min_stock_level (min_stock_level)
      )`,
      
      // Employees table for expense management - Added for ExpenseModel support
      `CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        monthly_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        date_added DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active),
        INDEX idx_date_added (date_added)
      )`,
      
      // Expenses table for expense tracking - Added for ExpenseModel support
      `CREATE TABLE IF NOT EXISTS expenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category ENUM('Materials', 'Tools', 'Rent', 'Utilities', 'Transportation', 'Marketing', 'Staff Salaries', 'Office Supplies', 'Maintenance', 'Professional Services', 'Insurance', 'Miscellaneous') NOT NULL,
        date DATE NOT NULL,
        description TEXT NULL,
        bill_url TEXT NULL,
        notes TEXT NULL,
        employee_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
        INDEX idx_title (title),
        INDEX idx_category (category),
        INDEX idx_date (date),
        INDEX idx_amount (amount),
        INDEX idx_employee_id (employee_id)
      )`
    ];
    
    for (const tableQuery of tables) {
      await executeQuery(tableQuery);
    }
    
    logDatabase.success('All database tables created successfully');
    
  } catch (error) {
    logDatabase.error('Failed to create database tables', error);
    throw error;
  }
};

export default {
  initializeDatabase,
  getConnection,
  executeQuery,
  executeTransaction,
  closeDatabase,
  createTables
};