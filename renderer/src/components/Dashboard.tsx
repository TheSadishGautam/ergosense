import React, { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell
} from 'recharts';
import { useMetrics, TimeRange } from '../hooks/useMetrics';
import { MetricCard } from './MetricCard';
import { TimeRangeSelector } from './TimeRangeSelector';
import { formatTime, aggregateByHour } from '../utils/chartHelpers';
import { getPostureStatus, getEyeStatus, getBlinkStatus } from '../utils/statusHelpers';
import { COLORS } from '../utils/theme';

export const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const { data, derived, loading, lastUpdated } = useMetrics(timeRange);

  // Calculate ergonomic score (composite metric)
  const ergonomicScore = derived.avgPosture * 0.4 + (1 - derived.avgEyeStrain) * 0.4 + 
    (Math.min(derived.avgBlinks / 15, 1)) * 0.2;

  // Prepare combined chart data
  const combinedData = data.posture.map((p, i) => ({
    timestamp: p.timestamp,
    posture: p.value,
    eyeStrain: data.eye[i]?.value || 0,
  }));

  // Posture distribution
  // Posture distribution
  const postureDistribution = [
    { name: 'Excellent', value: data.posture.filter(p => p.value >= 0.85).length, color: COLORS.excellent },
    { name: 'Good', value: data.posture.filter(p => p.value >= 0.7 && p.value < 0.85).length, color: COLORS.good },
    { name: 'Fair', value: data.posture.filter(p => p.value >= 0.4 && p.value < 0.7).length, color: COLORS.warning },
    { name: 'Poor', value: data.posture.filter(p => p.value < 0.4).length, color: COLORS.danger },
  ];

  // Hourly heatmap data
  const hourlyData = aggregateByHour(data.posture);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        color: 'var(--text-secondary)' 
      }}>
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ 
        marginBottom: 'var(--space-8)',
        padding: 'var(--space-8)',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(234, 88, 12, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Orange accent line at top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--gradient-orange)',
        }} />
        
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-2)' }}>
              <div style={{
                padding: 'var(--space-3)',
                background: 'var(--gradient-orange)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '1.5rem',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              </div>
              <h1 style={{ 
                margin: 0,
                color: 'white',
                fontSize: '2rem',
                fontWeight: 800,
              }}>
                ErgoSense Dashboard
              </h1>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: 0, marginLeft: '68px' }}>
              {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ animation: 'slideUp 0.5s ease forwards', animationDelay: '0.1s', opacity: 0 }}>
          <MetricCard
            title="Posture Score"
            value={(derived.avgPosture * 100).toFixed(0)}
            unit="%"
            trend={derived.postureTrend}
            status={getPostureStatus(derived.avgPosture)}
            icon="🧍"
            subtitle="Average posture quality"
          />
        </div>
        <div style={{ animation: 'slideUp 0.5s ease forwards', animationDelay: '0.2s', opacity: 0 }}>
          <MetricCard
            title="Eye Strain"
            value={(derived.avgEyeStrain * 100).toFixed(0)}
            unit="%"
            trend={derived.eyeTrend}
            status={getEyeStatus(derived.avgEyeStrain)}
            icon="👁️"
            subtitle="Eye fatigue level"
          />
        </div>
        <div style={{ animation: 'slideUp 0.5s ease forwards', animationDelay: '0.3s', opacity: 0 }}>
          <MetricCard
            title="Blink Rate"
            value={derived.avgBlinks.toFixed(0)}
            unit="/min"
            trend={derived.blinkTrend}
            status={getBlinkStatus(derived.avgBlinks)}
            icon="✨"
            subtitle="Blinks per minute"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ animation: 'slideUp 0.5s ease forwards', animationDelay: '0.4s', opacity: 0 }}>
          <MetricCard
            title="Ergonomic Score"
            value={(ergonomicScore * 100).toFixed(0)}
            unit="/100"
            status={ergonomicScore >= 0.85 ? 'excellent' : ergonomicScore >= 0.7 ? 'good' : ergonomicScore >= 0.5 ? 'warning' : 'danger'}
            icon="🎯"
            subtitle="Overall health index"
          />
        </div>
        <div style={{ animation: 'slideUp 0.5s ease forwards', animationDelay: '0.5s', opacity: 0 }}>
          <MetricCard
            title="Focus Time"
            value={derived.totalPresenceMinutes}
            unit="min"
            icon="⏱️"
            subtitle="Active time detected"
            status="excellent"
          />
        </div>
        <div style={{ animation: 'slideUp 0.5s ease forwards', animationDelay: '0.6s', opacity: 0 }}>
          <MetricCard
            title="Time Range"
            value={timeRange}
            icon="📅"
            subtitle="Time range displayed"
          />
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Dual-Axis Chart: Posture + Eye Strain */}
        <div className="card" style={{ 
          background: 'var(--gradient-card)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(234, 88, 12, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{
              padding: 'var(--space-2)',
              background: 'var(--gradient-orange)',
              borderRadius: 'var(--radius-md)',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
              <span style={{ fontSize: '1.25rem' }}>📈</span>
            </div>
            <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Posture & Eye Strain Trends</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={combinedData}>
              <defs>
                <linearGradient id="colorPosture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorEye" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(ts) => formatTime(ts)}
                stroke="var(--text-tertiary)"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis 
                domain={[0, 1]}
                stroke="var(--text-tertiary)"
                style={{ fontSize: '0.75rem' }}
              />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="posture" 
                stroke="#a855f7" 
                fillOpacity={1} 
                fill="url(#colorPosture)"
                name="Posture"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="eyeStrain" 
                stroke="#ea580c" 
                fillOpacity={1} 
                fill="url(#colorEye)"
                name="Eye Strain"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Blink Frequency */}
        <div className="card" style={{ 
          background: 'var(--gradient-card)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(234, 88, 12, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{
              padding: 'var(--space-2)',
              background: 'var(--gradient-orange)',
              borderRadius: 'var(--radius-md)',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
              <span style={{ fontSize: '1.25rem' }}>✨</span>
            </div>
            <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Blink Frequency</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.blink}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(ts) => formatTime(ts)}
                stroke="var(--text-tertiary)"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis 
                stroke="var(--text-tertiary)"
                style={{ fontSize: '0.75rem' }}
              />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#ea580c" 
                name="Blinks/min"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ 
            marginTop: 'var(--space-4)', 
            padding: 'var(--space-3)', 
            background: 'rgba(234, 88, 12, 0.15)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: '#fb923c',
            textAlign: 'center',
          }}>
            💡 Target: 12-20 blinks per minute
          </div>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Posture Distribution */}
        <div className="card" style={{ 
          background: 'var(--gradient-card)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{
              padding: 'var(--space-2)',
              background: 'var(--gradient-success)',
              borderRadius: 'var(--radius-md)',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
              <span style={{ fontSize: '1.25rem' }}>🎯</span>
            </div>
            <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Posture Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={postureDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {postureDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Activity */}
        <div className="card" style={{ 
          background: 'var(--gradient-card)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(234, 88, 12, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{
              padding: 'var(--space-2)',
              background: 'var(--gradient-orange)',
              borderRadius: 'var(--radius-md)',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
              <span style={{ fontSize: '1.25rem' }}>⏰</span>
            </div>
            <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Hourly Posture Average</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="hour"
                tickFormatter={(h) => `${h}:00`}
                stroke="var(--text-tertiary)"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis 
                domain={[0, 1]}
                stroke="var(--text-tertiary)"
                style={{ fontSize: '0.75rem' }}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#c084fc" 
                strokeWidth={3}
                dot={{ fill: '#a855f7', r: 4 }}
                name="Posture Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Panel */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
        border: '1px solid rgba(234, 88, 12, 0.3)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(234, 88, 12, 0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Orange accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--gradient-orange)',
        }} />
        
        <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-4)', paddingTop: 'var(--space-2)' }}>
          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--gradient-orange)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '1.5rem',
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
          }}>
            💡
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Insights & Recommendations</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: 'var(--space-2)' }}>Key Findings</h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem', lineHeight: 1.8 }}>
              <li>• {derived.avgPosture >= 0.85 ? 'Outstanding posture!' : derived.avgPosture >= 0.7 ? 'Good posture maintenance.' : 'Posture needs improvement'}</li>
              <li>• {derived.avgEyeStrain <= 0.15 ? 'Eyes are well rested' : derived.avgEyeStrain <= 0.3 ? 'Low eye strain detected' : 'Consider taking more breaks'}</li>
              <li>• {derived.avgBlinks >= 15 ? 'Excellent blink rate' : derived.avgBlinks >= 12 ? 'Healthy blink rate' : 'Increase blink frequency'}</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: 'var(--space-2)' }}>Action Items</h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem', lineHeight: 1.8 }}>
              <li>✅ Follow 20-20-20 rule (every 20 min, look 20 ft away for 20 sec)</li>
              <li>✅ Adjust monitor to eye level</li>
              <li>✅ Take micro-breaks every hour</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
