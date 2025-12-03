import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Donation {
  id: string;
  title: string;
  description: string;
  food_type: string;
  pickup_location: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  images: string[] | null;
  status: string;
}

const DonationsMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const navigate = useNavigate();

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          throw new Error("No token received");
        }
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
        toast.error("Failed to load map. Please check your Mapbox configuration.");
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Fetch donations
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const { data, error } = await supabase
          .from("food_donations")
          .select("id, title, description, food_type, pickup_location, pickup_latitude, pickup_longitude, images, status")
          .eq("status", "available");

        if (error) throw error;
        setDonations(data || []);
      } catch (error) {
        console.error("Error fetching donations:", error);
        toast.error("Failed to load donations");
      }
    };
    fetchDonations();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Default to Nairobi, Kenya if location not available
          setUserLocation([36.8219, -1.2921]);
        }
      );
    } else {
      setUserLocation([36.8219, -1.2921]);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !userLocation) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: userLocation,
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });
    map.current.addControl(geolocate, "top-right");

    map.current.on("load", () => {
      setLoading(false);
      // Trigger geolocation
      geolocate.trigger();
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
    };
  }, [mapboxToken, userLocation]);

  // Add donation markers
  useEffect(() => {
    if (!map.current || loading) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for donations with coordinates
    donations.forEach((donation) => {
      if (donation.pickup_latitude && donation.pickup_longitude) {
        // Create custom marker element
        const el = document.createElement("div");
        el.className = "donation-marker";
        el.innerHTML = `
          <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-pointer transform transition-transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
          <div class="p-2 min-w-[200px]">
            ${donation.images?.[0] ? `<img src="${donation.images[0]}" alt="${donation.title}" class="w-full h-24 object-cover rounded-md mb-2" />` : ""}
            <h3 class="font-semibold text-sm">${donation.title}</h3>
            <p class="text-xs text-gray-600 mt-1">${donation.food_type}</p>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2">${donation.pickup_location}</p>
            <button 
              onclick="window.location.href='/donation/${donation.id}'"
              class="mt-2 w-full bg-emerald-600 text-white text-xs py-1.5 px-3 rounded-md hover:bg-emerald-700 transition-colors"
            >
              View Details
            </button>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([donation.pickup_longitude, donation.pickup_latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers if there are any
    if (markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markersRef.current.forEach((marker) => {
        bounds.extend(marker.getLngLat());
      });
      if (userLocation) {
        bounds.extend(userLocation);
      }
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [donations, loading, userLocation]);

  const handleCenterOnUser = () => {
    if (map.current && userLocation) {
      map.current.flyTo({ center: userLocation, zoom: 14 });
    }
  };

  if (!mapboxToken && !loading) {
    return (
      <div className="h-[500px] rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Map could not be loaded</p>
          <p className="text-sm text-muted-foreground mt-1">Please configure your Mapbox token</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 bg-background/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="h-[500px] rounded-lg shadow-lg" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-primary rounded-full" />
          <span className="text-foreground">Available Donation</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {donations.filter(d => d.pickup_latitude && d.pickup_longitude).length} donations on map
        </p>
      </div>

      {/* Center button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-4 right-4 shadow-md"
        onClick={handleCenterOnUser}
      >
        <Navigation className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DonationsMap;
