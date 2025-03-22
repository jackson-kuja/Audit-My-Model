import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { cn } from "../lib/utils";
import { UserAuthForm } from '../components/user-auth-form';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { usePageTitle } from '../hooks/usePageTitle';
// Create a simple Alert component since we don't have the UI component
const Alert = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-4 border rounded-md mb-4 ${className}`}>{children}</div>
);

const AlertTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h5 className={`font-medium mb-1 ${className}`}>{children}</h5>
);

const AlertDescription = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`text-sm ${className}`}>{children}</div>
);

const Login: React.FC = () => {
  usePageTitle('Login');
  const { user, loading } = useAuth();

  // Force redirection if authenticated
  useEffect(() => {
    if (user && !loading) {
      console.log('Login page - User is authenticated, redirecting to dashboard');
      // Use a timeout to ensure this runs after render
      const timer = setTimeout(() => {
        document.location.href = '/dashboard';
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  const goToDashboard = () => {
    document.location.href = '/dashboard';
  };

  return (
    <div className="w-full h-screen">
      <div className="container relative hidden h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <RouterLink
          to="/signup"
          className={cn(
            "absolute right-4 top-4 md:right-8 md:top-8 text-sm font-medium underline underline-offset-4 hover:text-primary"
          )}
        >
          Create Account
        </RouterLink>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-black" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            Audit My File
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This platform helps me ensure my AI models are robust, 
                ethical, and ready for real-world deployment. It's become an essential 
                part of my development workflow.&rdquo;
              </p>
              <footer className="text-sm">AI Developer</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            {user && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertTitle className="text-blue-800">Logging in...</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Redirecting you to the dashboard
                </AlertDescription>
              </Alert>
            )}
            
            {!user && (
              <>
                <div className="flex flex-col space-y-2 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Sign in to your account
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your email below to sign in
                  </p>
                </div>
                <UserAuthForm />
                <p className="px-8 text-center text-sm text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <a
                    href="https://athenlabs.com/terms/model"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://athenlabs.com/privacy/model"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Mobile view */}
      <div className="md:hidden h-full w-full p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          {user && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTitle className="text-blue-800">Logging in...</AlertTitle>
              <AlertDescription className="text-blue-700">
                Redirecting you to the dashboard
              </AlertDescription>
            </Alert>
          )}
          
          {!user && (
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Sign in to your account
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email below to sign in
                </p>
              </div>
              <UserAuthForm />
              <p className="px-8 text-center text-sm text-muted-foreground">
                By signing in, you agree to our{" "}
                <a
                  href="https://athenlabs.com/terms/model"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="https://athenlabs.com/privacy/model"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy
                </a>
                .
              </p>
              <div className="text-center">
                <RouterLink
                  to="/signup"
                  className="text-sm font-medium underline underline-offset-4 hover:text-primary"
                >
                  Don't have an account? Create one
                </RouterLink>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
