import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp, MapPin, Target, Upload, Download, Search, Filter } from "lucide-react";

export default function AdminDashboard() {
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

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "officer"),
  });

  // Fetch predictions
  const { data: predictions = [], isLoading: predictionsLoading } = useQuery({
    queryKey: ["/api/admin/predictions"],
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "officer"),
  });

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

  if (!user || (user.role !== "admin" && user.role !== "officer")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalFarmers = users.filter(u => u.role === "farmer").length;
  const totalPredictions = predictions.length;
  const totalArea = users.reduce((acc, user) => acc + (user.farmArea || 0), 0);
  const avgAccuracy = predictions.length > 0 
    ? predictions.reduce((acc, pred) => acc + parseFloat(pred.confidence || 0), 0) / predictions.length 
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar 
        onLanguageChange={handleLanguageChange} 
        onLogout={handleLogout}
        user={user}
        isAuthenticated={true}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-admin-dashboard-title">
              {t('admin_portal')}
            </h1>
            <p className="text-muted-foreground">
              {user.role === "admin" ? "System Administrator" : "Agricultural Officer"}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <Button className="bg-primary text-primary-foreground" data-testid="button-upload-dataset">
              <Upload className="w-4 h-4 mr-2" />
              {t('upload_dataset')}
            </Button>
            <Button variant="outline" data-testid="button-export-report">
              <Download className="w-4 h-4 mr-2" />
              {t('export_report')}
            </Button>
          </div>
        </div>

        {/* Admin Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{t('registered_farmers')}</p>
                  <p className="text-2xl font-bold" data-testid="text-total-farmers">{totalFarmers}</p>
                </div>
                <Users className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{t('active_predictions')}</p>
                  <p className="text-2xl font-bold" data-testid="text-total-predictions">{totalPredictions}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{t('total_area')} (ha)</p>
                  <p className="text-2xl font-bold" data-testid="text-total-area">{totalArea.toFixed(1)}</p>
                </div>
                <MapPin className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{t('avg_accuracy')}</p>
                  <p className="text-2xl font-bold" data-testid="text-avg-accuracy">{avgAccuracy.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Farmer Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('farmer_management')}</CardTitle>
              <div className="flex space-x-2">
                <Input 
                  placeholder={t('search_farmers')} 
                  className="w-64" 
                  data-testid="input-search-farmers"
                />
                <Button variant="outline" size="icon" data-testid="button-filter">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('farmer_name')}</TableHead>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead>{t('role')}</TableHead>
                    <TableHead>{t('language')}</TableHead>
                    <TableHead>{t('joined_date')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t('no_farmers_found')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((farmer: any) => (
                      <TableRow key={farmer.id} data-testid={`row-farmer-${farmer.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={farmer.profileImageUrl} />
                              <AvatarFallback>
                                {farmer.firstName ? farmer.firstName[0] : farmer.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {farmer.firstName && farmer.lastName 
                                ? `${farmer.firstName} ${farmer.lastName}` 
                                : farmer.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{farmer.email}</TableCell>
                        <TableCell>
                          <Badge variant={farmer.role === "farmer" ? "default" : "secondary"}>
                            {farmer.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {farmer.language === "en" ? "English" : 
                           farmer.language === "hi" ? "Hindi" : 
                           farmer.language === "od" ? "Odia" : farmer.language}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(farmer.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" data-testid={`button-view-details-${farmer.id}`}>
                            {t('view_details')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
