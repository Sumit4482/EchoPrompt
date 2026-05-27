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
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  FileText,
  Database,
  LogOut,
  Crown,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GeminiApiDialog from "./GeminiApiDialog";

interface ProfileMenuProps {
  onOpenSettings: () => void;
}

const ProfileMenu = ({ onOpenSettings }: ProfileMenuProps) => {
  const { toast } = useToast();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeminiDialogOpen, setIsGeminiDialogOpen] = useState(false);

  const displayName = user?.fullName || user?.username || "User";
  const planLabel = user?.subscription?.plan
    ? user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)
    : "Free";
  const isPro = user?.subscription?.plan === "pro" || user?.subscription?.plan === "enterprise";
  const profile = {
    name: displayName,
    email: user?.email || "",
    avatar: "",
    initials: displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U",
    plan: planLabel,
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

  // Show Login button when not authenticated
  if (!isAuthenticated) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="hover-glow"
        onClick={() => navigate('/login')}
      >
        <User className="w-4 h-4 mr-2" />
        Login
      </Button>
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
          {isPro && (
            <Crown className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
          )}
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
                <div className="flex items-center mt-1">
                  <Badge 
                    variant={isPro ? "default" : "secondary"} 
                    className="text-xs px-2 py-0"
                  >
                    {isPro && <Crown className="w-3 h-3 mr-1" />}
                    {profile.plan}
                  </Badge>
                </div>
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
                <p className="text-xs text-muted-foreground">Templates</p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
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
          <span>Gemini API Key</span>
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
          <span>My Templates</span>
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
    </>
  );
};

export default ProfileMenu;
