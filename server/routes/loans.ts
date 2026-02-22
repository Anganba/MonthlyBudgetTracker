import { RequestHandler } from "express";
import { LoanModel } from "../models/Loan";
import { WalletModel } from "../models/Wallet";
import { AuditLogModel } from "../models/WalletAuditLog";
import { Loan } from "@shared/api";
import crypto from "crypto";

const mapToLoan = (doc: any): Loan => ({
    id: doc._id.toString(),
    userId: doc.userId,
    personName: doc.personName,
    direction: doc.direction,
    totalAmount: doc.totalAmount,
    remainingAmount: doc.remainingAmount,
    description: doc.description,
    walletId: doc.walletId,
    status: doc.status,
    date: doc.date,
    dueDate: doc.dueDate,
    payments: (doc.payments || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        date: p.date,
        timestamp: p.timestamp,
        walletId: p.walletId,
        note: p.note,
    })),
    topUps: (doc.topUps || []).map((t: any) => ({
        id: t.id,
        amount: t.amount,
        date: t.date,
        timestamp: t.timestamp,
        description: t.description,
        walletId: t.walletId,
    })),
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
});

// GET /api/loans
export const getLoans: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const status = req.query.status as string;
        const filter: any = { userId };
        if (status && status !== 'all') filter.status = status;

        const loans = await LoanModel.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: loans.map(mapToLoan) });
    } catch (error) {
        console.error("Get loans error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// POST /api/loans
export const createLoan: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const { personName, direction, totalAmount, description, walletId, date, dueDate } = req.body;

        if (!personName || !direction || !totalAmount || totalAmount <= 0) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Adjust wallet balance if a wallet is specified
        if (walletId) {
            const wallet = await WalletModel.findOne({ _id: walletId, userId });
            if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

            const previousBalance = wallet.balance;
            let changeAmount = 0;

            if (direction === 'given') {
                // Lending money: decrease wallet balance
                if (wallet.balance < totalAmount) {
                    return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
                }
                wallet.balance -= totalAmount;
                changeAmount = -totalAmount;
            } else {
                // Borrowing money: increase wallet balance
                wallet.balance += totalAmount;
                changeAmount = totalAmount;
            }
            await wallet.save();

            // Create audit log for wallet balance change
            await AuditLogModel.create({
                userId,
                entityType: 'wallet',
                entityId: walletId,
                entityName: wallet.name,
                changeType: 'balance_change',
                previousBalance,
                newBalance: wallet.balance,
                changeAmount,
                reason: `Loan ${direction === 'given' ? 'Creation (Lent)' : 'Creation (Borrowed)'}: ${personName}`,
                details: JSON.stringify({ personName, direction, totalAmount })
            });
        }

        // Check if an active loan already exists with the same person and direction
        const existingLoan = await LoanModel.findOne({
            userId,
            personName: personName.trim(),
            direction,
            status: 'active'
        });

        const initialTopUp = {
            id: crypto.randomUUID(),
            amount: totalAmount,
            date: date || new Date().toISOString().split('T')[0],
            description: description || undefined,
            walletId: walletId || undefined
        };

        if (existingLoan) {
            existingLoan.topUps.push(initialTopUp);
            existingLoan.totalAmount += totalAmount;
            existingLoan.remainingAmount += totalAmount;
            if (dueDate) {
                existingLoan.dueDate = dueDate;
            }

            await existingLoan.save();

            // Create audit log for loan consolidation
            await AuditLogModel.create({
                userId,
                entityType: 'loan',
                entityId: existingLoan._id.toString(),
                entityName: `${personName} (${direction === 'given' ? 'Lent' : 'Borrowed'})`,
                changeType: 'loan_updated',
                changeAmount: totalAmount,
                details: `Added new $${totalAmount} to existing loan. New Total: $${existingLoan.totalAmount} | Remaining: $${existingLoan.remainingAmount}${description ? ` | +${description}` : ''}`,
            });

            return res.json({ success: true, data: mapToLoan(existingLoan) });
        }

        const loan = await LoanModel.create({
            userId,
            personName: personName.trim(),
            direction,
            totalAmount,
            remainingAmount: totalAmount,
            description: description || '',
            walletId,
            status: 'active',
            date: date || new Date().toISOString().split('T')[0],
            dueDate: dueDate || undefined,
            payments: [],
            topUps: [initialTopUp],
        });

        // Create audit log
        await AuditLogModel.create({
            userId,
            entityType: 'loan',
            entityId: loan._id.toString(),
            entityName: `${personName} (${direction === 'given' ? 'Lent' : 'Borrowed'})`,
            changeType: 'loan_created',
            changeAmount: totalAmount,
            details: `$${totalAmount} ${direction === 'given' ? 'lent to' : 'borrowed from'} ${personName}${dueDate ? ` | Due: ${dueDate}` : ''}`,
        });

        res.json({ success: true, data: mapToLoan(loan) });
    } catch (error) {
        console.error("Create loan error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// PUT /api/loans/:id
export const updateLoan: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const loan = await LoanModel.findOne({ _id: id, userId });
        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });

        const { personName, description, dueDate } = req.body;
        const changes: string[] = [];

        if (personName && personName !== loan.personName) {
            changes.push(`person: "${loan.personName}" → "${personName}"`);
            loan.personName = personName.trim();
        }
        if (description !== undefined && description !== loan.description) {
            changes.push('description');
            loan.description = description;
        }
        if (dueDate !== undefined && dueDate !== loan.dueDate) {
            changes.push(`due date: ${loan.dueDate || 'none'} → ${dueDate || 'none'}`);
            loan.dueDate = dueDate || undefined;
        }

        await loan.save();

        if (changes.length > 0) {
            await AuditLogModel.create({
                userId,
                entityType: 'loan',
                entityId: id,
                entityName: `${loan.personName} (${loan.direction === 'given' ? 'Lent' : 'Borrowed'})`,
                changeType: 'loan_updated',
                details: `Updated: ${changes.join(', ')}`,
            });
        }

        res.json({ success: true, data: mapToLoan(loan) });
    } catch (error) {
        console.error("Update loan error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// DELETE /api/loans/:id
export const deleteLoan: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const loan = await LoanModel.findOne({ _id: id, userId });
        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });

        // Reverse wallet balance if wallet exists and loan is still active
        if (loan.status === 'active' && loan.walletId) {
            const wallet = await WalletModel.findOne({ _id: loan.walletId, userId });
            if (wallet) {
                const previousBalance = wallet.balance;
                let changeAmount = 0;

                if (loan.direction === 'given') {
                    // Return remaining amount back to wallet
                    wallet.balance += loan.remainingAmount;
                    changeAmount = loan.remainingAmount;
                } else {
                    // Remove remaining borrowed amount from wallet
                    wallet.balance -= loan.remainingAmount;
                    changeAmount = -loan.remainingAmount;
                }
                await wallet.save();

                // Create audit log for wallet balance reversal
                await AuditLogModel.create({
                    userId,
                    entityType: 'wallet',
                    entityId: loan.walletId,
                    entityName: wallet.name,
                    changeType: 'balance_change',
                    previousBalance,
                    newBalance: wallet.balance,
                    changeAmount,
                    reason: `Loan Deletion: ${loan.personName}`,
                    details: JSON.stringify({ loanId: id, personName: loan.personName, remainingAmount: loan.remainingAmount })
                });
            }
        }

        await AuditLogModel.create({
            userId,
            entityType: 'loan',
            entityId: id,
            entityName: `${loan.personName} (${loan.direction === 'given' ? 'Lent' : 'Borrowed'})`,
            changeType: 'loan_deleted',
            changeAmount: loan.totalAmount,
            details: `Deleted: $${loan.totalAmount} ${loan.direction === 'given' ? 'lent to' : 'borrowed from'} ${loan.personName} (Remaining: $${loan.remainingAmount})`,
        });

        await LoanModel.deleteOne({ _id: id, userId });
        res.json({ success: true });
    } catch (error) {
        console.error("Delete loan error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// POST /api/loans/:id/payments
export const addLoanPayment: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const loan = await LoanModel.findOne({ _id: id, userId });
        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
        if (loan.status === 'settled') {
            return res.status(400).json({ success: false, message: "Loan is already settled" });
        }

        const { amount, date, timestamp, walletId, note } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Payment amount must be greater than 0" });
        }
        if (amount > loan.remainingAmount) {
            return res.status(400).json({ success: false, message: `Payment exceeds remaining amount ($${loan.remainingAmount})` });
        }

        // Adjust wallet balance for the repayment
        if (walletId) {
            const wallet = await WalletModel.findOne({ _id: walletId, userId });
            if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

            const previousBalance = wallet.balance;
            let changeAmount = 0;

            if (loan.direction === 'given') {
                // Someone is paying us back: increase wallet
                wallet.balance += amount;
                changeAmount = amount;
            } else {
                // We are paying back: decrease wallet
                if (wallet.balance < amount) {
                    return res.status(400).json({ success: false, message: "Insufficient wallet balance for repayment" });
                }
                wallet.balance -= amount;
                changeAmount = -amount;
            }
            await wallet.save();

            // Create audit log for wallet balance change
            await AuditLogModel.create({
                userId,
                entityType: 'wallet',
                entityId: walletId,
                entityName: wallet.name,
                changeType: 'balance_change',
                previousBalance,
                newBalance: wallet.balance,
                changeAmount,
                reason: `Loan Payment: ${loan.personName}`,
                details: JSON.stringify({ loanId: id, personName: loan.personName, amount })
            });
        }

        const payment = {
            id: crypto.randomUUID(),
            amount,
            date: date || new Date().toISOString().split('T')[0],
            timestamp: timestamp || undefined,
            walletId: walletId || undefined,
            note: note || undefined,
        };

        loan.payments.push(payment);
        loan.remainingAmount -= amount;

        // Auto-settle if fully repaid
        if (loan.remainingAmount <= 0) {
            loan.remainingAmount = 0;
            loan.status = 'settled';
        }

        await loan.save();

        // Audit log for the payment
        await AuditLogModel.create({
            userId,
            entityType: 'loan',
            entityId: id,
            entityName: `${loan.personName} (${loan.direction === 'given' ? 'Lent' : 'Borrowed'})`,
            changeType: loan.status === 'settled' ? 'loan_settled' : 'loan_payment_added',
            changeAmount: amount,
            details: `Payment $${amount}${note ? ` — ${note}` : ''}${loan.status === 'settled' ? ' | FULLY SETTLED' : ` | Remaining: $${loan.remainingAmount}`}`,
        });

        res.json({ success: true, data: mapToLoan(loan) });
    } catch (error) {
        console.error("Add loan payment error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// DELETE /api/loans/:id/payments/:paymentId
export const removeLoanPayment: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id, paymentId } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const loan = await LoanModel.findOne({ _id: id, userId });
        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });

        const paymentIndex = loan.payments.findIndex((p: any) => p.id === paymentId);
        if (paymentIndex === -1) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        const payment = loan.payments[paymentIndex];

        // Reverse wallet balance
        if (payment.walletId) {
            const wallet = await WalletModel.findOne({ _id: payment.walletId, userId });
            if (wallet) {
                const previousBalance = wallet.balance;
                let changeAmount = 0;

                if (loan.direction === 'given') {
                    wallet.balance -= payment.amount;
                    changeAmount = -payment.amount;
                } else {
                    wallet.balance += payment.amount;
                    changeAmount = payment.amount;
                }
                await wallet.save();

                // Create audit log for wallet balance reversal
                await AuditLogModel.create({
                    userId,
                    entityType: 'wallet',
                    entityId: payment.walletId,
                    entityName: wallet.name,
                    changeType: 'balance_change',
                    previousBalance,
                    newBalance: wallet.balance,
                    changeAmount,
                    reason: `Loan Payment Removed: ${loan.personName}`,
                    details: JSON.stringify({ loanId: id, personName: loan.personName, amount: payment.amount })
                });
            }
        }

        // Reverse loan remaining amount
        loan.remainingAmount += payment.amount;
        if (loan.status === 'settled') {
            loan.status = 'active';
        }
        loan.payments.splice(paymentIndex, 1);
        await loan.save();

        await AuditLogModel.create({
            userId,
            entityType: 'loan',
            entityId: id,
            entityName: `${loan.personName} (${loan.direction === 'given' ? 'Lent' : 'Borrowed'})`,
            changeType: 'loan_payment_removed',
            changeAmount: -payment.amount,
            details: `Removed payment of $${payment.amount} | Remaining: $${loan.remainingAmount}`,
        });

        res.json({ success: true, data: mapToLoan(loan) });
    } catch (error) {
        console.error("Remove loan payment error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
