import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspection, downloadReport } from '../services/api';

export default function Report() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    getInspection(id)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load inspection.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await downloadReport(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `report_${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download report.');
    } finally {
      setDownloading(false);
    }
  }

  function severityColor(s) {
    return { High: '#c53030', Medium: '#c05621', Low: '#276749', None: '#4a5568' }[s] || '#4a5568';
  }

  if (loading) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      <span className="spinner"></span> Loading report...
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="error-msg">{error}</div>
      <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate('/history')}>
        Back to History
      </button>
    </div>
  );

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Inspection Report</h1>
          <p className="page-subtitle" style={{ fontFamily: 'monospace' }}>ID: {id}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => navigate('/history')}>← Back</button>
          <button className="btn-primary" onClick={handleDownload} disabled={downloading}>
            {downloading ? <><span className="spinner"></span>Downloading...</> : '⬇ Download PDF'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Detections', value: data.total_detections },
          { label: 'Severity',         value: data.severity, color: severityColor(data.severity) },
          { label: 'Status',           value: data.status?.toUpperCase() },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: item.color || '#1F4E79' }}>{item.value}</div>
            <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1F4E79', marginBottom: 12 }}>Inspection Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14 }}>
          {[
            ['Date', new Date(data.inspected_at).toLocaleString()],
            ['Image file', data.image_url?.split('/').pop() || '—'],
            ['Notes', data.notes || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <span style={{ color: '#718096', fontSize: 12 }}>{label}</span>
              <div style={{ color: '#1a202c', marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detections */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1F4E79', marginBottom: 14 }}>
          Detection Results ({data.detections.length})
        </h3>
        {data.detections.length === 0 ? (
          <p style={{ color: '#718096', textAlign: 'center', padding: 24 }}>No damage detected.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#1F4E79', color: 'white' }}>
                {['#', 'Damage Type', 'Confidence', 'Bounding Box'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.detections.map((d, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', color: '#718096' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1F4E79' }}>{d.damage_type}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${d.confidence * 100}%`, background: '#2E75B6', height: 6, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 13, color: '#4a5568', minWidth: 40 }}>
                        {(d.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#718096', fontSize: 12 }}>
                    {d.bounding_box
                      ? `(${d.bounding_box.x1}, ${d.bounding_box.y1}) → (${d.bounding_box.x2}, ${d.bounding_box.y2})`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
