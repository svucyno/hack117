import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/layout/navbar";
import { YieldChart } from "@/components/dashboard/yield-chart";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { RecommendationCards } from "@/components/dashboard/recommendation-cards";
import { AIChatbot } from "@/components/chatbot/ai-chatbot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp, MapPin, Droplets, Leaf } from "lucide-react";

const cropFormSchema = z.object({
  cropType: z.string().min(1, "Crop type is required"),
  soilType: z.string().min(1, "Soil type is required"),
  farmArea: z.string().min(1, "Farm area is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
});

export default function FarmerDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedCrop, setSelectedCrop] = useState<string>("");

  const form = useForm<z.infer<typeof cropFormSchema>>({
    resolver: zodResolver(cropFormSchema),
    defaultValues: {
      cropType: "",
      soilType: "",
      farmArea: "",
      district: "",
      state: "",
    },
  });

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

  // Fetch crops
  const { data: crops = [], isLoading: cropsLoading } = useQuery({
    queryKey: ["/api/crops"],
    enabled: isAuthenticated,
  });

  // Fetch predictions
  const { data: predictions = [], isLoading: predictionsLoading } = useQuery({
    queryKey: ["/api/predictions"],
    enabled: isAuthenticated,
  });

  // Fetch recommendations for selected crop
  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/recommendations", selectedCrop],
    enabled: !!selectedCrop,
  });

  // Create crop mutation
  const createCropMutation = useMutation({
    mutationFn: async (cropData: z.infer<typeof cropFormSchema>) => {
      return await apiRequest("POST", "/api/crops", {
        ...cropData,
        sowingDate: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Crop added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crops"] });
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to add crop",
        variant: "destructive",
      });
    },
  });

  // Create prediction mutation
  const createPredictionMutation = useMutation({
    mutationFn: async (cropId: string) => {
      return await apiRequest("POST", "/api/predict", {
        cropId,
        factors: {
          soilMoisture: 65,
          temperature: 28,
          humidity: 70,
          rainfall: 150,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prediction generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to generate prediction",
        variant: "destructive",
      });
    },
  });

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const onSubmit = (values: z.infer<typeof cropFormSchema>) => {
    createCropMutation.mutate(values);
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">
              {user.firstName ? `${user.firstName}'s Farm Dashboard` : "Farm Dashboard"}
            </h1>
            <p className="text-muted-foreground">
              {t('dashboard_subtitle')}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-48" data-testid="select-crop">
                <SelectValue placeholder="Select crop" />
              </SelectTrigger>
              <SelectContent>
                {crops.map((crop: any) => (
                  <SelectItem key={crop.id} value={crop.id}>
                    {crop.cropType} - {crop.farmArea} acres
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => selectedCrop && createPredictionMutation.mutate(selectedCrop)}
              disabled={!selectedCrop || createPredictionMutation.isPending}
              data-testid="button-generate-prediction"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {createPredictionMutation.isPending ? "Generating..." : "Generate Prediction"}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm">{t('predicted_yield')}</p>
                  <p className="text-2xl font-bold" data-testid="text-predicted-yield">
                    {predictions.length > 0 ? `${predictions[0].predictedYield} t/ha` : "N/A"}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary-foreground/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-secondary to-orange-400 text-secondary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-foreground/80 text-sm">{t('farm_area')}</p>
                  <p className="text-2xl font-bold" data-testid="text-farm-area">
                    {crops.length > 0 ? `${crops.reduce((acc: number, crop: any) => acc + parseFloat(crop.farmArea || 0), 0)} acres` : "0 acres"}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-secondary-foreground/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{t('active_crops')}</p>
                  <p className="text-2xl font-bold" data-testid="text-active-crops">{crops.length}</p>
                </div>
                <Leaf className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{t('confidence')}</p>
                  <p className="text-2xl font-bold" data-testid="text-confidence">
                    {predictions.length > 0 ? `${Math.round(parseFloat(predictions[0].confidence || 0))}%` : "N/A"}
                  </p>
                </div>
                <Droplets className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Crop Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('add_new_crop')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cropType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('crop_type')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-crop-type">
                            <SelectValue placeholder="Select crop type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rice">Rice</SelectItem>
                          <SelectItem value="wheat">Wheat</SelectItem>
                          <SelectItem value="maize">Maize</SelectItem>
                          <SelectItem value="cotton">Cotton</SelectItem>
                          <SelectItem value="sugarcane">Sugarcane</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="soilType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('soil_type')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-soil-type">
                            <SelectValue placeholder="Select soil type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="loamy">Loamy</SelectItem>
                          <SelectItem value="clay">Clay</SelectItem>
                          <SelectItem value="sandy">Sandy</SelectItem>
                          <SelectItem value="silt">Silt</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="farmArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('farm_area')} (acres)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" placeholder="0.0" data-testid="input-farm-area" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('district')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter district" data-testid="input-district" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('state')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter state" data-testid="input-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-end">
                  <Button 
                    type="submit" 
                    disabled={createCropMutation.isPending}
                    className="w-full"
                    data-testid="button-add-crop"
                  >
                    {createCropMutation.isPending ? "Adding..." : t('add_crop')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Charts and Data */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <YieldChart predictions={predictions} isLoading={predictionsLoading} />
          </div>
          <WeatherWidget district={crops[0]?.district || "Bhubaneswar"} />
        </div>

        {/* Recommendations */}
        <RecommendationCards recommendations={recommendations} />
      </div>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
}
