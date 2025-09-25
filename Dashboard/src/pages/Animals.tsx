import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Heart,
  Activity,
  Thermometer,
  AlertTriangle,
  Eye,
  Plus,
  FileText,
  Download,
  Phone,
  Syringe,
  ShieldAlert,
  Calendar,
  Camera,
  Video,
  Play,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

const Animals = () => {
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const chickens = [
    {
      id: "C001",
      bodyTemp: 41.2,
      activity: 85,
      heartRate: 240,
      healthStatus: "healthy",
      riskScore: 12,
      alerts: []
    },
    {
      id: "C002", 
      bodyTemp: 43.1,
      activity: 45,
      heartRate: 280,
      healthStatus: "at-risk",
      riskScore: 67,
      alerts: ["Low activity", "High temp"]
    },
    {
      id: "C003",
      bodyTemp: 44.5,
      activity: 25,
      heartRate: 320,
      healthStatus: "sick",
      riskScore: 89,
      alerts: ["Possible avian flu", "Isolation required"]
    }
  ];

  const pigs = [
    {
      id: "P001",
      bodyTemp: 38.8,
      activity: 78,
      heartRate: 85,
      healthStatus: "healthy",
      riskScore: 8,
      alerts: []
    },
    {
      id: "P002",
      bodyTemp: 40.2,
      activity: 35,
      heartRate: 110,
      healthStatus: "at-risk", 
      riskScore: 73,
      alerts: ["Elevated temperature"]
    }
  ];

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "success";
      case "at-risk":
        return "warning";
      case "sick":
        return "danger";
      default:
        return "secondary";
    }
  };

  const generateReport = (animals: any[], type: string) => {
    const healthyCount = animals.filter(a => a.healthStatus === 'healthy').length;
    const atRiskCount = animals.filter(a => a.healthStatus === 'at-risk').length;
    const sickCount = animals.filter(a => a.healthStatus === 'sick').length;
    const avgRiskScore = Math.round(animals.reduce((sum, a) => sum + a.riskScore, 0) / animals.length);
    const totalAlerts = animals.reduce((sum, a) => sum + a.alerts.length, 0);
    
    const report = {
      title: `${type} Health Report`,
      generatedAt: new Date().toLocaleString(),
      summary: {
        totalAnimals: animals.length,
        healthyCount,
        atRiskCount,
        sickCount,
        avgRiskScore,
        totalAlerts
      },
      animals: animals.map(animal => ({
        id: animal.id,
        health: animal.healthStatus,
        temp: animal.bodyTemp,
        activity: animal.activity,
        heartRate: animal.heartRate,
        riskScore: animal.riskScore,
        alerts: animal.alerts
      }))
    };
    
    setReportData(report);
    setIsReportOpen(true);
  };

  const openAnimalDetails = (animal: any) => {
    setSelectedAnimal(animal);
    setIsDetailOpen(true);
  };

  const AnimalCard = ({ animal, type }: { animal: any, type: string }) => (
    <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{animal.id}</CardTitle>
          <Badge variant={getHealthColor(animal.healthStatus) as any}>
            {animal.healthStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-danger/10 rounded-full mx-auto mb-1">
              <Thermometer className="w-4 h-4 text-danger" />
            </div>
            <div className="text-sm font-medium text-foreground">{animal.bodyTemp}°C</div>
            <div className="text-xs text-muted-foreground">Body Temp</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-full mx-auto mb-1">
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="text-sm font-medium text-foreground">{animal.activity}</div>
            <div className="text-xs text-muted-foreground">Activity</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-warning/10 rounded-full mx-auto mb-1">
              <Heart className="w-4 h-4 text-warning" />
            </div>
            <div className="text-sm font-medium text-foreground">{animal.heartRate}</div>
            <div className="text-xs text-muted-foreground">BPM</div>
          </div>
        </div>

        {animal.alerts.length > 0 && (
          <div className="space-y-1 mb-3">
            {animal.alerts.map((alert: string, index: number) => (
              <div key={index} className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="w-3 h-3" />
                {alert}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Risk Score: <span className="font-medium text-foreground">{animal.riskScore}%</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => openAnimalDetails(animal)}>
            <Eye className="w-3 h-3 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Animal Monitoring</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateReport([...chickens, ...pigs], 'All Animals')}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Animal
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chickens">Chickens ({chickens.length})</TabsTrigger>
          <TabsTrigger value="pigs">Pigs ({pigs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  Healthy Animals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {chickens.filter(c => c.healthStatus === 'healthy').length + 
                   pigs.filter(p => p.healthStatus === 'healthy').length}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  At Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {chickens.filter(c => c.healthStatus === 'at-risk').length + 
                   pigs.filter(p => p.healthStatus === 'at-risk').length}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-danger rounded-full"></div>
                  Sick/Critical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-danger">
                  {chickens.filter(c => c.healthStatus === 'sick').length + 
                   pigs.filter(p => p.healthStatus === 'sick').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chickens" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Chickens ({chickens.length})</h3>
            <Button variant="outline" size="sm" onClick={() => generateReport(chickens, 'Chickens')}>
              <Download className="w-4 h-4 mr-2" />
              Export Chickens Report
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chickens
              .sort((a, b) => b.riskScore - a.riskScore)
              .map((chicken) => (
                <AnimalCard key={chicken.id} animal={chicken} type="chicken" />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="pigs" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Pigs ({pigs.length})</h3>
            <Button variant="outline" size="sm" onClick={() => generateReport(pigs, 'Pigs')}>
              <Download className="w-4 h-4 mr-2" />
              Export Pigs Report
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pigs
              .sort((a, b) => b.riskScore - a.riskScore)
              .map((pig) => (
                <AnimalCard key={pig.id} animal={pig} type="pig" />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Animal Details Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Animal Details - {selectedAnimal?.id}
              <Badge variant={getHealthColor(selectedAnimal?.healthStatus) as any}>
                {selectedAnimal?.healthStatus}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedAnimal && (
            <div className="space-y-6">
              {/* Current Vitals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-danger" />
                      Body Temperature
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-danger">{selectedAnimal.bodyTemp}°C</div>
                    <div className="text-xs text-muted-foreground">Normal: 40-42°C</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" />
                      Activity Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">{selectedAnimal.activity}</div>
                    <div className="text-xs text-muted-foreground">Scale: 0-100</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Heart className="w-4 h-4 text-warning" />
                      Heart Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">{selectedAnimal.heartRate} BPM</div>
                    <div className="text-xs text-muted-foreground">Normal: 250-300 BPM</div>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-foreground">{selectedAnimal.riskScore}%</div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-2">Disease Risk Score</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            selectedAnimal.riskScore > 70 ? 'bg-danger' : 
                            selectedAnimal.riskScore > 40 ? 'bg-warning' : 'bg-success'
                          }`}
                          style={{ width: `${selectedAnimal.riskScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Alerts */}
              {selectedAnimal.alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      Active Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedAnimal.alerts.map((alert: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                          <span className="text-sm">{alert}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call Vet
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Syringe className="w-4 h-4" />
                  Mark Treated
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Isolate
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Generate Report
                </Button>
              </div>

              {/* Camera & Recording Section */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Live Camera Feed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Live Feed Placeholder */}
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-2 right-2 bg-danger text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          LIVE
                        </div>
                        <div className="text-center">
                          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <div className="text-sm text-muted-foreground">Camera Feed Active</div>
                          <div className="text-xs text-muted-foreground">Animal: {selectedAnimal?.id}</div>
                        </div>
                      </div>
                      
                      {/* Recording Controls */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Camera className="w-3 h-3" />
                          Take Snapshot
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Video className="w-3 h-3" />
                          Record Clip
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Recent Snapshots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { time: "2 min ago", status: "active" },
                        { time: "15 min ago", status: "feeding" },
                        { time: "1 hour ago", status: "resting" },
                        { time: "3 hours ago", status: "alert" }
                      ].map((snapshot, index) => (
                        <div key={index} className="space-y-2">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                            <Camera className="w-6 h-6 text-muted-foreground" />
                            <div className="absolute bottom-1 left-1 bg-background/80 text-xs px-1 rounded">
                              {snapshot.time}
                            </div>
                          </div>
                          <div className="text-xs text-center">
                            <Badge variant="outline" className="text-xs">
                              {snapshot.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Behavior Clips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Behavior Highlights (Last 24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { title: "Feeding Behavior", duration: "8s", time: "2 hours ago", activity: "high" },
                      { title: "Social Interaction", duration: "5s", time: "4 hours ago", activity: "normal" },
                      { title: "Alert Response", duration: "3s", time: "6 hours ago", activity: "alert" }
                    ].map((clip, index) => (
                      <div key={index} className="space-y-2">
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-muted/80 transition-colors">
                          <Play className="w-8 h-8 text-primary" />
                          <div className="absolute bottom-2 right-2 bg-background/80 text-xs px-1 rounded">
                            {clip.duration}
                          </div>
                          <div className="absolute top-2 left-2">
                            <Badge 
                              variant={clip.activity === 'alert' ? 'destructive' : clip.activity === 'high' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {clip.activity}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{clip.title}</div>
                          <div className="text-xs text-muted-foreground">{clip.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Historical Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Historical Data (7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{selectedAnimal?.bodyTemp}°C</div>
                        <div className="text-xs text-muted-foreground">Avg Body Temp</div>
                        <div className="text-xs text-success">+0.2°C trend</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{selectedAnimal?.activity}</div>
                        <div className="text-xs text-muted-foreground">Avg Activity</div>
                        <div className="text-xs text-warning">-5% trend</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{selectedAnimal?.heartRate}</div>
                        <div className="text-xs text-muted-foreground">Avg Heart Rate</div>
                        <div className="text-xs text-success">Normal range</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {reportData?.title}
            </DialogTitle>
          </DialogHeader>
          
          {reportData && (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Farm Health Assessment</h3>
                    <p className="text-sm text-muted-foreground">Generated on {reportData.generatedAt}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{reportData.summary.totalAnimals}</div>
                  <div className="text-xs text-muted-foreground">Total Animals</div>
                </div>
                <div className="text-center p-3 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">{reportData.summary.healthyCount}</div>
                  <div className="text-xs text-muted-foreground">Healthy</div>
                </div>
                <div className="text-center p-3 bg-warning/10 rounded-lg">
                  <div className="text-2xl font-bold text-warning">{reportData.summary.atRiskCount}</div>
                  <div className="text-xs text-muted-foreground">At Risk</div>
                </div>
                <div className="text-center p-3 bg-danger/10 rounded-lg">
                  <div className="text-2xl font-bold text-danger">{reportData.summary.sickCount}</div>
                  <div className="text-xs text-muted-foreground">Sick</div>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{reportData.summary.avgRiskScore}%</div>
                  <div className="text-xs text-muted-foreground">Avg Risk</div>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{reportData.summary.totalAlerts}</div>
                  <div className="text-xs text-muted-foreground">Total Alerts</div>
                </div>
              </div>

              {/* Individual Animal Data */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Individual Animal Details</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">Animal ID</th>
                        <th className="border border-border p-2 text-left">Health Status</th>
                        <th className="border border-border p-2 text-left">Body Temp (°C)</th>
                        <th className="border border-border p-2 text-left">Activity</th>
                        <th className="border border-border p-2 text-left">Heart Rate</th>
                        <th className="border border-border p-2 text-left">Risk Score</th>
                        <th className="border border-border p-2 text-left">Alerts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.animals.map((animal: any, index: number) => (
                        <tr key={animal.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                          <td className="border border-border p-2 font-medium">{animal.id}</td>
                          <td className="border border-border p-2">
                            <Badge variant={getHealthColor(animal.health) as any} className="text-xs">
                              {animal.health}
                            </Badge>
                          </td>
                          <td className="border border-border p-2">{animal.temp}</td>
                          <td className="border border-border p-2">{animal.activity}</td>
                          <td className="border border-border p-2">{animal.heartRate}</td>
                          <td className="border border-border p-2">
                            <span className={`font-medium ${
                              animal.riskScore > 70 ? 'text-danger' : 
                              animal.riskScore > 40 ? 'text-warning' : 'text-success'
                            }`}>
                              {animal.riskScore}%
                            </span>
                          </td>
                          <td className="border border-border p-2">
                            {animal.alerts.length > 0 ? (
                              <div className="space-y-1">
                                {animal.alerts.map((alert: string, alertIndex: number) => (
                                  <div key={alertIndex} className="text-xs text-warning flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {alert}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Recommendations</h4>
                <div className="space-y-3">
                  {reportData.summary.sickCount > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-danger/10 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-danger">Immediate Action Required</div>
                        <div className="text-sm text-muted-foreground">
                          {reportData.summary.sickCount} animal(s) showing signs of illness. Consider veterinary consultation and isolation protocols.
                        </div>
                      </div>
                    </div>
                  )}
                  {reportData.summary.atRiskCount > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                      <Eye className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-warning">Monitor Closely</div>
                        <div className="text-sm text-muted-foreground">
                          {reportData.summary.atRiskCount} animal(s) at risk. Increase monitoring frequency and review environmental conditions.
                        </div>
                      </div>
                    </div>
                  )}
                  {reportData.summary.avgRiskScore < 30 && (
                    <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                      <Heart className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-success">Good Health Status</div>
                        <div className="text-sm text-muted-foreground">
                          Overall herd health is good. Continue current management practices.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Animals;