import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Bird, Beef, Heart, Users } from "lucide-react";

interface AddAnimalDialogProps {
  onAnimalAdded: (animal: any) => void;
}

export const AddAnimalDialog = ({ onAnimalAdded }: AddAnimalDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [animalData, setAnimalData] = useState({
    name: "",
    breed: "",
    age: "",
    weight: "",
    healthStatus: "healthy"
  });

  const animalTypes = [
    { id: "chicken", name: "Chicken", icon: Bird, color: "text-orange-500", bgColor: "bg-orange-50" },
    { id: "pig", name: "Pig", icon: Heart, color: "text-pink-500", bgColor: "bg-pink-50" },
    { id: "cow", name: "Cow", icon: Beef, color: "text-brown-500", bgColor: "bg-amber-50" },
    { id: "sheep", name: "Sheep", icon: Users, color: "text-gray-500", bgColor: "bg-gray-50" }
  ];

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleSubmit = () => {
    if (!selectedType || !animalData.name) return;
    
    const newAnimal = {
      id: Date.now(),
      type: selectedType,
      ...animalData,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    onAnimalAdded(newAnimal);
    setIsOpen(false);
    setSelectedType("");
    setAnimalData({ name: "", breed: "", age: "", weight: "", healthStatus: "healthy" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Animal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Animal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!selectedType ? (
            <div>
              <Label className="text-base font-medium mb-4 block">Select Animal Type</Label>
              <div className="grid grid-cols-2 gap-4">
                {animalTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <Card 
                      key={type.id}
                      className="cursor-pointer hover:shadow-medium transition-shadow"
                      onClick={() => handleTypeSelect(type.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className={`w-16 h-16 ${type.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                            <IconComponent className={`w-8 h-8 ${type.color}`} />
                          </div>
                          <h3 className="font-medium text-foreground">{type.name}</h3>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                {(() => {
                  const selectedAnimal = animalTypes.find(t => t.id === selectedType);
                  const IconComponent = selectedAnimal?.icon || Bird;
                  return (
                    <>
                      <div className={`w-10 h-10 ${selectedAnimal?.bgColor} rounded-full flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${selectedAnimal?.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">Adding {selectedAnimal?.name}</h3>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedType("")}>
                          Change Type
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Animal Name/ID</Label>
                  <Input
                    id="name"
                    value={animalData.name}
                    onChange={(e) => setAnimalData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., CH001, Whitey"
                  />
                </div>
                
                <div>
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={animalData.breed}
                    onChange={(e) => setAnimalData(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="e.g., Rhode Island Red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={animalData.age}
                    onChange={(e) => setAnimalData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="e.g., 6 months"
                  />
                </div>
                
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={animalData.weight}
                    onChange={(e) => setAnimalData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="e.g., 2.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="health">Initial Health Status</Label>
                <Select value={animalData.healthStatus} onValueChange={(value) => setAnimalData(prev => ({ ...prev, healthStatus: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="monitoring">Under Monitoring</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="recovering">Recovering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="flex-1">
                  Add {animalTypes.find(t => t.id === selectedType)?.name}
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};