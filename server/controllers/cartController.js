
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Helper: Ensure cart reflects current stock and removes invalid items
const validateAndSyncCart = async (cart) => {
  let changed = false;
  
  // 1. Filter out items where product no longer exists
  // In Mongoose, if populated product is null, it means it was deleted
  const initialCount = cart.items.length;
  cart.items = cart.items.filter(item => item.product != null);
  if (cart.items.length !== initialCount) changed = true;

  // 2. Adjust quantities based on available stock
  cart.items.forEach(item => {
    // product is already populated here
    const product = item.product;
    if (product) {
      // If item quantity exceeds stock, cap it
      if (item.quantity > product.countInStock) {
        item.quantity = product.countInStock;
        changed = true;
      }
      
      // Strict Apparel Rule
      if (product.productType === 'APPAREL' && item.quantity > 1) {
          item.quantity = 1;
          changed = true;
      }
    }
  });

  // 3. Remove items that dropped to 0 quantity
  const beforeZeroCheckCount = cart.items.length;
  cart.items = cart.items.filter(item => item.quantity > 0);
  if (cart.items.length !== beforeZeroCheckCount) changed = true;

  if (changed) {
    await cart.save();
  }
  return cart;
};

// @desc    Get user cart
// @route   GET /api/cart
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    await validateAndSyncCart(cart);
    
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
export const addToCart = async (req, res, next) => {
  const { productId, quantity, selectedSize } = req.body;
  
  try {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    
    if (product.countInStock < quantity) {
       res.status(400);
       throw new Error('Insufficient stock');
    }
    
    if (product.productType === 'APPAREL' && quantity > 1) {
       res.status(400);
       throw new Error('Limit exceeded: Apparel items are restricted to 1 unit per order.');
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(p => 
      p.product.toString() === productId && p.selectedSize === selectedSize
    );

    if (itemIndex > -1) {
      // Check total new quantity against stock
      const newQty = cart.items[itemIndex].quantity + quantity;
      
      // Strict Apparel Check on update
      if (product.productType === 'APPAREL' && newQty > 1) {
          res.status(400);
          throw new Error('Limit exceeded: You already have this unique item.');
      }
      
      // Strict stock check
      if (newQty > product.countInStock) {
         res.status(400);
         throw new Error(`Insufficient stock. Only ${product.countInStock} available.`);
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity, selectedSize });
    }

    await cart.save();
    
    // Populate to return full item details
    const fullCart = await Cart.findById(cart._id).populate('items.product');
    res.json(fullCart);
  } catch (error) {
    next(error);
  }
};

// @desc    Merge local cart into user cart on login
// @route   POST /api/cart/merge
export const mergeCart = async (req, res, next) => {
  const { items } = req.body; // items: [{ id, quantity, selectedSize }]
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ message: 'Invalid items' });
  }

  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Pre-fetch all referenced products to minimize DB calls
    const productIds = [...new Set(items.map(i => i.id))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const localItem of items) {
      const product = productMap.get(String(localItem.id));
      if (!product) continue; // Skip if product deleted from DB

      const itemIndex = cart.items.findIndex(p => 
        p.product.toString() === String(localItem.id) && 
        p.selectedSize === localItem.selectedSize
      );

      if (itemIndex > -1) {
        // Item exists: merge quantities, respecting stock cap
        let potentialQty = cart.items[itemIndex].quantity + localItem.quantity;
        if (product.productType === 'APPAREL') potentialQty = 1;
        
        cart.items[itemIndex].quantity = Math.min(potentialQty, product.countInStock);
      } else {
        // New item: add, respecting stock cap
        let qty = Math.min(localItem.quantity, product.countInStock);
        if (product.productType === 'APPAREL' && qty > 1) qty = 1;
        
        if (qty > 0) {
            cart.items.push({
                product: localItem.id,
                quantity: qty,
                selectedSize: localItem.selectedSize
            });
        }
      }
    }

    await cart.save();

    // Populate and do a final sync check (in case DB stock changed during op)
    const fullCart = await Cart.findById(cart._id).populate('items.product');
    await validateAndSyncCart(fullCart);

    res.json(fullCart);
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
export const updateCartItem = async (req, res, next) => {
  const { quantity } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
        res.status(404);
        throw new Error('Cart not found');
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
        res.status(404);
        throw new Error('Item not found');
    }

    // Check stock
    const product = item.product; // Already populated
    if (product) {
        if (product.productType === 'APPAREL' && quantity > 1) {
            res.status(400);
            throw new Error('Apparel items are limited to 1 per order.');
        }
        
        // Strict stock check: cannot update if request exceeds available stock
        if (quantity > product.countInStock) {
            res.status(400);
            throw new Error(`Insufficient stock. Max ${product.countInStock} available.`);
        }
    }

    item.quantity = quantity;
    await cart.save();
    
    // Re-validate to be safe
    await validateAndSyncCart(cart);
    
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
export const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        res.status(404);
        throw new Error('Cart not found');
    }

    // Mongoose pull method
    cart.items.pull({ _id: req.params.itemId });
    await cart.save();

    const fullCart = await Cart.findById(cart._id).populate('items.product');
    res.json(fullCart);
  } catch (error) {
    next(error);
  }
};
