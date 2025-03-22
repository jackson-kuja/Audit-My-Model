"use client"

import * as React from "react";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { cn } from "../lib/utils";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  isRegister?: boolean;
}

export function UserAuthForm({ className, isRegister = false, ...props }: UserAuthFormProps) {
  const { user, login, register, loading, error } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  // On mount or user changes, redirect if user is not null
  React.useEffect(() => {
    console.log("UserAuthForm - useEffect [user]:", { user, isLoading: loading });
    if (!loading && user) {
      // If user is already logged in, redirect
      console.log("UserAuthForm - User detected, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLocalError(null);

    try {
      if (!email || !password) {
        setLocalError("Email and password are required");
        return;
      }

      console.log("UserAuthForm - Attempting login/register:", email, isRegister ? "(register)" : "(login)");

      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        await register(email, password);
        console.log('UserAuthForm - Registration successful');
      } else {
        console.log('UserAuthForm - Calling login function');
        await login(email, password);
        console.log('UserAuthForm - Login successful');
        console.log('UserAuthForm - User state after login:', { user });
      }
      
      // Only navigate after successful auth
      console.log('UserAuthForm - Auth successful, navigating to dashboard');
      navigate('/dashboard');
      
    } catch (err) {
      console.error("UserAuthForm - Auth error:", err);
      setLocalError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {localError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {localError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor={`email`}>
              Email
            </Label>
            <Input
              id={`email`}
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor={`password`}>
              Password
            </Label>
            <Input
              id={`password`}
              placeholder="Password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          {isRegister && (
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor={`confirmPassword`}>
                Confirm Password
              </Label>
              <Input
                id={`confirmPassword`}
                placeholder="Confirm Password"
                type="password"
                autoComplete="new-password"
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}
          
          <Button disabled={loading} type="submit">
            {loading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isRegister ? "Create Account" : "Sign In"}
          </Button>
        </div>
      </form>
    </div>
  );
}
