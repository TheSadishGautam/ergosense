import React, { useState } from 'react';
import { COLORS } from '../utils/theme';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Welcome to ErgoSense",
      description: "Your personal AI-powered ergonomics assistant. Improve your posture, reduce eye strain, and boost productivity.",
      icon: "👋",
      color: COLORS.excellent
    },
    {
      title: "The Silent Health Crisis",
      description: "Did you know? Prolonged sitting and screen time are linked to back pain, eye fatigue, and long-term health issues. ErgoSense helps you break the cycle.",
      icon: "📉",
      color: COLORS.danger,
      fact: "Research shows that taking micro-breaks every 20 minutes can reduce eye strain by up to 60%."
    },
    {
      title: "Your Privacy Fortress",
      description: "We take privacy seriously. All AI processing happens locally on your device. No video or images ever leave your computer.",
      icon: "🛡️",
      color: COLORS.good,
      visual: (
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginTop: '20px'
        }}>
          <div className="flex items-center gap-3 justify-center">
            <span style={{ fontSize: '2rem' }}>💻</span>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span style={{ fontSize: '2rem' }}>🔒</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: COLORS.good }}>
            Local Processing Only
          </div>
        </div>
      )
    },
    {
      title: "How It Works",
      description: "1. Position your camera at eye level.\n2. Work normally.\n3. Get gentle notifications when your posture slips or you need a break.",
      icon: "⚙️",
      color: COLORS.warning
    },
    {
      title: "Ready to Start?",
      description: "Let's set up your healthy workspace. You can customize alerts in Settings anytime.",
      icon: "🚀",
      color: "#8b5cf6"
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentSlide = slides[step];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div className="card animate-fadeIn" style={{
        maxWidth: '600px',
        width: '90%',
        padding: '40px',
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Progress Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / slides.length) * 100}%`,
            background: currentSlide.color,
            transition: 'width 0.5s ease'
          }} />
        </div>

        <div key={step} className="animate-slideUp" style={{ animation: 'slideUp 0.5s ease forwards' }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '20px',
            filter: `drop-shadow(0 0 20px ${currentSlide.color}40)`
          }}>
            {currentSlide.icon}
          </div>

          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '16px',
            background: `linear-gradient(135deg, white 0%, ${currentSlide.color} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {currentSlide.title}
          </h2>

          <p style={{
            fontSize: '1.1rem',
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '30px',
            whiteSpace: 'pre-line'
          }}>
            {currentSlide.description}
          </p>

          {currentSlide.fact && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '20px',
              borderLeft: `4px solid ${currentSlide.color}`
            }}>
              💡 <strong>Fact:</strong> {currentSlide.fact}
            </div>
          )}

          {currentSlide.visual}
        </div>

        <div className="flex justify-between items-center" style={{ marginTop: '40px' }}>
          <button
            onClick={onComplete}
            className="btn btn-ghost"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            Skip
          </button>

          <div className="flex gap-2">
            {slides.map((_, i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: i === step ? 'white' : 'rgba(255, 255, 255, 0.2)',
                  transition: 'background 0.3s ease'
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="btn"
            style={{
              background: currentSlide.color,
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '1rem',
              boxShadow: `0 4px 14px 0 ${currentSlide.color}60`,
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {step === slides.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};
