# Trip Planner - Origin First Implementation ✅

## What Was Changed

The trip planner workflow now **prioritizes origin location as the FIRST question**, even before asking about the destination.

## 3-Step Workflow

### Step 1: Ask for Origin Location (FIRST)
**User Request:** Initial trip planning request (no origin provided)

```bash
POST /api/ai/plan
{
  "message": "I want to plan a trip"
}
```

**Bot Response:** Asks "Where are you traveling FROM?"
```json
{
  "data": {
    "message": "Welcome to Voyagr Trip Planner! ✈️\n\n**First, where are you traveling FROM?**...",
    "requestOriginLocation": true,
    "step": "request_origin"
  }
}
```

### Step 2: Ask for Destination
**User Request:** Provides origin (destination not yet provided)

```bash
POST /api/ai/plan
{
  "message": "I want to plan a trip",
  "origin": "New York"
}
```

**Bot Response:** Acknowledges origin and asks for destination
```json
{
  "data": {
    "message": "Perfect! You're traveling from New York. 🎉\n\nNow, **where would you like to go?**...",
    "origin": "New York",
    "step": "request_destination"
  }
}
```

### Step 3: Generate Itinerary
**User Request:** Provides both origin and destination

```bash
POST /api/ai/plan
{
  "message": "I want to visit Paris",
  "origin": "New York",
  "destination": "Paris",
  "dates": {"start": "2025-12-01", "end": "2025-12-07"}
}
```

**Bot Response:** Generates complete itinerary
```json
{
  "data": {
    "message": "Perfect! Planning your trip from New York to Paris!...",
    "itinerary": {...},
    "suggestions": [...],
    "estimatedBudget": {...},
    "origin": "New York"
  }
}
```

## Key Changes Made

### 1. Controller Logic (`src/controllers/aiController.ts`)

Added **3-step validation**:

```typescript
// Step 1: No origin → Ask for origin
if (!requestData.origin && !requestData.originLocation) {
  return response with requestOriginLocation: true
}

// Step 2: Has origin, no destination → Ask for destination
if (!requestData.destination) {
  return response with step: 'request_destination'
}

// Step 3: Has both → Generate itinerary
generateItinerary(requestData)
```

### 2. Types (`src/models/types.ts`)

Added origin fields to `AITripRequest`:

```typescript
interface AITripRequest {
  origin?: string;           // Simple text: "New York"
  originLocation?: {         // Detailed location
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  destination?: string;      // Now asked AFTER origin
  // ... other fields
}
```

### 3. Response Indicators

Added step tracking fields:

- `requestOriginLocation: boolean` - True when origin needed
- `step: string` - Current workflow step: "request_origin", "request_destination", or complete
- `origin: string` - Confirms origin received

## Frontend Implementation

### React Example

```tsx
function TripPlanner() {
  const [step, setStep] = useState<'origin' | 'destination' | 'complete'>('origin');
  const [origin, setOrigin] = useState<string | null>(null);

  const submitRequest = async (data: any) => {
    const response = await fetch('/api/ai/plan', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        ...(origin && { origin })
      })
    });

    const result = await response.json();

    // Handle workflow steps
    if (result.data.requestOriginLocation) {
      setStep('origin');
      showLocationDialog();
    } else if (result.data.step === 'request_destination') {
      setStep('destination');
      setOrigin(result.data.origin);
      showDestinationInput();
    } else {
      setStep('complete');
      displayItinerary(result.data);
    }
  };

  return (
    <div>
      {step === 'origin' && <LocationInput onSubmit={submitRequest} />}
      {step === 'destination' && <DestinationInput origin={origin} onSubmit={submitRequest} />}
      {step === 'complete' && <ItineraryDisplay />}
    </div>
  );
}
```

### Step-by-Step User Flow

```javascript
// 1. User opens trip planner
fetch('/api/ai/plan', {
  method: 'POST',
  body: JSON.stringify({ message: "Plan a trip" })
});
// → Response: "Where are you traveling FROM?" (requestOriginLocation: true)

// 2. User provides origin
fetch('/api/ai/plan', {
  method: 'POST',
  body: JSON.stringify({
    message: "Plan a trip",
    origin: "Los Angeles"
  })
});
// → Response: "Perfect! You're from LA. Where would you like to go?" (step: request_destination)

// 3. User provides destination
fetch('/api/ai/plan', {
  method: 'POST',
  body: JSON.stringify({
    message: "I want to visit Tokyo",
    origin: "Los Angeles",
    destination: "Tokyo"
  })
});
// → Response: Full itinerary with flights from LAX to Tokyo
```

## Testing

Run the test script:

```bash
./test-trip-planner.sh
```

Or test manually:

```bash
# Step 1: Empty request (should ask for origin)
curl -X POST http://localhost:4000/api/ai/plan \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to plan a trip"}'

# Step 2: With origin only (should ask for destination)
curl -X POST http://localhost:4000/api/ai/plan \
  -H "Content-Type: application/json" \
  -d '{"message": "Plan trip", "origin": "New York"}'

# Step 3: With both origin and destination (should generate itinerary)
curl -X POST http://localhost:4000/api/ai/plan \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Visit Paris",
    "origin": "New York",
    "destination": "Paris"
  }'
```

## Benefits

✅ **Origin always collected first** - Ensures accurate flight searches
✅ **Clear workflow** - Step indicators guide the user
✅ **Flexible input** - Accepts simple text or detailed location object
✅ **Better UX** - Progressive disclosure of information
✅ **Accurate planning** - All itineraries include origin context

## Files Modified

1. `src/controllers/aiController.ts` - Added 3-step workflow logic
2. `src/models/types.ts` - Added origin fields to AITripRequest
3. `TRIP_PLANNER_WORKFLOW.md` - Updated documentation
4. `test-trip-planner.sh` - Updated test script

## Migration Notes

**For existing frontend implementations:**

1. Check `response.data.requestOriginLocation` flag
2. Show location dialog when `true`
3. Check `response.data.step` for workflow stage:
   - `"request_origin"` → Show location input
   - `"request_destination"` → Show destination input
   - No step field → Complete itinerary
4. Always include `origin` in subsequent requests after it's provided

---

**Implementation Complete!** The trip planner now correctly asks "Where are you traveling FROM?" as the **very first question**. 🎉
