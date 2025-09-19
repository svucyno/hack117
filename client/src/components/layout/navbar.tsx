import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Leaf, User, LogOut, Home, BarChart3, Users } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface NavbarProps {
  onLanguageChange: (language: string) => void;
  onLogin?: () => void;
  onLogout?: () => void;
  user?: any;
  isAuthenticated?: boolean;
}

export function Navbar({ onLanguageChange, onLogin, onLogout, user, isAuthenticated }: NavbarProps) {
  const { t, i18n } = useTranslation();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3" data-testid="link-logo">
            <div className="bg-primary p-2 rounded-lg">
              <Leaf className="text-primary-foreground w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AgriPredict</h1>
              <p className="text-xs text-muted-foreground">{t('smart_farming_solutions')}</p>
            </div>
          </Link>
          
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-foreground hover:text-primary transition-colors font-medium" data-testid="link-home">
                <Home className="inline w-4 h-4 mr-1" />
                {t('home')}
              </Link>
              {user?.role === "farmer" && (
                <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors font-medium" data-testid="link-dashboard">
                  <BarChart3 className="inline w-4 h-4 mr-1" />
                  {t('dashboard')}
                </Link>
              )}
              {(user?.role === "admin" || user?.role === "officer") && (
                <Link href="/admin" className="text-foreground hover:text-primary transition-colors font-medium" data-testid="link-admin">
                  <Users className="inline w-4 h-4 mr-1" />
                  {t('admin')}
                </Link>
              )}
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <Select value={i18n.language} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-24" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="hi">हि</SelectItem>
                <SelectItem value="od">ଓଡ଼</SelectItem>
              </SelectContent>
            </Select>
            
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8" data-testid="avatar-user">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback>
                    {user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  onClick={onLogout}
                  variant="outline" 
                  size="sm"
                  className="text-foreground hover:text-primary"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </Button>
              </div>
            ) : (
              <Button 
                onClick={onLogin}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-login"
              >
                <User className="w-4 h-4 mr-2" />
                {t('login')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
