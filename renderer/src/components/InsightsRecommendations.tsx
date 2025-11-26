import React from 'react';

interface InsightsRecommendationsProps {
  ergonomicScore: number;
  avgPosture: number;
  avgEyeStrain: number;
  avgBlinks: number;
  totalPresenceMinutes: number;
}

interface Recommendation {
  category: 'Posture' | 'Eyes' | 'Breaks' | 'Environment';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

export const InsightsRecommendations: React.FC<InsightsRecommendationsProps> = ({
  ergonomicScore,
  avgPosture,
  avgEyeStrain,
  avgBlinks,
  totalPresenceMinutes,
}) => {
  const recommendations: Recommendation[] = [];

  // Generate smart recommendations
  if (avgPosture < 0.6) {
    recommendations.push({
      category: 'Posture',
      severity: 'high',
      title: 'Improve Your Sitting Posture',
      description: 'Your posture score is below optimal. Sit with your back straight and shoulders relaxed.',
      impact: 'Reduces back pain and improves breathing',
    });
  } else if (avgPosture < 0.8) {
    recommendations.push({
      category: 'Posture',
      severity: 'medium',
      title: 'Minor Posture Adjustments Needed',
      description: 'You\'re doing well, but small improvements can make a big difference.',
      impact: 'Prevents long-term strain',
    });
  }

  if (avgEyeStrain > 0.5) {
    recommendations.push({
      category: 'Eyes',
      severity: 'high',
      title: 'Reduce Screen Eye Strain',
      description: 'Follow the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.',
      impact: 'Prevents digital eye fatigue',
    });
  }

  if (avgBlinks < 12) {
    recommendations.push({
      category: 'Eyes',
      severity: 'medium',
      title: 'Increase Blink Frequency',
      description: `Current rate: ${avgBlinks.toFixed(0)}/min. Try to blink more consciously while working.`,
      impact: 'Keeps eyes moisturized',
    });
  }

  if (totalPresenceMinutes > 90) {
    recommendations.push({
      category: 'Breaks',
      severity: 'high',
      title: 'Take a Movement Break',
      description: 'You\'ve been sitting for over 90 minutes. Stand up and walk around.',
      impact: 'Improves circulation and focus',
    });
  }

  recommendations.push({
    category: 'Environment',
    severity: 'low',
    title: 'Optimize Your Workspace',
    description: 'Ensure monitor is at eye level and 20-26 inches from your eyes.',
    impact: 'Better ergonomics overall',
  });

  const severityColors = {
    high: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', dot: '#ef4444' },
    medium: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', dot: '#f59e0b' },
    low: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', dot: '#3b82f6' },
  };

  const categoryIcons = {
    Posture: '🧍',
    Eyes: '👁️',
    Breaks: '⏰',
    Environment: '💻',
  };

  return (
    <div>
      {/* Overall Score Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(234, 88, 11, 0.2) 0%, rgba(251, 146, 60, 0.1) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        marginBottom: 'var(--space-5)',
        border: '2px solid rgba(234, 88, 11, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ergonomic Health Score
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ea580b' }}>
            {(ergonomicScore * 100).toFixed(0)}/100
          </div>
        </div>
        <div style={{ 
          padding: 'var(--space-3) var(--space-5)',
          background: 'rgba(234, 88, 11, 0.2)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}>
          {ergonomicScore >= 0.8 ? '🎉 Excellent' :
           ergonomicScore >= 0.6 ? '👍 Good' :
           ergonomicScore >= 0.4 ? '⚠️ Fair' :
           '🚨 Needs Work'}
        </div>
      </div>

      {/* Recommendations List */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.6)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: 700, 
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          <span>💡</span>
          <span>Personalized Recommendations</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {recommendations.map((rec, index) => {
            const colors = severityColors[rec.severity];
            
            return (
              <div key={index} style={{
                background: colors.bg,
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                border: `2px solid ${colors.border}`,
                borderLeft: `6px solid ${colors.border}`,
              }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                    {categoryIcons[rec.category]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>
                        {rec.title}
                      </h4>
                      <span style={{
                        fontSize: '0.625rem',
                        padding: '2px 6px',
                        background: colors.dot,
                        color: 'white',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}>
                        {rec.severity}
                      </span>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.8125rem', 
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-2)',
                      lineHeight: 1.5,
                    }}>
                      {rec.description}
                    </p>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                    }}>
                      <span>✓</span>
                      <span>{rec.impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
