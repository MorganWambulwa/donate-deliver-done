import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface DonationCardProps {
  donation: {
    id: string;
    title: string;
    description: string;
    food_type: string;
    quantity: string;
    pickup_location: string;
    expiry_date: string;
    serves_people: number | null;
    images: string[] | null;
    status: string;
    allergens: string[] | null;
    dietary_info: string[] | null;
  };
  userType: "donor" | "receiver";
  onRequest?: (id: string) => void;
  onView?: (id: string) => void;
}

const DonationCard = ({ donation, userType, onRequest, onView }: DonationCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-soft transition-shadow">
      {donation.images && donation.images.length > 0 && (
        <div className="aspect-video overflow-hidden">
          <img
            src={donation.images[0]}
            alt={donation.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{donation.title}</CardTitle>
          <Badge variant="secondary">{donation.food_type}</Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {donation.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{donation.pickup_location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Best before: {format(new Date(donation.expiry_date), "MMM d, yyyy")}</span>
        </div>
        {donation.serves_people && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Serves {donation.serves_people} people</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{donation.quantity}</Badge>
          {donation.allergens && donation.allergens.length > 0 && (
            <Badge variant="outline" className="bg-destructive/10">
              Contains: {donation.allergens.join(", ")}
            </Badge>
          )}
          {donation.dietary_info && donation.dietary_info.map((info) => (
            <Badge key={info} variant="outline" className="bg-primary/10">
              {info}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        {userType === "receiver" && donation.status === "available" && (
          <Button onClick={() => onRequest?.(donation.id)} className="flex-1 bg-gradient-hero">
            Request
          </Button>
        )}
        <Button variant="outline" onClick={() => onView?.(donation.id)} className="flex-1">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DonationCard;
