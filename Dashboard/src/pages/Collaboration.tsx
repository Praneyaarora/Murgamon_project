// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { 
//   Video,
//   MessageSquare,
//   Users,
//   Phone,
//   Send,
//   Search,
//   Bot,
//   HelpCircle,
//   Star,
//   FileText,
//   Clock,
//   CheckCircle
// } from "lucide-react";

// const Collaboration = () => {
//   const activeVets = [
//     { name: "Dr. Sarah Kumar", specialty: "Poultry Disease", rating: 4.9, available: true, location: "Regional Center" },
//     { name: "Dr. James Chen", specialty: "Swine Health", rating: 4.7, available: true, location: "Mobile Vet" },
//     { name: "Dr. Maria Santos", specialty: "Biosecurity", rating: 4.8, available: false, location: "University" }
//   ];

//   const recentQuestions = [
//     {
//       id: 1,
//       farmer: "Rajesh P.",
//       question: "My hens stopped laying eggs suddenly. Temperature is normal. What could be the cause?",
//       category: "Poultry Health",
//       time: "2 hours ago",
//       replies: 3,
//       status: "answered"
//     },
//     {
//       id: 2,
//       farmer: "Lin Zhou", 
//       question: "Best practices for footbath disinfection during monsoon season?",
//       category: "Biosecurity",
//       time: "5 hours ago", 
//       replies: 7,
//       status: "active"
//     },
//     {
//       id: 3,
//       farmer: "Ahmed Ali",
//       question: "Pig showing respiratory symptoms. Should I isolate immediately?",
//       category: "Swine Health", 
//       time: "1 day ago",
//       replies: 12,
//       status: "solved"
//     }
//   ];

//   const consultationHistory = [
//     {
//       date: "Yesterday",
//       vet: "Dr. Sarah Kumar",
//       topic: "Chicken respiratory issues consultation",
//       duration: "25 mins",
//       status: "completed",
//       recording: true
//     },
//     {
//       date: "3 days ago", 
//       vet: "Dr. James Chen",
//       topic: "Pig vaccination schedule review",
//       duration: "18 mins", 
//       status: "completed",
//       recording: true
//     }
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "solved":
//       case "completed":
//         return "success";
//       case "active": 
//         return "warning";
//       case "answered":
//         return "accent";
//       default:
//         return "secondary";
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-3xl font-bold text-foreground">Collaboration & Support</h2>
//         <Button className="bg-gradient-primary">
//           <Video className="w-4 h-4 mr-2" />
//           Start Consultation
//         </Button>
//       </div>

//       {/* Quick Actions */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
//           <CardContent className="pt-6">
//             <div className="text-center">
//               <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <Video className="w-6 h-6 text-primary" />
//               </div>
//               <h3 className="font-medium text-foreground">Video Call Vet</h3>
//               <p className="text-sm text-muted-foreground">Connect instantly</p>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
//           <CardContent className="pt-6">
//             <div className="text-center">
//               <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <MessageSquare className="w-6 h-6 text-accent" />
//               </div>
//               <h3 className="font-medium text-foreground">Ask Community</h3>
//               <p className="text-sm text-muted-foreground">Post question</p>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
//           <CardContent className="pt-6">
//             <div className="text-center">
//               <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <Bot className="w-6 h-6 text-warning" />
//               </div>
//               <h3 className="font-medium text-foreground">AI Assistant</h3>
//               <p className="text-sm text-muted-foreground">Quick answers</p>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
//           <CardContent className="pt-6">
//             <div className="text-center">
//               <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <Phone className="w-6 h-6 text-success" />
//               </div>
//               <h3 className="font-medium text-foreground">Emergency Line</h3>
//               <p className="text-sm text-muted-foreground">24/7 support</p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Available Veterinarians */}
//         <Card className="shadow-medium">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Users className="w-5 h-5 text-primary" />
//               Available Veterinarians
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {activeVets.map((vet, index) => (
//                 <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
//                   <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-medium">
//                     {vet.name.split(' ')[1][0]}
//                   </div>
                  
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 mb-1">
//                       <span className="font-medium text-foreground">{vet.name}</span>
//                       <div className={`w-2 h-2 rounded-full ${vet.available ? 'bg-success' : 'bg-muted'}`}></div>
//                     </div>
//                     <div className="text-sm text-muted-foreground">{vet.specialty} • {vet.location}</div>
//                     <div className="flex items-center gap-1 mt-1">
//                       <Star className="w-3 h-3 text-warning fill-current" />
//                       <span className="text-xs text-muted-foreground">{vet.rating}</span>
//                     </div>
//                   </div>
                  
//                   <div className="flex gap-2">
//                     <Button variant="outline" size="sm" disabled={!vet.available}>
//                       <Video className="w-3 h-3" />
//                     </Button>
//                     <Button variant="outline" size="sm">
//                       <MessageSquare className="w-3 h-3" />
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         {/* AI Chatbot */}
//         <Card className="shadow-medium">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Bot className="w-5 h-5 text-warning" />
//               AI Assistant
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <div className="bg-muted/50 rounded-lg p-3">
//                 <p className="text-sm text-foreground">
//                   <Bot className="w-4 h-4 inline mr-1" />
//                   Hello! I'm here to help with quick farming questions. Ask me about symptoms, best practices, or emergency procedures.
//                 </p>
//               </div>
              
//               <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                 <HelpCircle className="w-4 h-4" />
//                 <span>Try asking: "Pig ko bukhar ho toh kya karein?"</span>
//               </div>
              
//               <div className="flex gap-2">
//                 <Input placeholder="Ask your question in any language..." className="flex-1" />
//                 <Button size="sm">
//                   <Send className="w-4 h-4" />
//                 </Button>
//               </div>
              
//               <div className="grid grid-cols-2 gap-2">
//                 <Button variant="outline" size="sm" className="text-xs">
//                   Poultry diseases
//                 </Button>
//                 <Button variant="outline" size="sm" className="text-xs">
//                   Vaccination schedule
//                 </Button>
//                 <Button variant="outline" size="sm" className="text-xs">
//                   Biosecurity tips
//                 </Button>
//                 <Button variant="outline" size="sm" className="text-xs">
//                   Emergency care
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Community Forum */}
//       <Card className="shadow-medium">
//         <CardHeader>
//           <div className="flex justify-between items-center">
//             <CardTitle className="flex items-center gap-2">
//               <MessageSquare className="w-5 h-5 text-accent" />
//               Farmer Community Forum
//             </CardTitle>
//             <div className="flex gap-2">
//               <Input placeholder="Search discussions..." className="w-64" />
//               <Button variant="outline">
//                 <Search className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {recentQuestions.map((question) => (
//               <div key={question.id} className="border rounded-lg p-4 hover:shadow-soft transition-shadow">
//                 <div className="flex items-start justify-between mb-2">
//                   <div className="flex items-center gap-2">
//                     <span className="font-medium text-foreground">{question.farmer}</span>
//                     <Badge variant="outline" className="text-xs">
//                       {question.category}
//                     </Badge>
//                   </div>
//                   <Badge variant={getStatusColor(question.status) as any}>
//                     {question.status}
//                   </Badge>
//                 </div>
                
//                 <p className="text-foreground mb-3">{question.question}</p>
                
//                 <div className="flex items-center justify-between text-sm text-muted-foreground">
//                   <div className="flex items-center gap-4">
//                     <span>{question.time}</span>
//                     <span>{question.replies} replies</span>
//                   </div>
//                   <Button variant="ghost" size="sm">
//                     View Discussion
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </div>
          
//           <div className="mt-6 p-4 bg-muted/30 rounded-lg">
//             <h4 className="font-medium text-foreground mb-3">Ask a New Question</h4>
//             <Textarea placeholder="Describe your issue or question in detail..." className="mb-3" />
//             <div className="flex justify-between items-center">
//               <div className="text-sm text-muted-foreground">
//                 Questions are moderated by veterinarians and extension workers
//               </div>
//               <Button>
//                 <Send className="w-4 h-4 mr-2" />
//                 Post Question
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Consultation History */}
//       <Card className="shadow-medium">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <FileText className="w-5 h-5 text-success" />
//             Recent Consultations
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             {consultationHistory.map((consultation, index) => (
//               <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
//                 <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
//                   <CheckCircle className="w-5 h-5 text-success" />
//                 </div>
                
//                 <div className="flex-1">
//                   <div className="font-medium text-foreground">{consultation.topic}</div>
//                   <div className="text-sm text-muted-foreground">
//                     with {consultation.vet} • {consultation.duration} • {consultation.date}
//                   </div>
//                 </div>
                
//                 <div className="flex gap-2">
//                   {consultation.recording && (
//                     <Button variant="outline" size="sm">
//                       <Video className="w-3 h-3 mr-1" />
//                       Recording
//                     </Button>
//                   )}
//                   <Button variant="outline" size="sm">
//                     <FileText className="w-3 h-3 mr-1" />
//                     Notes
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Collaboration;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Video,
  MessageSquare,
  Users,
  Phone,
  Send,
  Search,
  Bot,
  HelpCircle,
  Star,
  FileText,
  CheckCircle
} from "lucide-react";

const Collaboration = () => {
  const activeVets = [
    { name: "Dr. Sarah Kumar", specialty: "Poultry Disease", rating: 4.9, available: true, location: "Regional Center" },
    { name: "Dr. James Chen", specialty: "Swine Health", rating: 4.7, available: true, location: "Mobile Vet" },
    { name: "Dr. Maria Santos", specialty: "Biosecurity", rating: 4.8, available: false, location: "University" }
  ];

  const recentQuestions = [
    {
      id: 1,
      farmer: "Rajesh P.",
      question: "My hens stopped laying eggs suddenly. Temperature is normal. What could be the cause?",
      category: "Poultry Health",
      time: "2 hours ago",
      replies: 3,
      status: "answered"
    },
    {
      id: 2,
      farmer: "Lin Zhou", 
      question: "Best practices for footbath disinfection during monsoon season?",
      category: "Biosecurity",
      time: "5 hours ago", 
      replies: 7,
      status: "active"
    },
    {
      id: 3,
      farmer: "Ahmed Ali",
      question: "Pig showing respiratory symptoms. Should I isolate immediately?",
      category: "Swine Health", 
      time: "1 day ago",
      replies: 12,
      status: "solved"
    }
  ];

  const consultationHistory = [
    {
      date: "Yesterday",
      vet: "Dr. Sarah Kumar",
      topic: "Chicken respiratory issues consultation",
      duration: "25 mins",
      status: "completed",
      recording: true
    },
    {
      date: "3 days ago", 
      vet: "Dr. James Chen",
      topic: "Pig vaccination schedule review",
      duration: "18 mins", 
      status: "completed",
      recording: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "solved":
      case "completed":
        return "success";
      case "active": 
        return "warning";
      case "answered":
        return "accent";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Collaboration & Support</h2>
        <Button asChild className="bg-gradient-primary">
          <a 
            href="https://development.delhi.gov.in/development/24-x-7-emergency-services-veterinary-hospital-tis-hazari" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Video className="w-4 h-4 mr-2" />
            Start Consultation
          </a>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <a 
          href="https://www.vethelpline.in/video-call" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">Video Call Vet</h3>
                <p className="text-sm text-muted-foreground">Connect instantly</p>
              </div>
            </CardContent>
          </Card>
        </a>

        <a 
          href="https://www.vethelpline.in/community" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-medium text-foreground">Ask Community</h3>
                <p className="text-sm text-muted-foreground">Post question</p>
              </div>
            </CardContent>
          </Card>
        </a>

        <a 
          href="https://www.vethelpline.in/ai-assistant" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-medium text-foreground">AI Assistant</h3>
                <p className="text-sm text-muted-foreground">Quick answers</p>
              </div>
            </CardContent>
          </Card>
        </a>

        <a 
          href="https://secure.petaindia.com/page/27907/data/1?locale=en-GB" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-medium text-foreground">Emergency Line</h3>
                <p className="text-sm text-muted-foreground">24/7 support</p>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* Available Veterinarians */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Available Veterinarians
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeVets.map((vet, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-medium">
                    {vet.name.split(' ')[1][0]}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{vet.name}</span>
                      <div className={`w-2 h-2 rounded-full ${vet.available ? 'bg-success' : 'bg-muted'}`}></div>
                    </div>
                    <div className="text-sm text-muted-foreground">{vet.specialty} • {vet.location}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-warning fill-current" />
                      <span className="text-xs text-muted-foreground">{vet.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!vet.available}>
                      <Video className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Chatbot */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-warning" />
              AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-foreground">
                  <Bot className="w-4 h-4 inline mr-1" />
                  Hello! I'm here to help with quick farming questions. Ask me about symptoms, best practices, or emergency procedures.
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HelpCircle className="w-4 h-4" />
                <span>Try asking: "Pig ko bukhar ho toh kya karein?"</span>
              </div>
              
              <div className="flex gap-2">
                <Input placeholder="Ask your question in any language..." className="flex-1" />
                <Button size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  Poultry diseases
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Vaccination schedule
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Biosecurity tips
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Emergency care
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Forum */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Farmer Community Forum
            </CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Search discussions..." className="w-64" />
              <Button variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4 hover:shadow-soft transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{question.farmer}</span>
                    <Badge variant="outline" className="text-xs">
                      {question.category}
                    </Badge>
                  </div>
                  <Badge variant={getStatusColor(question.status) as any}>
                    {question.status}
                  </Badge>
                </div>
                
                <p className="text-foreground mb-3">{question.question}</p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>{question.time}</span>
                    <span>{question.replies} replies</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Discussion
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-3">Ask a New Question</h4>
            <Textarea placeholder="Describe your issue or question in detail..." className="mb-3" />
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Questions are moderated by veterinarians and extension workers
              </div>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Post Question
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultation History */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-success" />
            Recent Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {consultationHistory.map((consultation, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-foreground">{consultation.topic}</div>
                  <div className="text-sm text-muted-foreground">
                    with {consultation.vet} • {consultation.duration} • {consultation.date}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {consultation.recording && (
                    <Button variant="outline" size="sm">
                      <Video className="w-3 h-3 mr-1" />
                      Recording
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <FileText className="w-3 h-3 mr-1" />
                    Notes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Collaboration;
