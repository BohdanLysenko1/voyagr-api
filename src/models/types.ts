import { Request } from 'express';

// Auth Types
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
  };
}

// Calendar Event Types
export type EventType = 'departure' | 'arrival' | 'event' | 'urgent' | 'meeting';

export type RepeatFrequency = 'never' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RepeatOptions {
  frequency: RepeatFrequency;
  interval: number;
  endDate: string;
  count: number;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  type: EventType;
  date: string;
  time?: string;
  repeat?: RepeatOptions;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventInput {
  title: string;
  type: EventType;
  date: string;
  time?: string;
  repeat?: RepeatOptions;
}

export interface UpdateCalendarEventInput {
  title?: string;
  type?: EventType;
  date?: string;
  time?: string;
  repeat?: RepeatOptions;
}

// Deal Types
export type DealType = 'flight' | 'hotel' | 'package' | 'restaurant';

export interface Deal {
  id: string;
  type: DealType;
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

// Favorite Types
export interface Favorite {
  id: string;
  userId: string;
  dealId: string;
  dealType: DealType;
  dealData: Deal;
  createdAt: string;
}

// User Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  travelStyle?: string;
  budget?: string;
  groupSize?: string;
  activities?: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// AI Types
export interface AITripRequest {
  destination?: string;
  dates?: {
    start: string;
    end: string;
  };
  budget?: string;
  travelers?: number;
  preferences?: {
    activities?: string[];
    accommodationType?: string;
    travelStyle?: string;
  };
  message: string;
}