import { Document, model, ObjectId, PopulatedDoc, Schema } from "mongoose";
import { IProduct } from "./Product";

export interface ICartItem {
  productId: PopulatedDoc<IProduct & Document<ObjectId>>;
  quantity: number;
}

export interface IUser extends Document {
  email: string;
  password: string;
  resetToken?: string;
  resetTokenExpiration?: Date;
  cart: {
    items: ICartItem[];
  };
  addToCart: (product: IProduct) => void;
  deleteItemFromCart: (productId: string) => void;
  clearCart: () => void;
  getOrders: () => void;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product: IProduct) {
  const cartProductIndex = this.cart.items.findIndex(
    (ci: ICartItem) => ci.productId?.toString() === product._id?.toString(),
  );
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }
  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;

  return this.save();
};

userSchema.methods.deleteItemFromCart = function (productId: string) {
  const updatedCartItems = this.cart.items.filter(
    (ci: ICartItem) => ci.productId?.toString() !== productId.toString(),
  );

  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

const User = model<IUser>("User", userSchema);

export default User;
