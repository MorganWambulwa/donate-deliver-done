import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HeartHandshake, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { signUp, signIn, resetPassword } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const [userType, setUserType] = useState<"donor" | "receiver">("donor");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a password recovery callback
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsUpdatingPassword(true);
      }
    });
  }, []);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    try {
      signInSchema.parse({ email, password });
      
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
      userType,
    };

    try {
      signUpSchema.parse(data);

      const { error } = await signUp(data);

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Account created successfully! Redirecting...");
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("reset-email") as string;

    try {
      z.string().email().parse(email);
      
      const { error } = await resetPassword(email);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset link sent! Check your email.");
        setShowResetPassword(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error("Please enter a valid email address");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("new-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    try {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully!");
        setIsUpdatingPassword(false);
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-bold text-primary mb-2">
            <HeartHandshake className="h-10 w-10" />
            <span>FoodShare</span>
          </Link>
          <p className="text-muted-foreground">Join the movement to end hunger</p>
        </div>

        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle>
              {(showResetPassword || isUpdatingPassword) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowResetPassword(false);
                    setIsUpdatingPassword(false);
                  }}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              )}
              {isUpdatingPassword ? "Update Password" : showResetPassword ? "Reset Password" : "Welcome"}
            </CardTitle>
            <CardDescription>
              {isUpdatingPassword
                ? "Enter your new password"
                : showResetPassword 
                  ? "Enter your email to receive a password reset link"
                  : "Sign in or create an account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isUpdatingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    name="new-password"
                    type="password" 
                    placeholder="••••••••" 
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    name="confirm-password"
                    type="password" 
                    placeholder="••••••••" 
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            ) : showResetPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input 
                    id="reset-email" 
                    name="reset-email"
                    type="email" 
                    placeholder="your@email.com" 
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input 
                      id="signin-email" 
                      name="signin-email"
                      type="email" 
                      placeholder="your@email.com" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input 
                      id="signin-password" 
                      name="signin-password"
                      type="password" 
                      placeholder="••••••••" 
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-primary"
                      onClick={() => setShowResetPassword(true)}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-4 mb-6">
                    <Label>I want to:</Label>
                    <RadioGroup value={userType} onValueChange={(value: "donor" | "receiver") => setUserType(value)}>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-primary transition-colors">
                        <RadioGroupItem value="donor" id="donor" />
                        <Label htmlFor="donor" className="flex-1 cursor-pointer">
                          <div className="font-semibold">Donate Food</div>
                          <div className="text-sm text-muted-foreground">I'm a restaurant or individual with surplus food</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-primary transition-colors">
                        <RadioGroupItem value="receiver" id="receiver" />
                        <Label htmlFor="receiver" className="flex-1 cursor-pointer">
                          <div className="font-semibold">Request Food</div>
                          <div className="text-sm text-muted-foreground">I'm looking for food donations for my family/organization</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name / Organization</Label>
                    <Input 
                      id="name" 
                      name="name"
                      placeholder="John Doe" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      placeholder="your@email.com" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      type="tel" 
                      placeholder="+254 700 000 000" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password"
                      type="password" 
                      placeholder="••••••••" 
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
