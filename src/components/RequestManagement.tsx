import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, X, Clock, Mail, Phone, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface DonationRequest {
  id: string;
  donation_id: string;
  receiver_id: string;
  message: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  requested_at: string;
  responded_at: string | null;
  donation: {
    id: string;
    title: string;
    food_type: string;
    images: string[] | null;
  };
  receiver: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    organization_name: string | null;
    avatar_url: string | null;
  };
}

const RequestManagement = () => {
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all donations by the current user
      const { data: donations, error: donationsError } = await supabase
        .from("food_donations")
        .select("id")
        .eq("donor_id", user.id);

      if (donationsError) throw donationsError;

      if (!donations || donations.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const donationIds = donations.map(d => d.id);

      // Get all requests for those donations
      const { data: requestsData, error: requestsError } = await supabase
        .from("donation_requests")
        .select("*")
        .in("donation_id", donationIds)
        .order("requested_at", { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Fetch donation details
      const uniqueDonationIds = [...new Set(requestsData.map(r => r.donation_id))];
      const { data: donationDetails } = await supabase
        .from("food_donations")
        .select("id, title, food_type, images")
        .in("id", uniqueDonationIds);

      // Fetch receiver profiles
      const uniqueReceiverIds = [...new Set(requestsData.map(r => r.receiver_id))];
      const { data: receiverProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, organization_name, avatar_url")
        .in("id", uniqueReceiverIds);

      // Combine data
      const enrichedRequests = requestsData.map(request => ({
        ...request,
        donation: donationDetails?.find(d => d.id === request.donation_id) || {
          id: request.donation_id,
          title: "Unknown",
          food_type: "Unknown",
          images: null,
        },
        receiver: receiverProfiles?.find(p => p.id === request.receiver_id) || {
          id: request.receiver_id,
          full_name: "Unknown",
          email: "",
          phone: "",
          organization_name: null,
          avatar_url: null,
        },
      })) as DonationRequest[];

      setRequests(enrichedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: "approved" | "rejected", donationId: string) => {
    setProcessingId(requestId);
    try {
      // Update request status
      const { error: requestError } = await supabase
        .from("donation_requests")
        .update({
          status: newStatus,
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // If approved, update donation status to confirmed
      if (newStatus === "approved") {
        const { error: donationError } = await supabase
          .from("food_donations")
          .update({ status: "confirmed" })
          .eq("id", donationId);

        if (donationError) throw donationError;

        // Reject other pending requests for the same donation
        await supabase
          .from("donation_requests")
          .update({
            status: "rejected",
            responded_at: new Date().toISOString(),
          })
          .eq("donation_id", donationId)
          .eq("status", "pending")
          .neq("id", requestId);
      }

      toast.success(`Request ${newStatus === "approved" ? "approved" : "rejected"} successfully`);
      fetchRequests();
    } catch (error: any) {
      console.error("Error updating request:", error);
      toast.error(error.message || "Failed to update request");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-primary/10"><Check className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No incoming requests yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          When someone requests your donation, it will appear here.
        </p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === "pending");
  const otherRequests = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {request.donation.images?.[0] ? (
                        <img
                          src={request.donation.images[0]}
                          alt={request.donation.title}
                          className="w-16 h-16 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No img</span>
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{request.donation.title}</CardTitle>
                        <CardDescription>
                          {request.donation.food_type} • Requested {format(new Date(request.requested_at), "MMM d, yyyy 'at' h:mm a")}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Receiver Info */}
                  <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                    {request.receiver.avatar_url ? (
                      <img
                        src={request.receiver.avatar_url}
                        alt={request.receiver.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{request.receiver.full_name}</p>
                      {request.receiver.organization_name && (
                        <p className="text-sm text-muted-foreground">{request.receiver.organization_name}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        <a href={`mailto:${request.receiver.email}`} className="flex items-center gap-1 hover:text-primary">
                          <Mail className="h-3 w-3" />
                          {request.receiver.email}
                        </a>
                        {request.receiver.phone && (
                          <a href={`tel:${request.receiver.phone}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone className="h-3 w-3" />
                            {request.receiver.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Message from requester:</p>
                      <p className="text-foreground">{request.message}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="gap-3">
                  <Button
                    onClick={() => handleUpdateStatus(request.id, "approved", request.donation_id)}
                    disabled={processingId === request.id}
                    className="flex-1 bg-gradient-hero"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {processingId === request.id ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(request.id, "rejected", request.donation_id)}
                    disabled={processingId === request.id}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {otherRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Past Requests ({otherRequests.length})
          </h3>
          <div className="space-y-3">
            {otherRequests.map((request) => (
              <Card key={request.id} className="bg-muted/20">
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {request.donation.images?.[0] ? (
                        <img
                          src={request.donation.images[0]}
                          alt={request.donation.title}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No img</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{request.donation.title}</p>
                        <p className="text-sm text-muted-foreground">
                          From {request.receiver.full_name} • {format(new Date(request.requested_at), "MMM d")}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;
