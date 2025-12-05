import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, MapPin, X } from "lucide-react";
import { toast } from "sonner";

export interface FilterValues {
  searchQuery: string;
  foodType: string;
  expiryFilter: string;
  maxDistance: number | null;
  userLocation: { lat: number; lng: number } | null;
}

interface DonationsFilterProps {
  onFilterChange: (filters: FilterValues) => void;
}

const FOOD_TYPES = [
  "All Types",
  "Prepared Meals",
  "Fresh Produce",
  "Bakery Items",
  "Dairy Products",
  "Canned Goods",
  "Beverages",
  "Other",
];

const EXPIRY_OPTIONS = [
  { value: "all", label: "Any Expiry" },
  { value: "today", label: "Expires Today" },
  { value: "3days", label: "Within 3 Days" },
  { value: "week", label: "Within a Week" },
];

const DISTANCE_OPTIONS = [
  { value: "any", label: "Any Distance" },
  { value: "1", label: "Within 1 km" },
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "25", label: "Within 25 km" },
];

const DonationsFilter = ({ onFilterChange }: DonationsFilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [foodType, setFoodType] = useState("All Types");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [maxDistance, setMaxDistance] = useState<string>("any");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        toast.success("Location detected");
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to get your location");
        setLoadingLocation(false);
      }
    );
  };

  useEffect(() => {
    const filters: FilterValues = {
      searchQuery,
      foodType: foodType === "All Types" ? "" : foodType,
      expiryFilter,
      maxDistance: maxDistance === "any" ? null : parseInt(maxDistance),
      userLocation,
    };
    onFilterChange(filters);
  }, [searchQuery, foodType, expiryFilter, maxDistance, userLocation]);

  const clearFilters = () => {
    setSearchQuery("");
    setFoodType("All Types");
    setExpiryFilter("all");
    setMaxDistance("any");
  };

  const hasActiveFilters = searchQuery || foodType !== "All Types" || expiryFilter !== "all" || maxDistance !== "any";

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search donations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={foodType} onValueChange={setFoodType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Food Type" />
          </SelectTrigger>
          <SelectContent>
            {FOOD_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={expiryFilter} onValueChange={setExpiryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            {EXPIRY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={getUserLocation}
            disabled={loadingLocation}
            className={userLocation ? "border-primary text-primary" : ""}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {loadingLocation ? "Getting location..." : userLocation ? "Location set" : "Use my location"}
          </Button>

          {userLocation && (
            <Select value={maxDistance} onValueChange={setMaxDistance}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Distance" />
              </SelectTrigger>
              <SelectContent>
                {DISTANCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default DonationsFilter;
