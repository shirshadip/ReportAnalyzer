import { useState, useEffect } from 'react'
import {
  Trophy, TrendingUp, TrendingDown, Users,
  Download, RefreshCw, AlertCircle, BookOpen,
  CheckCircle, XCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell
} from 'recharts'
import RankingTable from './RankingTable.jsx'
import { fetchAnalysis, downloadReport } from '../api.js'
import './Dashboard.css'

const SUBJECT_COLORS = ['#2196f3', '#00b4d8', '#4caf50', '#f4c542']

function StatCard({ icon, label, value, sub, variant, delay = 0 }) {
  return (
    <div
      className={`stat-card stat-card--${variant || 'default'} animate-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="dashboard-loading">
      <div className="skeleton-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '110px', animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: '320px', marginTop: '2rem' }} />
      <div className="skeleton" style={{ height: '400px', marginTop: '1.5rem' }} />
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAnalysis()
      setData(result)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to fetch analysis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await downloadReport()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'student_performance_report.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Download failed: ' + (e.message || 'Unknown error'))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="dashboard-error animate-in">
        <AlertCircle size={40} />
        <h2>Could not load data</h2>
        <p>{error}</p>
        <button className="btn btn--primary" onClick={load}>
          <RefreshCw size={15} /> Try Again
        </button>
      </div>
    )
  }

  if (!data) return null

  const { summary, topper, highest_scorer, lowest_scorer,
          subject_averages, grade_distribution, ranked_students } = data

  // Subject chart data
  const subjectData = Object.entries(subject_averages).map(([name, avg]) => ({
    name: name.replace('Computer Science', 'CS'),
    avg,
  }))

  // Grade chart data (ordered)
  const gradeOrder = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F']
  const gradeColors = {
    'A+': '#2ecc71', A: '#27ae60', 'B+': '#3498db', B: '#2980b9',
    C: '#f4c542', D: '#e67e22', F: '#e74c3c'
  }
  const gradeData = gradeOrder
    .filter(g => grade_distribution[g] > 0)
    .map(g => ({ grade: g, count: grade_distribution[g] || 0, fill: gradeColors[g] }))

  // Radar data
  const radarData = Object.entries(subject_averages).map(([name, avg]) => ({
    subject: name.replace('Computer Science', 'CS'),
    average: avg,
    max: 100,
  }))

  return (
    <div className="dashboard">

      {/* ── Top Action Bar ─────────────────────────── */}
      <div className="dashboard-topbar animate-in">
        <div className="topbar-left">
          <h1 className="page-title">Class Analytics</h1>
          <span className="student-count">
            <Users size={14} /> {summary.total_students} students
          </span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn--ghost btn--sm" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="btn btn--primary btn--sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={14} />
            {downloading ? 'Generating…' : 'Download Report'}
          </button>
        </div>
      </div>

      {/* ── Summary Stat Cards ─────────────────────── */}
      <div className="stat-grid">
        <StatCard
          icon={<Trophy size={22} />}
          label="Class Topper"
          value={topper.name}
          sub={`${topper.percentage}% · ${topper.grade}`}
          variant="gold"
          delay={50}
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Class Average"
          value={`${summary.class_average_percentage}%`}
          sub={`Total avg: ${summary.class_average_total}`}
          variant="blue"
          delay={100}
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Highest Score"
          value={`${highest_scorer.percentage}%`}
          sub={highest_scorer.name}
          variant="green"
          delay={150}
        />
        <StatCard
          icon={<TrendingDown size={22} />}
          label="Lowest Score"
          value={`${lowest_scorer.percentage}%`}
          sub={lowest_scorer.name}
          variant="red"
          delay={200}
        />
        <StatCard
          icon={<CheckCircle size={22} />}
          label="Passed"
          value={summary.pass_count}
          sub={`${((summary.pass_count / summary.total_students) * 100).toFixed(0)}% pass rate`}
          variant="green"
          delay={250}
        />
        <StatCard
          icon={<XCircle size={22} />}
          label="Failed"
          value={summary.fail_count}
          sub="Below 40%"
          variant="red"
          delay={300}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────── */}
      <div className="charts-row">

        {/* Subject Averages Bar Chart */}
        <div className="chart-card animate-in" style={{ animationDelay: '350ms' }}>
          <div className="chart-header">
            <BookOpen size={18} />
            <h2>Subject Averages</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(240,246,255,0.65)', fontSize: 12, fontFamily: 'DM Sans' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'rgba(240,246,255,0.45)', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(22,40,64,0.97)',
                  border: '1px solid rgba(0,180,216,0.3)',
                  borderRadius: '8px',
                  color: '#f0f6ff',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                }}
                cursor={{ fill: 'rgba(0,180,216,0.06)' }}
                formatter={(v) => [`${v}`, 'Average']}
              />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {subjectData.map((_, i) => (
                  <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="chart-card animate-in" style={{ animationDelay: '420ms' }}>
          <div className="chart-header">
            <Trophy size={18} />
            <h2>Grade Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="grade"
                tick={{ fill: 'rgba(240,246,255,0.65)', fontSize: 12, fontFamily: 'DM Sans' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'rgba(240,246,255,0.45)', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(22,40,64,0.97)',
                  border: '1px solid rgba(0,180,216,0.3)',
                  borderRadius: '8px',
                  color: '#f0f6ff',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                }}
                cursor={{ fill: 'rgba(0,180,216,0.06)' }}
                formatter={(v) => [`${v} students`, 'Count']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {gradeData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="chart-card chart-card--radar animate-in" style={{ animationDelay: '490ms' }}>
          <div className="chart-header">
            <TrendingUp size={18} />
            <h2>Class Performance Radar</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="rgba(0,180,216,0.18)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'rgba(240,246,255,0.7)', fontSize: 12, fontFamily: 'DM Sans' }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="average"
                stroke="#00b4d8"
                fill="#00b4d8"
                fillOpacity={0.22}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(22,40,64,0.97)',
                  border: '1px solid rgba(0,180,216,0.3)',
                  borderRadius: '8px',
                  color: '#f0f6ff',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                }}
                formatter={(v) => [`${v}`, 'Avg']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── Ranking Table ───────────────────────────── */}
      <div className="animate-in" style={{ animationDelay: '560ms' }}>
        <RankingTable students={ranked_students} onRefresh={load} />
      </div>
    </div>
  )
}
