'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Coins, 
  ArrowLeftRight, 
  TrendingUp, 
  Droplets,
  RotateCcw 
} from 'lucide-react';

const DEMO_STEPS = [
  {
    id: 'connect',
    title: 'Connect Wallet',
    description: 'Connect your Solana wallet to start the demo',
    icon: Circle,
    path: null,
  },
  {
    id: 'create-token',
    title: 'Create Token2022',
    description: 'Create a Token2022 with whitelist Transfer Hook',
    icon: Coins,
    path: '/create-token',
  },
  {
    id: 'wrap-tokens',
    title: 'Wrap Tokens',
    description: 'Lock Token2022 tokens to get tradeable bridge tokens',
    icon: ArrowLeftRight,
    path: '/bridge',
  },
  {
    id: 'create-pool',
    title: 'Create Pool',
    description: 'Create a SOL/Bridge Token liquidity pool on Orca',
    icon: Droplets,
    path: '/pools',
  },
  {
    id: 'trade',
    title: 'Trade Tokens',
    description: 'Swap tokens using Jupiter aggregation',
    icon: TrendingUp,
    path: '/trade',
  },
  {
    id: 'unwrap',
    title: 'Unwrap Tokens',
    description: 'Convert bridge tokens back to original Token2022',
    icon: ArrowLeftRight,
    path: '/bridge',
  },
];

interface GuidedDemoProps {
  currentStep?: string;
  onStepComplete?: (stepId: string) => void;
}

export function GuidedDemo({ currentStep = 'connect', onStepComplete }: GuidedDemoProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(currentStep);

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
      onStepComplete?.(stepId);
    }
    
    // Move to next step
    const currentIndex = DEMO_STEPS.findIndex(step => step.id === stepId);
    const nextStep = DEMO_STEPS[currentIndex + 1];
    if (nextStep) {
      setActiveStep(nextStep.id);
    }
  };

  const resetDemo = () => {
    setCompletedSteps([]);
    setActiveStep('connect');
  };

  const progress = (completedSteps.length / DEMO_STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Guided Demo Flow
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completedSteps.length}/{DEMO_STEPS.length} completed</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
      </Card>

      {/* Demo Steps */}
      <div className="grid gap-4">
        {DEMO_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = activeStep === step.id;
          const isAccessible = index === 0 || completedSteps.includes(DEMO_STEPS[index - 1].id);
          
          const Icon = isCompleted ? CheckCircle : step.icon;
          
          return (
            <Card 
              key={step.id}
              className={`transition-all ${
                isActive ? 'ring-2 ring-primary border-primary' : ''
              } ${!isAccessible ? 'opacity-50' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{step.title}</h3>
                      {isCompleted && (
                        <Badge variant="secondary" className="text-green-600">
                          Complete
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="default">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {step.path && isAccessible && (
                      <Button
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        asChild
                      >
                        <a href={step.path}>
                          Go to Step <ArrowRight className="h-4 w-4 ml-1" />
                        </a>
                      </Button>
                    )}
                    
                    {isActive && !isCompleted && step.id === 'connect' && (
                      <Button
                        size="sm"
                        onClick={() => markStepComplete('connect')}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Demo Controls */}
      <Card>
        <CardFooter className="pt-6">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={resetDemo}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Demo
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {completedSteps.length === DEMO_STEPS.length ? (
                <span className="text-green-600 font-medium">
                  🎉 Demo Complete! You've successfully bridged Token2022 to AMMs!
                </span>
              ) : (
                <span>
                  Follow the steps above to complete the full demo flow
                </span>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}