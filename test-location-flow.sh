#!/bin/bash

echo "=========================================="
echo "Testing Location-Based Chat Flow"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: First message without location (should request location)
echo -e "${BLUE}Test 1: First message without location${NC}"
echo "Request: POST /api/ai/chat with message 'Hi'"
echo ""

RESPONSE1=$(curl -s -X POST http://localhost:4000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi, I want to plan a trip"
  }')

echo "Response:"
echo "$RESPONSE1" | jq '.'
echo ""

# Check if requestLocation is true
REQUEST_LOCATION=$(echo "$RESPONSE1" | jq -r '.data.requestLocation')
if [ "$REQUEST_LOCATION" == "true" ]; then
  echo -e "${GREEN}✓ Bot correctly requested location${NC}"
else
  echo "✗ Bot did not request location"
fi
echo ""
echo "=========================================="
echo ""

# Test 2: Second message WITH location
echo -e "${BLUE}Test 2: Message with user location${NC}"
echo "Request: POST /api/ai/chat with location data"
echo ""

RESPONSE2=$(curl -s -X POST http://localhost:4000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am sharing my location",
    "chatHistory": [
      {
        "role": "user",
        "content": "Hi, I want to plan a trip"
      },
      {
        "role": "model",
        "content": "Welcome to Voyagr..."
      }
    ],
    "userLocation": {
      "city": "New York",
      "country": "United States",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }')

echo "Response:"
echo "$RESPONSE2" | jq '.'
echo ""

# Check if requestLocation is false now
REQUEST_LOCATION2=$(echo "$RESPONSE2" | jq -r '.data.requestLocation')
MESSAGE2=$(echo "$RESPONSE2" | jq -r '.data.message')

if [ "$REQUEST_LOCATION2" == "false" ]; then
  echo -e "${GREEN}✓ Bot no longer requesting location${NC}"
else
  echo "✗ Bot still requesting location"
fi

if echo "$MESSAGE2" | grep -q "New York"; then
  echo -e "${GREEN}✓ Bot acknowledged the location${NC}"
else
  echo "✗ Bot did not acknowledge location"
fi
echo ""
echo "=========================================="
echo ""

# Test 3: Continue conversation with location context
echo -e "${BLUE}Test 3: Flight search with origin location${NC}"
echo "Request: POST /api/ai/chat asking for flights"
echo ""

RESPONSE3=$(curl -s -X POST http://localhost:4000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to fly to Paris in December",
    "chatHistory": [
      {
        "role": "user",
        "content": "Hi, I want to plan a trip"
      },
      {
        "role": "model",
        "content": "Welcome to Voyagr..."
      },
      {
        "role": "user",
        "content": "I am sharing my location"
      },
      {
        "role": "model",
        "content": "Perfect! I see you are in New York..."
      }
    ],
    "context": "User'\''s current location: New York, United States (Coordinates: 40.7128, -74.0060)",
    "userLocation": {
      "city": "New York",
      "country": "United States",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }')

echo "Response:"
echo "$RESPONSE3" | jq '.'
echo ""

MESSAGE3=$(echo "$RESPONSE3" | jq -r '.data.message')
if echo "$MESSAGE3" | grep -qi "Paris"; then
  echo -e "${GREEN}✓ Bot understood the destination request${NC}"
else
  echo "✗ Bot did not understand destination"
fi
echo ""
echo "=========================================="
echo "Tests Complete!"
echo "=========================================="
