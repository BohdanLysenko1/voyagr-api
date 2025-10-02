# Voyagr API

Production-ready Node.js/Express + TypeScript backend for the Voyagr travel web application with Firebase Auth and Firestore database integration.

## 🚀 Features

- **Express + TypeScript**: Type-safe backend with modern JavaScript features
- **Firebase Authentication**: Secure token-based authentication using Firebase Admin SDK
- **Firestore Database**: NoSQL cloud database for scalable data storage
- **RESTful API Design**: Clean, intuitive API endpoints following REST principles
- **Comprehensive Validation**: Request validation using express-validator
- **Error Handling**: Centralized error handling with custom error classes
- **Security Best Practices**: Helmet, CORS, compression, and rate limiting ready
- **Hot Reload**: Fast development with nodemon and ts-node
- **Production Ready**: Optimized for deployment with build scripts

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Firebase Project** with Firestore enabled
- **Firebase Service Account JSON** file

## 🛠️ Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd voyagr-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Firebase**:

   a. Go to [Firebase Console](https://console.firebase.google.com/)

   b. Select your project or create a new one

   c. Navigate to **Project Settings** > **Service Accounts**

   d. Click **Generate New Private Key**

   e. Save the downloaded JSON file as `firebase-service-account.json` in the project root

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   PORT=4000
   NODE_ENV=development
   WEB_ORIGIN=http://localhost:3000
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

5. **Enable Firestore** (if not already enabled):

   In Firebase Console, go to **Firestore Database** and click **Create Database**

## 🚦 Running the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

The server will start at `http://localhost:4000`

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication

Most endpoints require authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

To get a Firebase ID token from your frontend:
```javascript
const token = await firebase.auth().currentUser.getIdToken();
```

---

## 🔐 API Endpoints

### Health Check

#### GET `/api/health`
Check if the API is running

**Response:**
```json
{
  "success": true,
  "message": "Voyagr API is running",
  "timestamp": "2025-09-30T10:00:00.000Z",
  "environment": "development"
}
```

---

### Calendar Events

#### GET `/api/calendar/events`
Get all calendar events for authenticated user

**Auth:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)
- `type` (optional): Filter by event type

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "event123",
        "userId": "user456",
        "title": "Flight to Paris",
        "type": "departure",
        "date": "2025-08-15",
        "time": "10:00 AM",
        "createdAt": "2025-09-30T10:00:00.000Z",
        "updatedAt": "2025-09-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### GET `/api/calendar/events/:id`
Get a single calendar event

**Auth:** Required

#### POST `/api/calendar/events`
Create a new calendar event

**Auth:** Required

**Request Body:**
```json
{
  "title": "Flight to Paris",
  "type": "departure",
  "date": "2025-08-15",
  "time": "10:00",
  "repeat": {
    "frequency": "never",
    "interval": 1,
    "endDate": "2025-12-31",
    "count": 1
  }
}
```

**Event Types:**
- `departure`
- `arrival`
- `event`
- `urgent`
- `meeting`

#### PUT `/api/calendar/events/:id`
Update a calendar event

**Auth:** Required

#### DELETE `/api/calendar/events/:id`
Delete a calendar event

**Auth:** Required

#### POST `/api/calendar/events/bulk-delete`
Delete multiple calendar events

**Auth:** Required

**Request Body:**
```json
{
  "ids": ["event1", "event2", "event3"]
}
```

---

### Deals

#### GET `/api/deals`
Get all travel deals

**Auth:** Optional (public endpoint)

**Response:**
```json
{
  "success": true,
  "data": {
    "deals": [
      {
        "id": "1",
        "type": "flight",
        "title": "NYC → Paris",
        "location": "Paris, France",
        "continent": "Europe",
        "price": 499,
        "originalPrice": 699,
        "description": "Direct flights...",
        "image": "/images/deal.jpg",
        "rating": 4.8,
        "duration": "per person",
        "features": ["Direct Flight", "Checked Bag"]
      }
    ]
  }
}
```

#### GET `/api/deals/:id`
Get a single deal by ID

**Auth:** Optional

#### GET `/api/deals/search`
Search deals with filters

**Auth:** Optional

**Query Parameters:**
- `type`: Filter by deal type (flight, hotel, package, restaurant)
- `continent`: Filter by continent
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `query`: Search in title, location, description

---

### Favorites

#### GET `/api/favorites`
Get all favorites for authenticated user

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "fav123",
        "userId": "user456",
        "dealId": "deal789",
        "dealType": "hotel",
        "dealData": {
          "id": "deal789",
          "title": "Plaza Hotel",
          "price": 299
        },
        "createdAt": "2025-09-30T10:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

#### POST `/api/favorites`
Add a deal to favorites

**Auth:** Required

**Request Body:**
```json
{
  "dealId": "deal789",
  "dealType": "hotel",
  "dealData": {
    "id": "deal789",
    "type": "hotel",
    "title": "Plaza Hotel",
    "location": "New York, USA",
    "price": 299,
    "image": "/images/hotel.jpg",
    "features": ["Spa", "Pool"]
  }
}
```

#### DELETE `/api/favorites/:id`
Remove a favorite by favorite ID

**Auth:** Required

#### DELETE `/api/favorites/deal/:dealId`
Remove a favorite by deal ID

**Auth:** Required

#### GET `/api/favorites/check/:dealId`
Check if a deal is favorited

**Auth:** Required

---

### AI Trip Planning

#### POST `/api/ai/plan`
Generate AI-powered trip plan

**Auth:** Optional (enhanced with user context if authenticated)

**Request Body:**
```json
{
  "message": "Plan a romantic weekend in Paris",
  "destination": "Paris, France",
  "dates": {
    "start": "2025-08-15",
    "end": "2025-08-17"
  },
  "budget": "$1500",
  "travelers": 2,
  "preferences": {
    "activities": ["culture", "dining", "museums"],
    "accommodationType": "hotel",
    "travelStyle": "relaxation"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "I'd be happy to help you plan...",
    "suggestions": [
      {
        "type": "activity",
        "title": "Local Cultural Experience",
        "description": "...",
        "estimatedCost": "$50-150 per person"
      }
    ],
    "itinerary": {
      "days": 3,
      "dailyPlan": [...]
    },
    "estimatedBudget": {
      "accommodation": "$300-750",
      "food": "$300-600",
      "activities": "$300-900",
      "transportation": "$90-240",
      "total": "$990-2490",
      "currency": "USD"
    }
  }
}
```

---

## 🗄️ Firestore Database Schema

### Collections

#### `users`
```typescript
{
  uid: string;              // Firebase UID (document ID)
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences?: {
    travelStyle?: string;
    budget?: string;
    groupSize?: string;
    activities?: string[];
  };
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}
```

#### `calendar_events`
```typescript
{
  id: string;               // Auto-generated
  userId: string;           // User's Firebase UID
  title: string;
  type: string;             // departure | arrival | event | urgent | meeting
  date: string;             // ISO 8601 date
  time?: string;            // HH:MM format
  repeat?: {
    frequency: string;
    interval: number;
    endDate: string;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### `favorites`
```typescript
{
  id: string;               // Auto-generated
  userId: string;           // User's Firebase UID
  dealId: string;           // Reference to deal
  dealType: string;         // flight | hotel | package | restaurant
  dealData: Deal;           // Embedded deal data
  createdAt: string;
}
```

#### `deals`
```typescript
{
  id: string;               // Auto-generated
  type: string;             // flight | hotel | package | restaurant
  title: string;
  location: string;
  continent: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  rating?: number;
  duration?: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔒 Security Best Practices

1. **Firebase Authentication**: All protected routes verify Firebase ID tokens
2. **Helmet**: Sets security-related HTTP headers
3. **CORS**: Configurable cross-origin resource sharing
4. **Input Validation**: All inputs validated with express-validator
5. **Error Handling**: Sensitive error details hidden in production
6. **Rate Limiting**: Ready for implementation (see middleware)

---

## 🏗️ Project Structure

```
voyagr-api/
├── src/
│   ├── config/
│   │   ├── firebase.ts          # Firebase Admin SDK initialization
│   │   └── constants.ts         # App constants
│   ├── controllers/
│   │   ├── calendarController.ts
│   │   ├── dealsController.ts
│   │   ├── favoritesController.ts
│   │   └── aiController.ts
│   ├── middleware/
│   │   ├── auth.ts              # Authentication middleware
│   │   ├── errorHandler.ts      # Error handling
│   │   └── validation.ts        # Request validation
│   ├── models/
│   │   └── types.ts             # TypeScript interfaces
│   ├── routes/
│   │   ├── calendarRoutes.ts
│   │   ├── dealsRoutes.ts
│   │   ├── favoritesRoutes.ts
│   │   ├── aiRoutes.ts
│   │   └── index.ts             # Route aggregator
│   ├── validators/
│   │   ├── calendarValidators.ts
│   │   ├── favoritesValidators.ts
│   │   └── aiValidators.ts
│   └── index.ts                 # Application entry point
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── .gitignore
├── firebase-service-account.json # Firebase credentials (not in git)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `WEB_ORIGIN` | Frontend URL (for CORS) | `http://localhost:3000` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON | `./firebase-service-account.json` |

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates optimized JavaScript files in the `dist/` directory.

### Run Production Server

```bash
NODE_ENV=production npm start
```

### Deploy to Cloud Platforms

**Recommended platforms:**
- **Google Cloud Run** (works great with Firebase)
- **Heroku**
- **Railway**
- **Render**
- **AWS Elastic Beanstalk**

**Environment Setup:**
1. Set all environment variables in your platform's dashboard
2. Upload Firebase service account JSON securely
3. Ensure Firestore security rules are configured
4. Set `NODE_ENV=production`

---

## 🔐 Firebase Security Rules

Add these security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Calendar events - users can only access their own events
    match /calendar_events/{eventId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Favorites - users can only access their own favorites
    match /favorites/{favoriteId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow delete: if isOwner(resource.data.userId);
    }

    // Deals - public read access
    match /deals/{dealId} {
      allow read: if true;
      allow write: if false; // Only admins can write (handle via Admin SDK)
    }

    // Users - users can only read/write their own data
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create, update: if isOwner(userId);
      allow delete: if false; // Prevent user deletion via client
    }
  }
}
```

---

## 🧪 Testing

Test the API using:
- **Postman** or **Insomnia** for manual testing
- **curl** for command-line testing
- **Frontend application** for integration testing

### Example curl requests:

**Health Check:**
```bash
curl http://localhost:4000/api/health
```

**Get Deals (Public):**
```bash
curl http://localhost:4000/api/deals
```

**Create Calendar Event (Authenticated):**
```bash
curl -X POST http://localhost:4000/api/calendar/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "title": "Flight to Paris",
    "type": "departure",
    "date": "2025-08-15",
    "time": "10:00"
  }'
```

---

## 🤝 Integration with Frontend

To integrate with your Next.js frontend:

1. **Update Frontend .env:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

2. **Add Firebase to Frontend** (if not already):
   ```bash
   npm install firebase
   ```

3. **Create API client with auth:**
   ```typescript
   // lib/apiClient.ts
   import { getAuth } from 'firebase/auth';

   const API_BASE = process.env.NEXT_PUBLIC_API_URL;

   export async function apiRequest(endpoint: string, options: RequestInit = {}) {
     const auth = getAuth();
     const user = auth.currentUser;

     const headers: HeadersInit = {
       'Content-Type': 'application/json',
       ...options.headers,
     };

     if (user) {
       const token = await user.getIdToken();
       headers['Authorization'] = `Bearer ${token}`;
     }

     const response = await fetch(`${API_BASE}${endpoint}`, {
       ...options,
       headers,
     });

     return response.json();
   }
   ```

---

## 📝 Notes

- **Firebase Service Account**: Keep `firebase-service-account.json` secure and never commit it to version control
- **Hot Reload**: The dev server automatically restarts when you make changes
- **TypeScript**: All code is fully typed for better development experience
- **Error Handling**: All endpoints return consistent error responses
- **Validation**: Input validation prevents malformed requests

---

## 🆘 Troubleshooting

### Firebase initialization error
- Ensure `firebase-service-account.json` exists in the project root
- Verify the file is valid JSON
- Check Firebase project permissions

### CORS errors
- Verify `WEB_ORIGIN` in `.env` matches your frontend URL
- Check browser console for specific CORS errors
- Ensure credentials are included in frontend requests

### Port already in use
```bash
# Find and kill process using port 4000
lsof -ti:4000 | xargs kill -9
# Or use a different port in .env
```

---

## 📄 License

ISC

---

## 👨‍💻 Support

For issues or questions:
1. Check this README
2. Review Firebase Console for auth/database issues
3. Check server logs for detailed error messages
4. Verify environment variables are set correctly

---

**Built with ❤️ for Voyagr Travel Application**