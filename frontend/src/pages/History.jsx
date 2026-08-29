import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInspections } from '../services/api';

export default function History() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    getInspections()
      .then(res => setInspections(res.data))
      .catch(() => setError('Failed to load inspections.'))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleString();
  }

  function statusBadge(s) {
    return <span className={`badge badge-${s}`}>{s}</span>;
  }

  if (loading) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      <span className="spinner"></span> Loading inspections...
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-title">Inspection History</h1>
      <p className="page-subtitle">All past road damage inspections.</p>

      {error && <div className="error-msg">{error}</div>}

      {inspections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <p style={{ color: '#718096', fontWeight: 500 }}>No inspections yet.</p>
          <button className="btn-primary" style={{ marginTop: 16 }}
            onClick={() => navigate('/upload')}>Upload your first image</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#1F4E79', color: 'white' }}>
                {['#', 'Inspection ID', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inspections.map((ins, i) => (
                <tr key={ins.id} style={{ background: i % 2 === 0 ? 'white' : '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', color: '#718096' }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#4a5568' }}>
                    {ins.id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4a5568' }}>{formatDate(ins.inspected_at)}</td>
                  <td style={{ padding: '12px 16px' }}>{statusBadge(ins.status)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}
                      onClick={() => navigate(`/report/${ins.id}`)}>
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
