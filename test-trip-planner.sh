#!/bin/bash

echo "=========================================="
echo "Testing Trip Planner 3-Step Workflow"
echo "=========================================="
echo ""
echo "Expected Flow:"
echo "  Step 1: Ask for ORIGIN (current location)"
echo "  Step 2: Ask for DESTINATION"
echo "  Step 3: Generate ITINERARY"
echo ""
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:4000/api/ai/plan"

# Test 1: Request WITHOUT anything (should ask for origin FIRST)
echo -e "${BLUE}Test 1: Empty trip request${NC}"
echo "Expected: Should ask for ORIGIN location (Step 1)"
echo ""

RESPONSE1=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to plan a trip"
  }')

echo "Response:"
echo "$RESPONSE1" | jq '.'
echo ""

# Validate response
REQUEST_ORIGIN=$(echo "$RESPONSE1" | jq -r '.data.requestOriginLocation')
STEP=$(echo "$RESPONSE1" | jq -r '.data.step')

if [ "$REQUEST_ORIGIN" == "true" ] && [ "$STEP" == "request_origin" ]; then
  echo -e "${GREEN}✓ Test 1 PASSED: Bot correctly requested origin location${NC}"
else
  echo -e "${YELLOW}✗ Test 1 FAILED: Bot did not request origin location${NC}"
fi

echo ""
echo "=========================================="
echo ""

# Test 2: Request WITH origin but NO destination (should ask for destination)
echo -e "${BLUE}Test 2: Trip request WITH origin but NO destination${NC}"
echo "Expected: Should ask for DESTINATION (Step 2)"
echo ""

RESPONSE2=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to plan a trip",
    "origin": "New York",
    "originLocation": {
      "city": "New York",
      "country": "United States"
    }
  }')

echo "Response:"
echo "$RESPONSE2" | jq '.'
echo ""

# Validate response
STEP2=$(echo "$RESPONSE2" | jq -r '.data.step')
ORIGIN2=$(echo "$RESPONSE2" | jq -r '.data.origin')
MESSAGE2=$(echo "$RESPONSE2" | jq -r '.data.message')

if [ "$STEP2" == "request_destination" ] && [ "$ORIGIN2" == "New York" ]; then
  echo -e "${GREEN}✓ Test 2 PASSED: Bot acknowledged origin and asked for destination${NC}"
else
  echo -e "${YELLOW}✗ Test 2 FAILED: Expected step 'request_destination', got '$STEP2'${NC}"
fi

if echo "$MESSAGE2" | grep -qi "where would you like to go"; then
  echo -e "${GREEN}✓ Message asks for destination${NC}"
else
  echo -e "${YELLOW}✗ Message doesn't ask for destination${NC}"
fi

echo ""
echo "=========================================="
echo ""

# Test 3: Request WITH both origin and destination (should generate itinerary)
echo -e "${BLUE}Test 3: Complete trip request WITH origin AND destination${NC}"
echo "Expected: Should generate complete itinerary (Step 3)"
echo ""

RESPONSE3=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to visit Paris for a week",
    "destination": "Paris",
    "origin": "New York",
    "originLocation": {
      "city": "New York",
      "country": "United States",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "budget": "$3000",
    "travelers": 2,
    "dates": {
      "start": "2025-12-01",
      "end": "2025-12-07"
    },
    "preferences": {
      "activities": ["culture", "food", "sightseeing"],
      "travelStyle": "moderate"
    }
  }')

echo "Response:"
echo "$RESPONSE3" | jq '.'
echo ""

# Validate response
HAS_ITINERARY=$(echo "$RESPONSE3" | jq -r '.data.itinerary')
HAS_SUGGESTIONS=$(echo "$RESPONSE3" | jq -r '.data.suggestions')
HAS_BUDGET=$(echo "$RESPONSE3" | jq -r '.data.estimatedBudget')
ORIGIN_CITY=$(echo "$RESPONSE3" | jq -r '.data.origin')
MESSAGE=$(echo "$RESPONSE3" | jq -r '.data.message')

SUCCESS_COUNT=0
TOTAL_CHECKS=5

# Check 1: Has itinerary
if [ "$HAS_ITINERARY" != "null" ]; then
  echo -e "${GREEN}✓ Has itinerary${NC}"
  ((SUCCESS_COUNT++))
else
  echo -e "${YELLOW}✗ Missing itinerary${NC}"
fi

# Check 2: Has suggestions
if [ "$HAS_SUGGESTIONS" != "null" ]; then
  echo -e "${GREEN}✓ Has suggestions${NC}"
  ((SUCCESS_COUNT++))
else
  echo -e "${YELLOW}✗ Missing suggestions${NC}"
fi

# Check 3: Has budget
if [ "$HAS_BUDGET" != "null" ]; then
  echo -e "${GREEN}✓ Has estimated budget${NC}"
  ((SUCCESS_COUNT++))
else
  echo -e "${YELLOW}✗ Missing budget${NC}"
fi

# Check 4: Origin acknowledged
if [ "$ORIGIN_CITY" == "New York" ]; then
  echo -e "${GREEN}✓ Origin location stored${NC}"
  ((SUCCESS_COUNT++))
else
  echo -e "${YELLOW}✗ Origin not stored (got: $ORIGIN_CITY)${NC}"
fi

# Check 5: Message mentions origin
if echo "$MESSAGE" | grep -qi "New York"; then
  echo -e "${GREEN}✓ Response mentions origin city${NC}"
  ((SUCCESS_COUNT++))
else
  echo -e "${YELLOW}✗ Response doesn't mention origin${NC}"
fi

echo ""
if [ $SUCCESS_COUNT -eq $TOTAL_CHECKS ]; then
  echo -e "${GREEN}✓ Test 3 PASSED: All checks passed ($SUCCESS_COUNT/$TOTAL_CHECKS)${NC}"
else
  echo -e "${YELLOW}⚠ Test 3 PARTIAL: $SUCCESS_COUNT/$TOTAL_CHECKS checks passed${NC}"
fi

echo ""
echo "=========================================="
echo "All Tests Complete!"
echo "=========================================="
