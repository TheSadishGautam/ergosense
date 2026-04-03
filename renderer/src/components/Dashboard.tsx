import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  Activity, Eye, Zap, TrendingUp, Clock, Calendar, 
  Monitor, RotateCcw, LayoutGrid, CheckCircle 
} from 'lucide-react';
import { useMetrics, TimeRange } from '../hooks/useMetrics';
import { MetricCard } from './MetricCard';
import { TimeRangeSelector } from './TimeRangeSelector';
import { PostureHeatmap } from './PostureHeatmap';
import { MultiMonitorStats } from './MultiMonitorStats';
import { CustomTooltip } from './CustomTooltip';
import { formatTime, aggregateByHour } from '../utils/chartHelpers';
import { getPostureStatus, getEyeStatus, getBlinkStatus } from '../utils/statusHelpers';
import { CHART, COLORS } from '../utils/theme';

// Time windows mapping
const timeWindows: Record<TimeRange, number> = {
  '30M': 30 * 60 * 1000,
  '1H': 60 * 60 * 1000,
  '6H': 6 * 60 * 60 * 1000,
  '24H': 24 * 60 * 60 * 1000,
  '7D': 7 * 24 * 60 * 60 * 1000,
  '30D': 30 * 24 * 60 * 60 * 1000,
};

export const Dashboard: React.FC = React.memo(() => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const { data, derived, loading, lastUpdated } = useMetrics(timeRange);
  const [zoneData, setZoneData] = useState<any[]>([]);

  // Fetch zone data when time range changes
  useEffect(() => {
    const fetchZoneData = async () => {
      try {
        const zones = await window.electronAPI.getZoneMetrics(timeWindows[timeRange]);
        setZoneData(zones || []);
      } catch (err) {
        console.error('Failed to fetch zone data:', err);
      }
    };
    fetchZoneData();
  }, [timeRange]);

  // Calculate ergonomic score (composite metric)
  const ergonomicScore = React.useMemo(() => 
    derived.avgPosture * 0.4 + (1 - derived.avgEyeStrain) * 0.4 + 
    (Math.min(derived.avgBlinks / 15, 1)) * 0.2,
    [derived]
  );

  // Prepare combined chart data by aligned timestamp buckets to avoid index mismatch.
  const combinedData = React.useMemo(() => {
    const bucketMs = 60_000;
    const postureByBucket = new Map<number, number>();
    const eyeByBucket = new Map<number, number>();

    data.posture.forEach((sample) => {
      postureByBucket.set(Math.floor(sample.timestamp / bucketMs), sample.value);
    });
    data.eye.forEach((sample) => {
      eyeByBucket.set(Math.floor(sample.timestamp / bucketMs), sample.value);
    });

    const allBuckets = new Set<number>([...postureByBucket.keys(), ...eyeByBucket.keys()]);
    return [...allBuckets]
      .sort((a, b) => a - b)
      .map((bucket) => ({
        timestamp: bucket * bucketMs,
        posture: postureByBucket.get(bucket) ?? 0,
        eyeStrain: eyeByBucket.get(bucket) ?? 0,
      }));
  }, [data.posture, data.eye]);

  // Posture distribution
  const postureDistribution = React.useMemo(() => [
    { name: 'Excellent', value: data.posture.filter(p => p.value >= 0.85).length, color: COLORS.excellent },
    { name: 'Good', value: data.posture.filter(p => p.value >= 0.7 && p.value < 0.85).length, color: COLORS.good },
    { name: 'Fair', value: data.posture.filter(p => p.value >= 0.4 && p.value < 0.7).length, color: COLORS.warning },
    { name: 'Poor', value: data.posture.filter(p => p.value < 0.4).length, color: COLORS.danger },
  ], [data.posture]);

  // Hourly heatmap data
  const hourlyData = React.useMemo(() => aggregateByHour(data.posture), [data.posture]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        color: 'var(--text-secondary)' 
      }}>
        <div className="animate-spin" style={{ marginRight: 'var(--space-2)' }}><RotateCcw size={24} /></div>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }} className="animate-fadeIn">
      {/* Header */}
      <header style={{
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
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
                color: 'white'
              }}>
                <LayoutGrid size={32} />
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
      </header>

      {/* Key Metrics Grid - Premium Cards */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-8)',
      }}>
        <div className="card-glass" style={{ animation: 'none' }}>
          <MetricCard
            title="Posture Score"
            value={(derived.avgPosture * 100).toFixed(0)}
            unit="%"
            trend={derived.postureTrend}
            status={getPostureStatus(derived.avgPosture)}
            icon={<Activity />}
            subtitle="Average posture quality"
          />
        </div>
        <div className="card-glass" style={{ animation: 'none' }}>
          <MetricCard
            title="Eye Strain"
            value={(derived.avgEyeStrain * 100).toFixed(0)}
            unit="%"
            trend={derived.eyeTrend}
            status={getEyeStatus(derived.avgEyeStrain)}
            icon={<Eye />}
            subtitle="Eye fatigue level"
          />
        </div>
        <div className="card-glass" style={{ animation: 'none' }}>
          <MetricCard
            title="Blink Rate"
            value={derived.avgBlinks.toFixed(0)}
            unit="/min"
            trend={derived.blinkTrend}
            status={getBlinkStatus(derived.avgBlinks)}
            icon={<Zap />}
            subtitle="Blinks per minute"
          />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        <div className="card-glass" style={{ animation: 'none' }}>
          <MetricCard
            title="Ergonomic Score"
            value={(ergonomicScore * 100).toFixed(0)}
            unit="/100"
            status={ergonomicScore >= 0.85 ? 'excellent' : ergonomicScore >= 0.7 ? 'good' : ergonomicScore >= 0.5 ? 'warning' : 'danger'}
            icon={<Activity />}
            subtitle="Overall health index"
          />
        </div>
        <div className="card-glass" style={{ animation: 'none' }}>
          <MetricCard
            title="Focus Time"
            value={derived.totalPresenceMinutes}
            unit="min"
            icon={<Clock />}
            subtitle="Active time detected"
            status="excellent"
          />
        </div>
        <div className="card-glass" style={{ animation: 'none' }}>
          <MetricCard
            title="Time Range"
            value={timeRange}
            icon={<Calendar />}
            subtitle="Time range displayed"
          />
        </div>
      </div>

      {/* Charts Grid - Premium Layout */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-8)',
      }}>
        {/* Dual-Axis Chart: Posture + Eye Strain */}
        <section
          className="card-glass dashboard-chart-card dashboard-chart-border--info"
          data-dashboard-hover="orange"
          role="region"
          aria-label="Posture and eye strain trends chart"
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${CHART.infoStroke} 0%, ${CHART.infoStrokeEnd} 100%)`,
            }}
          />
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="dashboard-chart-icon dashboard-chart-icon--orange">
              <TrendingUp size={20} />
            </div>
            <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Posture & Eye Strain Trends</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={combinedData}>
              <defs>
                <linearGradient id="colorPosture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.posture} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={CHART.posture} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorEye" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.eyeStrain} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={CHART.eyeStrain} stopOpacity={0.1}/>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="posture" 
                stroke={CHART.posture} 
                fillOpacity={1} 
                fill="url(#colorPosture)"
                name="Posture"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="eyeStrain" 
                stroke={CHART.eyeStrain} 
                fillOpacity={1} 
                fill="url(#colorEye)"
                name="Eye Strain"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {/* Blink Frequency */}
        <section
          className="card-glass dashboard-chart-card dashboard-chart-border--info"
          data-dashboard-hover="orange"
          role="region"
          aria-label="Blink frequency chart"
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${CHART.infoStroke} 0%, ${CHART.infoStrokeEnd} 100%)`,
          }} />
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="dashboard-chart-icon dashboard-chart-icon--orange">
              <Zap size={20} />
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill={CHART.barBlink} 
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
            color: 'var(--brand-primary-light)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}>
            <Zap size={16} /> Target: 12-20 blinks per minute
          </div>
        </section>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Posture Distribution */}
        <section
          className="card-glass dashboard-chart-card dashboard-chart-border--info"
          data-dashboard-hover="green"
          role="region"
          aria-label="Posture distribution pie chart"
        >
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="dashboard-chart-icon dashboard-chart-icon--success">
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
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </section>

        {/* Hourly Activity */}
        <section
          className="card dashboard-chart-card"
          data-dashboard-hover="purple"
          role="region"
          aria-label="Hourly posture average line chart"
          style={{
            background: 'var(--gradient-card)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="dashboard-chart-icon dashboard-chart-icon--orange">
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
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={CHART.postureMid} 
                strokeWidth={3}
                dot={{ fill: CHART.posture, r: 4 }}
                name="Posture Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
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
            color: 'white'
          }}>
            <Zap size={24} />
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
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-success" /> Follow 20-20-20 rule (every 20 min, look 20 ft away for 20 sec)</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-success" /> Adjust monitor to eye level</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-success" /> Take micro-breaks every hour</li>
            </ul>
          </div>
        </div>

        {/* Posture Zone Heatmap */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(234, 88, 12, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <div style={{
              padding: 'var(--space-2)',
              background: 'var(--gradient-orange)',
              borderRadius: 'var(--radius-md)',
              fontSize: '1.25rem',
              color: 'white'
            }}>
              <Activity size={20} />
            </div>
            <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Posture Zone Heatmap</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Where does your head spend most of its time?
          </p>
          <PostureHeatmap zoneData={zoneData} />
        </div>

        {/* Multi-Monitor Usage */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(234, 88, 12, 0.2)',
          marginTop: 'var(--space-6)', // Added margin to separate from heatmap
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <div style={{
              padding: 'var(--space-2)',
              background: 'var(--gradient-orange)',
              borderRadius: 'var(--radius-md)',
              fontSize: '1.25rem',
              color: 'white'
            }}>
              <Monitor size={20} />
            </div>
            <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Multi-Monitor Usage</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            How much time do you spend looking at each monitor?
          </p>
          <MultiMonitorStats timeRange={timeWindows[timeRange]} />
        </div>
      </div>
    </div>
  );
});
