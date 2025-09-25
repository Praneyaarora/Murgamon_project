import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import { 
  FileText, 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle
} from "lucide-react";

export const EnvironmentReportDialog = () => {
  // Enhanced mock data for comprehensive environmental report
  const environmentalMetrics = [
    { name: "Temperature", current: "24.5°C", optimal: "18-26°C", status: "normal", trend: "up" },
    { name: "Humidity", current: "68%", optimal: "60-75%", status: "normal", trend: "stable" },
    { name: "CO₂", current: "420ppm", optimal: "<400ppm", status: "warning", trend: "up" },
    { name: "NH₃", current: "15ppm", optimal: "<10ppm", status: "critical", trend: "up" },
    { name: "Air Flow", current: "2.5 m/s", optimal: "2-3 m/s", status: "normal", trend: "stable" },
    { name: "Lighting", current: "850 lux", optimal: "800-1000 lux", status: "normal", trend: "down" }
  ];

  const weeklyTrends = [
    { day: "Mon", temp: 23.2, humidity: 70, co2: 380, nh3: 8 },
    { day: "Tue", temp: 24.1, humidity: 68, co2: 390, nh3: 10 },
    { day: "Wed", temp: 24.8, humidity: 67, co2: 410, nh3: 12 },
    { day: "Thu", temp: 24.5, humidity: 68, co2: 420, nh3: 15 },
    { day: "Fri", temp: 24.2, humidity: 69, co2: 400, nh3: 14 },
    { day: "Sat", temp: 23.9, humidity: 71, co2: 385, nh3: 11 },
    { day: "Sun", temp: 24.5, humidity: 68, co2: 420, nh3: 15 }
  ];

  const alerts = [
    { time: "2 hours ago", message: "NH₃ levels exceeded threshold in Barn B", severity: "high" },
    { time: "6 hours ago", message: "CO₂ levels slightly elevated in Barn A", severity: "medium" },
    { time: "1 day ago", message: "Temperature sensor calibration completed", severity: "low" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "success";
      case "warning": return "warning";
      case "critical": return "danger";
      default: return "secondary";
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <div className="w-4 h-4" />;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          Environment Summary Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Environmental Monitoring Report - {new Date().toLocaleDateString()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">4/6</div>
                  <div className="text-sm text-muted-foreground">Parameters Normal</div>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <div className="text-2xl font-bold text-warning">1</div>
                  <div className="text-sm text-muted-foreground">Warning Level</div>
                </div>
                <div className="text-center p-4 bg-danger/10 rounded-lg">
                  <div className="text-2xl font-bold text-danger">1</div>
                  <div className="text-sm text-muted-foreground">Critical Alert</div>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <div className="text-2xl font-bold text-accent">95%</div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Current Environmental Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {environmentalMetrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{metric.name}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-2xl font-bold mb-1">{metric.current}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Optimal: {metric.optimal}
                    </div>
                    <Badge variant={getStatusColor(metric.status) as any}>
                      {metric.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>7-Day Environmental Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Temperature & Humidity</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Line type="monotone" dataKey="temp" stroke="hsl(var(--primary))" strokeWidth={2} />
                      <Line type="monotone" dataKey="humidity" stroke="hsl(var(--accent))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Gas Levels</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Bar dataKey="co2" fill="hsl(var(--warning))" />
                      <Bar dataKey="nh3" fill="hsl(var(--danger))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Recent Alerts & Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className={`p-3 border rounded-lg ${
                    alert.severity === 'high' ? 'bg-danger/10 border-danger/20' :
                    alert.severity === 'medium' ? 'bg-warning/10 border-warning/20' :
                    'bg-muted/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{alert.message}</span>
                      <span className="text-sm text-muted-foreground">{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Automated Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <strong>Immediate Action Required:</strong> Activate additional ventilation in Barn B to reduce NH₃ levels below 10ppm threshold.
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <strong>Preventive Measure:</strong> Schedule maintenance for CO₂ monitoring systems to prevent further elevations.
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <strong>Optimization:</strong> Current temperature and humidity levels are optimal for livestock comfort.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};