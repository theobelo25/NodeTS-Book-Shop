import { model, Schema } from "mongoose";
import { ICartItem } from "./User";

export interface IOrder {
  products: ICartItem[];
  user: {
    userId: string;
  };
}

const orderSchema = new Schema<IOrder>({
  products: [
    {
      productId: { type: Object, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  user: {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
});

const Order = model<IOrder>("Orders", orderSchema);

export default Order;
