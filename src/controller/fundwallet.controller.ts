import axios from "axios";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types/types";
import { User } from "../models/user.model";
import { Transaction } from "../models/transactions.model";
import { FLW_SECRET_KEY, FRONTEND_URL_LOCAL } from "../config/env";
import Wallet from "../models/wallet.model";


export const fundWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, currency } = req.body;
    const userId = req.user?._id; // Get authenticated user ID

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: "Invalid amount." });
      return;
    }

    // Fetch user details
    const user = await User.findById(userId).session(session);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Generate transaction reference
    const transactionReference = `ACADEMIX-${Date.now()}-${userId}`;

    // Initiate payment request with Flutterwave
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: transactionReference,
        amount,
        currency: currency || "NGN", 
        redirect_url: `${FRONTEND_URL_LOCAL}/wallet/success`, // Adjust based on frontend
        customer: {
          email: user.email,
          name: user.firstName + " " + user.lastName,
        },
        customizations: {
          title: "Wallet Funding",
          description: "Funding wallet via Flutterwave",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data || response.data.status !== "success") {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: "Flutterwave payment initiation failed." });
      return;
    }

    // Store transaction in database
    const newTransaction = new Transaction({
      userId,
      transactionReference,
      amount,
      currency,
      status: "pending",
      paymentGateway: "flutterwave",
    });

    await newTransaction.save({ session });

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      paymentLink: response.data.data.link, // Redirect the user here
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error funding wallet:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    session.endSession();
  }
};

export const verifyFlutterwavePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { transactionId } = req.params; // Get transaction ID from Flutterwave callback
  
      if (!transactionId) {
        res.status(400).json({ success: false, message: "Transaction ID is required" });
        return;
      }
  
      // Verify transaction with Flutterwave
      const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
      });
  
      const transactionData = response.data?.data;
      if (!transactionData) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: "Invalid transaction data received" });
        return;
      }
  
      // Fetch transaction record
      const transaction = await Transaction.findOne({ transactionReference: transactionData.tx_ref }).session(session);
      if (!transaction) {
        await session.abortTransaction();
        res.status(404).json({ success: false, message: "Transaction not found" });
        return;
      }
  
      if (transaction.status !== "pending") {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: "Transaction already processed" });
        return;
      }
  
      // Fetch user's wallet
      const wallet = await Wallet.findOne({ userId: transaction.userId }).session(session);
      if (!wallet) {
        await session.abortTransaction();
        res.status(404).json({ success: false, message: "User wallet not found" });
        return;
      }
  
      if (transactionData.status === "successful") {
        // If transaction is successful, update wallet balance
        wallet.balance += transactionData.amount;
  
        wallet.transactions.push({
          type: "deposit",
          amount: transactionData.amount,
          description: "Wallet funding via Flutterwave",
          timestamp: new Date(),
          status: "completed",
        });
  
        // Mark transaction as successful
        transaction.status = "completed";

        await wallet.save({ session });
        await transaction.save({ session });
  
        await session.commitTransaction();
        res.status(200).json({
          success: true,
          message: "Wallet funded successfully",
        });
      } else {
        // If payment verification failed, mark transaction and wallet transaction as failed
        transaction.status = "failed";
  
        wallet.transactions.push({
          type: "deposit",
          amount: transactionData.amount,
          description: "Wallet funding failed via Flutterwave",
          timestamp: new Date(),
          status: "failed",
        });
  
        await wallet.save({ session });
        await transaction.save({ session });
  
        await session.commitTransaction();
        res.status(400).json({ success: false, message: transactionData.status === "successful" ? "Wallet funded successfully" : "Payment verification failed", });
      }
    } catch (error) {
      await session.abortTransaction();
      console.error("Error verifying Flutterwave payment:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    } finally {
      session.endSession();
    }
  };
  
  