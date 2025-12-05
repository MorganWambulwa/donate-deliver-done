import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin,
  Phone,
  User
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
  delivery_person: {
    full_name: string;
    phone: string;
  } | null;
  receiver_profile?: {
    full_name: string;
    phone: string;
    address: string | null;
  } | null;
}

interface DeliveryTrackerProps {
  userId: string;
  userType: "donor" | "receiver" | "delivery";
}

const statusSteps = [
  { key: "assigned", label: "Assigned", icon: Clock },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const DeliveryTracker = ({ userId, userType }: DeliveryTrackerProps) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
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
            images
          ),
          request:donation_requests (
            id,
            receiver_id,
            message
          ),
          delivery_person:profiles!deliveries_delivery_person_id_fkey (
            full_name,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch receiver profiles for each delivery
      const deliveriesWithReceivers = await Promise.all(
        (data || []).map(async (delivery: any) => {
          if (delivery.request?.receiver_id) {
            const { data: receiverData } = await supabase
              .from("profiles")
              .select("full_name, phone, address")
              .eq("id", delivery.request.receiver_id)
              .maybeSingle();
            return { ...delivery, receiver_profile: receiverData };
          }
          return delivery;
        })
      );

      setDeliveries(deliveriesWithReceivers as Delivery[]);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("deliveries-changes")
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
  }, [userId]);

  const sendNotification = async (
    delivery: Delivery,
    newStatus: string
  ) => {
    try {
      // Get receiver email
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

      console.log("Notification sent successfully");
    } catch (error) {
      console.error("Error sending notification:", error);
      // Don't throw - notification failure shouldn't block status update
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

      // Find the delivery and send notification
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Truck className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No deliveries yet</h3>
          <p className="text-muted-foreground text-center">
            Deliveries will appear here once donation requests are approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {deliveries.map((delivery) => {
        const currentStep = getStatusIndex(delivery.status);

        return (
          <Card key={delivery.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {delivery.donation?.title || "Donation"}
                </CardTitle>
                {getStatusBadge(delivery.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Timeline */}
              {delivery.status !== "failed" && (
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
                      <div
                        key={step.key}
                        className="flex flex-col items-center relative z-10"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isCompleted
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-xs mt-2 ${
                            isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Pickup Location</h4>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{delivery.donation?.pickup_location || "Not specified"}</span>
                  </div>
                </div>

                {delivery.receiver_profile && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Deliver To</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{delivery.receiver_profile.full_name}</span>
                      </div>
                      {delivery.receiver_profile.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{delivery.receiver_profile.phone}</span>
                        </div>
                      )}
                      {delivery.receiver_profile.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span>{delivery.receiver_profile.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
                <span>Created: {format(new Date(delivery.created_at), "PPp")}</span>
                {delivery.pickup_time && (
                  <span>Picked up: {format(new Date(delivery.pickup_time), "PPp")}</span>
                )}
                {delivery.delivery_time && (
                  <span>Delivered: {format(new Date(delivery.delivery_time), "PPp")}</span>
                )}
              </div>

              {/* Actions for delivery person */}
              {userType === "delivery" && delivery.status !== "delivered" && delivery.status !== "failed" && (
                <div className="flex gap-2 pt-2">
                  {delivery.status === "assigned" && (
                    <Button
                      size="sm"
                      onClick={() => updateDeliveryStatus(delivery.id, "in_transit")}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Start Delivery
                    </Button>
                  )}
                  {delivery.status === "in_transit" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateDeliveryStatus(delivery.id, "delivered")}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Delivered
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateDeliveryStatus(delivery.id, "failed")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Mark Failed
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DeliveryTracker;
