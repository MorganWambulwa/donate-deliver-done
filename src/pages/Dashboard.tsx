import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { HeartHandshake, LogOut, User as UserIcon } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const userType = user?.user_metadata?.user_type || "receiver";

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <nav className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold text-primary">
            <HeartHandshake className="h-8 w-8" />
            <span>FoodShare</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-5 w-5" />
              <span className="capitalize">{userType}</span>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Welcome to Your Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {userType === "donor" 
              ? "Start making a difference by donating surplus food to those in need."
              : "Browse available food donations and request what you need."}
          </p>

          <div className="grid gap-6">
            {userType === "donor" ? (
              <>
                <div className="bg-card border border-border rounded-lg p-6 shadow-card">
                  <h2 className="text-2xl font-bold mb-4">Post a Donation</h2>
                  <p className="text-muted-foreground mb-4">
                    Have surplus food? Share it with those who need it most.
                  </p>
                  <Button className="bg-gradient-hero">Create Donation</Button>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-card">
                  <h2 className="text-2xl font-bold mb-4">My Donations</h2>
                  <p className="text-muted-foreground">
                    View and manage your active food donations.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-card border border-border rounded-lg p-6 shadow-card">
                  <h2 className="text-2xl font-bold mb-4">Browse Donations</h2>
                  <p className="text-muted-foreground mb-4">
                    Find available food donations near you.
                  </p>
                  <Button className="bg-gradient-hero">View Donations</Button>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-card">
                  <h2 className="text-2xl font-bold mb-4">My Requests</h2>
                  <p className="text-muted-foreground">
                    Track your food donation requests and pickups.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
