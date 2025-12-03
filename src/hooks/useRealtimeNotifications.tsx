import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

interface UseRealtimeNotificationsProps {
  user: User | null;
  userType: "donor" | "receiver" | "delivery";
}

export const useRealtimeNotifications = ({ user, userType }: UseRealtimeNotificationsProps) => {
  const userDonationIds = useRef<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // For donors, fetch their donation IDs to track requests
    const fetchDonorDonations = async () => {
      if (userType === "donor") {
        const { data } = await supabase
          .from("food_donations")
          .select("id")
          .eq("donor_id", user.id);
        
        if (data) {
          userDonationIds.current = data.map(d => d.id);
        }
      }
    };

    fetchDonorDonations();

    // Subscribe to donation_requests changes
    const channel = supabase
      .channel('donation-requests-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donation_requests'
        },
        async (payload) => {
          console.log('New request received:', payload);
          
          // Only notify donors when they receive a new request
          if (userType === "donor" && userDonationIds.current.includes(payload.new.donation_id)) {
            // Fetch donation title for better notification
            const { data: donation } = await supabase
              .from("food_donations")
              .select("title")
              .eq("id", payload.new.donation_id)
              .maybeSingle();

            toast.info("New Request Received!", {
              description: `Someone has requested your donation "${donation?.title || 'Unknown'}"`,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'donation_requests'
        },
        async (payload) => {
          console.log('Request updated:', payload);
          
          // Notify receivers when their request status changes
          if (userType === "receiver" && payload.new.receiver_id === user.id) {
            const newStatus = payload.new.status;
            const oldStatus = payload.old?.status;

            if (newStatus !== oldStatus) {
              // Fetch donation title for better notification
              const { data: donation } = await supabase
                .from("food_donations")
                .select("title")
                .eq("id", payload.new.donation_id)
                .maybeSingle();

              if (newStatus === "approved") {
                toast.success("Request Approved!", {
                  description: `Your request for "${donation?.title || 'Unknown'}" has been approved!`,
                  duration: 5000,
                });
              } else if (newStatus === "rejected") {
                toast.error("Request Rejected", {
                  description: `Your request for "${donation?.title || 'Unknown'}" was not accepted.`,
                  duration: 5000,
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from realtime notifications');
      supabase.removeChannel(channel);
    };
  }, [user, userType]);
};
