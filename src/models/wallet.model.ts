import mongoose, { Schema, Model, Document, Types } from "mongoose";
interface ITransaction {
  type: "deposit" | "withdrawal";
  amount: number;
  timestamp: Date;
  description?: string;
  status: "pending" | "completed" | "failed";
}

 interface IWallet extends Document {
  walletId: string
  userId: string;
  balance: number;
  currency: string;
  transactions: ITransaction[];
  deposit(amount: number, description?: string): Promise<void>;
  withdraw(amount: number, description?: string): Promise<boolean>;
}

// Define the Schema for the Wallet model
const walletSchema: Schema<IWallet> = new mongoose.Schema(
  {
    walletId: {
      type: String,
      unique: true,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0.0,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["deposit", "withdrawal"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        description: {
          type: String,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ** Deposit Money **
walletSchema.methods.deposit = async function (amount: number, description = "Deposit") {
  if (amount <= 0) throw new Error("Deposit amount must be greater than zero.");
  
  this.balance += amount;
  this.transactions.push({
    type: "deposit",
    amount,
    description,
    timestamp: new Date(),
    status: "completed", // Assuming deposits are instant
  });

  await this.save();
};

// ** Withdraw Money **
walletSchema.methods.withdraw = async function (amount: number, description = "Withdrawal"): Promise<boolean> {
  if (amount <= 0) throw new Error("Withdrawal amount must be greater than zero.");
  if (this.balance < amount) throw new Error("Insufficient funds.");

  this.balance -= amount;
  this.transactions.push({
    type: "withdrawal",
    amount,
    description,
    timestamp: new Date(),
    status: "pending", // Assuming withdrawals need processing
  });

  await this.save();
  return true;
};

// Export the Wallet model
const Wallet: Model<IWallet> = mongoose.model<IWallet>("Wallet", walletSchema);
export default Wallet;
