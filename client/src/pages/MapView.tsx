import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Trash2, Save, MapPin, Satellite, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FieldBoundary {
  id: string;
  name: string;
  coordinates: number[][];
  area: number;
  cropType?: string;
  userId: string;
  createdAt: string;
}

interface DrawControlProps {
  onBoundaryCreated: (boundary: { coordinates: number[][]; area: number }) => void;
}

const DrawControls = ({ onBoundaryCreated }: DrawControlProps) => {
  const map = useMap();

  const onCreated = useCallback((e: any) => {
    const layer = e.layer;
    if (layer instanceof L.Polygon) {
      const coordinates = layer.getLatLngs()[0].map((point: L.LatLng) => [
        point.lat,
        point.lng
      ]);
      
      // Calculate area in hectares
      const area = L.GeometryUtil ? L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) / 10000 : 0;
      
      onBoundaryCreated({ coordinates, area });
      
      // Remove the temporary layer
      map.removeLayer(layer);
    }
  }, [map, onBoundaryCreated]);

  return (
    <FeatureGroup>
      <EditControl
        position="topright"
        onCreated={onCreated}
        draw={{
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: 'Field boundaries cannot intersect'
            },
            shapeOptions: {
              color: '#2E7D32',
              weight: 3,
              fillOpacity: 0.2
            }
          }
        }}
        edit={{
          featureGroup: new L.FeatureGroup(),
          remove: true
        }}
      />
    </FeatureGroup>
  );
};

export default function MapView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newBoundary, setNewBoundary] = useState<{
    coordinates: number[][];
    area: number;
    name: string;
    cropType: string;
  } | null>(null);
  
  const [selectedLayer, setSelectedLayer] = useState<string>('satellite');
  const mapRef = useRef<L.Map | null>(null);

  // Fetch existing field boundaries
  const { data: boundaries = [], isLoading } = useQuery<FieldBoundary[]>({
    queryKey: ['/api/field-boundaries'],
  });

  // Save field boundary mutation
  const saveBoundaryMutation = useMutation({
    mutationFn: (data: { name: string; coordinates: number[][]; area: number; cropType?: string }) =>
      apiRequest('/api/field-boundaries', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: t('success'),
        description: 'Field boundary saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/field-boundaries'] });
      setNewBoundary(null);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: 'Failed to save field boundary',
        variant: 'destructive',
      });
    }
  });

  // Delete field boundary mutation
  const deleteBoundaryMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/field-boundaries/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: t('success'),
        description: 'Field boundary deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/field-boundaries'] });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: 'Failed to delete field boundary',
        variant: 'destructive',
      });
    }
  });

  const handleBoundaryCreated = useCallback((boundary: { coordinates: number[][]; area: number }) => {
    setNewBoundary({
      ...boundary,
      name: '',
      cropType: ''
    });
  }, []);

  const handleSaveBoundary = () => {
    if (!newBoundary || !newBoundary.name.trim()) {
      toast({
        title: t('validation_error'),
        description: 'Please enter a field name',
        variant: 'destructive',
      });
      return;
    }

    saveBoundaryMutation.mutate({
      name: newBoundary.name,
      coordinates: newBoundary.coordinates,
      area: newBoundary.area,
      cropType: newBoundary.cropType || undefined
    });
  };

  const getTileLayerUrl = () => {
    switch (selectedLayer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'street':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'terrain':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}';
      default:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
  };

  const getTileLayerAttribution = () => {
    switch (selectedLayer) {
      case 'satellite':
        return '&copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community';
      case 'street':
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      case 'terrain':
        return '&copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS';
      default:
        return '&copy; Esri';
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Interactive Field Map
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Draw field boundaries and analyze satellite data
            </p>
          </div>
          
          {/* Layer Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedLayer === 'satellite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLayer('satellite')}
              data-testid="button-satellite-layer"
            >
              <Satellite className="w-4 h-4 mr-1" />
              Satellite
            </Button>
            <Button
              variant={selectedLayer === 'street' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLayer('street')}
              data-testid="button-street-layer"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Street
            </Button>
            <Button
              variant={selectedLayer === 'terrain' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLayer('terrain')}
              data-testid="button-terrain-layer"
            >
              <Layers className="w-4 h-4 mr-1" />
              Terrain
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-card border-r border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* New Boundary Form */}
            {newBoundary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Save className="w-5 h-5 text-primary" />
                    Save Field Boundary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="field-name">Field Name *</Label>
                    <Input
                      id="field-name"
                      value={newBoundary.name}
                      onChange={(e) => setNewBoundary(prev => prev ? {...prev, name: e.target.value} : null)}
                      placeholder="Enter field name"
                      data-testid="input-field-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop-type">Crop Type</Label>
                    <Input
                      id="crop-type"
                      value={newBoundary.cropType}
                      onChange={(e) => setNewBoundary(prev => prev ? {...prev, cropType: e.target.value} : null)}
                      placeholder="e.g., Rice, Wheat, Corn"
                      data-testid="input-crop-type"
                    />
                  </div>
                  <div>
                    <Label>Area: {newBoundary.area.toFixed(2)} hectares</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveBoundary}
                      disabled={saveBoundaryMutation.isPending}
                      className="flex-1"
                      data-testid="button-save-boundary"
                    >
                      {saveBoundaryMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setNewBoundary(null)}
                      data-testid="button-cancel-boundary"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Existing Boundaries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Boundaries</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading boundaries...</p>
                ) : boundaries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No field boundaries yet. Use the drawing tools on the map to create your first field boundary.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {boundaries.map((boundary) => (
                      <div 
                        key={boundary.id}
                        className="p-3 border border-border rounded-lg"
                        data-testid={`boundary-${boundary.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{boundary.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {boundary.area.toFixed(2)} ha
                            </p>
                            {boundary.cropType && (
                              <p className="text-xs text-primary">
                                {boundary.cropType}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteBoundaryMutation.mutate(boundary.id)}
                            disabled={deleteBoundaryMutation.isPending}
                            data-testid={`button-delete-${boundary.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>1. Use the polygon tool on the map to draw field boundaries</p>
                <p>2. Click to place vertices around your field</p>
                <p>3. Double-click to complete the polygon</p>
                <p>4. Enter field details and save</p>
                <p>5. Switch between satellite, street, and terrain views</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[20.2961, 85.8245]} // Bhubaneswar coordinates
            zoom={13}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              url={getTileLayerUrl()}
              attribution={getTileLayerAttribution()}
            />
            <DrawControls onBoundaryCreated={handleBoundaryCreated} />
            
            {/* Render existing boundaries */}
            {boundaries.map((boundary) => {
              const coordinates = boundary.coordinates.map(coord => [coord[0], coord[1]] as [number, number]);
              return (
                <L.Polygon
                  key={boundary.id}
                  positions={coordinates}
                  pathOptions={{
                    color: '#2E7D32',
                    weight: 2,
                    fillOpacity: 0.1,
                    fillColor: '#8BC34A'
                  }}
                />
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}