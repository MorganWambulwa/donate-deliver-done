import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { HeartHandshake, LogOut, User as UserIcon, Plus, Settings, Inbox, Map } from "lucide-react";
import CreateDonationForm from "@/components/CreateDonationForm";
import DonationsList from "@/components/DonationsList";
import RequestManagement from "@/components/RequestManagement";
import DonationsMap from "@/components/DonationsMap";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "map" | "my-items" | "requests">("browse");
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

  // Enable real-time notifications
  useRealtimeNotifications({ user, userType });

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
            <Button variant="ghost" onClick={() => navigate("/profile")}>
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </Button>
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

          {userType === "donor" && (
            <div className="flex justify-end mb-6">
              <Button onClick={() => setShowCreateForm(true)} className="bg-gradient-hero">
                <Plus className="h-4 w-4 mr-2" />
                Create Donation
              </Button>
            </div>
          )}

          <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto">
            <button
              onClick={() => setActiveTab("browse")}
              className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
                activeTab === "browse"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {userType === "donor" ? "All Donations" : "Browse Donations"}
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`pb-3 px-1 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "map"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Map className="h-4 w-4" />
              Map View
            </button>
            <button
              onClick={() => setActiveTab("my-items")}
              className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
                activeTab === "my-items"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {userType === "donor" ? "My Donations" : "My Requests"}
            </button>
            {userType === "donor" && (
              <button
                onClick={() => setActiveTab("requests")}
                className={`pb-3 px-1 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "requests"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Inbox className="h-4 w-4" />
                Incoming Requests
              </button>
            )}
          </div>

          <div>
            {activeTab === "browse" ? (
              <DonationsList userType={userType} filterByUser={false} />
            ) : activeTab === "map" ? (
              <DonationsMap />
            ) : activeTab === "my-items" ? (
              userType === "donor" ? (
                <DonationsList userType={userType} filterByUser={true} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Request tracking coming soon...
                </div>
              )
            ) : (
              <RequestManagement />
            )}
          </div>
        </div>
      </div>

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Donation</DialogTitle>
            <DialogDescription>
              Share your surplus food with those who need it most.
            </DialogDescription>
          </DialogHeader>
          <CreateDonationForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
