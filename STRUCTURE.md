# Project Structure Documentation

## Overview

This document outlines the improved structure of the Cobbler Management System, which now includes centralized types, schemas, and utilities for better maintainability and consistency.

## Directory Structure

```
src/
├── types/           # Centralized TypeScript interfaces
│   └── index.ts     # All business entity types
├── schemas/         # Zod validation schemas
│   └── index.ts     # Form and data validation schemas
├── services/        # API service layer
│   └── api.ts       # API client and service functions
├── constants/       # Application constants
│   └── index.ts     # Shared constants and options
├── utils/           # Utility functions
│   └── index.ts     # Common helper functions
├── components/      # React components (existing)
├── hooks/           # Custom React hooks (existing)
├── lib/             # Third-party library utilities (existing)
└── pages/           # Page components (existing)
```

## Key Improvements

### 1. Centralized Types (`src/types/index.ts`)

**Problem Solved**: Duplicate interfaces across components with inconsistent field names.

**Benefits**:
- Single source of truth for all data structures
- Consistent field naming across modules
- Better TypeScript intellisense
- Easier refactoring

**Usage**:
```typescript
import { Enquiry, ServiceOrder, PickupOrder } from '@/types';

// Use in components
const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
```

### 2. Zod Schemas (`src/schemas/index.ts`)

**Problem Solved**: No form validation, inconsistent data validation.

**Benefits**:
- Runtime type safety
- Form validation with detailed error messages
- API request/response validation
- Automatic TypeScript types from schemas

**Usage**:
```typescript
import { enquiryFormSchema, schemas } from '@/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(enquiryFormSchema),
  defaultValues: {
    customerName: '',
    phone: '',
    // ... other fields
  }
});
```

### 3. API Service Layer (`src/services/api.ts`)

**Problem Solved**: No centralized API communication, inconsistent error handling.

**Benefits**:
- **MVC Pattern**: Follows proper Model-View-Controller structure
- **CRUD Operations**: Standard Create, Read, Update, Delete operations
- **RESTful Endpoints**: Proper REST API conventions
- **Type-safe Responses**: Full TypeScript support
- **Class-based Services**: Object-oriented approach with inheritance
- **Authentication Support**: JWT token management
- **File Upload Support**: Image and document upload handling

**MVC Structure**:
- **Models**: Defined in `@/types` (Enquiry, ServiceOrder, etc.)
- **Controllers**: API service classes (EnquiryService, ServiceOrderService, etc.)
- **Views**: React components consuming the API services

**Usage**:
```typescript
import { apiService } from '@/services/api';

// Standard CRUD operations
const enquiries = await apiService.enquiries.getAll({ page: 1, limit: 10 });
const enquiry = await apiService.enquiries.getById(1);
const newEnquiry = await apiService.enquiries.create(enquiryData);
const updatedEnquiry = await apiService.enquiries.update(1, updateData);
await apiService.enquiries.delete(1);

// Business-specific operations
await apiService.enquiries.updateStatus(1, 'contacted');
await apiService.enquiries.markContacted(1);
const stats = await apiService.enquiries.getStats();

// Service-specific operations
await apiService.services.updateStatus(1, 'completed');
await apiService.services.addPhoto(1, photoFormData);
const workHistory = await apiService.services.getWorkHistory(1);

// Authentication
await apiService.auth.login('email@example.com', 'password');
const profile = await apiService.auth.getProfile();

// File uploads
const imageUrl = await apiService.uploads.uploadImage(formData);
```

### 4. Constants (`src/constants/index.ts`)

**Problem Solved**: Hardcoded values scattered throughout components.

**Benefits**:
- Centralized configuration
- Easy to update business rules
- Consistent UI options
- Type-safe constants

**Usage**:
```typescript
import { CONSTANTS } from '@/constants';

// Use status options
const statusOptions = CONSTANTS.status.enquiry;

// Use validation limits
const maxNameLength = CONSTANTS.validation.name.max;
```

### 5. Utilities (`src/utils/index.ts`)

**Problem Solved**: Repeated utility functions across components.

**Benefits**:
- DRY principle (Don't Repeat Yourself)
- Consistent formatting and calculations
- Reusable helper functions
- Better maintainability

**Usage**:
```typescript
import { utils } from '@/utils';

// Format currency
const formattedAmount = utils.currency.format(1500);

// Format date
const formattedDate = utils.date.format('2024-01-15');

// Validate email
const isValid = utils.validation.isValidEmail('test@example.com');
```

## Migration Guide

### Step 1: Update Component Imports

Replace local interface definitions with centralized types:

```typescript
// Before
interface Enquiry {
  id: number;
  name: string;
  // ... local definition
}

// After
import { Enquiry } from '@/types';
```

### Step 2: Add Form Validation

Update forms to use Zod schemas:

```typescript
// Before
const handleSubmit = () => {
  if (!formData.name) {
    alert('Name is required');
    return;
  }
  // ... manual validation
};

// After
import { enquiryFormSchema } from '@/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(enquiryFormSchema),
  defaultValues: {
    customerName: '',
    phone: '',
    // ... other fields
  }
});
```

### Step 3: Use Constants

Replace hardcoded values with constants:

```typescript
// Before
const statusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  // ... hardcoded options
];

// After
import { CONSTANTS } from '@/constants';
const statusOptions = CONSTANTS.status.enquiry;
```

### Step 4: Implement API Services

Replace direct fetch calls with API service:

```typescript
// Before
const response = await fetch('/api/enquiries');
const data = await response.json();

// After
import { apiService } from '@/services/api';
const { data } = await apiService.enquiries.getAll();
```

## Best Practices

### 1. Type Safety
- Always use TypeScript interfaces from `@/types`
- Use Zod schemas for runtime validation
- Avoid `any` types, use proper typing

### 2. Form Validation
- Use Zod schemas with react-hook-form
- Provide meaningful error messages
- Validate on both client and server

### 3. API Communication
- Use the centralized API service
- Handle errors consistently
- Use proper loading states

### 4. Constants
- Use constants instead of magic numbers/strings
- Update business rules in one place
- Keep constants type-safe

### 5. Utilities
- Use utility functions for common operations
- Don't repeat logic across components
- Keep utilities pure and testable

## File Naming Conventions

- **Types**: `PascalCase` (e.g., `Enquiry`, `ServiceOrder`)
- **Schemas**: `camelCase` with `Schema` suffix (e.g., `enquiryFormSchema`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `ENQUIRY_STATUS_OPTIONS`)
- **Utilities**: `camelCase` (e.g., `formatCurrency`, `validateEmail`)

## Testing Considerations

- Mock API services for unit tests
- Test Zod schemas with various inputs
- Test utility functions with edge cases
- Use TypeScript for compile-time testing

## Future Enhancements

1. **State Management**: Consider adding Zustand or Redux for global state
2. **Error Boundaries**: Implement React error boundaries
3. **Internationalization**: Add i18n support
4. **Theme System**: Implement dynamic theming
5. **Performance**: Add React.memo and useMemo optimizations

## Conclusion

This new structure provides:
- **Better maintainability** through centralized types and schemas
- **Improved developer experience** with better TypeScript support
- **Consistent data handling** across the application
- **Easier testing** with proper separation of concerns
- **Scalability** for future feature additions

The structure follows modern React/TypeScript best practices and provides a solid foundation for the cobbler management system.
