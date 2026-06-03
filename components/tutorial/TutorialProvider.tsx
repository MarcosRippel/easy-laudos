'use client';

import React, { createContext, ReactNode, useCallback, useState } from 'react';
import type { TutorialStep } from './tutorialSteps';
import TutorialOverlay from './TutorialOverlay';

interface TutorialContextType {
    active: boolean;
    currentStep: number;
    steps: TutorialStep[];
    startTutorial: (steps: TutorialStep[]) => void;
    closeTutorial: () => void;
    nextStep: () => void;
    prevStep: () => void;
}

export const TutorialContext = createContext<TutorialContextType | null>(null);

export default function TutorialProvider({ children }: { children: ReactNode }) {
    const [active, setActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState<TutorialStep[]>([]);

    const startTutorial = useCallback((newSteps: TutorialStep[]) => {
        setSteps(newSteps);
        setCurrentStep(0);
        setActive(true);
    }, []);

    const closeTutorial = useCallback(() => {
        setActive(false);
        setCurrentStep(0);
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep((s) => {
            if (s >= steps.length - 1) return s;
            return s + 1;
        });
    }, [steps.length]);

    const prevStep = useCallback(() => {
        setCurrentStep((s) => Math.max(0, s - 1));
    }, []);

    return (
        <TutorialContext.Provider
            value={{ active, currentStep, steps, startTutorial, closeTutorial, nextStep, prevStep }}
        >
            {children}
            {active && steps.length > 0 && (
                <TutorialOverlay
                    steps={steps}
                    currentStep={currentStep}
                    onNext={nextStep}
                    onPrev={prevStep}
                    onClose={closeTutorial}
                />
            )}
        </TutorialContext.Provider>
    );
}
