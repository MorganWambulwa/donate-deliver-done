import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DonationCard from "./DonationCard";
import DonationsFilter, { FilterValues } from "./DonationsFilter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { addDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

interface DonationsListProps {
  userType: "donor" | "receiver";
  filterByUser?: boolean;
}

// Calculate distance between two coordinates in km (Haversine formula)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number | null,
  lng2: number | null
): number | null => {
  if (lat2 === null || lng2 === null) return null;
  
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const DonationsList = ({ userType, filterByUser = false }: DonationsListProps) => {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({
    searchQuery: "",
    foodType: "",
    expiryFilter: "all",
    maxDistance: null,
    userLocation: null,
  });
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

  // Filter donations based on filter values
  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          donation.title?.toLowerCase().includes(query) ||
          donation.description?.toLowerCase().includes(query) ||
          donation.food_type?.toLowerCase().includes(query) ||
          donation.pickup_location?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Food type filter
      if (filters.foodType && donation.food_type !== filters.foodType) {
        return false;
      }

      // Expiry filter
      if (filters.expiryFilter !== "all") {
        const expiryDate = new Date(donation.expiry_date);
        const today = startOfDay(new Date());

        switch (filters.expiryFilter) {
          case "today":
            if (!isBefore(expiryDate, endOfDay(today))) return false;
            break;
          case "3days":
            if (!isBefore(expiryDate, endOfDay(addDays(today, 3)))) return false;
            break;
          case "week":
            if (!isBefore(expiryDate, endOfDay(addDays(today, 7)))) return false;
            break;
        }
      }

      // Distance filter
      if (filters.maxDistance && filters.userLocation) {
        const distance = calculateDistance(
          filters.userLocation.lat,
          filters.userLocation.lng,
          donation.pickup_latitude,
          donation.pickup_longitude
        );
        if (distance === null || distance > filters.maxDistance) return false;
      }

      return true;
    });
  }, [donations, filters]);

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

  return (
    <div>
      {!filterByUser && <DonationsFilter onFilterChange={setFilters} />}
      
      {filteredDonations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {filterByUser
              ? "You haven't posted any donations yet."
              : filters.searchQuery || filters.foodType || filters.expiryFilter !== "all" || filters.maxDistance
              ? "No donations match your filters."
              : "No donations available at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.map((donation) => (
            <DonationCard
              key={donation.id}
              donation={donation}
              userType={userType}
              onRequest={handleRequest}
              onView={(id) => navigate(`/donation/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DonationsList;
