import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import DeliveryRouteOptimizer from "@/components/DeliveryRouteOptimizer";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin,
  Phone,
  User,
  ArrowLeft,
  Route
} from "lucide-react";
import { format } from "date-fns";

interface Delivery {
  id: string;
  status: "assigned" | "in_transit" | "delivered" | "failed";
  pickup_time: string | null;
  delivery_time: string | null;
  delivery_notes: string | null;
  created_at: string;
  donation: {
    id: string;
    title: string;
    pickup_location: string;
    images: string[] | null;
  } | null;
  request: {
    id: string;
    receiver_id: string;
    message: string | null;
  } | null;
  donor_profile?: {
    full_name: string;
    phone: string;
  } | null;
  receiver_profile?: {
    full_name: string;
    phone: string;
    address: string | null;
  } | null;
}

const statusSteps = [
  { key: "assigned", label: "Assigned", icon: Clock },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const DeliveryDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkUserType = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.user_type !== "delivery") {
        toast.error("Access denied. This page is for delivery personnel only.");
        navigate("/dashboard");
        return;
      }
      setUserType(data.user_type);
    };

    if (user) {
      checkUserType();
    }
  }, [user, navigate]);

  const fetchDeliveries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select(`
          id,
          status,
          pickup_time,
          delivery_time,
          delivery_notes,
          created_at,
          donation:food_donations (
            id,
            title,
            pickup_location,
            images,
            donor_id
          ),
          request:donation_requests (
            id,
            receiver_id,
            message
          )
        `)
        .eq("delivery_person_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch donor and receiver profiles
      const deliveriesWithProfiles = await Promise.all(
        (data || []).map(async (delivery: any) => {
          let donorProfile = null;
          let receiverProfile = null;

          if (delivery.donation?.donor_id) {
            const { data: donorData } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("id", delivery.donation.donor_id)
              .maybeSingle();
            donorProfile = donorData;
          }

          if (delivery.request?.receiver_id) {
            const { data: receiverData } = await supabase
              .from("profiles")
              .select("full_name, phone, address")
              .eq("id", delivery.request.receiver_id)
              .maybeSingle();
            receiverProfile = receiverData;
          }

          return { 
            ...delivery, 
            donor_profile: donorProfile,
            receiver_profile: receiverProfile 
          };
        })
      );

      setDeliveries(deliveriesWithProfiles as Delivery[]);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userType === "delivery") {
      fetchDeliveries();

      // Subscribe to real-time updates
      const channel = supabase
        .channel("delivery-dashboard-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "deliveries" },
          () => {
            fetchDeliveries();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, userType]);

  const sendNotification = async (delivery: Delivery, newStatus: string) => {
    try {
      if (!delivery.request?.receiver_id) return;

      const { data: receiverProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", delivery.request.receiver_id)
        .maybeSingle();

      if (!receiverProfile?.email) return;

      await supabase.functions.invoke("send-delivery-notification", {
        body: {
          deliveryId: delivery.id,
          newStatus,
          donationTitle: delivery.donation?.title || "Food Donation",
          recipientEmail: receiverProfile.email,
          recipientName: receiverProfile.full_name || "Valued User",
        },
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const updateDeliveryStatus = async (
    deliveryId: string,
    newStatus: "in_transit" | "delivered" | "failed"
  ) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === "in_transit") {
        updateData.pickup_time = new Date().toISOString();
      } else if (newStatus === "delivered") {
        updateData.delivery_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from("deliveries")
        .update(updateData)
        .eq("id", deliveryId);

      if (error) throw error;

      const delivery = deliveries.find(d => d.id === deliveryId);
      if (delivery) {
        sendNotification(delivery, newStatus);
      }

      toast.success(`Delivery marked as ${newStatus.replace("_", " ")}`);
      fetchDeliveries();
    } catch (error: any) {
      console.error("Error updating delivery:", error);
      toast.error(error.message || "Failed to update delivery status");
    }
  };

  const getStatusIndex = (status: string) => {
    if (status === "failed") return -1;
    return statusSteps.findIndex((s) => s.key === status);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Assigned
          </Badge>
        );
      case "in_transit":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <Truck className="w-3 h-3 mr-1" />
            In Transit
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Delivered
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const activeDeliveries = deliveries.filter(d => d.status === "assigned" || d.status === "in_transit");
  const completedDeliveries = deliveries.filter(d => d.status === "delivered" || d.status === "failed");

  if (authLoading || (user && !userType)) {
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
            <h1 className="text-3xl font-bold text-foreground">My Deliveries</h1>
            <p className="text-muted-foreground">
              Manage your assigned food deliveries
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{deliveries.length}</div>
              <p className="text-sm text-muted-foreground">Total Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{deliveries.filter(d => d.status === "assigned").length}</div>
              <p className="text-sm text-muted-foreground">Pending Pickup</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">{deliveries.filter(d => d.status === "in_transit").length}</div>
              <p className="text-sm text-muted-foreground">In Transit</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-600">{deliveries.filter(d => d.status === "delivered").length}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : deliveries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No deliveries assigned</h3>
              <p className="text-muted-foreground text-center">
                You don't have any deliveries assigned yet. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="deliveries" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="deliveries" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                My Deliveries
              </TabsTrigger>
              <TabsTrigger value="route" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Route Optimizer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deliveries" className="space-y-8">
              {/* Active Deliveries */}
              {activeDeliveries.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Active Deliveries</h2>
                  <div className="space-y-4">
                    {activeDeliveries.map((delivery) => {
                      const currentStep = getStatusIndex(delivery.status);

                      return (
                        <Card key={delivery.id} className="overflow-hidden border-primary/20">
                          <CardHeader className="pb-3 bg-primary/5">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {delivery.donation?.title || "Donation"}
                              </CardTitle>
                              {getStatusBadge(delivery.status)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-4">
                            {/* Progress Timeline */}
                            <div className="flex items-center justify-between relative">
                              <div className="absolute top-4 left-0 right-0 h-1 bg-muted" />
                              <div
                                className="absolute top-4 left-0 h-1 bg-primary transition-all duration-500"
                                style={{
                                  width: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
                                }}
                              />
                              {statusSteps.map((step, index) => {
                                const Icon = step.icon;
                                const isCompleted = index <= currentStep;
                                const isCurrent = index === currentStep;

                                return (
                                  <div key={step.key} className="flex flex-col items-center relative z-10">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                        isCompleted
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted text-muted-foreground"
                                      } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <span className={`text-xs mt-2 ${isCompleted ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Contact Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-foreground">Pickup From (Donor)</h4>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  {delivery.donor_profile && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{delivery.donor_profile.full_name}</span>
                                      </div>
                                      {delivery.donor_profile.phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4" />
                                          <a href={`tel:${delivery.donor_profile.phone}`} className="hover:underline">
                                            {delivery.donor_profile.phone}
                                          </a>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{delivery.donation?.pickup_location || "Not specified"}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-foreground">Deliver To (Receiver)</h4>
                                {delivery.receiver_profile ? (
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      <span>{delivery.receiver_profile.full_name}</span>
                                    </div>
                                    {delivery.receiver_profile.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <a href={`tel:${delivery.receiver_profile.phone}`} className="hover:underline">
                                          {delivery.receiver_profile.phone}
                                        </a>
                                      </div>
                                    )}
                                    {delivery.receiver_profile.address && (
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-0.5" />
                                        <span>{delivery.receiver_profile.address}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Receiver details not available
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-4 border-t">
                              {delivery.status === "assigned" && (
                                <Button
                                  onClick={() => updateDeliveryStatus(delivery.id, "in_transit")}
                                  className="flex-1"
                                >
                                  <Truck className="h-4 w-4 mr-2" />
                                  Start Delivery
                                </Button>
                              )}
                              {delivery.status === "in_transit" && (
                                <>
                                  <Button
                                    onClick={() => updateDeliveryStatus(delivery.id, "delivered")}
                                    className="flex-1"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Mark Delivered
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => updateDeliveryStatus(delivery.id, "failed")}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Failed
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed Deliveries */}
              {completedDeliveries.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Completed Deliveries</h2>
                  <div className="space-y-4">
                    {completedDeliveries.map((delivery) => (
                      <Card key={delivery.id} className="overflow-hidden opacity-75">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Package className="h-5 w-5" />
                              {delivery.donation?.title || "Donation"}
                            </CardTitle>
                            {getStatusBadge(delivery.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Pickup:</span>
                              <p className="text-foreground">{delivery.donation?.pickup_location || "N/A"}</p>
                              {delivery.pickup_time && (
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(delivery.pickup_time), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Delivery:</span>
                              <p className="text-foreground">{delivery.receiver_profile?.address || "N/A"}</p>
                              {delivery.delivery_time && (
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(delivery.delivery_time), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="route">
              <DeliveryRouteOptimizer deliveries={activeDeliveries} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DeliveryDashboard;
