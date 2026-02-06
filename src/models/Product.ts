import { Schema, Document, model, Types } from "mongoose";

export interface IProduct extends Document {
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  userId: Types.ObjectId;
}

export const productSchema = new Schema<IProduct>({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Product = model<IProduct>("Product", productSchema);

export default Product;
