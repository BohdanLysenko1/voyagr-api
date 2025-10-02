import { Response } from 'express';
import { getFirestore } from '../config/firebase';
import { AuthRequest, Favorite } from '../models/types';
import { COLLECTIONS, HTTP_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';

const db = getFirestore();

/**
 * Get all favorites for the authenticated user
 */
export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;

    const snapshot = await db.collection(COLLECTIONS.FAVORITES)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const favorites: Favorite[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Favorite));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        favorites,
        count: favorites.length,
      },
    });
  } catch (error: any) {
    console.error('Get favorites error:', error);
    throw new AppError('Failed to fetch favorites', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Add a deal to favorites
 */
export const addFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { dealId, dealType, dealData } = req.body;

    // Check if already favorited
    const existingFavorite = await db.collection(COLLECTIONS.FAVORITES)
      .where('userId', '==', userId)
      .where('dealId', '==', dealId)
      .limit(1)
      .get();

    if (!existingFavorite.empty) {
      throw new AppError('Deal is already in favorites', HTTP_STATUS.CONFLICT);
    }

    const newFavorite: Omit<Favorite, 'id'> = {
      userId,
      dealId,
      dealType,
      dealData,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTIONS.FAVORITES).add(newFavorite);
    const doc = await docRef.get();
    const favorite = { id: doc.id, ...doc.data() } as Favorite;

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: favorite,
      message: 'Added to favorites successfully',
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error('Add favorite error:', error);
    throw new AppError('Failed to add favorite', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Remove a deal from favorites
 */
export const removeFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const favoriteId = req.params.id;

    const docRef = db.collection(COLLECTIONS.FAVORITES).doc(favoriteId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError('Favorite not found', HTTP_STATUS.NOT_FOUND);
    }

    const favorite = doc.data() as Favorite;

    // Verify ownership
    if (favorite.userId !== userId) {
      throw new AppError('Forbidden: You do not have access to this favorite', HTTP_STATUS.FORBIDDEN);
    }

    await docRef.delete();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Removed from favorites successfully',
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error('Remove favorite error:', error);
    throw new AppError('Failed to remove favorite', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Remove a deal from favorites by deal ID
 */
export const removeFavoriteByDealId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const dealId = req.params.dealId;

    const snapshot = await db.collection(COLLECTIONS.FAVORITES)
      .where('userId', '==', userId)
      .where('dealId', '==', dealId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new AppError('Favorite not found', HTTP_STATUS.NOT_FOUND);
    }

    const docRef = snapshot.docs[0].ref;
    await docRef.delete();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Removed from favorites successfully',
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error('Remove favorite by deal ID error:', error);
    throw new AppError('Failed to remove favorite', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Check if a deal is favorited
 */
export const checkFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const dealId = req.params.dealId;

    const snapshot = await db.collection(COLLECTIONS.FAVORITES)
      .where('userId', '==', userId)
      .where('dealId', '==', dealId)
      .limit(1)
      .get();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        isFavorite: !snapshot.empty,
        favoriteId: snapshot.empty ? null : snapshot.docs[0].id,
      },
    });
  } catch (error: any) {
    console.error('Check favorite error:', error);
    throw new AppError('Failed to check favorite status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};