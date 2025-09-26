-- Update existing service_types records to populate product and item_index fields
-- This script will set the product to the enquiry's product and item_index to 1 for existing services

UPDATE service_types st
JOIN enquiries e ON st.enquiry_id = e.id
SET 
  st.product = e.product,
  st.item_index = 1
WHERE 
  st.product IS NULL 
  AND st.item_index IS NULL;

-- Verify the update
SELECT 
  st.id,
  st.enquiry_id,
  st.service_type,
  st.product,
  st.item_index,
  e.product as enquiry_product
FROM service_types st
JOIN enquiries e ON st.enquiry_id = e.id
ORDER BY st.enquiry_id, st.id;

