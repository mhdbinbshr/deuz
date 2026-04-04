
import Product from '../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product (Admin)
// @route   POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const { productType, countInStock } = req.body;

    if (productType === 'APPAREL') {
        req.body.countInStock = countInStock > 0 ? 1 : 0;
        if (!req.body.uniquenessTag) {
            req.body.uniquenessTag = '1-of-1';
        }
    }

    const product = new Product(req.body);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product (Admin)
// @route   PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const { 
        title, price, description, image, category, productType, 
        countInStock, sizes, details, uniquenessTag, isArchived 
    } = req.body;
    
    const product = await Product.findById(req.params.id);

    if (product) {
      product.title = title || product.title;
      product.price = price !== undefined ? price : product.price;
      product.description = description || product.description;
      product.image = image || product.image;
      product.category = category || product.category;
      product.productType = productType || product.productType;
      
      if (isArchived !== undefined) {
          product.isArchived = isArchived;
      }

      if (product.productType === 'APPAREL') {
          const targetStock = countInStock !== undefined ? countInStock : product.countInStock;
          product.countInStock = targetStock > 0 ? 1 : 0;
      } else {
          product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
      }
      
      if (sizes) product.sizes = sizes;
      if (details) product.details = details;
      if (uniquenessTag !== undefined) product.uniquenessTag = uniquenessTag;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product (Admin)
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};
