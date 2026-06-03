'use client';

import { usePathname } from 'next/navigation';
import { useTutorial } from './useTutorial';
import { routeToSteps } from './tutorialSteps';
import styles from './tutorial.module.css';

export default function TutorialButton() {
    const { startTutorial, active } = useTutorial();
    const pathname = usePathname();

    // Find matching steps for the current route
    // Supports exact match or prefix match (e.g. /clients/create)
    const steps =
        routeToSteps[pathname] ??
        Object.entries(routeToSteps).find(([route]) =>
            pathname.startsWith(route) && route !== '/'
        )?.[1];

    const handleClick = () => {
        if (!steps || steps.length === 0) {
            alert('Não há tutorial disponível para esta página ainda.');
            return;
        }
        startTutorial(steps);
    };

    if (active) return null; // Hide button while tutorial is active

    return (
        <button
            className={styles.tutorialButton}
            onClick={handleClick}
            title="Iniciar tutorial interativo desta página"
            aria-label="Tutorial"
        >
            <span>❓</span>
            Tutorial
        </button>
    );
}
