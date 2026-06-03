import { useContext } from 'react';
import { TutorialContext } from './TutorialProvider';

export function useTutorial() {
    const ctx = useContext(TutorialContext);
    if (!ctx) throw new Error('useTutorial must be used inside TutorialProvider');
    return ctx;
}
