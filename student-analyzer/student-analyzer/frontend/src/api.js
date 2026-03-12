import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

export const fetchAnalysis = () => api.get('/analyze').then(r => r.data)
export const fetchStudents = () => api.get('/students').then(r => r.data)
export const addStudent   = (student) => api.post('/students', student).then(r => r.data)
export const deleteStudent = (id) => api.delete(`/students/${id}`).then(r => r.data)
export const uploadCSV    = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/upload-csv', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}
export const downloadReport = () =>
  api.get('/report', { responseType: 'blob' }).then(r => r.data)
