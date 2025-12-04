import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X, MapPin, Check } from "lucide-react";

interface GeocodeSuggestion {
  place_name: string;
  latitude: number;
  longitude: number;
}

const CreateDonationForm = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    foodType: "",
    quantity: "",
    pickupLocation: "",
    expiryDate: "",
    servesCount: "",
    allergens: "",
    dietaryInfo: "",
  });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const geocodeAddress = useCallback(async (address: string) => {
    if (address.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode-address", {
        body: { address },
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, pickupLocation: value });
    setCoordinates(null);
    
    // Debounce geocoding
    const timeoutId = setTimeout(() => {
      geocodeAddress(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const selectSuggestion = (suggestion: GeocodeSuggestion) => {
    setFormData({ ...formData, pickupLocation: suggestion.place_name });
    setCoordinates({ lat: suggestion.latitude, lng: suggestion.longitude });
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success("Location coordinates captured");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages([...images, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload images
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('food-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Create donation with coordinates
      const { error: insertError } = await supabase
        .from('food_donations')
        .insert({
          donor_id: user.id,
          title: formData.title,
          description: formData.description,
          food_type: formData.foodType,
          quantity: formData.quantity,
          pickup_location: formData.pickupLocation,
          pickup_latitude: coordinates?.lat || null,
          pickup_longitude: coordinates?.lng || null,
          expiry_date: new Date(formData.expiryDate).toISOString(),
          serves_people: formData.servesCount ? parseInt(formData.servesCount) : null,
          allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : null,
          dietary_info: formData.dietaryInfo ? formData.dietaryInfo.split(',').map(d => d.trim()) : null,
          images: imageUrls.length > 0 ? imageUrls : null,
          status: 'available',
        });

      if (insertError) throw insertError;

      toast.success("Donation created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating donation:", error);
      toast.error(error.message || "Failed to create donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Fresh vegetables"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the food items..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="foodType">Food Type *</Label>
          <Input
            id="foodType"
            value={formData.foodType}
            onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
            placeholder="e.g., Vegetables, Cooked meals"
            required
          />
        </div>

        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="e.g., 5kg, 10 servings"
            required
          />
        </div>
      </div>

      <div className="relative">
        <Label htmlFor="pickupLocation">Pickup Location *</Label>
        <div className="relative">
          <Input
            id="pickupLocation"
            value={formData.pickupLocation}
            onChange={handleAddressChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Start typing an address..."
            required
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isGeocoding ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : coordinates ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {coordinates && (
          <p className="text-xs text-muted-foreground mt-1">
            Coordinates: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
          </p>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{suggestion.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiryDate">Best Before Date *</Label>
          <Input
            id="expiryDate"
            type="datetime-local"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="servesCount">Serves (people)</Label>
          <Input
            id="servesCount"
            type="number"
            value={formData.servesCount}
            onChange={(e) => setFormData({ ...formData, servesCount: e.target.value })}
            placeholder="e.g., 10"
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="allergens">Allergens (comma-separated)</Label>
          <Input
            id="allergens"
            value={formData.allergens}
            onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
            placeholder="e.g., nuts, dairy"
          />
        </div>

        <div>
          <Label htmlFor="dietaryInfo">Dietary Info (comma-separated)</Label>
          <Input
            id="dietaryInfo"
            value={formData.dietaryInfo}
            onChange={(e) => setFormData({ ...formData, dietaryInfo: e.target.value })}
            placeholder="e.g., vegan, halal"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="images">Images</Label>
        <div className="mt-2">
          <label htmlFor="images" className="cursor-pointer">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload images</p>
            </div>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-hero flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Donation"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/dashboard")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default CreateDonationForm;
