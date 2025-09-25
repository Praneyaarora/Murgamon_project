import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle, Leaf, Award, ArrowRight } from "lucide-react";

const TrainingQuiz = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      id: 1,
      question: "What is the optimal temperature range for chicken coops?",
      options: [
        "10-15°C",
        "18-24°C",
        "25-30°C",
        "30-35°C"
      ],
      correct: "18-24°C",
      explanation: "Chickens perform best in temperatures between 18-24°C for optimal health and egg production."
    },
    {
      id: 2,
      question: "How often should you refill footbaths for biosecurity?",
      options: [
        "Once a week",
        "Every 2-3 days",
        "Daily",
        "Only when dirty"
      ],
      correct: "Daily",
      explanation: "Daily refilling ensures maximum effectiveness in preventing disease transmission."
    },
    {
      id: 3,
      question: "What are the early signs of avian flu in poultry?",
      options: [
        "Increased appetite",
        "Decreased activity and respiratory issues",
        "Faster growth",
        "Brighter feathers"
      ],
      correct: "Decreased activity and respiratory issues",
      explanation: "Early detection through monitoring activity levels and respiratory symptoms is crucial for disease prevention."
    },
    {
      id: 4,
      question: "What CO₂ level indicates poor ventilation in livestock areas?",
      options: [
        "Below 1000 ppm",
        "1000-2000 ppm",
        "Above 3000 ppm",
        "Above 5000 ppm"
      ],
      correct: "Above 3000 ppm",
      explanation: "CO₂ levels above 3000 ppm indicate inadequate ventilation and can stress animals."
    },
    {
      id: 5,
      question: "How often should pigs be vaccinated against common diseases?",
      options: [
        "Once in lifetime",
        "Every 6 months",
        "According to veterinary schedule",
        "Only when sick"
      ],
      correct: "According to veterinary schedule",
      explanation: "Following a proper veterinary vaccination schedule ensures optimal protection against diseases."
    }
  ];

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    
    if (currentQuestion === questions.length - 1) {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach((q, index) => {
        if (newAnswers[index] === q.correct) {
          correctAnswers++;
        }
      });
      setScore(correctAnswers);
      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
    }
  };

  const handleStartDashboard = () => {
    navigate("/dashboard");
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResults) {
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= 60;

    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-hero opacity-20"></div>
        <div className="absolute inset-0 backdrop-blur-sm bg-background/80"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <Card className="w-full max-w-2xl shadow-strong">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${passed ? 'bg-gradient-primary' : 'bg-gradient-subtle'}`}>
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">Training Complete!</h1>
              </div>
              <CardTitle className="text-2xl">
                {passed ? "Congratulations! 🎉" : "Good Effort! 📚"}
              </CardTitle>
              <CardDescription className="text-lg">
                You scored {score} out of {questions.length} questions
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{percentage.toFixed(0)}%</div>
                <Progress value={percentage} className="w-full h-3" />
              </div>

              <div className="grid gap-4">
                <div className={`p-4 rounded-lg border-2 ${passed ? 'border-success bg-success/10' : 'border-warning bg-warning/10'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {passed ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Circle className="w-5 h-5 text-warning" />
                    )}
                    <span className="font-semibold">
                      {passed ? "Training Passed" : "More Study Needed"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {passed 
                      ? "You've demonstrated good understanding of livestock health and biosecurity practices."
                      : "Review the training materials and try again. A 60% score is required to proceed."
                    }
                  </p>
                </div>

                {passed && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <Badge variant="secondary" className="p-3">
                      <Leaf className="w-4 h-4 mr-1" />
                      Biosecurity Expert
                    </Badge>
                    <Badge variant="secondary" className="p-3">
                      Health Monitor
                    </Badge>
                    <Badge variant="secondary" className="p-3">
                      Disease Prevention
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {!passed && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCurrentQuestion(0);
                      setAnswers([]);
                      setSelectedAnswer("");
                      setShowResults(false);
                    }}
                    className="flex-1"
                  >
                    Retake Training
                  </Button>
                )}
                <Button 
                  onClick={handleStartDashboard}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                  disabled={!passed}
                >
                  {passed ? "Access Dashboard" : "Complete Training First"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero opacity-20"></div>
      <div className="absolute inset-0 backdrop-blur-sm bg-background/80"></div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-2xl shadow-strong">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Livestock Health Training</CardTitle>
                  <CardDescription>
                    Question {currentQuestion + 1} of {questions.length}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                {questions[currentQuestion].question}
              </h2>
              
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                {questions[currentQuestion].options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Progress: {currentQuestion + 1}/{questions.length}
              </div>
              <Button 
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="bg-gradient-primary hover:opacity-90"
              >
                {currentQuestion === questions.length - 1 ? "Complete Training" : "Next Question"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainingQuiz;