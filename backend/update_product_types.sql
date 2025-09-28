-- Update product ENUM to include new product types: Jacket and Other
-- This script updates the enquiries table to support the new product types

-- First, let's check the current ENUM values
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'enquiries' 
  AND COLUMN_NAME = 'product';

-- Update the ENUM to include the new product types
ALTER TABLE enquiries 
MODIFY COLUMN product ENUM('Bag', 'Shoe', 'Wallet', 'Belt', 'All type furniture', 'Jacket', 'Other') NOT NULL;

-- Also update the enquiry_products table if it exists
-- Check if enquiry_products table exists and has a product column
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'enquiry_products' 
  AND COLUMN_NAME = 'product';

-- If enquiry_products table exists, update its product column too
ALTER TABLE enquiry_products 
MODIFY COLUMN product ENUM('Bag', 'Shoe', 'Wallet', 'Belt', 'All type furniture', 'Jacket', 'Other') NOT NULL;

-- Verify the changes
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'enquiries' 
  AND COLUMN_NAME = 'product';

SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'enquiry_products' 
  AND COLUMN_NAME = 'product';
