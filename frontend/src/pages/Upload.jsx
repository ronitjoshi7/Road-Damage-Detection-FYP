import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../services/api';

const COLORS = {
  longitudinal_crack: '#2E75B6',
  transverse_crack:   '#27AE60',
  alligator_crack:    '#E74C3C',
  pothole:            '#F39C12',
};

export default function Upload() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const canvasRef = useRef(null);
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState(null);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  }

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type === 'image/jpeg' || f.type === 'image/png')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError('');
    }
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadImage(fd);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!result || !canvasRef.current || !preview) return;
    const canvas = canvasRef.current;
    const img    = new Image();
    img.src      = preview;
    img.onload   = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      result.detections.forEach(det => {
        if (!det.bounding_box) return;
        const { x1, y1, x2, y2 } = det.bounding_box;
        const color    = COLORS[det.damage_type] || '#FF0000';
        const label    = det.damage_type.replace(/_/g,' ') + ' ' + (det.confidence*100).toFixed(1) + '%';
        const fontSize = Math.max(14, canvas.width / 45);
        ctx.strokeStyle = color;
        ctx.lineWidth   = Math.max(3, canvas.width / 200);
        ctx.strokeRect(x1, y1, x2-x1, y2-y1);
        ctx.font = 'bold ' + fontSize + 'px Arial';
        const textW = ctx.measureText(label).width;
        ctx.fillStyle = color;
        ctx.fillRect(x1, Math.max(0, y1-fontSize-8), textW+12, fontSize+10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, x1+6, Math.max(fontSize, y1-4));
      });
    };
  }, [result, preview]);

  function severityColor(s) {
    return { High:'#c53030', Medium:'#c05621', Low:'#276749', None:'#4a5568' }[s] || '#4a5568';
  }

  function resetUpload() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{textAlign:'center',padding:60}}>
          <span className="spinner"></span>
          <p style={{marginTop:16,color:'#4a5568'}}>Analysing image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Upload Road Image</h1>
      <p className="page-subtitle">Upload a road photo to detect and classify surface damage using AI.</p>

      {!result ? (
        <div className="card">
          <div onDrop={handleDrop} onDragOver={e=>e.preventDefault()}
            onClick={()=>fileRef.current?.click()}
            style={{border:'2px dashed #cbd5e0',borderRadius:10,padding:40,
              textAlign:'center',cursor:'pointer',background:'#f7fafc'}}
            onMouseOver={e=>e.currentTarget.style.borderColor='#2E75B6'}
            onMouseOut={e=>e.currentTarget.style.borderColor='#cbd5e0'}>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png"
              style={{display:'none'}} onChange={handleFile}/>
            {preview ? (
              <img src={preview} alt="Preview"
                style={{maxHeight:280,maxWidth:'100%',borderRadius:8,objectFit:'contain'}}/>
            ) : (
              <>
                <div style={{fontSize:48,marginBottom:12}}>📷</div>
                <p style={{color:'#4a5568',fontWeight:500}}>Click or drag and drop a road image</p>
                <p style={{color:'#a0aec0',fontSize:13,marginTop:6}}>JPEG or PNG, max 10MB</p>
              </>
            )}
          </div>
          {file && (
            <div style={{marginTop:12,display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:13,color:'#718096',flex:1}}>
                {file.name} ({(file.size/1024/1024).toFixed(2)} MB)
              </span>
              <button className="btn-secondary"
                onClick={e=>{e.stopPropagation();resetUpload();}}>Remove</button>
            </div>
          )}
          {error && <div className="error-msg" style={{marginTop:12}}>{error}</div>}
          <button className="btn-primary" onClick={handleUpload} disabled={!file}
            style={{width:'100%',marginTop:16,padding:'13px',fontSize:15}}>
            Detect Road Damage
          </button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{fontSize:18,fontWeight:600,color:'#1F4E79'}}>Detection Results</h2>
              <div style={{display:'flex',gap:8}}>
                <button className="btn-secondary" onClick={resetUpload}>Upload Another</button>
                <button className="btn-primary"
                  onClick={()=>navigate('/report/'+result.inspection_id)}>
                  View Full Report
                </button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              {[
                {label:'Total Detections',value:result.total_detections},
                {label:'Severity',value:result.severity,color:severityColor(result.severity)},
                {label:'Status',value:result.status?.toUpperCase()},
              ].map(item=>(
                <div key={item.label}
                  style={{background:'#f7fafc',borderRadius:8,padding:'14px 16px',textAlign:'center'}}>
                  <div style={{fontSize:24,fontWeight:700,color:item.color||'#1F4E79'}}>{item.value}</div>
                  <div style={{fontSize:12,color:'#718096',marginTop:4}}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:12}}>
              {Object.entries(COLORS).map(([cls,color])=>(
                <div key={cls} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#4a5568'}}>
                  <div style={{width:12,height:12,background:color,borderRadius:2}}/>
                  {cls.replace(/_/g,' ')}
                </div>
              ))}
            </div>
            <canvas ref={canvasRef}
              style={{width:'100%',maxHeight:480,display:'block',
                borderRadius:8,background:'#f7fafc'}}/>
          </div>
          <div className="card">
            <h3 style={{fontSize:16,fontWeight:600,color:'#1F4E79',marginBottom:14}}>
              Detected Damages ({result.detections?.length||0})
            </h3>
            {result.detections?.length > 0 ? (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
                <thead>
                  <tr style={{background:'#1F4E79',color:'white'}}>
                    {['#','Damage Type','Confidence','Bounding Box'].map(h=>(
                      <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:500}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.detections.map((d,i)=>(
                    <tr key={i} style={{background:i%2===0?'white':'#f7fafc',borderBottom:'1px solid #e2e8f0'}}>
                      <td style={{padding:'10px 12px',color:'#718096'}}>{i+1}</td>
                      <td style={{padding:'10px 12px',fontWeight:500}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
                          <span style={{width:12,height:12,borderRadius:2,
                            background:COLORS[d.damage_type]||'#ccc',flexShrink:0}}/>
                          {d.damage_type.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{flex:1,background:'#e2e8f0',borderRadius:4,height:6}}>
                            <div style={{width:(d.confidence*100)+'%',
                              background:COLORS[d.damage_type]||'#2E75B6',height:6,borderRadius:4}}/>
                          </div>
                          <span style={{fontSize:13,color:'#4a5568',minWidth:40}}>
                            {(d.confidence*100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{padding:'10px 12px',color:'#718096',fontSize:12}}>
                        {d.bounding_box
                          ? '('+d.bounding_box.x1+', '+d.bounding_box.y1+') to ('+d.bounding_box.x2+', '+d.bounding_box.y2+')'
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{textAlign:'center',color:'#718096',padding:40}}>
                <div style={{fontSize:40,marginBottom:12}}>✅</div>
                <p style={{fontWeight:500}}>No damage detected.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
