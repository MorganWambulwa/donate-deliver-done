import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [userType, setUserType] = useState<"donor" | "receiver">("donor");

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
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or create an account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" placeholder="your@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" placeholder="••••••••" />
                </div>
                <Button className="w-full bg-gradient-hero">Sign In</Button>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
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
                  <Input id="name" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+254 700 000 000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
                <Button className="w-full bg-gradient-hero">Create Account</Button>
              </TabsContent>
            </Tabs>

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
