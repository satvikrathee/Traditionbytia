import { Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { getSocket } from '../services/socketService.js';

const DEFAULT_CATEGORIES = [
  {
    name: 'Festive Ensembles',
    slug: 'festive-ensembles',
    description: 'Hand-tailored Traditional Silhouettes & Heritage Kurtas',
    image: 'https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&w=800&q=80',
    order: 1,
    isActive: true,
  },
  {
    name: 'Lehengas & Kurtas',
    slug: 'lehengas-kurtas',
    description: 'Zardozi Velvet & Chikankari Bridal Sets',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80',
    order: 2,
    isActive: true,
  },
  {
    name: 'Heritage Jewellery',
    slug: 'heritage-jewellery',
    description: 'Temple 22K Gold & Jadau Kundan Masterpieces',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    order: 3,
    isActive: true,
  },
  {
    name: 'Handloom Dupattas',
    slug: 'handloom-dupattas',
    description: 'Kashmiri Sozni Pashmina, Banarasi & Silk Stoles',
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
    order: 4,
    isActive: true,
  },
];

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

/**
 * @desc    Get all categories (public gets active, admin can request includeInactive=true)
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';

    let count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
    }

    const filter = includeInactive ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ order: 1, createdAt: 1 });

    // Calculate product counts for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const prodCount = await Product.countDocuments({ category: cat.name });
        return {
          ...cat.toObject(),
          productCount: prodCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount,
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch categories',
    });
  }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private / Admin
 */
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, image, isActive, order } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }

    const trimmedName = name.trim();
    const slug = generateSlug(trimmedName);

    const existing = await Category.findOne({
      $or: [{ name: trimmedName }, { slug }],
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'A category with this name already exists' });
      return;
    }

    const maxOrderCat = await Category.findOne().sort({ order: -1 });
    const nextOrder = order !== undefined ? Number(order) : (maxOrderCat?.order || 0) + 1;

    const category = await Category.create({
      name: trimmedName,
      slug,
      description: description ? description.trim() : '',
      image: image ? image.trim() : '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: nextOrder,
    });

    // Notify connected clients via Socket
    try {
      const io = getSocket();
      io.emit('category:created', category);
    } catch (sockErr) {
      // socket fallback
    }

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        ...category.toObject(),
        productCount: 0,
      },
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create category',
    });
  }
};

/**
 * @desc    Update a category (and update associated products if name changes)
 * @route   PUT /api/categories/:id
 * @access  Private / Admin
 */
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive, order } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const oldName = category.name;
    let nameChanged = false;

    if (name && name.trim() && name.trim() !== category.name) {
      const newName = name.trim();
      const newSlug = generateSlug(newName);

      // Check if duplicate
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        $or: [{ name: newName }, { slug: newSlug }],
      });

      if (duplicate) {
        res.status(400).json({
          success: false,
          message: 'Another category with this name or slug already exists',
        });
        return;
      }

      category.name = newName;
      category.slug = newSlug;
      nameChanged = true;
    }

    if (description !== undefined) category.description = description.trim();
    if (image !== undefined) category.image = image.trim();
    if (isActive !== undefined) category.isActive = Boolean(isActive);
    if (order !== undefined) category.order = Number(order);

    await category.save();

    // If the category name was edited, automatically update all products that used oldName!
    let affectedProducts = 0;
    if (nameChanged) {
      const updateResult = await Product.updateMany(
        { category: oldName },
        { $set: { category: category.name } }
      );
      affectedProducts = updateResult.modifiedCount;
    }

    const prodCount = await Product.countDocuments({ category: category.name });

    // Broadcast category update via Socket
    try {
      const io = getSocket();
      io.emit('category:updated', {
        category,
        oldName: nameChanged ? oldName : undefined,
        newName: category.name,
        affectedProducts,
      });
    } catch (sockErr) {
      // socket fallback
    }

    res.status(200).json({
      success: true,
      message: nameChanged
        ? `Category updated and ${affectedProducts} associated product(s) synced!`
        : 'Category updated successfully',
      category: {
        ...category.toObject(),
        productCount: prodCount,
      },
      affectedProducts,
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update category',
    });
  }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private / Admin
 */
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    // Check if products are currently using this category
    const prodCount = await Product.countDocuments({ category: category.name });
    if (prodCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because ${prodCount} product(s) are assigned to it. Please reassign or edit them first.`,
      });
      return;
    }

    await category.deleteOne();

    try {
      const io = getSocket();
      io.emit('category:deleted', { id, name: category.name });
    } catch (sockErr) {
      // socket fallback
    }

    res.status(200).json({
      success: true,
      message: `Category "${category.name}" deleted successfully`,
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete category',
    });
  }
};
