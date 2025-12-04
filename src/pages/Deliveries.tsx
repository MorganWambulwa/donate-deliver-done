import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeliveryTracker from "@/components/DeliveryTracker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

const Deliveries = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"donor" | "receiver" | "delivery">("receiver");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.user_type) {
        setUserType(data.user_type as "donor" | "receiver" | "delivery");
      }
      setLoading(false);
    };

    if (user) {
      fetchUserType();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Delivery Tracking</h1>
            <p className="text-muted-foreground">
              Track the status of food deliveries in real-time
            </p>
          </div>
        </div>

        {user && (
          <DeliveryTracker userId={user.id} userType={userType} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Deliveries;
