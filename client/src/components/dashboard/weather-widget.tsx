import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Cloud, CloudRain, Sun, MapPin, Thermometer, Droplets, Wind } from "lucide-react";
import type { Weather } from "@shared/schema";

interface WeatherWidgetProps {
  district: string;
}

export function WeatherWidget({ district }: WeatherWidgetProps) {
  const { t } = useTranslation();

  const { data: weather, isLoading } = useQuery<Weather>({
    queryKey: ["/api/weather", district],
    enabled: !!district,
  });

  const getWeatherIcon = (weatherType: string) => {
    switch (weatherType?.toLowerCase()) {
      case "sunny":
        return <Sun className="w-8 h-8 text-yellow-500 animate-pulse" />;
      case "rainy":
      case "light rain":
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      case "cloudy":
        return <Cloud className="w-8 h-8 text-gray-500" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20" data-testid="card-weather-loading">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('weather_forecast')}
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20" data-testid="card-weather">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t('weather_forecast')}
          <MapPin className="w-5 h-5 text-muted-foreground" />
        </CardTitle>
        <p className="text-sm text-muted-foreground" data-testid="text-district">{district}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Weather */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getWeatherIcon(weather?.weatherType || "sunny")}
              <div>
                <p className="font-medium" data-testid="text-current-day">{t('today')}</p>
                <p className="text-sm text-muted-foreground capitalize" data-testid="text-weather-type">
                  {weather?.weatherType || "Sunny"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-2xl" data-testid="text-temperature">
                {weather?.temperature || "32"}°C
              </p>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t('humidity')}</p>
                <p className="font-medium" data-testid="text-humidity">{weather?.humidity || "68"}%</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Wind className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t('wind_speed')}</p>
                <p className="font-medium" data-testid="text-wind-speed">{weather?.windSpeed || "15"} km/h</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <CloudRain className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">{t('rainfall')}</p>
                <p className="font-medium" data-testid="text-rainfall">{weather?.rainfall || "12"} mm</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">{t('feels_like')}</p>
                <p className="font-medium" data-testid="text-feels-like">
                  {weather?.temperature ? Math.round(parseFloat(weather.temperature) + 2) : 34}°C
                </p>
              </div>
            </div>
          </div>

          {/* Weather Alert */}
          {weather?.weatherType === "rainy" && (
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200" data-testid="text-weather-alert">
                ⚠️ {t('irrigation_alert')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
