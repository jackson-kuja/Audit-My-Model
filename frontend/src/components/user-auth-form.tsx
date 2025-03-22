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
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // Generate unique IDs for form fields to avoid DOM conflicts
  const idPrefix = React.useId();

  // If user is already authenticated, redirect to dashboard
  React.useEffect(() => {
    console.log('UserAuthForm - useEffect [user]:', { user, isLoading });
    if (user) {
      console.log('UserAuthForm - User already authenticated, redirecting to dashboard');
      console.log('UserAuthForm - User data:', user);
      console.log('UserAuthForm - Current location:', window.location.pathname);
      console.log('UserAuthForm - Calling navigate("/dashboard")');
      navigate('/dashboard');
      console.log('UserAuthForm - Navigate called');
    }
  }, [user, navigate, isLoading]);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    // Set authentication flag immediately - this will be detected by our early scripts
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('lastAuthTime', Date.now().toString());
    // Also use sessionStorage as a backup
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('lastAuthTime', Date.now().toString());
    
    // Create a timestamp that will be used to validate the redirect
    const authTimestamp = Date.now().toString();
    
    // Force immediate hard redirect WITH authentication parameter in URL
    console.log('UserAuthForm - CRITICAL REDIRECT: Forcing navigation to dashboard IMMEDIATELY');
    window.location.replace(`/dashboard?authenticated=true&ts=${authTimestamp}`);
    
    try {
      console.log(`UserAuthForm - Attempting ${isRegister ? 'registration' : 'login'} with email: ${email}`);
      
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
      
      // This point should never be reached as we already redirected
      
    } catch (err) {
      console.error(`UserAuthForm - ${isRegister ? 'Registration' : 'Login'} error:`, err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      // Remove the auth flag if login fails
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastAuthTime');
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('lastAuthTime');
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor={`${idPrefix}-email`}>
              Email
            </Label>
            <Input
              id={`${idPrefix}-email`}
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor={`${idPrefix}-password`}>
              Password
            </Label>
            <Input
              id={`${idPrefix}-password`}
              placeholder="Password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          {isRegister && (
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor={`${idPrefix}-confirmPassword`}>
                Confirm Password
              </Label>
              <Input
                id={`${idPrefix}-confirmPassword`}
                placeholder="Confirm Password"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}
          
          <Button disabled={isLoading} type="submit">
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isRegister ? "Create Account" : "Sign In"}
          </Button>
        </div>
      </form>
    </div>
  );
}
