import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileEditDialog = ({ open, onOpenChange }: ProfileEditDialogProps) => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [defaultTone, setDefaultTone] = useState("");
  const [defaultOutputFormat, setDefaultOutputFormat] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    setEmail(user.email || "");
    setUsername(user.username || "");
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setDefaultTone(user.preferences?.defaultTone || "");
    setDefaultOutputFormat(user.preferences?.defaultOutputFormat || "");
    setDefaultLanguage(user.preferences?.defaultLanguage || "en");
  }, [user, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await apiService.updateProfile({
        email: email.trim() || undefined,
        username: username.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        preferences: {
          defaultTone: defaultTone || undefined,
          defaultOutputFormat: defaultOutputFormat || undefined,
          defaultLanguage: defaultLanguage || undefined,
        },
      });
      if (!result.success) throw new Error(result.error || "Update failed");
      await refreshUser();
      toast({ title: "Profile updated" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            {user?.email} · @{user?.username}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-username">Username</Label>
            <Input
              id="profile-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="profile-first">First name</Label>
              <Input
                id="profile-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last">Last name</Label>
              <Input
                id="profile-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-tone">Default tone</Label>
            <Input
              id="profile-tone"
              value={defaultTone}
              onChange={(e) => setDefaultTone(e.target.value)}
              placeholder="e.g. Professional"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-format">Default output format</Label>
            <Input
              id="profile-format"
              value={defaultOutputFormat}
              onChange={(e) => setDefaultOutputFormat(e.target.value)}
              placeholder="e.g. Markdown"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label>Default language</Label>
            <Select value={defaultLanguage} onValueChange={setDefaultLanguage} disabled={isSaving}>
              <SelectTrigger>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
