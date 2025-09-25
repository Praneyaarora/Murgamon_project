import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Activity,
  ClipboardCheck
} from "lucide-react";

const Dashboard = () => {
  const farms = [
    { id: 1, name: "North Farm", riskScore: 15, status: "healthy" },
    { id: 2, name: "South Farm", riskScore: 65, status: "warning" },
    { id: 3, name: "East Farm", riskScore: 85, status: "critical" },
  ];

  const currentFarm = farms[0];

  const environmentData = [
    { 
      metric: "Temperature", 
      value: "24.5°C", 
      trend: "up", 
      status: "normal",
      icon: Thermometer 
    },
    { 
      metric: "Humidity", 
      value: "68%", 
      trend: "down", 
      status: "normal",
      icon: Droplets 
    },
    { 
      metric: "CO₂", 
      value: "420ppm", 
      trend: "stable", 
      status: "warning",
      icon: Wind 
    },
    { 
      metric: "NH₃", 
      value: "15ppm", 
      trend: "up", 
      status: "critical",
      icon: Activity 
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
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
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3" />;
      case "down":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <BarChart3 className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Farm Selection */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Murgamon Farm Dashboard</h2>
        <Tabs defaultValue="1" className="w-auto">
          <TabsList>
            {farms.map((farm) => (
              <TabsTrigger key={farm.id} value={farm.id.toString()}>
                {farm.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Farm Risk Score & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              Farm Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">
              {currentFarm.riskScore}/100
            </div>
            <Badge variant={getStatusColor(currentFarm.status) as any}>
              {currentFarm.status}
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Last Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-foreground">
              2 hours ago
            </div>
            <p className="text-sm text-muted-foreground">
              High NH₃ levels detected in Barn B
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-success">
              92% Complete
            </div>
            <p className="text-sm text-muted-foreground">
              3 items need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Environment Sensors */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-accent" />
            Environmental Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {environmentData.map((item) => {
              const IconComponent = item.icon;
              return (
                <div key={item.metric} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                    {getTrendIcon(item.trend)}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {item.value}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {item.metric}
                    </span>
                    <Badge 
                      variant={getStatusColor(item.status) as any}
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Panel */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Compliance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <div className="font-medium text-foreground">Footbath</div>
                <div className="text-sm text-muted-foreground">Last refilled: 4 hours ago</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <div className="font-medium text-foreground">Vaccinations</div>
                <div className="text-sm text-muted-foreground">Next due: Tomorrow</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <div className="font-medium text-foreground">Sanitization</div>
                <div className="text-sm text-muted-foreground">12 gates cleaned today</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;