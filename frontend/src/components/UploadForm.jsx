import { useState, useRef } from 'react'
import { Upload, UserPlus, CheckCircle, AlertCircle, FileText, X } from 'lucide-react'
import { addStudent, uploadCSV } from '../api.js'
import './UploadForm.css'

const EMPTY_FORM = { name: '', math: '', physics: '', cs: '', english: '' }

function SubjectInput({ label, name, value, onChange, error }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <input
        type="number"
        min="0" max="100"
        name={name}
        value={value}
        onChange={onChange}
        className={`input-field ${error ? 'input-field--error' : ''}`}
        placeholder="0–100"
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}

export default function UploadForm({ onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState(null) // { type, message }

  const [csvFile, setCsvFile] = useState(null)
  const [csvDragging, setCsvDragging] = useState(false)
  const [csvUploading, setCsvUploading] = useState(false)
  const fileInputRef = useRef(null)

  const notify = (type, message, duration = 4000) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), duration)
  }

  // ── Manual form ─────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFormErrors(fe => ({ ...fe, [name]: '' }))
  }

  const validateForm = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    const subjects = ['math', 'physics', 'cs', 'english']
    for (const s of subjects) {
      const v = parseInt(form[s])
      if (form[s] === '') errors[s] = 'Required'
      else if (isNaN(v) || v < 0 || v > 100) errors[s] = 'Must be 0–100'
    }
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    setSubmitting(true)
    try {
      await addStudent({
        name: form.name.trim(),
        math: parseInt(form.math),
        physics: parseInt(form.physics),
        cs: parseInt(form.cs),
        english: parseInt(form.english),
      })
      notify('success', `${form.name} added successfully!`)
      setForm(EMPTY_FORM)
    } catch (e) {
      notify('error', e.response?.data?.detail || e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── CSV Upload ──────────────────────────────
  const handleCsvDrop = (e) => {
    e.preventDefault()
    setCsvDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'text/csv' || file?.name.endsWith('.csv')) {
      setCsvFile(file)
    } else {
      notify('error', 'Please drop a .csv file')
    }
  }

  const handleCsvSelect = (e) => {
    const file = e.target.files[0]
    if (file) setCsvFile(file)
  }

  const handleCsvUpload = async () => {
    if (!csvFile) return
    setCsvUploading(true)
    try {
      const result = await uploadCSV(csvFile)
      notify('success', result.message)
      setCsvFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(onSuccess, 1200)
    } catch (e) {
      notify('error', e.response?.data?.detail || e.message)
    } finally {
      setCsvUploading(false)
    }
  }

  return (
    <div className="upload-page">

      {/* ── Notification ──────────────────────── */}
      {notification && (
        <div className={`notification notification--${notification.type}`}>
          {notification.type === 'success'
            ? <CheckCircle size={18} />
            : <AlertCircle size={18} />}
          <span>{notification.message}</span>
          <button className="notif-close" onClick={() => setNotification(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="upload-page-header">
        <h1 className="page-title">Add Student Data</h1>
        <p className="page-subtitle">
          Add students manually or upload a CSV with columns:
          <code>name, math, physics, cs, english</code>
        </p>
      </div>

      <div className="upload-grid">

        {/* ── Manual Entry ──────────────────── */}
        <div className="upload-card">
          <div className="upload-card-header">
            <UserPlus size={18} />
            <h2>Manual Entry</h2>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label className="input-label">Student Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`input-field ${formErrors.name ? 'input-field--error' : ''}`}
                placeholder="e.g. Alex Johnson"
                autoComplete="off"
              />
              {formErrors.name && <span className="input-error">{formErrors.name}</span>}
            </div>

            <div className="marks-grid">
              <SubjectInput label="Mathematics" name="math"
                value={form.math} onChange={handleChange} error={formErrors.math} />
              <SubjectInput label="Physics" name="physics"
                value={form.physics} onChange={handleChange} error={formErrors.physics} />
              <SubjectInput label="Computer Science" name="cs"
                value={form.cs} onChange={handleChange} error={formErrors.cs} />
              <SubjectInput label="English" name="english"
                value={form.english} onChange={handleChange} error={formErrors.english} />
            </div>

            {/* Live preview */}
            {form.math && form.physics && form.cs && form.english && (
              <div className="preview-box">
                <span className="preview-label">Preview</span>
                <span className="preview-val">
                  Total: {
                    [form.math, form.physics, form.cs, form.english]
                      .map(Number).reduce((a, b) => a + b, 0)
                  } / 400
                  &nbsp;·&nbsp;
                  {(([form.math, form.physics, form.cs, form.english]
                    .map(Number).reduce((a, b) => a + b, 0)) / 4).toFixed(1)}%
                </span>
              </div>
            )}

            <button type="submit" className="btn btn--primary btn--md submit-btn" disabled={submitting}>
              <UserPlus size={16} />
              {submitting ? 'Adding…' : 'Add Student'}
            </button>
          </form>
        </div>

        {/* ── CSV Upload ────────────────────── */}
        <div className="upload-card">
          <div className="upload-card-header">
            <FileText size={18} />
            <h2>Upload CSV</h2>
          </div>

          {/* Dropzone */}
          <div
            className={`dropzone ${csvDragging ? 'dropzone--active' : ''} ${csvFile ? 'dropzone--has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setCsvDragging(true) }}
            onDragLeave={() => setCsvDragging(false)}
            onDrop={handleCsvDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleCsvSelect}
            />
            <div className="dropzone-inner">
              <Upload size={28} className="dropzone-icon" />
              {csvFile ? (
                <>
                  <span className="dropzone-filename">{csvFile.name}</span>
                  <span className="dropzone-hint">
                    {(csvFile.size / 1024).toFixed(1)} KB · Click to change
                  </span>
                </>
              ) : (
                <>
                  <span className="dropzone-text">Drop CSV here or click to browse</span>
                  <span className="dropzone-hint">Accepts .csv files only</span>
                </>
              )}
            </div>
          </div>

          {/* CSV Format hint */}
          <div className="csv-hint">
            <strong>Expected format:</strong>
            <pre>{`name,math,physics,cs,english\nAlex,78,65,89,70\nBob,90,88,95,85`}</pre>
          </div>

          <button
            className="btn btn--primary btn--md submit-btn"
            onClick={handleCsvUpload}
            disabled={!csvFile || csvUploading}
          >
            <Upload size={16} />
            {csvUploading ? 'Uploading…' : 'Upload CSV'}
          </button>

          {csvFile && (
            <button
              className="btn btn--ghost btn--sm clear-btn"
              onClick={() => { setCsvFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
