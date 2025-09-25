import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Thermometer,
  Droplets,
  Wind,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Settings
} from "lucide-react";

const Environment = () => {
  const sensorData = [
    {
      name: "Temperature",
      current: "24.5°C",
      trend: "up",
      status: "normal",
      threshold: "18-26°C",
      icon: Thermometer,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      history: [22.1, 23.2, 24.0, 24.5, 24.2]
    },
    {
      name: "Humidity", 
      current: "68%",
      trend: "down",
      status: "normal", 
      threshold: "60-75%",
      icon: Droplets,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      history: [72, 70, 69, 68, 67]
    },
    {
      name: "CO₂ Levels",
      current: "420ppm",
      trend: "up",
      status: "warning",
      threshold: "<400ppm", 
      icon: Wind,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      history: [380, 390, 405, 415, 420]
    },
    {
      name: "NH₃ Levels",
      current: "15ppm", 
      trend: "up",
      status: "critical",
      threshold: "<10ppm",
      icon: Activity,
      color: "text-red-600",
      bgColor: "bg-red-50",
      history: [8, 10, 12, 14, 15]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "success";
      case "warning": 
        return "warning";
      case "critical":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? 
      <TrendingUp className="w-4 h-4 text-red-500" /> : 
      <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Environmental Monitoring</h2>
        <div className="flex gap-3">
          <Select defaultValue="24h">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Thresholds
          </Button>
        </div>
      </div>

      {/* Current Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensorData.map((sensor) => {
          const IconComponent = sensor.icon;
          return (
            <Card key={sensor.name} className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg ${sensor.bgColor} flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${sensor.color}`} />
                  </div>
                  {getTrendIcon(sensor.trend)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-foreground">
                    {sensor.current}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {sensor.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Target: {sensor.threshold}
                    </span>
                    <Badge variant={getStatusColor(sensor.status) as any}>
                      {sensor.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Environmental Alerts */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Active Environmental Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Critical NH₃ Level</div>
                <div className="text-sm text-muted-foreground">
                  Barn B - 15ppm detected (threshold: 10ppm) - Ventilation system activated
                </div>
              </div>
              <div className="text-xs text-muted-foreground">2 min ago</div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Elevated CO₂</div>
                <div className="text-sm text-muted-foreground">
                  Barn A - 420ppm detected (threshold: 400ppm) - Monitoring closely
                </div>
              </div>
              <div className="text-xs text-muted-foreground">15 min ago</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental History Chart Placeholder */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Environmental Trends (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Interactive chart showing sensor trends</p>
              <p className="text-sm text-muted-foreground">Temperature, Humidity, CO₂, NH₃ over time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barn Layout Status */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Barn Environmental Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Barn A', 'Barn B', 'Barn C'].map((barn, index) => {
              const statuses = ['normal', 'warning', 'critical'];
              const status = statuses[index];
              return (
                <div key={barn} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground">{barn}</h3>
                    <Badge variant={getStatusColor(status) as any}>
                      {status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Temp: 24.{index + 1}°C</div>
                    <div>Humidity: 6{index + 8}%</div>
                    <div>CO₂: {380 + index * 20}ppm</div>
                    <div>NH₃: {8 + index * 3}ppm</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Environment;