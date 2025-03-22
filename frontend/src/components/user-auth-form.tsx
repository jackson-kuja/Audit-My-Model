import * as React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircle } from "lucide-react"

interface UserAuthFormProps {
  isRegister?: boolean
}

export function UserAuthForm({ isRegister = false }: UserAuthFormProps) {
  const { user, login, register, error, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  
  // Generate unique IDs for this form instance
  const formId = React.useId()
  const emailInputId = `email-${formId}`
  const passwordInputId = `password-${formId}`
  const firstNameInputId = `first-name-${formId}`
  const lastNameInputId = `last-name-${formId}`

  // Redirect when user state changes
  useEffect(() => {
    console.log("UserAuthForm - useEffect [user]:", { user, isLoading: loading })
    if (!loading && user) {
      // If user is already logged in, redirect to dashboard
      console.log("UserAuthForm - User authenticated, redirecting to dashboard")
      navigate("/dashboard")
    }
  }, [user, loading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormError(null)
      if (!email || !password) {
        setFormError("Please enter email and password.")
        return
      }

      if (isRegister) {
        // Register new user
        console.log("UserAuthForm - Attempting login/register:", email, "(register)")
        await register(email, password)
      } else {
        // Login existing user
        console.log("UserAuthForm - Attempting login/register:", email, "(login)")
        await login(email, password)
      }

      console.log("UserAuthForm - Login/register successful")
      // No need to manually navigate - the useEffect will handle it when user state updates
    } catch (err: any) {
      console.error("UserAuthForm - Error in handleSubmit:", err)
      setFormError(err?.message || "Something went wrong")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <Alert variant="destructive" className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4" />
          <div className="flex-1">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </div>
        </Alert>
      )}

      {isRegister && (
        <div className="space-y-2">
          <Label htmlFor={firstNameInputId} className="text-sm font-medium">
            First Name
          </Label>
          <Input
            id={firstNameInputId}
            type="text"
            placeholder="First name"
            autoCapitalize="words"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
      )}

      {isRegister && (
        <div className="space-y-2">
          <Label htmlFor={lastNameInputId} className="text-sm font-medium">
            Last Name
          </Label>
          <Input
            id={lastNameInputId}
            type="text"
            placeholder="Last name"
            autoCapitalize="words"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label
          htmlFor={emailInputId}
          className="text-sm font-medium"
        >
          Email
        </Label>
        <Input
          id={emailInputId}
          type="email"
          placeholder="name@example.com"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor={passwordInputId}
          className="text-sm font-medium"
        >
          Password
        </Label>
        <Input
          id={passwordInputId}
          type="password"
          placeholder="Password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "Loading..."
          : isRegister
          ? "Create Account"
          : "Sign In"}
      </Button>
    </form>
  )
}
