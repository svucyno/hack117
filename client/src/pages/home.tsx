import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Link } from "wouter";
import { BarChart3, Users, MapPin, Target } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar 
        onLanguageChange={handleLanguageChange} 
        onLogout={handleLogout}
        user={user}
        isAuthenticated={true}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t('welcome_back')}, {user.firstName || user.email}!
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('home_subtitle')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {user.role === "farmer" && (
            <>
              <Link href="/dashboard">
                <div className="bg-gradient-to-br from-primary to-accent p-8 rounded-2xl text-primary-foreground cursor-pointer hover:scale-105 transition-transform" data-testid="card-farmer-dashboard">
                  <BarChart3 className="w-12 h-12 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('farmer_dashboard')}</h3>
                  <p className="text-primary-foreground/80">{t('farmer_dashboard_description')}</p>
                </div>
              </Link>
              
              <div className="bg-gradient-to-br from-secondary to-orange-400 p-8 rounded-2xl text-secondary-foreground cursor-pointer hover:scale-105 transition-transform" data-testid="card-predictions">
                <Target className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('yield_predictions')}</h3>
                <p className="text-secondary-foreground/80">{t('predictions_description')}</p>
              </div>
            </>
          )}

          {(user.role === "admin" || user.role === "officer") && (
            <Link href="/admin">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-2xl text-white cursor-pointer hover:scale-105 transition-transform" data-testid="card-admin-dashboard">
                <Users className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('admin_dashboard')}</h3>
                <p className="text-white/80">{t('admin_dashboard_description')}</p>
              </div>
            </Link>
          )}

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-2xl text-white cursor-pointer hover:scale-105 transition-transform" data-testid="card-weather">
            <MapPin className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('weather_forecasts')}</h3>
            <p className="text-white/80">{t('weather_description')}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-2xl font-semibold mb-6">{t('recent_activity')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">{t('account_created')}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
              <div className="text-sm text-primary">
                {t('welcome_message')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
