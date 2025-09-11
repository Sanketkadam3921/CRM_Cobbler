#!/bin/bash

echo "Posting sample enquiries with valid enums..."

# URL = https://<URL/api/enquiries?limit=1000
# URL = 'http://localhost:3001/api/enquiries'


# 1 - Facebook + Wallet
curl 'https://render-f67c.onrender.com/api/enquiries' \
  -H 'Accept: */*' -H 'Content-Type: application/json' \
  -H 'X-Token: cobbler_super_secret_token_2024' \
  --data-raw '{"customerName":"Rahul Sharma","phone":"9876543210","address":"Bandra West, Mumbai","message":"Looking for premium leather wallet","inquiryType":"Facebook","product":"Wallet","quantity":2,"date":"2025-09-03","status":"new","contacted":false,"currentStage":"enquiry"}'

# 2 - Instagram + Bag
curl 'https://render-f67c.onrender.com/api/enquiries' \
  -H 'Accept: */*' -H 'Content-Type: application/json' \
  -H 'X-Token: cobbler_super_secret_token_2024' \
  --data-raw '{"customerName":"Priya Mehta","phone":"9123456789","address":"Indiranagar, Bangalore","message":"Interested in bulk bags","inquiryType":"Instagram","product":"Bag","quantity":5,"date":"2025-09-03","status":"new","contacted":false,"currentStage":"enquiry"}'

# 3 - WhatsApp + Bag
curl 'https://render-f67c.onrender.com/api/enquiries' \
  -H 'Accept: */*' -H 'Content-Type: application/json' \
  -H 'X-Token: cobbler_super_secret_token_2024' \
  --data-raw '{"customerName":"Arjun Patel","phone":"9000000001","address":"Navrangpura, Ahmedabad","message":"Need 50 units for gifting","inquiryType":"WhatsApp","product":"Bag","quantity":50,"date":"2025-09-03","status":"new","contacted":false,"currentStage":"enquiry"}'

# 4 - Phone + Belt
curl 'https://render-f67c.onrender.com/api/enquiries' \
  -H 'Accept: */*' -H 'Content-Type: application/json' \
  -H 'X-Token: cobbler_super_secret_token_2024' \
  --data-raw '{"customerName":"Sneha Kapoor","phone":"9811111111","address":"South Delhi","message":"Bulk order for belts","inquiryType":"Phone","product":"Belt","quantity":100,"date":"2025-09-03","status":"new","contacted":false,"currentStage":"enquiry"}'

# 5 - Website + All type furniture
curl 'https://render-f67c.onrender.com/api/enquiries' \
  -H 'Accept: */*' -H 'Content-Type: application/json' \
  -H 'X-Token: cobbler_super_secret_token_2024' \
  --data-raw '{"customerName":"Mohammed Ali","phone":"9877001122","address":"Charminar, Hyderabad","message":"Looking for custom furniture options","inquiryType":"Website","product":"All type furniture","quantity":25,"date":"2025-09-03","status":"new","contacted":false,"currentStage":"enquiry"}'

echo "All sample enquiries posted successfully."
