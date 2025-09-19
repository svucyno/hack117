import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/layout/navbar";
import { Leaf, TrendingUp, Brain, Database, BarChart3, Settings, Users, Target, MapPin, Calendar } from "lucide-react";

export default function Landing() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onLanguageChange={handleLanguageChange} onLogin={handleLogin} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-accent text-primary-foreground py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-medium">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  {t('hackathon_badge')}
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  {t('hero_title_part1')} <span className="text-secondary">{t('hero_title_highlight')}</span> {t('hero_title_part2')}
                </h1>
                <p className="text-xl text-primary-foreground/80 leading-relaxed">
                  {t('hero_description')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleLogin}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-4 text-lg"
                  data-testid="button-start-prediction"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  {t('start_prediction')}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-4 text-lg"
                  data-testid="button-watch-demo"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  {t('watch_demo')}
                </Button>
              </div>
            </div>
            
            <div className="lg:pl-12">
              <img 
                src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt={t('hero_image_alt')}
                className="rounded-2xl shadow-2xl w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">{t('problem_title')}</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('problem_description')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border shadow-sm">
              <CardContent className="p-0">
                <div className="bg-destructive/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="text-destructive w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('problem_1_title')}</h3>
                <p className="text-muted-foreground">
                  {t('problem_1_description')}
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-8 border shadow-sm">
              <CardContent className="p-0">
                <div className="bg-secondary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <MapPin className="text-secondary w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('problem_2_title')}</h3>
                <p className="text-muted-foreground">
                  {t('problem_2_description')}
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-8 border shadow-sm">
              <CardContent className="p-0">
                <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <Brain className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('problem_3_title')}</h3>
                <p className="text-muted-foreground">
                  {t('problem_3_description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">{t('solution_title')}</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('solution_description')}
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-primary p-3 rounded-xl shrink-0">
                  <Database className="text-primary-foreground w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('feature_1_title')}</h3>
                  <p className="text-muted-foreground">
                    {t('feature_1_description')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-accent p-3 rounded-xl shrink-0">
                  <BarChart3 className="text-accent-foreground w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('feature_2_title')}</h3>
                  <p className="text-muted-foreground">
                    {t('feature_2_description')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-secondary p-3 rounded-xl shrink-0">
                  <Settings className="text-secondary-foreground w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('feature_3_title')}</h3>
                  <p className="text-muted-foreground">
                    {t('feature_3_description')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-8 rounded-2xl">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt={t('solution_image_alt')}
                className="rounded-xl shadow-lg w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">{t('features_title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('features_description')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 border shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <Brain className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('ai_chatbot_title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('ai_chatbot_description')}
                </p>
                <div className="text-sm text-primary font-medium">
                  <span className="mr-2">🌐</span>{t('languages_supported')}
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-8 border shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="bg-accent/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <Target className="text-accent w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('mobile_responsive_title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('mobile_responsive_description')}
                </p>
                <div className="text-sm text-accent font-medium">
                  <span className="mr-2">✓</span>{t('cross_platform')}
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-8 border shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="bg-secondary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <MapPin className="text-secondary w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t('weather_integration_title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('weather_integration_description')}
                </p>
                <div className="text-sm text-secondary font-medium">
                  <span className="mr-2">🔄</span>{t('real_time_updates')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-primary p-2 rounded-lg">
                  <Leaf className="text-primary-foreground w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">AgriPredict</h1>
                  <p className="text-sm text-muted-foreground">{t('hackathon_badge')}</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                {t('footer_description')}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('platform')}</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">{t('dashboard')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('predictions')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('recommendations')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('weather')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('support')}</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">{t('help_center')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('documentation')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('contact_us')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('privacy_policy')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 mt-12 text-center text-muted-foreground">
            <p>{t('copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
