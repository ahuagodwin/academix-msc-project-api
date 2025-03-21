import mongoose, { Document, Schema, Model } from "mongoose";
import { InflowAmount } from "./inflow.model";
import { OutflowAmount } from "./outflow.model";


export interface IFinancialSummary extends Document {
  totalInflowAmount: number;
  totalOutflowAmount: number;
  netBalance: number;
  lastUpdated: Date;
}

// Extend Mongoose Model to include updateSummary method
interface FinancialSummaryModel extends Model<IFinancialSummary> {
    updateSummary(): Promise<void>;
  }

const FinancialSummarySchema = new Schema<IFinancialSummary>({
  totalInflowAmount: { type: Number, required: true, default: 0 },
  totalOutflowAmount: { type: Number, required: true, default: 0 },
  netBalance: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

// **Update the financial summary whenever transactions occur**
FinancialSummarySchema.statics.updateSummary = async function (): Promise<void> {
  try {
    // Calculate total inflow
    const inflowResult = await InflowAmount.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
    const totalInflow = inflowResult.length > 0 ? inflowResult[0].total : 0;

    // Calculate total outflow
    const outflowResult = await OutflowAmount.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
    const totalOutflow = outflowResult.length > 0 ? outflowResult[0].total : 0;

    // Calculate net balance
    const netBalance = totalInflow - totalOutflow;

    // Find and update existing summary or create a new one
    const summary = await FinancialSummary.findOne();
    if (summary) {
      summary.totalInflowAmount = totalInflow;
      summary.totalOutflowAmount = totalOutflow;
      summary.netBalance = netBalance;
      summary.lastUpdated = new Date();
      await summary.save();
    } else {
      await FinancialSummary.create({
        totalInflowAmount: totalInflow,
        totalOutflowAmount: totalOutflow,
        netBalance,
      });
    }
  } catch (error) {
    console.error("Error updating financial summary:", error);
  }
};

export const FinancialSummary = mongoose.model<IFinancialSummary, FinancialSummaryModel>("FinancialSummary", FinancialSummarySchema);
