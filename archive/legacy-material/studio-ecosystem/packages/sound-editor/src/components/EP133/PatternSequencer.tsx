/**
 * Pattern Sequencer Component
 * Step-by-step pattern editing grid (16 pads x 16 steps)
 */

import React from 'react';
import { useEP133Store } from '../../store/ep133Store';
import './PatternSequencer.css';

export const PatternSequencer: React.FC = () => {
  const {
    currentPattern,
    currentStep,
    stepCount,
    toggleStep,
    setStepVelocity,
    getStepData,
    drums
  } = useEP133Store();

  if (!currentPattern) {
    return <div className="sequencer-empty">No pattern loaded</div>;
  }

  const handleStepClick = (padIndex: number, stepIndex: number) => {
    toggleStep(padIndex, stepIndex);
  };

  const handleStepVelocityChange = (
    padIndex: number,
    stepIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStepVelocity(padIndex, stepIndex, parseInt(e.target.value));
  };

  return (
    <div className="pattern-sequencer">
      <div className="sequencer-header">
        <h3>🎹 Pattern Sequencer</h3>
        <div className="sequencer-info">
          <span>
            Step: <strong>{currentStep + 1}</strong> / {stepCount}
          </span>
          <span>
            BPM: <strong>{currentPattern.bpm}</strong>
          </span>
        </div>
      </div>

      <div className="sequencer-grid">
        {/* Step numbers */}
        <div className="grid-row header">
          <div className="grid-cell pad-label">Pad</div>
          {Array.from({ length: stepCount }).map((_, step) => (
            <div
              key={`header-${step}`}
              className={`grid-cell step-number ${currentStep === step ? 'current' : ''}`}
            >
              {step + 1}
            </div>
          ))}
        </div>

        {/* Pad rows */}
        {Array.from({ length: 16 }).map((_, padIndex) => (
          <div key={`row-${padIndex}`} className="grid-row">
            <div className="grid-cell pad-label">
              <span className="pad-num">{padIndex + 1}</span>
              <span className="pad-name">{drums[padIndex]?.name}</span>
            </div>

            {Array.from({ length: stepCount }).map((_, stepIndex) => {
              const stepData = getStepData(padIndex, stepIndex);
              const isActive = stepData?.enabled || false;
              const velocity = stepData?.velocity || 0;

              return (
                <div
                  key={`cell-${padIndex}-${stepIndex}`}
                  className={`grid-cell step ${isActive ? 'active' : ''} ${
                    currentStep === stepIndex ? 'current-step' : ''
                  }`}
                  onClick={() => handleStepClick(padIndex, stepIndex)}
                  title={isActive ? `Velocity: ${velocity}` : 'Click to enable'}
                >
                  {isActive ? (
                    <div className="step-indicator" style={{ opacity: velocity / 127 }}>
                      ●
                    </div>
                  ) : (
                    <div className="step-empty">○</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sequencer-footer">
        <p className="tip">💡 Click steps to toggle, patterns update in real-time</p>
      </div>
    </div>
  );
};
