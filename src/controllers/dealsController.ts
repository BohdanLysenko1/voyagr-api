import { Request, Response } from 'express';
// import { getFirestore } from '../config/firebase'; // Uncomment when using Firestore
import { Deal } from '../models/types';
import { HTTP_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';

// const db = getFirestore(); // Uncomment when using Firestore instead of sample data

/**
 * Sample deals data - In production, this would come from Firestore
 */
const sampleDeals: Deal[] = [
  {
    id: '1',
    type: 'flight',
    title: 'NYC → Paris',
    location: 'Paris, France',
    continent: 'Europe',
    price: 499,
    originalPrice: 699,
    description: 'Direct flights with premium service and flexible dates. Enjoy priority boarding and complimentary checked baggage.',
    image: '/images/DealsPage/Flights_ParisPic.jpg',
    rating: 4.8,
    duration: 'per person',
    features: ['Direct Flight', 'Checked Bag', 'Flexible Dates', 'Priority Boarding'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'hotel',
    title: 'The Plaza Hotel',
    location: 'New York, USA',
    continent: 'North America',
    price: 299,
    originalPrice: 450,
    description: 'Luxury accommodations in Manhattan with Central Park views. Experience world-class dining and premium spa services.',
    image: '/images/DealsPage/Hotel_NewYork.jpg',
    rating: 4.9,
    duration: 'per night',
    features: ['Central Park View', 'Spa Access', 'Fine Dining', 'Concierge Service'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get all deals
 */
export const getDeals = async (_req: Request, res: Response): Promise<void> => {
  try {
    // In production, fetch from Firestore
    // const snapshot = await db.collection(COLLECTIONS.DEALS).get();
    // const deals: Deal[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        deals: sampleDeals,
      },
    });
  } catch (error: any) {
    console.error('Get deals error:', error);
    throw new AppError('Failed to fetch deals', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get a single deal by ID
 */
export const getDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const dealId = req.params.id;

    // In production, fetch from Firestore
    // const doc = await db.collection(COLLECTIONS.DEALS).doc(dealId).get();
    // if (!doc.exists) {
    //   throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);
    // }
    // const deal = { id: doc.id, ...doc.data() } as Deal;

    const deal = sampleDeals.find(d => d.id === dealId);

    if (!deal) {
      throw new AppError('Deal not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: deal,
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error('Get deal error:', error);
    throw new AppError('Failed to fetch deal', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Search deals by filters
 */
export const searchDeals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, continent, minPrice, maxPrice, query } = req.query;

    let filteredDeals = sampleDeals;

    // Apply filters
    if (type) {
      filteredDeals = filteredDeals.filter(d => d.type === type);
    }

    if (continent) {
      filteredDeals = filteredDeals.filter(d => d.continent === continent);
    }

    if (minPrice) {
      filteredDeals = filteredDeals.filter(d => d.price >= parseInt(minPrice as string));
    }

    if (maxPrice) {
      filteredDeals = filteredDeals.filter(d => d.price <= parseInt(maxPrice as string));
    }

    if (query) {
      const searchQuery = (query as string).toLowerCase();
      filteredDeals = filteredDeals.filter(d =>
        d.title.toLowerCase().includes(searchQuery) ||
        d.location.toLowerCase().includes(searchQuery) ||
        d.description.toLowerCase().includes(searchQuery)
      );
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        deals: filteredDeals,
        count: filteredDeals.length,
      },
    });
  } catch (error: any) {
    console.error('Search deals error:', error);
    throw new AppError('Failed to search deals', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};