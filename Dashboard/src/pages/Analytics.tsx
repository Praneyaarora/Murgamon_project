import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Activity,
  AlertTriangle,
  Eye
} from "lucide-react";

const Analytics = () => {
  const timeWindows = [
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 90 Days", value: "90d" },
    { label: "Last 120 Days", value: "120d" },
    { label: "Custom Range", value: "custom" }
  ];

  const healthTrends = [
    { date: "Week 1", healthy: 85, atRisk: 12, sick: 3 },
    { date: "Week 2", healthy: 82, atRisk: 15, sick: 3 },
    { date: "Week 3", healthy: 79, atRisk: 18, sick: 3 },
    { date: "Week 4", healthy: 88, atRisk: 10, sick: 2 }
  ];

  const environmentalEvents = [
    { date: "2024-01-15", event: "Vaccination Day", type: "planned", impact: "positive" },
    { date: "2024-01-18", event: "Heavy Rain", type: "weather", impact: "negative" },
    { date: "2024-01-22", event: "Regional Outbreak Alert", type: "alert", impact: "negative" },
    { date: "2024-01-25", event: "Equipment Upgrade", type: "planned", impact: "positive" }
  ];

  const kpiData = [
    {
      title: "Farm Average Temperature", 
      current: "24.2°C",
      change: "+0.5°C", 
      trend: "up",
      status: "normal"
    },
    {
      title: "Average Animal Health Score",
      current: "87%",
      change: "+3%",
      trend: "up", 
      status: "good"
    },
    {
      title: "Environment Compliance",
      current: "92%", 
      change: "-1%",
      trend: "down",
      status: "warning"
    },
    {
      title: "Disease Risk Level",
      current: "Low",
      change: "Stable",
      trend: "stable",
      status: "good"
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-danger" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-success";
      case "warning":
        return "text-warning";
      case "critical":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Analytics & Trends</h2>
        <div className="flex gap-3">
          <Select defaultValue="30d">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeWindows.map((window) => (
                <SelectItem key={window.value} value={window.value}>
                  {window.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-gradient-primary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="shadow-medium">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </div>
                {getTrendIcon(kpi.trend)}
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(kpi.status)}`}>
                {kpi.current}
              </div>
              <div className="text-sm text-muted-foreground">
                {kpi.change} from last period
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health Distribution Trends */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Animal Health Distribution Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted/20 rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Stacked Area Chart</p>
              <p className="text-sm text-muted-foreground">
                Showing percentage of animals by health status over selected time period
              </p>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success rounded"></div>
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-warning rounded"></div>
              <span>At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-danger rounded"></div>
              <span>Sick</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environmental Correlation */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Environmental vs Health Correlation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-foreground">Dual-Axis Line Chart</p>
                <p className="text-sm text-muted-foreground">
                  Farm avg environment temp vs avg animal body temp
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Correlation Coefficient</span>
                <span className="font-medium text-success">+0.73 (Strong)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Temperature Variance</span>
                <span className="font-medium text-foreground">±2.1°C</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environmental Timeseries */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning" />
              Environmental Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-foreground">Multi-Line Chart</p>
                <p className="text-sm text-muted-foreground">
                  CO₂, NH₃, PM2.5 levels over time
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-medium text-foreground">CO₂</div>
                <div className="text-warning">420ppm avg</div>
              </div>
              <div>
                <div className="font-medium text-foreground">NH₃</div>
                <div className="text-danger">12ppm avg</div>
              </div>
              <div>
                <div className="font-medium text-foreground">PM2.5</div>
                <div className="text-success">8µg/m³ avg</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Timeline */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Event Timeline & Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {environmentalEvents.map((event, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  event.impact === 'positive' ? 'bg-success' : 
                  event.impact === 'negative' ? 'bg-danger' : 'bg-warning'
                }`}></div>
                
                <div className="flex-1">
                  <div className="font-medium text-foreground">{event.event}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.date} • {event.type}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {event.impact === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : event.impact === 'negative' ? (
                    <TrendingDown className="w-4 h-4 text-danger" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                  
                  <Button variant="ghost" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    View Impact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent" />
            Predictive Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="font-medium text-foreground">Weather Alert</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Heavy rainfall predicted in 3 days. Consider increasing ventilation and monitoring humidity levels.
              </p>
            </div>
            
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                <span className="font-medium text-foreground">Health Trend</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Animal health scores improving by 2% weekly. Current protocols are effective.
              </p>
            </div>
            
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="font-medium text-foreground">Optimization</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Reduce NH₃ by 15% with adjusted feeding schedule based on current data patterns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;