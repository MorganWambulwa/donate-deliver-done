import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  ArrowLeft, Calendar, MapPin, Users, Phone, Mail, 
  Building, ChevronLeft, ChevronRight, Send 
} from "lucide-react";
import { format } from "date-fns";

interface Donation {
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
  donor_id: string;
  created_at: string;
}

interface DonorProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  organization_name: string | null;
  address: string | null;
  avatar_url: string | null;
}

const DonationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [donation, setDonation] = useState<Donation | null>(null);
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDonation = async () => {
      if (!id) return;

      try {
        // Fetch donation
        const { data: donationData, error: donationError } = await supabase
          .from("food_donations")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (donationError) throw donationError;
        if (!donationData) {
          toast.error("Donation not found");
          navigate("/dashboard");
          return;
        }

        setDonation(donationData);

        // Fetch donor profile
        const { data: donorData, error: donorError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, organization_name, address, avatar_url")
          .eq("id", donationData.donor_id)
          .maybeSingle();

        if (!donorError && donorData) {
          setDonor(donorData);
        }

        // Check for existing request from this user
        if (user) {
          const { data: requestData } = await supabase
            .from("donation_requests")
            .select("id")
            .eq("donation_id", id)
            .eq("receiver_id", user.id)
            .maybeSingle();

          setExistingRequest(!!requestData);
        }
      } catch (error) {
        console.error("Error fetching donation:", error);
        toast.error("Failed to load donation details");
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [id, navigate, user]);

  const handlePrevImage = () => {
    if (donation?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? donation.images!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (donation?.images) {
      setCurrentImageIndex((prev) => 
        prev === donation.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleSendRequest = async () => {
    if (!user) {
      toast.error("Please sign in to request this donation");
      navigate("/auth");
      return;
    }

    if (!donation) return;

    const userType = user.user_metadata?.user_type;
    if (userType !== "receiver") {
      toast.error("Only receivers can request donations");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("donation_requests").insert({
        donation_id: donation.id,
        receiver_id: user.id,
        message: requestMessage || null,
      });

      if (error) throw error;

      toast.success("Request sent successfully!");
      setExistingRequest(true);
      setRequestMessage("");
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast.error(error.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-video rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Donation not found</p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const userType = user?.user_metadata?.user_type;
  const isOwner = user?.id === donation.donor_id;
  const canRequest = userType === "receiver" && donation.status === "available" && !isOwner && !existingRequest;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              {donation.images && donation.images.length > 0 ? (
                <>
                  <img
                    src={donation.images[currentImageIndex]}
                    alt={`${donation.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {donation.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                        onClick={handlePrevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                        onClick={handleNextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {donation.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              idx === currentImageIndex ? "bg-primary" : "bg-background/60"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No images available
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {donation.images && donation.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {donation.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      idx === currentImageIndex ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{donation.title}</h1>
                <Badge 
                  variant={donation.status === "available" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {donation.status}
                </Badge>
              </div>
              <Badge variant="outline" className="text-sm">
                {donation.food_type}
              </Badge>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {donation.description}
            </p>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{donation.pickup_location}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Best before: {format(new Date(donation.expiry_date), "MMMM d, yyyy 'at' h:mm a")}</span>
              </div>
              {donation.serves_people && (
                <div className="flex items-center gap-3 text-foreground">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Serves {donation.serves_people} people</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{donation.quantity}</Badge>
              {donation.allergens && donation.allergens.length > 0 && (
                <Badge variant="destructive">
                  Allergens: {donation.allergens.join(", ")}
                </Badge>
              )}
              {donation.dietary_info?.map((info) => (
                <Badge key={info} variant="secondary">
                  {info}
                </Badge>
              ))}
            </div>

            {/* Donor Contact Card */}
            {donor && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Donor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    {donor.avatar_url ? (
                      <img 
                        src={donor.avatar_url} 
                        alt={donor.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {donor.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{donor.full_name}</p>
                      {donor.organization_name && (
                        <p className="text-sm text-muted-foreground">{donor.organization_name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${donor.email}`} className="hover:text-primary transition-colors">
                        {donor.email}
                      </a>
                    </div>
                    {donor.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${donor.phone}`} className="hover:text-primary transition-colors">
                          {donor.phone}
                        </a>
                      </div>
                    )}
                    {donor.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="h-4 w-4" />
                        <span>{donor.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Request Section for Receivers */}
            {user && canRequest && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Request This Donation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Add a message to the donor (optional)..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleSendRequest} 
                    disabled={submitting}
                    className="w-full bg-gradient-hero"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Sending..." : "Send Request"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {existingRequest && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-4 text-center">
                  <p className="text-primary font-medium">You have already requested this donation</p>
                </CardContent>
              </Card>
            )}

            {!user && donation.status === "available" && (
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-muted-foreground mb-3">Sign in to request this donation</p>
                  <Button onClick={() => navigate("/auth")}>Sign In</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationDetails;
