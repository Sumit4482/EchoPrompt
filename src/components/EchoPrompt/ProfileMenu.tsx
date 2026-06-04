import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Settings,
  FileText,
  Database,
  LogOut,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GeminiApiDialog from "./GeminiApiDialog";
import ProfileEditDialog from "./ProfileEditDialog";

interface ProfileMenuProps {
  onOpenSettings: () => void;
}

const ProfileMenu = ({ onOpenSettings }: ProfileMenuProps) => {
  const { toast } = useToast();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeminiDialogOpen, setIsGeminiDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const displayName = user?.fullName || user?.username || "User";
  const profile = {
    name: displayName,
    email: user?.email || "",
    avatar: "",
    initials: displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U",
    promptsGenerated: user?.usage?.promptsGenerated ?? 0,
    templatesCreated: user?.usage?.templatesCreated ?? 0,
  };

  const handleMenuAction = async (action: string) => {
    setIsLoading(true);
    
    try {
      switch (action) {
        case 'templates':
          navigate('/my-templates');
          break;
          
        case 'prompts':
          navigate('/my-prompts');
          break;
          
        case 'gemini-api':
          setIsGeminiDialogOpen(true);
          break;

        case 'profile':
          setIsProfileDialogOpen(true);
          break;
          
        case 'logout':
          logout();
          navigate('/login');
          toast({
            title: "Logged out",
            description: "You have been logged out.",
          });
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Menu action error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="hover-glow hidden sm:inline-flex"
            onClick={() => setIsGeminiDialogOpen(true)}
          >
            <Key className="w-4 h-4 mr-1.5" />
            API key
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover-glow"
            onClick={() => navigate('/login')}
          >
            <User className="w-4 h-4 mr-2" />
            Login
          </Button>
        </div>
        <GeminiApiDialog
          isOpen={isGeminiDialogOpen}
          onClose={() => setIsGeminiDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="hover-glow relative">
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback className="text-xs font-semibold bg-gradient-primary text-primary-foreground">
              {profile.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72" align="end" forceMount>
        {/* User Info Section */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-sm font-semibold bg-gradient-primary text-primary-foreground">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">{profile.name}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {profile.email}
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{profile.promptsGenerated}</p>
                <p className="text-xs text-muted-foreground">Prompts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{profile.templatesCreated}</p>
                <p className="text-xs text-muted-foreground">Blueprints</p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleMenuAction('profile')}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <User className="w-4 h-4 mr-2" />
          <span>Edit profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onOpenSettings}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleMenuAction('gemini-api')}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <Key className="w-4 h-4 mr-2" />
          <span>Your API key (unlimited AI)</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleMenuAction('prompts')}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          <span>My Prompts</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleMenuAction('templates')}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <Database className="w-4 h-4 mr-2" />
          <span>My Blueprints</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleMenuAction('logout')}
          disabled={isLoading}
          className="cursor-pointer text-red-600 dark:text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
    {/* Gemini API Key Dialog */}
    <GeminiApiDialog 
      isOpen={isGeminiDialogOpen} 
      onClose={() => setIsGeminiDialogOpen(false)} 
    />
    <ProfileEditDialog
      open={isProfileDialogOpen}
      onOpenChange={setIsProfileDialogOpen}
    />
    </>
  );
};

export default ProfileMenu;
