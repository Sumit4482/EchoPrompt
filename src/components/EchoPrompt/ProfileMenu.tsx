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
  BarChart3,
  CreditCard,
  HelpCircle,
  LogOut,
  Crown,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ProfileMenuProps {
  onOpenSettings: () => void;
}

const ProfileMenu = ({ onOpenSettings }: ProfileMenuProps) => {
  const { toast } = useToast();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Mock user data - replace with real user data from context
  const mockUser = {
    name: user?.fullName || "Demo User",
    email: user?.email || "demo@echoprompt.com",
    avatar: "",
    initials: user?.fullName?.split(' ').map(n => n[0]).join('') || "DU",
    plan: "Free",
    promptsGenerated: 25,
    templatesCreated: 3,
    totalUsage: "2.1k tokens",
  };

  const handleMenuAction = async (action: string) => {
    setIsLoading(true);
    
    try {
      switch (action) {
        case 'profile':
          toast({
            title: "👤 Profile",
            description: "Profile management coming soon!",
          });
          break;
          
        case 'templates':
          navigate('/my-templates');
          break;
          
        case 'prompts':
          navigate('/my-prompts');
          break;
          
        case 'analytics':
          toast({
            title: "📊 Analytics",
            description: "Usage analytics coming soon!",
          });
          break;
          
        case 'billing':
          toast({
            title: "💳 Billing",
            description: "Billing management coming soon!",
          });
          break;
          
        case 'help':
          window.open('https://docs.echoprompt.com', '_blank');
          break;
          
        case 'logout':
          logout();
          navigate('/login');
          toast({
            title: "👋 Logged Out",
            description: "You have been successfully logged out.",
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="hover-glow relative">
          <Avatar className="w-8 h-8">
            <AvatarImage src={mockUser.avatar} />
            <AvatarFallback className="text-xs font-semibold bg-gradient-primary text-primary-foreground">
              {mockUser.initials}
            </AvatarFallback>
          </Avatar>
          {mockUser.plan === "Pro" && (
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
                <AvatarImage src={mockUser.avatar} />
                <AvatarFallback className="text-sm font-semibold bg-gradient-primary text-primary-foreground">
                  {mockUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">{mockUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {mockUser.email}
                </p>
                <div className="flex items-center mt-1">
                  <Badge 
                    variant={mockUser.plan === "Pro" ? "default" : "secondary"} 
                    className="text-xs px-2 py-0"
                  >
                    {mockUser.plan === "Pro" && <Crown className="w-3 h-3 mr-1" />}
                    {mockUser.plan}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{mockUser.promptsGenerated}</p>
                <p className="text-xs text-muted-foreground">Prompts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{mockUser.templatesCreated}</p>
                <p className="text-xs text-muted-foreground">Templates</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{mockUser.totalUsage}</p>
                <p className="text-xs text-muted-foreground">Tokens</p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Menu Items */}
        <DropdownMenuItem 
          onClick={() => handleMenuAction('profile')}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <User className="w-4 h-4 mr-2" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onOpenSettings}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2" />
          <span>App Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleMenuAction('prompts')}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          <span>My Prompts</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {mockUser.promptsGenerated}
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleMenuAction('templates')}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <Database className="w-4 h-4 mr-2" />
          <span>My Templates</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {mockUser.templatesCreated}
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleMenuAction('analytics')}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          <span>Analytics</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {mockUser.plan === "Free" && (
          <>
            <DropdownMenuItem 
              onClick={() => handleMenuAction('billing')}
              disabled={isLoading}
              className="cursor-pointer text-primary"
            >
              <Zap className="w-4 h-4 mr-2" />
              <span>Upgrade to Pro</span>
              <Badge className="ml-auto text-xs bg-gradient-primary">
                New
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {mockUser.plan === "Pro" && (
          <>
            <DropdownMenuItem 
              onClick={() => handleMenuAction('billing')}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              <span>Billing & Usage</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem 
          onClick={() => handleMenuAction('help')}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleMenuAction('logout')}
          disabled={isLoading}
          className="cursor-pointer text-red-600 dark:text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
