import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, XCircle, Package, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

interface RequestWithDonation {
  id: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  requested_at: string;
  responded_at: string | null;
  donation: {
    id: string;
    title: string;
    food_type: string;
    quantity: string;
    pickup_location: string;
    expiry_date: string;
    images: string[] | null;
  } | null;
}

const MyRequests = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestWithDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("donation_requests")
        .select(`
          id,
          status,
          message,
          requested_at,
          responded_at,
          donation:food_donations (
            id,
            title,
            food_type,
            quantity,
            pickup_location,
            expiry_date,
            images
          )
        `)
        .eq("receiver_id", user.id)
        .order("requested_at", { ascending: false });

      if (!error && data) {
        setRequests(data as RequestWithDonation[]);
      }
      setLoading(false);
    };

    if (user) {
      fetchRequests();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No requests yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't made any donation requests. Browse available donations to get started.
              </p>
              <Button onClick={() => navigate("/dashboard")}>Browse Donations</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {request.donation?.images?.[0] && (
                    <div className="md:w-48 h-48 md:h-auto flex-shrink-0">
                      <img
                        src={request.donation.images[0]}
                        alt={request.donation.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-grow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">
                          {request.donation?.title || "Donation no longer available"}
                        </CardTitle>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {request.donation ? (
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>{request.donation.food_type} • {request.donation.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{request.donation.pickup_location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Expires: {format(new Date(request.donation.expiry_date), "PPP")}</span>
                          </div>
                          {request.message && (
                            <p className="mt-2 italic">"{request.message}"</p>
                          )}
                          <div className="pt-2 text-xs">
                            Requested: {format(new Date(request.requested_at), "PPp")}
                            {request.responded_at && (
                              <span className="ml-4">
                                Responded: {format(new Date(request.responded_at), "PPp")}
                              </span>
                            )}
                          </div>
                          <div className="pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/donation/${request.donation?.id}`)}
                            >
                              View Donation Details
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          This donation is no longer available.
                        </p>
                      )}
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyRequests;
