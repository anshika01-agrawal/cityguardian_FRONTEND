#!/bin/bash

echo "🔧 Testing CityGuardian Authentication System"
echo "============================================="

# Test server health
echo "1. Testing server health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Server health check passed"
else
    echo "❌ Server health check failed (Status: $HEALTH_STATUS)"
fi

# Test login page
echo "2. Testing login page..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)
if [ "$LOGIN_STATUS" = "200" ]; then
    echo "✅ Login page accessible"
else
    echo "❌ Login page failed (Status: $LOGIN_STATUS)"
fi

# Test register page
echo "3. Testing register page..."
REGISTER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/register)
if [ "$REGISTER_STATUS" = "200" ]; then
    echo "✅ Register page accessible"
else
    echo "❌ Register page failed (Status: $REGISTER_STATUS)"
fi

# Test user registration API
echo "4. Testing user registration API..."
REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test.user@cityguardian.com",
    "password": "testpassword123",
    "phone": "+91-9876543210",
    "address": "123 Test Street, Test Area",
    "city": "Delhi",
    "role": "citizen"
  }' \
  http://localhost:3000/api/auth/register)

if echo "$REGISTER_RESPONSE" | grep -q "successfully"; then
    echo "✅ User registration API working"
    echo "   Response: $(echo "$REGISTER_RESPONSE" | jq -r '.message' 2>/dev/null || echo "$REGISTER_RESPONSE")"
else
    echo "❌ User registration API failed"
    echo "   Response: $REGISTER_RESPONSE"
fi

# Test login with demo user
echo "5. Testing login with demo user..."
LOGIN_TEST_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anshika@cityguardian.com",
    "password": "password123"
  }' \
  http://localhost:3000/api/auth/signin)

echo "   Login response: $LOGIN_TEST_RESPONSE"

# Test complaints API
echo "6. Testing complaints API..."
COMPLAINTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/complaints)
if [ "$COMPLAINTS_STATUS" = "200" ]; then
    echo "✅ Complaints API accessible"
else
    echo "❌ Complaints API failed (Status: $COMPLAINTS_STATUS)"
fi

# Test database connection
echo "7. Testing database connection via web interface..."
DB_TEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/test-database)
if [ "$DB_TEST_STATUS" = "200" ]; then
    echo "✅ Database test page accessible"
else
    echo "❌ Database test page failed (Status: $DB_TEST_STATUS)"
fi

echo ""
echo "🎯 Authentication system testing completed!"
echo "📱 Web interfaces:"
echo "   - Login: http://localhost:3000/login"
echo "   - Register: http://localhost:3000/register"
echo "   - Database Test: http://localhost:3000/test-database"
echo ""
echo "🔑 Demo Accounts Available:"
echo "   - Citizen: anshika@cityguardian.com"
echo "   - Employee: employee.delhi@cityguardian.com"
echo "   - Admin: admin@cityguardian.com"
echo "   - Password: password123"