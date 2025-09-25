import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Calendar,
  Droplets,
  Zap,
  Syringe,
  Award,
  Download
} from "lucide-react";

const Compliance = () => {
  const complianceScore = 92;
  
  const complianceItems = [
    {
      category: "Footbath Management",
      items: [
        { 
          name: "Daily Footbath Refill",
          status: "completed",
          lastAction: "4 hours ago",
          nextDue: "Tomorrow 8:00 AM",
          icon: Droplets
        },
        {
          name: "Footbath Disinfectant Check", 
          status: "completed",
          lastAction: "Yesterday",
          nextDue: "In 6 days",
          icon: CheckCircle
        }
      ]
    },
    {
      category: "Sanitization",
      items: [
        {
          name: "Gate Sanitization",
          status: "completed", 
          lastAction: "2 hours ago",
          nextDue: "Every 4 hours",
          icon: Zap,
          count: "12 gates today"
        },
        {
          name: "Equipment Disinfection",
          status: "overdue",
          lastAction: "3 days ago", 
          nextDue: "Overdue by 1 day",
          icon: AlertTriangle
        }
      ]
    },
    {
      category: "Vaccinations",
      items: [
        {
          name: "Poultry Vaccination",
          status: "upcoming",
          lastAction: "2 weeks ago",
          nextDue: "Tomorrow",
          icon: Syringe,
          details: "Newcastle Disease booster"
        },
        {
          name: "Swine Vaccination", 
          status: "completed",
          lastAction: "1 week ago",
          nextDue: "In 3 weeks",
          icon: Syringe
        }
      ]
    }
  ];

  const certificationRequirements = [
    { name: "Footbath Compliance", progress: 95, target: 95 },
    { name: "Vaccination Schedule", progress: 88, target: 100 },
    { name: "Sanitization Records", progress: 92, target: 90 },
    { name: "Environmental Monitoring", progress: 97, target: 85 },
    { name: "Animal Health Records", progress: 89, target: 90 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "upcoming":
        return "warning";
      case "overdue":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "upcoming": 
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Compliance Management</h2>
        <Button className="bg-gradient-primary">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Overall Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">
              {complianceScore}%
            </div>
            <Progress value={complianceScore} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              3 items need attention
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              12
            </div>
            <p className="text-sm text-muted-foreground">
              Tasks completed today
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              3
            </div>
            <p className="text-sm text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Categories */}
      <div className="space-y-4">
        {complianceItems.map((category, index) => (
          <Card key={index} className="shadow-medium">
            <CardHeader>
              <CardTitle>{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={itemIndex} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center
                        ${item.status === 'completed' ? 'bg-success/10' : 
                          item.status === 'overdue' ? 'bg-danger/10' : 'bg-warning/10'}`}>
                        <IconComponent className={`w-5 h-5 
                          ${item.status === 'completed' ? 'text-success' : 
                            item.status === 'overdue' ? 'text-danger' : 'text-warning'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Last: {item.lastAction} • Next: {item.nextDue}
                        </div>
                        {item.count && (
                          <div className="text-sm text-success">{item.count}</div>
                        )}
                        {item.details && (
                          <div className="text-sm text-accent">{item.details}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(item.status) as any}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Certification Readiness */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Disease-Free Compartment Certification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {certificationRequirements.map((req, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{req.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {req.progress}% / {req.target}%
                    </span>
                    {req.progress >= req.target ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Clock className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
                <Progress 
                  value={req.progress} 
                  className={req.progress >= req.target ? "text-success" : "text-warning"}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Recent Compliance Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "2 hours ago", action: "Gate sanitization completed", user: "Farm Worker A", type: "success" },
              { time: "4 hours ago", action: "Footbath refilled with fresh disinfectant", user: "Supervisor B", type: "success" },
              { time: "6 hours ago", action: "Equipment disinfection missed", user: "System Alert", type: "warning" },
              { time: "Yesterday", action: "Vaccination record updated", user: "Veterinarian C", type: "success" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-success' : 'bg-warning'
                }`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{activity.action}</div>
                  <div className="text-xs text-muted-foreground">{activity.user} • {activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Compliance;