# Backend API Structure Reference

This document outlines the recommended backend structure that would work with the frontend API service layer.

## Recommended Backend Structure (Node.js/Express + TypeScript)

```
backend/
├── src/
│   ├── controllers/          # MVC Controllers
│   │   ├── AuthController.ts
│   │   ├── EnquiryController.ts
│   │   ├── ServiceController.ts
│   │   ├── PickupController.ts
│   │   ├── InventoryController.ts
│   │   ├── ExpenseController.ts
│   │   ├── CustomerController.ts
│   │   ├── StaffController.ts
│   │   ├── DashboardController.ts
│   │   ├── ReportController.ts
│   │   └── UploadController.ts
│   │
│   ├── models/               # Database Models (Mongoose/Prisma/Sequelize)
│   │   ├── User.ts
│   │   ├── Enquiry.ts
│   │   ├── ServiceOrder.ts
│   │   ├── PickupOrder.ts
│   │   ├── InventoryItem.ts
│   │   ├── Expense.ts
│   │   ├── Customer.ts
│   │   └── StaffMember.ts
│   │
│   ├── routes/               # API Routes
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── enquiries.ts
│   │   ├── services.ts
│   │   ├── pickups.ts
│   │   ├── inventory.ts
│   │   ├── expenses.ts
│   │   ├── customers.ts
│   │   ├── staff.ts
│   │   ├── dashboard.ts
│   │   ├── reports.ts
│   │   └── uploads.ts
│   │
│   ├── services/             # Business Logic Services
│   │   ├── AuthService.ts
│   │   ├── EnquiryService.ts
│   │   ├── ServiceOrderService.ts
│   │   ├── PickupService.ts
│   │   ├── InventoryService.ts
│   │   ├── ExpenseService.ts
│   │   ├── CustomerService.ts
│   │   ├── StaffService.ts
│   │   ├── NotificationService.ts
│   │   └── ReportService.ts
│   │
│   ├── middleware/           # Express Middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimit.ts
│   │   └── upload.ts
│   │
│   ├── utils/               # Utility Functions
│   │   ├── database.ts
│   │   ├── validation.ts
│   │   ├── encryption.ts
│   │   ├── jwt.ts
│   │   ├── email.ts
│   │   └── fileUpload.ts
│   │
│   ├── types/               # Shared Types (same as frontend)
│   │   └── index.ts
│   │
│   ├── config/              # Configuration
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   ├── upload.ts
│   │   └── environment.ts
│   │
│   └── app.ts               # Express App Setup
│
├── uploads/                 # File Upload Directory
├── tests/                   # Test Files
├── docs/                    # API Documentation
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## API Endpoints Structure

### Authentication Routes (`/api/auth`)
```typescript
POST   /api/auth/login       # User login
POST   /api/auth/logout      # User logout
POST   /api/auth/register    # User registration
POST   /api/auth/refresh     # Refresh JWT token
GET    /api/auth/profile     # Get user profile
PUT    /api/auth/profile     # Update user profile
```

### Enquiries Routes (`/api/enquiries`)
```typescript
GET    /api/enquiries                    # Get all enquiries (paginated)
GET    /api/enquiries/:id               # Get enquiry by ID
POST   /api/enquiries                   # Create new enquiry
PUT    /api/enquiries/:id               # Update enquiry
DELETE /api/enquiries/:id               # Delete enquiry
GET    /api/enquiries/search            # Search enquiries
GET    /api/enquiries/stats             # Get enquiry statistics
GET    /api/enquiries/export            # Export enquiries data
```

### Services Routes (`/api/services`)
```typescript
GET    /api/services                    # Get all services (paginated)
GET    /api/services/:id               # Get service by ID
POST   /api/services                   # Create new service
PUT    /api/services/:id               # Update service
DELETE /api/services/:id               # Delete service
GET    /api/services/status/:status    # Get services by status
PATCH  /api/services/:id/status        # Update service status
POST   /api/services/:id/photos        # Add photos to service
GET    /api/services/:id/history       # Get work history
POST   /api/services/:id/history       # Add work history entry
GET    /api/services/search            # Search services
GET    /api/services/stats             # Get service statistics
```

### Pickups Routes (`/api/pickups`)
```typescript
GET    /api/pickups                    # Get all pickups (paginated)
GET    /api/pickups/:id               # Get pickup by ID
POST   /api/pickups                   # Create new pickup
PUT    /api/pickups/:id               # Update pickup
DELETE /api/pickups/:id               # Delete pickup
GET    /api/pickups/status/:status    # Get pickups by status
PATCH  /api/pickups/:id/status        # Update pickup status
PATCH  /api/pickups/:id/assign        # Assign pickup to staff
POST   /api/pickups/schedule          # Schedule multiple pickups
GET    /api/pickups/search            # Search pickups
GET    /api/pickups/stats             # Get pickup statistics
```

### Inventory Routes (`/api/inventory`)
```typescript
GET    /api/inventory                     # Get all inventory items
GET    /api/inventory/:id                # Get item by ID
POST   /api/inventory                    # Create new item
PUT    /api/inventory/:id                # Update item
DELETE /api/inventory/:id                # Delete item
GET    /api/inventory/category/:category  # Get items by category
PATCH  /api/inventory/:id/stock          # Update stock quantity
GET    /api/inventory/low-stock          # Get low stock items
GET    /api/inventory/search             # Search inventory
GET    /api/inventory/stats              # Get inventory statistics
```

### Expenses Routes (`/api/expenses`)
```typescript
GET    /api/expenses                     # Get all expenses (paginated)
GET    /api/expenses/:id                # Get expense by ID
POST   /api/expenses                    # Create new expense
PUT    /api/expenses/:id                # Update expense
DELETE /api/expenses/:id                # Delete expense
GET    /api/expenses/category/:category  # Get expenses by category
GET    /api/expenses/monthly            # Get monthly expenses
GET    /api/expenses/yearly             # Get yearly expenses
GET    /api/expenses/search             # Search expenses
GET    /api/expenses/stats              # Get expense statistics
GET    /api/expenses/export             # Export expenses data
```

### Customers Routes (`/api/customers`)
```typescript
GET    /api/customers                   # Get all customers (paginated)
GET    /api/customers/:id              # Get customer by ID
POST   /api/customers                  # Create new customer
PUT    /api/customers/:id              # Update customer
DELETE /api/customers/:id              # Delete customer
GET    /api/customers/:id/history      # Get customer history
GET    /api/customers/:id/services     # Get customer services
GET    /api/customers/search           # Search customers
GET    /api/customers/stats            # Get customer statistics
```

### Staff Routes (`/api/staff`)
```typescript
GET    /api/staff                      # Get all staff (paginated)
GET    /api/staff/:id                 # Get staff by ID
POST   /api/staff                     # Create new staff
PUT    /api/staff/:id                 # Update staff
DELETE /api/staff/:id                 # Delete staff
GET    /api/staff/role/:role          # Get staff by role
GET    /api/staff/active              # Get active staff
GET    /api/staff/:id/workload        # Get staff workload
GET    /api/staff/search              # Search staff
```

### Dashboard Routes (`/api/dashboard`)
```typescript
GET    /api/dashboard/stats            # Get dashboard statistics
GET    /api/dashboard/overview         # Get dashboard overview
GET    /api/dashboard/charts           # Get chart data
GET    /api/dashboard/recent           # Get recent activities
```

### Reports Routes (`/api/reports`)
```typescript
GET    /api/reports/services           # Service reports
GET    /api/reports/expenses           # Expense reports
GET    /api/reports/revenue            # Revenue reports
GET    /api/reports/inventory          # Inventory reports
GET    /api/reports/customers          # Customer reports
POST   /api/reports/custom             # Generate custom report
```

### Upload Routes (`/api/uploads`)
```typescript
POST   /api/uploads/images             # Upload images
POST   /api/uploads/documents          # Upload documents
DELETE /api/uploads/:filename          # Delete uploaded file
```

## Example Controller Implementation

### EnquiryController.ts
```typescript
import { Request, Response } from 'express';
import { EnquiryService } from '../services/EnquiryService';
import { enquiryFormSchema } from '../schemas';

export class EnquiryController {
  private enquiryService: EnquiryService;

  constructor() {
    this.enquiryService = new EnquiryService();
  }

  // GET /api/enquiries
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await this.enquiryService.getAll({
        page: Number(page),
        limit: Number(limit),
        filters
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/enquiries/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const enquiry = await this.enquiryService.getById(Number(id));
      if (!enquiry) {
        return res.status(404).json({ success: false, error: 'Enquiry not found' });
      }
      res.json({ success: true, data: enquiry });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST /api/enquiries
  async create(req: Request, res: Response) {
    try {
      const validatedData = enquiryFormSchema.parse(req.body);
      const enquiry = await this.enquiryService.create(validatedData);
      res.status(201).json({ success: true, data: enquiry });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // PUT /api/enquiries/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const enquiry = await this.enquiryService.update(Number(id), req.body);
      res.json({ success: true, data: enquiry });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // DELETE /api/enquiries/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.enquiryService.delete(Number(id));
      res.json({ success: true, message: 'Enquiry deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/enquiries/stats
  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.enquiryService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

## Database Models (Example with Mongoose)

### Enquiry Model
```typescript
import mongoose, { Document, Schema } from 'mongoose';
import { Enquiry } from '../types';

interface EnquiryDocument extends Enquiry, Document {}

const enquirySchema = new Schema<EnquiryDocument>({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  message: { type: String, required: true },
  inquiryType: { 
    type: String, 
    enum: ['Instagram', 'Facebook', 'WhatsApp', 'Phone', 'Walk-in', 'Website'],
    required: true 
  },
  product: { 
    type: String, 
    enum: ['Bag', 'Shoe', 'Wallet', 'Belt', 'All type furniture'],
    required: true 
  },
  quantity: { type: Number, required: true, min: 1 },
  date: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['new', 'contacted', 'converted', 'closed', 'lost'],
    default: 'new' 
  },
  contacted: { type: Boolean, default: false },
  contactedAt: { type: String },
  assignedTo: { type: String },
  notes: { type: String }
}, {
  timestamps: true
});

export const EnquiryModel = mongoose.model<EnquiryDocument>('Enquiry', enquirySchema);
```

## Environment Configuration

### .env.example
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/cobbler_db
# or for PostgreSQL
# DATABASE_URL=postgresql://username:password@localhost:5432/cobbler_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Key Features of This Backend Structure

1. **MVC Architecture**: Clear separation of concerns
2. **RESTful API**: Standard HTTP methods and status codes
3. **Type Safety**: Full TypeScript support
4. **Validation**: Zod schema validation
5. **Authentication**: JWT-based authentication
6. **File Uploads**: Support for image and document uploads
7. **Error Handling**: Consistent error responses
8. **Database Agnostic**: Can work with MongoDB, PostgreSQL, MySQL
9. **Scalable**: Easy to add new features and endpoints
10. **Testing Ready**: Structure supports unit and integration testing

This backend structure perfectly complements the frontend API service layer you now have!
