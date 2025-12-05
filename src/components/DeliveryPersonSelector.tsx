import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, User } from "lucide-react";

interface DeliveryPerson {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}

interface DeliveryPersonSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const DeliveryPersonSelector = ({ value, onValueChange, disabled }: DeliveryPersonSelectorProps) => {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveryPersons = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, avatar_url")
          .eq("user_type", "delivery")
          .order("full_name");

        if (error) throw error;
        setDeliveryPersons(data || []);
      } catch (error) {
        console.error("Error fetching delivery persons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryPersons();
  }, []);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (deliveryPersons.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <Truck className="h-4 w-4" />
        <span>No delivery persons available. The receiver will handle pickup.</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a delivery person (optional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Receiver will pickup</span>
          </div>
        </SelectItem>
        {deliveryPersons.map((person) => (
          <SelectItem key={person.id} value={person.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={person.avatar_url || undefined} alt={person.full_name} />
                <AvatarFallback className="text-xs">
                  {person.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{person.full_name}</span>
                <span className="text-xs text-muted-foreground">{person.phone || person.email}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DeliveryPersonSelector;
