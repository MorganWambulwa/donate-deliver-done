import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DonationCard from "./DonationCard";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DonationsListProps {
  userType: "donor" | "receiver";
  filterByUser?: boolean;
}

const DonationsList = ({ userType, filterByUser = false }: DonationsListProps) => {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDonations();
  }, [filterByUser]);

  const fetchDonations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from('food_donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterByUser) {
        query = query.eq('donor_id', user.id);
      } else if (userType === "receiver") {
        query = query.eq('status', 'available');
      }

      const { data, error } = await query;

      if (error) throw error;
      setDonations(data || []);
    } catch (error: any) {
      console.error("Error fetching donations:", error);
      toast.error("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (donationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('donation_requests')
        .insert({
          donation_id: donationId,
          receiver_id: user.id,
          status: 'pending',
        });

      if (error) throw error;

      toast.success("Request sent successfully!");
      fetchDonations();
    } catch (error: any) {
      console.error("Error requesting donation:", error);
      toast.error(error.message || "Failed to send request");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {filterByUser
            ? "You haven't posted any donations yet."
            : "No donations available at the moment."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {donations.map((donation) => (
        <DonationCard
          key={donation.id}
          donation={donation}
          userType={userType}
          onRequest={handleRequest}
          onView={(id) => navigate(`/donation/${id}`)}
        />
      ))}
    </div>
  );
};

export default DonationsList;
