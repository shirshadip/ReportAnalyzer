import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown, Medal } from 'lucide-react'
import { deleteStudent } from '../api.js'
import './RankingTable.css'

const GRADE_COLORS = {
  'A+': '#2ecc71', A: '#27ae60', 'B+': '#3498db', B: '#2980b9',
  C: '#f4c542', D: '#e67e22', F: '#e74c3c',
}

function MedalBadge({ rank }) {
  if (rank === 1) return <span className="rank-medal rank-medal--gold"><Medal size={13} />1</span>
  if (rank === 2) return <span className="rank-medal rank-medal--silver">2</span>
  if (rank === 3) return <span className="rank-medal rank-medal--bronze">3</span>
  return <span className="rank-num">#{rank}</span>
}

function PercentBar({ value }) {
  return (
    <div className="percent-bar-wrap">
      <span className="percent-val">{value}%</span>
      <div className="percent-track">
        <div
          className="percent-fill"
          style={{
            width: `${value}%`,
            background: value >= 80
              ? 'var(--green)'
              : value >= 60
              ? 'var(--blue-bright)'
              : value >= 40
              ? 'var(--gold)'
              : 'var(--red)',
          }}
        />
      </div>
    </div>
  )
}

export default function RankingTable({ students, onRefresh }) {
  const [sortKey, setSortKey] = useState('rank')
  const [sortDir, setSortDir] = useState('asc')
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'rank' ? 'asc' : 'desc')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return
    setDeletingId(id)
    try {
      await deleteStudent(id)
      onRefresh()
    } catch (e) {
      alert('Delete failed: ' + e.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (typeof av === 'string') return sortDir === 'asc'
      ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="sort-icon sort-icon--inactive"><ChevronUp size={12} /></span>
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="sort-icon sort-icon--active" />
      : <ChevronDown size={13} className="sort-icon sort-icon--active" />
  }

  const cols = [
    { key: 'rank', label: 'Rank' },
    { key: 'name', label: 'Name' },
    { key: 'math', label: 'Math' },
    { key: 'physics', label: 'Physics' },
    { key: 'cs', label: 'CS' },
    { key: 'english', label: 'English' },
    { key: 'total', label: 'Total' },
    { key: 'percentage', label: 'Score' },
    { key: 'grade', label: 'Grade' },
  ]

  return (
    <div className="ranking-section">
      <div className="ranking-header">
        <h2 className="ranking-title">Student Rankings</h2>
        <input
          className="search-input"
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table className="ranking-table">
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)}>
                  <span className="th-inner">
                    {c.label} <SortIcon col={c.key} />
                  </span>
                </th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={cols.length + 1} className="empty-row">
                  No students found
                </td>
              </tr>
            ) : sorted.map((s) => (
              <tr key={s.id} className={s.rank === 1 ? 'row--topper' : ''}>
                <td><MedalBadge rank={s.rank} /></td>
                <td className="td-name">{s.name}</td>
                <td>{s.math}</td>
                <td>{s.physics}</td>
                <td>{s.cs}</td>
                <td>{s.english}</td>
                <td><strong>{s.total}</strong></td>
                <td><PercentBar value={s.percentage} /></td>
                <td>
                  <span
                    className="grade-badge"
                    style={{ color: GRADE_COLORS[s.grade] || '#aaa',
                             borderColor: GRADE_COLORS[s.grade] || '#aaa' }}
                  >
                    {s.grade}
                  </span>
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={deletingId === s.id}
                    title="Delete student"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div className="table-footer">
          Showing {sorted.length} of {students.length} students
        </div>
      )}
    </div>
  )
}
