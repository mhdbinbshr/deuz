
import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
  productType: { type: String, enum: ['APPAREL', 'CARD'], default: 'APPAREL' },
  countInStock: { type: Number, required: true, default: 0 },
  isArchived: { type: Boolean, default: false },
  image: { type: String, required: true },
  sizes: [String],
  details: { type: Map, of: String },
  uniquenessTag: { type: String },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;
