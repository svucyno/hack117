import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Droplets, Leaf, Shield, TrendingUp } from "lucide-react";

interface RecommendationCardsProps {
  recommendations: any[];
}

export function RecommendationCards({ recommendations }: RecommendationCardsProps) {
  const { t } = useTranslation();

  if (recommendations.length === 0) {
    return (
      <div data-testid="recommendations-empty">
        <h2 className="text-2xl font-semibold mb-6">{t('ai_recommendations')}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex items-center justify-center h-40">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('no_recommendations')}</p>
                <p className="text-sm">{t('generate_prediction_first')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const latestRecommendation = recommendations[0];

  return (
    <div data-testid="recommendations-section">
      <h2 className="text-2xl font-semibold mb-6">{t('ai_recommendations')}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Irrigation Recommendation */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" data-testid="card-irrigation-recommendation">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-blue-800 dark:text-blue-200">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span>{t('irrigation')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3" data-testid="text-irrigation-advice">
              {latestRecommendation?.irrigationSchedule || t('default_irrigation_advice')}
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-blue-600 dark:text-blue-400" data-testid="badge-irrigation-confidence">
                <TrendingUp className="w-3 h-3 mr-1" />
                {t('confidence')}: {Math.round(parseFloat(latestRecommendation?.confidence || 92))}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Fertilizer Recommendation */}
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" data-testid="card-fertilizer-recommendation">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-green-800 dark:text-green-200">
              <div className="bg-green-500 p-2 rounded-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span>{t('fertilizer')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground" data-testid="text-fertilizer-type">
                <strong>{t('type')}:</strong> {latestRecommendation?.fertilizerType || "NPK 10:26:26"}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-fertilizer-amount">
                <strong>{t('amount')}:</strong> {latestRecommendation?.fertilizerAmount || "50kg per acre"}
              </p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Badge variant="outline" className="text-green-600 dark:text-green-400" data-testid="badge-fertilizer-confidence">
                <TrendingUp className="w-3 h-3 mr-1" />
                {t('confidence')}: {Math.round(parseFloat(latestRecommendation?.confidence || 88))}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pest Control Recommendation */}
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" data-testid="card-pest-control-recommendation">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-orange-800 dark:text-orange-200">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span>{t('pest_control')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3" data-testid="text-pest-control-advice">
              {latestRecommendation?.pestControl || t('default_pest_control_advice')}
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-orange-600 dark:text-orange-400" data-testid="badge-risk-level">
                ⚠️ {t('risk_level')}: {t('medium')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
