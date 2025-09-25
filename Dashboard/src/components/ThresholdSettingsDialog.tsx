import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Thermometer, Droplets, Wind, Activity, Bell, Save } from "lucide-react";

export const ThresholdSettingsDialog = () => {
  const [thresholds, setThresholds] = useState({
    temperature: { min: 18, max: 26, alertEnabled: true },
    humidity: { min: 60, max: 75, alertEnabled: true },
    co2: { max: 400, alertEnabled: true },
    nh3: { max: 10, alertEnabled: true },
    airflow: { min: 2, max: 3, alertEnabled: true },
    lighting: { min: 800, max: 1000, alertEnabled: false }
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    dashboard: true,
    sound: true
  });

  const parameterConfigs = [
    {
      key: "temperature",
      name: "Temperature",
      icon: Thermometer,
      unit: "°C",
      color: "text-blue-500",
      hasRange: true,
      description: "Optimal temperature range for animal comfort"
    },
    {
      key: "humidity",
      name: "Humidity",
      icon: Droplets,
      unit: "%",
      color: "text-cyan-500",
      hasRange: true,
      description: "Relative humidity for disease prevention"
    },
    {
      key: "co2",
      name: "CO₂ Level",
      icon: Wind,
      unit: "ppm",
      color: "text-orange-500",
      hasRange: false,
      description: "Maximum carbon dioxide concentration"
    },
    {
      key: "nh3",
      name: "NH₃ Level",
      icon: Activity,
      unit: "ppm",
      color: "text-red-500",
      hasRange: false,
      description: "Maximum ammonia concentration"
    },
    {
      key: "airflow",
      name: "Air Flow",
      icon: Wind,
      unit: "m/s",
      color: "text-green-500",
      hasRange: true,
      description: "Ventilation air flow rate"
    },
    {
      key: "lighting",
      name: "Lighting",
      icon: Bell,
      unit: "lux",
      color: "text-yellow-500",
      hasRange: true,
      description: "Illumination levels for productivity"
    }
  ];

  const updateThreshold = (key: string, field: string, value: any) => {
    setThresholds(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const updateNotification = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Here you would save the threshold settings
    console.log("Saving thresholds:", thresholds);
    console.log("Saving notifications:", notifications);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Thresholds
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Environmental Threshold Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Parameter Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle>Parameter Thresholds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {parameterConfigs.map((config) => {
                  const IconComponent = config.icon;
                  const threshold = thresholds[config.key];
                  
                  return (
                    <div key={config.key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <IconComponent className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div>
                            <div className="font-medium">{config.name}</div>
                            <div className="text-sm text-muted-foreground">{config.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={threshold.alertEnabled}
                            onCheckedChange={(checked) => updateThreshold(config.key, 'alertEnabled', checked)}
                          />
                          <Label className="text-sm">Alerts</Label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 ml-11">
                        {config.hasRange ? (
                          <>
                            <div>
                              <Label className="text-sm">Minimum {config.unit}</Label>
                              <Input
                                type="number"
                                value={threshold.min || ""}
                                onChange={(e) => updateThreshold(config.key, 'min', parseFloat(e.target.value))}
                                disabled={!threshold.alertEnabled}
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Maximum {config.unit}</Label>
                              <Input
                                type="number"
                                value={threshold.max || ""}
                                onChange={(e) => updateThreshold(config.key, 'max', parseFloat(e.target.value))}
                                disabled={!threshold.alertEnabled}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2">
                            <Label className="text-sm">Maximum Threshold {config.unit}</Label>
                            <Input
                              type="number"
                              value={threshold.max || ""}
                              onChange={(e) => updateThreshold(config.key, 'max', parseFloat(e.target.value))}
                              disabled={!threshold.alertEnabled}
                            />
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Alert Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alert Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">Receive alerts via email</div>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => updateNotification('email', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">SMS Alerts</div>
                      <div className="text-sm text-muted-foreground">Immediate SMS for critical alerts</div>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => updateNotification('sms', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Dashboard Notifications</div>
                      <div className="text-sm text-muted-foreground">Show alerts on dashboard</div>
                    </div>
                    <Switch
                      checked={notifications.dashboard}
                      onCheckedChange={(checked) => updateNotification('dashboard', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sound Alerts</div>
                      <div className="text-sm text-muted-foreground">Audio notifications</div>
                    </div>
                    <Switch
                      checked={notifications.sound}
                      onCheckedChange={(checked) => updateNotification('sound', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline">
              Reset to Defaults
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};