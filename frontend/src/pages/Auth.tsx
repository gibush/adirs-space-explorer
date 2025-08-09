import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authAPI, apiUtils } from '../api';

const Auth: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is already authenticated and redirect if so
  useEffect(() => {
    const checkAuthentication = async () => {
      if (apiUtils.isAuthenticated()) {
        const token = apiUtils.getAuthToken();
        if (token) {
          try {
            // Validate the token to make sure it's still valid
            const response = await authAPI.validateToken({ token });
            if (response.data.valid) {
              // User is authenticated and token is valid, redirect to platform
              navigate("/platform");
              return;
            } else {
              // Token is invalid, remove it
              apiUtils.removeAuthToken();
            }
          } catch (error) {
            // Token validation failed, remove it
            apiUtils.removeAuthToken();
          }
        }
      }
    };

    checkAuthentication();
  }, [navigate]);

  // Read the type parameter from URL on component mount
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "signup" || typeParam === "login") {
      setActiveTab(typeParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: "login" | "signup") => {
    setActiveTab(tab);
    setSearchParams({ type: tab });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (activeTab === "signup") {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match!");
          return;
        }

        // Call signup API
        const response = await authAPI.signup({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
        });

        if (response.data.success) {
          // Check if a token was returned (auto-login after signup)
          if (response.data.token) {
            // Store token and redirect to platform
            apiUtils.setAuthToken(response.data.token);
            setSuccess("Account created successfully! Redirecting...");
            
            // Redirect to platform after a short delay
            setTimeout(() => {
              navigate("/platform");
            }, 1500);
          } else {
            // No auto-login, show success message and switch to login
            setSuccess("Account created successfully! Please log in.");
            // Switch to login tab and clear form
            setActiveTab("login");
            setSearchParams({ type: "login" });
            setFormData({
              email: formData.email, // Keep email for convenience
              password: "",
              confirmPassword: "",
              firstName: "",
              lastName: "",
            });
          }
        }
      } else {
        // Call login API
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password,
        });

        if (response.data.success) {
          // Store token and redirect to platform
          apiUtils.setAuthToken(response.data.token);
          setSuccess("Login successful! Redirecting...");
          
          // Redirect to platform after a short delay
          setTimeout(() => {
            navigate("/platform");
          }, 1500);
        }
      }
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={handleBackToHome}
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center mx-auto"
          >
            ← Back to Home
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">Space Explorer</h2>
          <p className="text-gray-300">Join the cosmic journey</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => handleTabChange("login")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "login"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => handleTabChange("signup")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "signup"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            {/* Name fields for signup */}
            {activeTab === "signup" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    autoComplete="given-name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    autoComplete="family-name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Last name"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                autoComplete={activeTab === "login" ? "current-password" : "new-password"}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            {/* Confirm password for signup */}
            {activeTab === "signup" && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {activeTab === "login" ? "Signing In..." : "Creating Account..."}
              </>
            ) : (
              activeTab === "login" ? "Sign In" : "Create Account"
            )}
          </button>

          
        </form>

        {/* Additional info */}
        <div className="text-center text-sm text-gray-400">
          {activeTab === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => handleTabChange("signup")}
                className="text-blue-400 hover:text-blue-300"
              >
                Sign up here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => handleTabChange("login")}
                className="text-blue-400 hover:text-blue-300"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
