import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { cn } from "../lib/utils";
import { UserAuthForm } from '../components/user-auth-form';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Register: React.FC = () => {
  const theme = useTheme();

  return (
    <div className="w-full h-screen">
      <div className="container relative hidden h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <RouterLink
          to="/login"
          className={cn(
            "absolute right-4 top-4 md:right-8 md:top-8 text-sm font-medium underline underline-offset-4 hover:text-primary"
          )}
        >
          Login
        </RouterLink>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
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
            <Typography
              component="h1"
              variant="h4"
              align="center"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: theme.palette.primary.main
              }}
            >
              Audit My File
            </Typography>
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
            <div className="flex flex-col space-y-2 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-6 w-6">
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              Audit My File
            </div>
            <UserAuthForm isRegister={true} />
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <RouterLink
                to="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </RouterLink>{" "}
              and{" "}
              <RouterLink
                to="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </RouterLink>
              .
            </p>
          </div>
        </div>
      </div>
      {/* Mobile view */}
      <div className="md:hidden h-full w-full p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to create your account
            </p>
          </div>
          <UserAuthForm isRegister={true} />
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <RouterLink
              to="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </RouterLink>{" "}
            and{" "}
            <RouterLink
              to="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </RouterLink>
            .
          </p>
          <div className="text-center">
            <RouterLink
              to="/login"
              className="text-sm font-medium underline underline-offset-4 hover:text-primary"
            >
              Already have an account? Sign in
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
