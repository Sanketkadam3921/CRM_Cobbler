import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, Wrench } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // --- CHANGE: Replaced single demo user with a list of users ---
  // In a real application, this user data would come from a secure backend API.
  const users = [
    { email: "admin@cobbler.com", password: "password123", name: "Admin User" },
    { email: "staff@cobbler.com", password: "password456", name: "Staff User" }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // --- CHANGE: Find the user in the array instead of a direct comparison ---
    const foundUser = users.find(
      (user) => user.email === email && user.password === password
    );

    if (foundUser) {
      // Store auth state and user info in localStorage
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", foundUser.email);
      localStorage.setItem("userName", foundUser.name); // Store the user's name

      toast.success(`Login successful! Welcome back, ${foundUser.name}.`);
      navigate("/dashboard");
    } else {
      toast.error("Invalid credentials. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-orange-600 rounded-xl shadow-lg">
              <Wrench className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CobblerCRM</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          {/* Demo Credentials Notice */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Admin:</strong> admin@cobbler.com / password123</p>
              <p><strong>Staff:</strong> staff@cobbler.com / password456</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign up here
              </button>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2025 CobblerCRM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
