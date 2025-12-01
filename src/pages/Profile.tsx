import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { HeartHandshake, ArrowLeft, Upload, Loader2 } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(20),
  address: z.string().max(500).optional(),
  bio: z.string().max(500).optional(),
  organizationName: z.string().max(100).optional(),
});

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  bio: string | null;
  avatar_url: string | null;
  organization_name: string | null;
  user_type: "donor" | "receiver" | "delivery";
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setPreviewUrl(data.avatar_url);
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        fullName: formData.get("fullName") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        bio: formData.get("bio") as string,
        organizationName: formData.get("organizationName") as string,
      };

      profileSchema.parse(data);

      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          phone: data.phone,
          address: data.address || null,
          bio: data.bio || null,
          organization_name: data.organizationName || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error updating profile:", error);
        toast.error(error.message || "Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <nav className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold text-primary">
            <HeartHandshake className="h-8 w-8" />
            <span>FoodShare</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your profile information and avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={previewUrl || undefined} />
                    <AvatarFallback className="text-3xl">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                        <Upload className="h-4 w-4" />
                        <span>Change Avatar</span>
                      </div>
                      <input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name / Organization *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={profile.full_name}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={profile.phone}
                    required
                  />
                </div>

                {profile.user_type === "donor" && (
                  <div>
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      name="organizationName"
                      defaultValue={profile.organization_name || ""}
                      placeholder="e.g., Restaurant name"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={profile.address || ""}
                    placeholder="Your address"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile.bio || ""}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 500 characters
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex-1 bg-gradient-hero"
                  >
                    {saving || uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {uploading ? "Uploading..." : "Saving..."}
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    disabled={saving || uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
