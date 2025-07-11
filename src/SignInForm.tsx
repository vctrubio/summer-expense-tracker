"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

function ContactInfo() {
  return (
    <div className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-center gap-4 mb-2">
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <a href="mailto:dev@donkeydrills?subject=Error%20401" className="text-blue-600 hover:text-blue-800 hover:underline">
            dev@donkeydrills
          </a>
        </div>
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          <a href="https://github.com/vctrubio/summer-expense-tracker" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
            Check the code
          </a>
        </div>
      </div>
      <p>This is made by <span className="text-blue-600 hover:text-blue-800">donkeydrills.com</span></p>
    </div>
  );
}

function SignUpForm() {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="flex flex-col gap-form-field"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.target as HTMLFormElement);
        formData.set("flow", "signUp");
        void signIn("password", formData).catch((error) => {
          let toastTitle = "";
          if (error.message.includes("User already exists")) {
            toastTitle = "User already exists. Please sign in instead.";
          } else {
            toastTitle = "Could not sign up. Please try again.";
          }
          toast.error(toastTitle);
          setSubmitting(false);
        });
      }}
    >
      <input
        className="auth-input-field"
        type="email"
        name="email"
        placeholder="Email"
        required
      />
      <input
        className="auth-input-field"
        type="password"
        name="password"
        placeholder="Password"
        required
      />
      <button className="auth-button" type="submit" disabled={submitting}>
        Sign up
      </button>
    </form>
  );
}

export { SignUpForm };

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", "signIn");
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle = "Could not sign in. Please check your credentials.";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          Sign in
        </button>
      </form>
      <SignUpForm />
      <ContactInfo />
    </div>
  );
}
