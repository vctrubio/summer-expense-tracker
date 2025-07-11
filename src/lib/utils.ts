import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Id } from "../convex/_generated/dataModel";

interface Expense {
  _id: Id<'expenses'>;
  amount: number;
  desc: string;
  timestamp: number;
  dst?: string; // Destination owner for expenses
}

interface Deposit {
  _id: Id<'deposits'>;
  amount: number;
  timestamp: number;
  by?: string; // Owner who made the deposit
}

interface Owner {
  _id: Id<'owners'>;
  name: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, type: "expense" | "deposit"): string {
  const formattedAmount = amount.toFixed(2);
  if (type === "expense") {
    return `- ${formattedAmount} €`;
  } else {
    return `+ ${formattedAmount} €`;
  }
}

export function calculateOwnerBalances(
  expenses: Expense[],
  deposits: Deposit[],
  owners: Owner[]
) {
  const patriciaName = "Patricia";
  const robenaName = "Robena";

  const ownerBalances: { [key: string]: { expenses: number; deposits: number; sharedExpenses: number } } = {};
  owners.forEach(owner => {
    ownerBalances[owner.name] = { expenses: 0, deposits: 0, sharedExpenses: 0 };
  });

  let totalSharedExpenses = 0;

  expenses.forEach(expense => {
    if (expense.dst && ownerBalances[expense.dst]) {
      ownerBalances[expense.dst].expenses += expense.amount;
    } else {
      totalSharedExpenses += expense.amount;
    }
  });

  deposits.forEach(deposit => {
    if (deposit.by && ownerBalances[deposit.by]) {
      ownerBalances[deposit.by].deposits += deposit.amount;
    }
  });

  const robenaSharedExpense = totalSharedExpenses * (2 / 3);
  const patriciaSharedExpense = totalSharedExpenses * (1 / 3);

  if (ownerBalances[robenaName]) {
    ownerBalances[robenaName].sharedExpenses = robenaSharedExpense;
  }
  if (ownerBalances[patriciaName]) {
    ownerBalances[patriciaName].sharedExpenses = patriciaSharedExpense;
  }

  return {
    ownerBalances,
    totalSharedExpenses,
    robenaSharedExpense,
    patriciaSharedExpense,
  };
}