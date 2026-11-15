import { Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { emitProductUpdate, emitInventoryUpdated } from '../services/socketService.js';
import { deleteImageFromStorage } from '../services/storageService.js';

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .concat('-', Date.now().toString().slice(-4));
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page = '1',
      limit = '12',
      featured,
      isNewArrival,
      isBestSeller,
      includeInactive,
      isActive,
    } = req.query;

    const query: any = {};

    if (includeInactive === 'true') {
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }
      // If includeInactive=true and isActive is undefined, show both active & inactive
    } else if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (isNewArrival === 'true') {
      query.isNewArrival = true;
    }

    if (isBestSeller === 'true') {
      query.isBestSeller = true;
    }

    let sortOptions: any = { createdAt: -1 };
    if (sort === 'price-low') {
      sortOptions = { price: 1 };
    } else if (sort === 'price-high') {
      sortOptions = { price: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch products' });
  }
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug, isActive: true });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.status(200).json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error retrieving product' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.status(200).json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error retrieving product' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoriesWithCount = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.status(200).json({ success: true, categories: categoriesWithCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch categories' });
  }
};

// Admin Operations
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      category,
      price,
      discountPrice,
      stock,
      images,
      isActive,
      featured,
      isBestSeller,
      isNewArrival,
    } = req.body;

    const slug = generateSlug(name);

    const product = await Product.create({
      name: name.trim(),
      slug,
      description,
      category: category.trim(),
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock: Number(stock),
      images: images || [],
      isActive: isActive !== undefined ? isActive : true,
      featured: !!featured,
      isBestSeller: !!isBestSeller,
      isNewArrival: isNewArrival !== undefined ? !!isNewArrival : true,
    });

    emitProductUpdate(product, 'update');

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.discountPrice !== undefined) {
      updateData.discountPrice = updateData.discountPrice ? Number(updateData.discountPrice) : undefined;
    }
    if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    emitProductUpdate(product, 'update');
    emitInventoryUpdated(product._id.toString(), product.stock, product.price, product.discountPrice);

    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Clean up images from storage
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.publicId) {
          await deleteImageFromStorage(img.publicId);
        }
      }
    }

    await Product.findByIdAndDelete(id);
    emitProductUpdate({ _id: id, deleted: true }, 'update');

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete product' });
  }
};

export const updateStockAndPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stock, price, discountPrice } = req.body;

    const updates: any = {};
    if (stock !== undefined) updates.stock = Math.max(0, parseInt(stock, 10));
    if (price !== undefined) updates.price = Math.max(0, parseFloat(price));
    if (discountPrice !== undefined) {
      updates.discountPrice = discountPrice ? Math.max(0, parseFloat(discountPrice)) : null;
    }

    const product = await Product.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    emitInventoryUpdated(product._id.toString(), product.stock, product.price, product.discountPrice);
    emitProductUpdate(product, 'stock');

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      product,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update inventory' });
  }
};

