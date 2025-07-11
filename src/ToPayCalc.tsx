import React from 'react';
import { calculateOwnerBalances } from './lib/utils';
import { Id } from '../convex/_generated/dataModel';

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

interface ToPayCalcProps {
  transactionsData: {
    expenses: Expense[];
    deposits: Deposit[];
  } | null;
  owners: Owner[];
}

export default function ToPayCalc({ transactionsData, owners }: ToPayCalcProps) {
  if (!transactionsData || !owners || owners.length === 0) {
    return null;
  }

  const patriciaName = "Patricia"; // Assuming these are fixed names
  const robenaName = "Robena";

  const { ownerBalances, totalSharedExpenses, robenaSharedExpense, patriciaSharedExpense } =
    calculateOwnerBalances(transactionsData.expenses, transactionsData.deposits, owners);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">To Pay Calculation</h3>
      <div className="space-y-4">

        {/* Section: Deposits by Owner */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Deposited by Owner</h4>
          <div className="space-y-1">
            {owners.map(owner => {
              const balance = ownerBalances[owner.name];
              if (!balance || balance.deposits === 0) return null;
              return (
                <div key={owner._id} className="flex justify-between items-center text-sm">
                  <span>{owner.name}:</span>
                  <span className="font-medium text-green-600">
                    + {balance.deposits.toFixed(2)} €
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Expenses by Owner */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Expenses by Owner</h4>
          <div className="space-y-1">
            {owners.map(owner => {
              const balance = ownerBalances[owner.name];
              if (!balance || balance.expenses === 0) return null;
              return (
                <div key={owner._id} className="flex justify-between items-center text-sm">
                  <span>{owner.name}:</span>
                  <span className="font-medium text-red-600">
                    - {balance.expenses.toFixed(2)} €
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Shared Expenses */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Shared Expenses</h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span>Total Shared:</span>
              <span className="font-medium text-red-600">
                - {totalSharedExpenses.toFixed(2)} €
              </span>
            </div>
            {ownerBalances[robenaName] && (
              <div className="flex justify-between items-center text-xs text-gray-600 ml-2">
                <span>{robenaName} (2/3):</span>
                <span>- {robenaSharedExpense.toFixed(2)} €</span>
              </div>
            )}
            {ownerBalances[patriciaName] && (
              <div className="flex justify-between items-center text-xs text-gray-600 ml-2">
                <span>{patriciaName} (1/3):</span>
                <span>- {patriciaSharedExpense.toFixed(2)} €</span>
              </div>
            )}
          </div>
        </div>

        {/* Section: Final Balance (To Pay) */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Final Balance</h4>
          <div className="space-y-1">
            {owners.map(owner => {
              const balance = ownerBalances[owner.name];
              if (!balance) return null;
              const totalToPay = (balance.expenses + balance.sharedExpenses) - balance.deposits;
              return (
                <div key={owner._id} className="flex justify-between items-center text-sm">
                  <span>{owner.name}:</span>
                  <span className={`font-medium ${totalToPay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalToPay > 0
                      ? `${totalToPay.toFixed(2)} €`
                      : `has paid ${Math.abs(totalToPay).toFixed(2)} € over the request`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Settlement */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Settlement</h4>
          <div className="space-y-1">
            {(() => {
              const robenaNetBalance = ownerBalances[robenaName] ? (ownerBalances[robenaName].expenses + ownerBalances[robenaName].sharedExpenses) - ownerBalances[robenaName].deposits : 0;
              const patriciaNetBalance = ownerBalances[patriciaName] ? (ownerBalances[patriciaName].expenses + ownerBalances[patriciaName].sharedExpenses) - ownerBalances[patriciaName].deposits : 0;

              const messages: JSX.Element[] = [];

              const overallSystemBalance = robenaNetBalance + patriciaNetBalance;

              if (overallSystemBalance > 0) {
                messages.push(
                  <p key="missing-cost" className="text-sm text-gray-600">
                    The total missing cost for the system is <span className="font-medium">{overallSystemBalance.toFixed(2)} €</span>.
                  </p>
                );
              } else if (overallSystemBalance < 0) {
                messages.push(
                  <p key="overpaid-system" className="text-sm text-gray-600">
                    The system has been overpaid by <span className="font-medium">{Math.abs(overallSystemBalance).toFixed(2)} €</span>.
                  </p>
                );
              } else {
                messages.push(<p key="system-settled" className="text-sm text-gray-600">The system's overall balance is settled.</p>);
              }

              // Add a separator if there's an overall balance message and individual settlement is needed
              if (overallSystemBalance !== 0 && (robenaNetBalance !== 0 || patriciaNetBalance !== 0)) {
                messages.push(<hr key="separator" className="my-2 border-gray-200" />);
              }

              // Individual balances and direct payment
              if (robenaNetBalance === 0 && patriciaNetBalance === 0) {
                messages.push(<p key="individual-settled" className="text-sm text-gray-600">Individual balances are settled.</p>);
              } else if (robenaNetBalance > 0 && patriciaNetBalance < 0) {
                const amount = Math.min(robenaNetBalance, Math.abs(patriciaNetBalance));
                messages.push(
                  <p key="patricia-pays-robena" className="text-sm text-gray-600">
                    To settle individual accounts, {patriciaName} pays {robenaName} <span className="font-medium">{amount.toFixed(2)} €</span>.
                  </p>
                );
              } else if (patriciaNetBalance > 0 && robenaNetBalance < 0) {
                const amount = Math.min(patriciaNetBalance, Math.abs(robenaNetBalance));
                messages.push(
                  <p key="robena-pays-patricia" className="text-sm text-gray-600">
                    To settle individual accounts, {robenaName} pays {patriciaName} <span className="font-medium">{amount.toFixed(2)} €</span> to clear the balance.
                  </p>
                );
              } else if (robenaNetBalance > 0 && patriciaNetBalance > 0) {
                messages.push(
                  <p key="both-owe-individual" className="text-sm text-gray-600">
                    Both {robenaName} and {patriciaName} need to contribute to the system to cover their shares.
                  </p>
                );
              } else if (robenaNetBalance < 0 && patriciaNetBalance < 0) {
                messages.push(
                  <p key="both-overpaid-individual" className="text-sm text-gray-600">
                    Both {robenaName} and {patriciaName} have overpaid the system.
                  </p>
                );
              }
              return messages;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

