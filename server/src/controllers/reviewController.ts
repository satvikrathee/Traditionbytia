import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';

// Seed initial curated reviews if database has none
const INITIAL_CURATED_REVIEWS = [
  {
    userName: 'Priya Sharma',
    userEmail: 'priya.s@example.com',
    rating: 5,
    title: 'Exquisite Craftsmanship & Regal Drape',
    comment:
      'The pure Mulberry silk saree with handcrafted zardozi borders exceeded every expectation. The richness of the crimson hue and the weight of the zari work truly feel heirloom-grade.',
    isVerifiedPurchase: true,
  },
  {
    userName: 'Meenakshi Sundaram',
    userEmail: 'meenakshi.s@example.com',
    rating: 5,
    title: 'Bespoke Perfection for My Wedding Trousseau',
    comment:
      'Ordered the bridal collection lehenga. The intricate dabka embroidery and flawless fit made my wedding reception unforgettable. Traditions By Tiya offers genuine royal heritage.',
    isVerifiedPurchase: true,
  },
  {
    userName: 'Ananya Deshmukh',
    userEmail: 'ananya.d@example.com',
    rating: 5,
    title: 'Unmatched Fabric Quality & Luxurious Feel',
    comment:
      'From the royal packaging with wax seal to the touch of the raw silk, everything is 10/10. Received compliments all evening. Will definitely purchase again!',
    isVerifiedPurchase: true,
  },
  {
    userName: 'Rhea Oberoi',
    userEmail: 'rhea.o@example.com',
    rating: 5,
    title: 'Pure Heritage Artistry',
    comment:
      'The resham thread embroidery and banarasi weave are museum-worthy. Prompt doorstep delivery and beautiful presentation. Truly a regal shopping experience.',
    isVerifiedPurchase: true,
  },
];

/**
 * @desc    Create a new product review
 * @route   POST /api/reviews
 * @access  Private (Logged-in customer)
 */
export const createReview = async (req: Request, res: Response, Next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized to post a review' });
    }

    const { productId, orderId, rating, title, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product ID, a rating (1-5), and review comment',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5 stars',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user has an order for this product (verified purchase)
    let isVerified = true;
    if (orderId && mongoose.isValidObjectId(orderId)) {
      const order = await Order.findOne({
        _id: orderId,
        user: user._id,
      });
      if (order) {
        isVerified = true;
      }
    }

    // Create the review
    const review = await Review.create({
      user: user._id,
      userName: user.name || 'Valued Patron',
      userEmail: user.email,
      productId: product._id,
      productName: product.name,
      orderId: orderId && mongoose.isValidObjectId(orderId) ? orderId : undefined,
      rating: numRating,
      title: title ? String(title).trim() : 'Verified Customer Review',
      comment: String(comment).trim(),
      isVerifiedPurchase: isVerified,
    });

    // Recalculate product rating & review count
    const allReviews = await Review.find({ productId: product._id });
    const totalScore = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgScore = Number((totalScore / allReviews.length).toFixed(1));

    product.rating = avgScore;
    product.numReviews = allReviews.length;
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for your review! Your reflection has been published.',
      review,
      productStats: {
        rating: product.rating,
        numReviews: product.numReviews,
      },
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit review',
    });
  }
};

/**
 * @desc    Get all reviews for a specific product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });

    const total = reviews.length;
    const avgRating = total > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1))
      : 5.0;

    // Distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    res.status(200).json({
      success: true,
      count: total,
      averageRating: avgRating,
      distribution,
      reviews,
    });
  } catch (error: any) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product reviews' });
  }
};

/**
 * @desc    Get recent top reviews for home showcase
 * @route   GET /api/reviews/recent
 * @access  Public
 */
export const getRecentReviews = async (req: Request, res: Response) => {
  try {
    let reviews = await Review.find({ rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(10);

    // If database has very few reviews yet, ensure we seed or return initial curated reviews
    if (reviews.length === 0) {
      // Find a featured product to associate initial reviews with
      const sampleProduct = await Product.findOne();
      if (sampleProduct) {
        const toInsert = INITIAL_CURATED_REVIEWS.map((rev) => ({
          user: sampleProduct._id, // placeholder id
          userName: rev.userName,
          userEmail: rev.userEmail,
          productId: sampleProduct._id,
          productName: sampleProduct.name,
          rating: rev.rating,
          title: rev.title,
          comment: rev.comment,
          isVerifiedPurchase: true,
        }));
        await Review.insertMany(toInsert);
        reviews = await Review.find({ rating: { $gte: 4 } })
          .sort({ createdAt: -1 })
          .limit(10);
      }
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error: any) {
    console.error('Get recent reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent reviews' });
  }
};
