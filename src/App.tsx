import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import ExpenseTracker from "./ExpenseTracker";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-gray-800">Tarifa Tracker</h2>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1 p-4">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Authenticated>
        <ExpenseTracker />
      </Authenticated>
      <Unauthenticated>
        <div className="max-w-2xl mx-auto mt-20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🌊 Welcome to Nacho and the Boys Tarifa Expenses 2025! 🏄‍♂️
            </h1>
            <div className="text-lg text-gray-700 mb-4">
              Featuring the legendary trio:
            </div>
            <div className="text-xl font-semibold text-blue-600 mb-2">
              🇪🇸 Paco • Pablo • Noah 🇪🇸
            </div>
            <div className="text-lg text-gray-600 mb-6">
              with Dr. <em>Gardener</em> <strong>Nacho Trueba</strong>
            </div>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
