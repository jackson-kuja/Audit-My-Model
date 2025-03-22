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
          <Label htmlFor="register-first-name" className="text-sm font-medium">
            First Name
          </Label>
          <Input
            id="register-first-name"
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
          <Label htmlFor="register-last-name" className="text-sm font-medium">
            Last Name
          </Label>
          <Input
            id="register-last-name"
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
          htmlFor={isRegister ? "register-email" : "login-email"}
          className="text-sm font-medium"
        >
          Email
        </Label>
        <Input
          id={isRegister ? "register-email" : "login-email"}
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
          htmlFor={isRegister ? "register-password" : "login-password"}
          className="text-sm font-medium"
        >
          Password
        </Label>
        <Input
          id={isRegister ? "register-password" : "login-password"}
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
