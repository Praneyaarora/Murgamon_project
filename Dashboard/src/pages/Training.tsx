import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Play,
  BookOpen,
  Award,
  Users,
  Clock,
  CheckCircle,
  Star,
  Trophy,
  Volume2,
  Globe
} from "lucide-react";

const Training = () => {
  const trainingModules = [
    {
      id: 1,
      title: "Proper Footbath Usage",
      description: "Learn correct procedures for footbath maintenance and disinfection",
      duration: "15 mins",
      language: "Multiple",
      progress: 100,
      status: "completed",
      type: "video",
      quiz: { score: 85, passed: true }
    },
    {
      id: 2, 
      title: "Recognizing Bird Flu Symptoms",
      description: "Identify early warning signs of avian influenza in poultry",
      duration: "20 mins", 
      language: "English, Hindi",
      progress: 60,
      status: "in-progress",
      type: "interactive",
      quiz: null
    },
    {
      id: 3,
      title: "Biosecurity Fundamentals", 
      description: "Essential biosecurity practices for disease prevention",
      duration: "25 mins",
      language: "Multiple",
      progress: 0,
      status: "not-started", 
      type: "video",
      quiz: null
    },
    {
      id: 4,
      title: "Equipment Sanitization Protocol",
      description: "Step-by-step guide to proper equipment disinfection",
      duration: "18 mins",
      language: "English, Bengali",
      progress: 0,
      status: "not-started",
      type: "infographic", 
      quiz: null
    }
  ];

  const badges = [
    { name: "Biosecurity Champion", earned: true, date: "2 weeks ago" },
    { name: "Training Completionist", earned: true, date: "1 month ago" }, 
    { name: "Disease Prevention Expert", earned: false, requirement: "Complete 5 modules" },
    { name: "Compliance Master", earned: false, requirement: "Pass all quizzes with 80%" }
  ];

  const teamProgress = [
    { name: "Farm Worker A", completed: 3, total: 4, score: 92 },
    { name: "Farm Worker B", completed: 2, total: 4, score: 78 },
    { name: "Supervisor C", completed: 4, total: 4, score: 95 },
    { name: "New Trainee D", completed: 1, total: 4, score: 65 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in-progress":
        return "warning"; 
      case "not-started":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />;
      case "interactive":
        return <BookOpen className="w-4 h-4" />;
      case "infographic":
        return <Globe className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Training & Capacity Building</h2>
        <Button className="bg-gradient-primary">
          <Users className="w-4 h-4 mr-2" />
          Manage Team
        </Button>
      </div>

      {/* Training Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">4</div>
                <div className="text-sm text-muted-foreground">Available Modules</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">1</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">40%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">2</div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Modules */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Training Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainingModules.map((module) => (
              <div key={module.id} className="border rounded-lg p-4 hover:shadow-soft transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(module.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">{module.title}</h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                      <Badge variant={getStatusColor(module.status) as any}>
                        {module.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {module.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        {module.language}
                      </div>
                    </div>

                    {module.progress > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} />
                      </div>
                    )}

                    {module.quiz && (
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-warning" />
                        <span className="text-sm">
                          Quiz Score: <span className={`font-medium ${module.quiz.passed ? 'text-success' : 'text-danger'}`}>
                            {module.quiz.score}%
                          </span>
                        </span>
                      </div>
                    )}

                    <Button 
                      variant={module.status === 'completed' ? 'outline' : 'default'}
                      size="sm"
                    >
                      {module.status === 'completed' ? 'Review' : 
                       module.status === 'in-progress' ? 'Continue' : 'Start Training'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-warning" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map((badge, index) => (
              <div key={index} className={`p-4 border rounded-lg text-center ${
                badge.earned ? 'bg-success/5 border-success/20' : 'bg-muted/20 border-muted'
              }`}>
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  badge.earned ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-foreground mb-1">{badge.name}</h3>
                {badge.earned ? (
                  <p className="text-xs text-success">Earned {badge.date}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{badge.requirement}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Progress Tracking */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Team Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamProgress.map((member, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-medium">
                  {member.name.split(' ')[0][0]}{member.name.split(' ')[1][0]}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-foreground">{member.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Average Score: {member.score}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Progress value={(member.completed / member.total) * 100} className="flex-1" />
                    <span className="text-sm text-muted-foreground">
                      {member.completed}/{member.total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Training;