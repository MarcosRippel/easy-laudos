'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TutorialStep } from './tutorialSteps';
import styles from './tutorial.module.css';

interface TutorialOverlayProps {
    steps: TutorialStep[];
    currentStep: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
}

interface TargetRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

const PADDING = 10;

export default function TutorialOverlay({
    steps,
    currentStep,
    onNext,
    onPrev,
    onClose,
}: TutorialOverlayProps) {
    const step = steps[currentStep];
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const isLast = currentStep === steps.length - 1;

    const findAndScrollToTarget = useCallback(() => {
        const el = document.querySelector<HTMLElement>(`[data-tutorial="${step.target}"]`);
        if (!el) {
            // No target found: center the tooltip
            setTargetRect(null);
            setTooltipPos({
                top: window.innerHeight / 2 - 100,
                left: window.innerWidth / 2 - 180,
            });
            return;
        }

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Wait for scroll to finish before measuring
        setTimeout(() => {
            const rect = el.getBoundingClientRect();
            setTargetRect({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            });
        }, 350);
    }, [step.target]);

    // Recalculate on step change and on resize/scroll
    useEffect(() => {
        findAndScrollToTarget();
        window.addEventListener('resize', findAndScrollToTarget);
        return () => window.removeEventListener('resize', findAndScrollToTarget);
    }, [findAndScrollToTarget]);

    // Position tooltip relative to the target rect
    useEffect(() => {
        if (!targetRect || !tooltipRef.current) return;

        const tt = tooltipRef.current;
        const ttW = tt.offsetWidth || 320;
        const ttH = tt.offsetHeight || 180;
        const vW = window.innerWidth;
        const vH = window.innerHeight;
        const position = step.position ?? 'bottom';

        let top = 0;
        let left = 0;

        if (position === 'bottom') {
            top = targetRect.top + targetRect.height + PADDING + 12;
            left = targetRect.left + targetRect.width / 2 - ttW / 2;
        } else if (position === 'top') {
            top = targetRect.top - ttH - PADDING - 12;
            left = targetRect.left + targetRect.width / 2 - ttW / 2;
        } else if (position === 'right') {
            top = targetRect.top + targetRect.height / 2 - ttH / 2;
            left = targetRect.left + targetRect.width + PADDING + 12;
        } else {
            top = targetRect.top + targetRect.height / 2 - ttH / 2;
            left = targetRect.left - ttW - PADDING - 12;
        }

        // Clamp to viewport
        left = Math.max(12, Math.min(left, vW - ttW - 12));
        top = Math.max(12, Math.min(top, vH - ttH - 12));

        setTooltipPos({ top, left });
    }, [targetRect, step.position]);

    // ESC key closes
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && !isLast) onNext();
            if (e.key === 'ArrowLeft' && currentStep > 0) onPrev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, onNext, onPrev, isLast, currentStep]);

    const spotlightPath = targetRect
        ? buildSpotlightPath(targetRect, PADDING)
        : null;

    return (
        <div className={styles.overlay}>
            {/* SVG Dimmed Backdrop with Spotlight Cutout */}
            <svg
                className={styles.backdrop}
                onClick={onClose}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <mask id="tutorial-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={targetRect.left - PADDING}
                                y={targetRect.top - PADDING}
                                width={targetRect.width + PADDING * 2}
                                height={targetRect.height + PADDING * 2}
                                rx="10"
                                ry="10"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.72)"
                    mask="url(#tutorial-mask)"
                />
                {/* Spotlight glowing border */}
                {targetRect && (
                    <rect
                        x={targetRect.left - PADDING}
                        y={targetRect.top - PADDING}
                        width={targetRect.width + PADDING * 2}
                        height={targetRect.height + PADDING * 2}
                        rx="10"
                        ry="10"
                        fill="none"
                        stroke="rgba(139,92,246,0.7)"
                        strokeWidth="2"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.8))' }}
                    />
                )}
            </svg>

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className={styles.tooltip}
                style={{ top: tooltipPos.top, left: tooltipPos.left }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.tooltipHeader}>
                    <div className={styles.tooltipTitle}>{step.title}</div>
                    <button
                        className={styles.tooltipClose}
                        onClick={onClose}
                        title="Fechar tutorial (ESC)"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className={styles.tooltipContent}>{step.content}</div>

                {/* Progress Dots */}
                <div className={styles.progressDots}>
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.dot} ${i === currentStep ? styles.active : i < currentStep ? styles.done : ''}`}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className={styles.tooltipFooter}>
                    <span className={styles.stepCounter}>
                        {currentStep + 1} / {steps.length}
                    </span>
                    <div className={styles.tooltipActions}>
                        <button
                            className={styles.btnPrev}
                            onClick={onPrev}
                            disabled={currentStep === 0}
                        >
                            ← Anterior
                        </button>
                        <button
                            className={`${styles.btnNext} ${isLast ? styles.btnFinish : ''}`}
                            onClick={isLast ? onClose : onNext}
                        >
                            {isLast ? '✓ Concluir' : 'Próximo →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Not used but kept for potential future use
function buildSpotlightPath(_rect: TargetRect, _padding: number): string {
    return '';
}
