# Trip Planner Workflow - Origin Location as First Question

## Overview

The `/api/ai/plan` endpoint now implements a **3-step workflow**:
1. **Ask for ORIGIN location** (where you're traveling FROM) - FIRST QUESTION
2. **Ask for DESTINATION** (where you want to go)
3. **Generate itinerary** (with full trip plan)

This ensures origin location is always collected before asking about the destination or generating any itinerary.

## Workflow Steps

### Step 1: Request Origin Location (FIRST QUESTION)

When a trip planning request is made **without** origin location (even if destination is provided), the API responds with an origin location request.

**Request (without origin):**
```bash
POST /api/ai/plan
Content-Type: application/json

{
  "message": "I want to plan a trip"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Welcome to Voyagr Trip Planner! ✈️\n\nLet's start planning your perfect trip!\n\n**First, where are you traveling FROM?**\n\nThis is important because it helps me:\n• Find the best flights from your location\n• Calculate accurate travel times and costs\n• Suggest destinations based on your starting point\n\n**How would you like to share your location?**\n\n📍 **Auto-detect** - Let me automatically detect your current city\n✍️ **Type it in** - Enter your city or nearest airport\n\nExamples: \"New York\", \"JFK\", \"Los Angeles\", \"LAX\", \"London\"\n\nOnce I know where you're starting from, I'll help you discover amazing destinations and plan your itinerary!",
    "requestOriginLocation": true,
    "step": "request_origin",
    "nextStep": "After receiving your origin, I'll ask about your destination and preferences.",
    "metadata": {
      "model": "voyagr-trip-planner",
      "userId": "user123",
      "timestamp": "2025-10-23T10:00:00.000Z"
    }
  },
  "message": "Please provide origin location first"
}
```

**Key Response Fields:**
- `requestOriginLocation: true` - Signals frontend to show location UI
- `step: "request_origin"` - Indicates workflow stage (step 1)
- `nextStep` - Tells what happens next
- `message` - Friendly explanation asking for origin location FIRST

### Step 2: Ask for Destination

After origin is provided, if destination is not included, the API asks for it.

**Request (with origin, no destination):**
```bash
POST /api/ai/plan
Content-Type: application/json

{
  "message": "I want to plan a trip",
  "origin": "New York",
  "originLocation": {
    "city": "New York",
    "country": "United States"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Perfect! You're traveling from New York. 🎉\n\nNow, **where would you like to go?**\n\nTell me your dream destination, and I'll create a personalized itinerary for you!\n\nYou can also include:\n• Travel dates (if you know them)\n• Budget range\n• Number of travelers\n• Your interests (culture, food, adventure, relaxation, etc.)\n\nExample: \"I want to visit Paris for 5 days in December with a budget of $3000\"",
    "origin": "New York",
    "step": "request_destination",
    "requestOriginLocation": false,
    "metadata": {
      "model": "voyagr-trip-planner",
      "userId": "user123",
      "timestamp": "2025-10-23T10:01:00.000Z"
    }
  },
  "message": "Origin received, now need destination"
}
```

**Key Response Fields:**
- `step: "request_destination"` - Indicates workflow stage (step 2)
- `origin` - Confirms the origin location received
- `requestOriginLocation: false` - Origin already collected

### Step 3: Generate Itinerary

After both origin and destination are provided, the API generates the full itinerary.

**Request (with both origin and destination):**
```bash
POST /api/ai/plan
Content-Type: application/json

{
  "message": "I want to plan a trip to Paris",
  "destination": "Paris",
  "origin": "New York",
  "originLocation": {
    "city": "New York",
    "country": "United States",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "dates": {
    "start": "2025-12-01",
    "end": "2025-12-07"
  },
  "budget": "$3000",
  "travelers": 2,
  "preferences": {
    "activities": ["culture", "food"],
    "travelStyle": "moderate"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Perfect! Planning your trip from New York to Paris! Based on your request...",
    "suggestions": [...],
    "itinerary": {
      "days": 7,
      "dailyPlan": [...]
    },
    "estimatedBudget": {...},
    "origin": "New York",
    "metadata": {
      "processingTime": 850,
      "model": "voyagr-ai-v1",
      "userId": "user123",
      "timestamp": "2025-10-23T10:01:00.000Z"
    }
  },
  "message": "Trip plan generated successfully"
}
```

## Request Body Schema

### AITripRequest Interface

```typescript
interface AITripRequest {
  // Origin location (REQUIRED for planning, asked first)
  origin?: string;                    // Simple text: "New York", "JFK"
  originLocation?: {                  // Detailed location data
    city?: string;                    // "New York"
    country?: string;                 // "United States"
    latitude?: number;                // 40.7128
    longitude?: number;               // -74.0060
  };

  // Trip details (provided after origin)
  destination?: string;               // "Paris", "Tokyo"
  dates?: {
    start: string;                    // "2025-12-01"
    end: string;                      // "2025-12-07"
  };
  budget?: string;                    // "$3000", "2000 EUR"
  travelers?: number;                 // 2
  preferences?: {
    activities?: string[];            // ["culture", "food"]
    accommodationType?: string;       // "hotel", "hostel"
    travelStyle?: string;             // "luxury", "budget", "moderate"
  };
  message: string;                    // User's message/intent
}
```

## Frontend Implementation

### React/TypeScript Example

```typescript
import { useState } from 'react';

interface TripPlanState {
  step: 'request_origin' | 'planning' | 'complete';
  origin?: string;
  originLocation?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
}

function TripPlannerWorkflow() {
  const [planState, setPlanState] = useState<TripPlanState>({
    step: 'request_origin'
  });

  // Step 1: Submit initial request
  const startPlanning = async (tripData: any) => {
    const response = await fetch('/api/ai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData)
    });

    const data = await response.json();

    // Check if origin location is needed
    if (data.data.requestOriginLocation) {
      setPlanState({ step: 'request_origin' });
      showLocationDialog();
    } else {
      setPlanState({ step: 'complete' });
      displayItinerary(data.data);
    }
  };

  // Step 2: Handle location detection
  const handleLocationProvided = async (location: any) => {
    setPlanState({
      step: 'planning',
      origin: location.city,
      originLocation: location
    });

    // Resubmit with origin
    const response = await fetch('/api/ai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...originalTripData,
        origin: location.city,
        originLocation: location
      })
    });

    const data = await response.json();
    setPlanState({ step: 'complete' });
    displayItinerary(data.data);
  };

  // Get location using browser API
  const getLocation = async () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Optionally reverse geocode
          const location = {
            city: 'Detected City',
            country: 'Detected Country',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          resolve(location);
        },
        (error) => reject(error)
      );
    });
  };

  return (
    <div>
      {planState.step === 'request_origin' && (
        <LocationRequestDialog
          onAutoDetect={async () => {
            const location = await getLocation();
            handleLocationProvided(location);
          }}
          onManualInput={(city) => {
            handleLocationProvided({ city });
          }}
        />
      )}

      {planState.step === 'planning' && <LoadingSpinner />}

      {planState.step === 'complete' && <ItineraryDisplay />}
    </div>
  );
}
```

### Vue.js Example

```vue
<template>
  <div>
    <!-- Step 1: Location Request -->
    <LocationDialog
      v-if="showLocationRequest"
      @location-provided="handleLocation"
    />

    <!-- Step 2: Itinerary Display -->
    <ItineraryCard v-if="itinerary" :data="itinerary" />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const showLocationRequest = ref(false);
const itinerary = ref(null);
const originLocation = ref(null);

const planTrip = async (tripData) => {
  const response = await fetch('/api/ai/plan', {
    method: 'POST',
    body: JSON.stringify({
      ...tripData,
      ...(originLocation.value && {
        origin: originLocation.value.city,
        originLocation: originLocation.value
      })
    })
  });

  const data = await response.json();

  if (data.data.requestOriginLocation) {
    showLocationRequest.value = true;
  } else {
    itinerary.value = data.data;
  }
};

const handleLocation = (location) => {
  originLocation.value = location;
  showLocationRequest.value = false;
  // Resubmit with location
  planTrip(originalTripData);
};
</script>
```

## Complete Flow Example

### Example 1: With Auto-Detect Location

```javascript
// 1. User fills out trip form
const tripRequest = {
  message: "Plan a romantic trip to Paris",
  destination: "Paris",
  dates: { start: "2025-12-01", end: "2025-12-07" },
  budget: "$3000",
  travelers: 2
};

// 2. Submit to API
let response = await fetch('/api/ai/plan', {
  method: 'POST',
  body: JSON.stringify(tripRequest)
});

let data = await response.json();

// 3. Check if location needed
if (data.data.requestOriginLocation) {
  console.log("Location needed!");

  // 4. Get user location
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const location = {
      city: "San Francisco",  // From geocoding
      country: "USA",
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    };

    // 5. Resubmit with location
    response = await fetch('/api/ai/plan', {
      method: 'POST',
      body: JSON.stringify({
        ...tripRequest,
        origin: location.city,
        originLocation: location
      })
    });

    data = await response.json();
    console.log("Itinerary:", data.data);
  });
}
```

### Example 2: With Manual Input

```javascript
// 1. Initial request
const response1 = await fetch('/api/ai/plan', {
  method: 'POST',
  body: JSON.stringify({
    message: "I want to visit Tokyo",
    destination: "Tokyo"
  })
});

const data1 = await response1.json();

// 2. User manually types location
if (data1.data.requestOriginLocation) {
  const userCity = prompt("Where are you traveling from?");

  // 3. Resubmit with manual origin
  const response2 = await fetch('/api/ai/plan', {
    method: 'POST',
    body: JSON.stringify({
      message: "I want to visit Tokyo",
      destination: "Tokyo",
      origin: userCity  // "Los Angeles"
    })
  });

  const data2 = await response2.json();
  displayItinerary(data2.data);
}
```

## Testing

### Test Script

```bash
#!/bin/bash

echo "Test 1: Request without origin (should ask for location)"
curl -X POST http://localhost:4000/api/ai/plan \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to visit Paris",
    "destination": "Paris",
    "budget": "$3000"
  }' | jq '.'

echo "\n\nTest 2: Request WITH origin (should generate itinerary)"
curl -X POST http://localhost:4000/api/ai/plan \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to visit Paris",
    "destination": "Paris",
    "origin": "New York",
    "originLocation": {
      "city": "New York",
      "country": "United States"
    },
    "budget": "$3000",
    "dates": {
      "start": "2025-12-01",
      "end": "2025-12-07"
    }
  }' | jq '.'
```

## Benefits

✅ **Better Flight Searches** - Origin enables accurate flight search and pricing
✅ **Accurate Budgets** - Cost estimates account for user's starting location
✅ **Realistic Itineraries** - Travel times and routes are accurate
✅ **User-Friendly** - Clear two-step process guides users
✅ **Flexible** - Supports both auto-detect and manual input

## Migration Notes

### For Existing Frontend Code

If you already have a trip planner form, update it to:

1. **Check response for `requestOriginLocation` flag**
2. **Show location dialog when flag is true**
3. **Resubmit with origin data after location is obtained**
4. **Store origin in state for subsequent requests**

### Backward Compatibility

The API will work with old requests that don't include origin, but will ask for it first. To skip the location request (for testing), always include either `origin` or `originLocation` in your requests.

---

**Implementation Complete!** The trip planner now properly asks for origin location as the first question. 🎉
