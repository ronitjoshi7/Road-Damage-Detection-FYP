import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../services/api';

const COLORS = {
  longitudinal_crack: '#2E75B6',
  transverse_crack: '#27AE60',
  alligator_crack: '#E74C3C',
  pothole: '#F39C12',
};

export default function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // ---------------------------------------------------------
  // SELECT FILE
  // ---------------------------------------------------------

  function handleFile(e) {
    const f = e.target.files[0];

    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  }

  // ---------------------------------------------------------
  // DRAG & DROP
  // ---------------------------------------------------------

  function handleDrop(e) {
    e.preventDefault();

    const f = e.dataTransfer.files[0];

    if (
      f &&
      (f.type === 'image/jpeg' ||
        f.type === 'image/png')
    ) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError('');
    }
  }

  // ---------------------------------------------------------
  // UPLOAD IMAGE
  // ---------------------------------------------------------

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const fd = new FormData();

      fd.append('file', file);

      const res = await uploadImage(fd);

      console.log('================================');
      console.log('YOLO RESPONSE');
      console.log('================================');
      console.log(res.data);

      console.log(
        'DETECTIONS:',
        res.data.detections
      );

      setResult(res.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          'Upload failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // SEVERITY COLOR
  // ---------------------------------------------------------

  function severityColor(s) {
    return (
      {
        High: '#c53030',
        Medium: '#c05621',
        Low: '#276749',
        None: '#4a5568',
      }[s] || '#4a5568'
    );
  }

  // ---------------------------------------------------------
  // FORMAT DAMAGE NAME
  // ---------------------------------------------------------

  function formatDamageType(type) {
    if (!type) return 'Unknown';

    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c =>
        c.toUpperCase()
      );
  }

  // ---------------------------------------------------------
  // GET BOUNDING BOX STYLE
  // ---------------------------------------------------------

  function getBoundingBoxStyle(det) {
    if (!det || !det.bounding_box) {
      return null;
    }

    const x1 = Number(det.bounding_box.x1);
    const y1 = Number(det.bounding_box.y1);
    const x2 = Number(det.bounding_box.x2);
    const y2 = Number(det.bounding_box.y2);

    /*
     * The YOLO coordinates returned by your backend
     * are based on the original image dimensions.
     *
     * We use the image's natural dimensions to convert
     * them into percentages.
     */

    const imageElement =
      document.getElementById(
        'detection-image'
      );

    if (
      !imageElement ||
      !imageElement.naturalWidth ||
      !imageElement.naturalHeight
    ) {
      console.log(
        'Image dimensions not available yet.'
      );

      return null;
    }

    const imageWidth =
      imageElement.naturalWidth;

    const imageHeight =
      imageElement.naturalHeight;

    /*
     * Convert original pixel coordinates
     * into percentages.
     */

    const left =
      (x1 / imageWidth) * 100;

    const top =
      (y1 / imageHeight) * 100;

    const width =
      ((x2 - x1) / imageWidth) * 100;

    const height =
      ((y2 - y1) / imageHeight) * 100;

    console.log(
      'Bounding box:',
      {
        x1,
        y1,
        x2,
        y2,
      }
    );

    console.log(
      'Image:',
      imageWidth,
      'x',
      imageHeight
    );

    console.log(
      'Percentage:',
      {
        left,
        top,
        width,
        height,
      }
    );

    return {
      position: 'absolute',

      left: `${left}%`,
      top: `${top}%`,

      width: `${width}%`,
      height: `${height}%`,

      border: `4px solid ${
        COLORS[det.damage_type] ||
        '#FF0000'
      }`,

      boxSizing: 'border-box',

      pointerEvents: 'none',

      zIndex: 20,
    };
  }

  // ---------------------------------------------------------
  // REMOVE / RESET
  // ---------------------------------------------------------

  function resetUpload() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  }

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="page">

        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: 60,
          }}
        >

          <span className="spinner"></span>

          <p
            style={{
              marginTop: 16,
              color: '#4a5568',
            }}
          >
            Analysing image...
          </p>

        </div>

      </div>
    );
  }

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

  return (
    <div className="page">

      <h1 className="page-title">
        Upload Road Image
      </h1>

      <p className="page-subtitle">
        Upload a road photo to detect and
        classify surface damage using AI.
      </p>

      {/* =====================================================
          UPLOAD SCREEN
      ===================================================== */}

      {!result ? (

        <div className="card">

          <div
            onDrop={handleDrop}
            onDragOver={e =>
              e.preventDefault()
            }
            onClick={() =>
              fileRef.current?.click()
            }
            style={{
              border:
                '2px dashed #cbd5e0',
              borderRadius: 10,
              padding: 40,
              textAlign: 'center',
              cursor: 'pointer',
              background: '#f7fafc',
            }}
          >

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{
                display: 'none',
              }}
              onChange={handleFile}
            />

            {preview ? (

              <img
                src={preview}
                alt="Preview"
                style={{
                  maxHeight: 280,
                  maxWidth: '100%',
                  borderRadius: 8,
                  objectFit: 'contain',
                }}
              />

            ) : (

              <>
                <div
                  style={{
                    fontSize: 48,
                    marginBottom: 12,
                  }}
                >
                  📷
                </div>

                <p
                  style={{
                    color: '#4a5568',
                    fontWeight: 500,
                  }}
                >
                  Click or drag & drop a
                  road image
                </p>

                <p
                  style={{
                    color: '#a0aec0',
                    fontSize: 13,
                    marginTop: 6,
                  }}
                >
                  JPEG or PNG, max 10MB
                </p>
              </>

            )}

          </div>

          {/* FILE INFORMATION */}

          {file && (

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >

              <span
                style={{
                  fontSize: 13,
                  color: '#718096',
                  flex: 1,
                }}
              >
                {file.name}

                {' '}

                (
                {(
                  file.size /
                  1024 /
                  1024
                ).toFixed(2)}
                {' '}MB)
              </span>

              <button
                className="btn-secondary"
                onClick={e => {
                  e.stopPropagation();
                  resetUpload();
                }}
              >
                Remove
              </button>

            </div>

          )}

          {/* ERROR */}

          {error && (

            <div
              className="error-msg"
              style={{
                marginTop: 12,
              }}
            >
              {error}
            </div>

          )}

          {/* UPLOAD BUTTON */}

          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={!file}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '13px',
              fontSize: 15,
            }}
          >
            Detect Road Damage
          </button>

        </div>

      ) : (

        /* =====================================================
           RESULTS SCREEN
        ===================================================== */

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >

          {/* =================================================
              DETECTION RESULT CARD
          ================================================= */}

          <div className="card">

            {/* HEADER */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >

              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#1F4E79',
                }}
              >
                Detection Results
              </h2>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >

                <button
                  className="btn-secondary"
                  onClick={resetUpload}
                >
                  Upload Another
                </button>

                <button
                  className="btn-primary"
                  onClick={() =>
                    navigate(
                      `/report/${result.inspection_id}`
                    )
                  }
                >
                  View Full Report
                </button>

              </div>

            </div>

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3,1fr)',
                gap: 12,
                marginBottom: 20,
              }}
            >

              {[
                {
                  label:
                    'Total Detections',
                  value:
                    result.total_detections,
                },

                {
                  label: 'Severity',
                  value:
                    result.severity,
                  color:
                    severityColor(
                      result.severity
                    ),
                },

                {
                  label: 'Status',
                  value:
                    result.status
                      ?.toUpperCase(),
                },

              ].map(item => (

                <div
                  key={item.label}
                  style={{
                    background:
                      '#f7fafc',
                    borderRadius: 8,
                    padding:
                      '14px 16px',
                    textAlign:
                      'center',
                  }}
                >

                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color:
                        item.color ||
                        '#1F4E79',
                    }}
                  >
                    {item.value}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color:
                        '#718096',
                      marginTop: 4,
                    }}
                  >
                    {item.label}
                  </div>

                </div>

              ))}

            </div>

            {/* =================================================
                LEGEND
            ================================================= */}

            <div
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                marginBottom: 12,
              }}
            >

              {Object.entries(
                COLORS
              ).map(
                ([cls, color]) => (

                  <div
                    key={cls}
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: 6,
                      fontSize: 12,
                      color:
                        '#4a5568',
                    }}
                  >

                    <div
                      style={{
                        width: 12,
                        height: 12,
                        background:
                          color,
                        borderRadius: 2,
                      }}
                    />

                    {formatDamageType(
                      cls
                    )}

                  </div>

                )
              )}

            </div>

            {/* =================================================
                IMAGE + BOUNDING BOXES
            ================================================= */}

            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent:
                  'center',
                background:
                  '#f7fafc',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >

              <div
                style={{
                  position: 'relative',

                  /*
                   * IMPORTANT:
                   * The container has exactly the same
                   * aspect ratio as the image.
                   */

                  width: '100%',

                  lineHeight: 0,
                }}
              >

                {/* =================================================
                    ACTUAL IMAGE
                ================================================= */}

                <img
                  id="detection-image"
                  src={preview}
                  alt="Detected road damage"
                  style={{
                    display: 'block',

                    width: '100%',

                    height: 'auto',

                    maxWidth: '100%',

                    borderRadius: 8,
                  }}
                />

                {/* =================================================
                    BOUNDING BOXES
                ================================================= */}

                {result.detections?.map(
                  (det, index) => {

                    const box =
                      getBoundingBoxStyle(
                        det
                      );

                    if (!box) {
                      return null;
                    }

                    const color =
                      COLORS[
                        det.damage_type
                      ] ||
                      '#FF0000';

                    const confidence =
                      (
                        Number(
                          det.confidence
                        ) * 100
                      ).toFixed(1);

                    const label =
                      `${formatDamageType(
                        det.damage_type
                      )} ${confidence}%`;

                    return (

                      <div
                        key={index}
                        style={box}
                      >

                        {/* =================================================
                            LABEL
                        ================================================= */}

                        <div
                          style={{
                            position:
                              'absolute',

                            left: -4,

                            top: -32,

                            background:
                              color,

                            color:
                              '#FFFFFF',

                            padding:
                              '5px 9px',

                            borderRadius:
                              4,

                            fontSize:
                              12,

                            fontWeight:
                              700,

                            lineHeight:
                              '18px',

                            whiteSpace:
                              'nowrap',

                            zIndex: 30,
                          }}
                        >
                          {label}
                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            </div>

            {/* =================================================
                DEBUG INFO
            ================================================= */}

            <div
              style={{
                marginTop: 10,
                textAlign: 'center',
                fontSize: 11,
                color: '#718096',
              }}
            >

              Bounding boxes:
              {' '}
              {result.detections?.length || 0}

            </div>

          </div>

          {/* =================================================
              DETECTION TABLE
          ================================================= */}

          <div className="card">

            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#1F4E79',
                marginBottom: 14,
              }}
            >
              Detected Damages (
              {result.detections?.length || 0}
              )
            </h3>

            {result.detections?.length >
            0 ? (

              <table
                style={{
                  width: '100%',
                  borderCollapse:
                    'collapse',
                  fontSize: 14,
                }}
              >

                <thead>

                  <tr
                    style={{
                      background:
                        '#1F4E79',
                      color:
                        'white',
                    }}
                  >

                    {[
                      '#',
                      'Damage Type',
                      'Confidence',
                      'Bounding Box',
                    ].map(h => (

                      <th
                        key={h}
                        style={{
                          padding:
                            '10px 12px',
                          textAlign:
                            'left',
                          fontWeight:
                            500,
                        }}
                      >
                        {h}
                      </th>

                    ))}

                  </tr>

                </thead>

                <tbody>

                  {result.detections.map(
                    (d, i) => (

                      <tr
                        key={i}
                        style={{
                          background:
                            i % 2 ===
                            0
                              ? 'white'
                              : '#f7fafc',

                          borderBottom:
                            '1px solid #e2e8f0',
                        }}
                      >

                        {/* NUMBER */}

                        <td
                          style={{
                            padding:
                              '10px 12px',
                            color:
                              '#718096',
                          }}
                        >
                          {i + 1}
                        </td>

                        {/* DAMAGE TYPE */}

                        <td
                          style={{
                            padding:
                              '10px 12px',
                            fontWeight:
                              500,
                          }}
                        >

                          <span
                            style={{
                              display:
                                'inline-flex',
                              alignItems:
                                'center',
                              gap: 8,
                            }}
                          >

                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius:
                                  2,

                                background:
                                  COLORS[
                                    d.damage_type
                                  ] ||
                                  '#ccc',

                                flexShrink:
                                  0,
                              }}
                            />

                            {formatDamageType(
                              d.damage_type
                            )}

                          </span>

                        </td>

                        {/* CONFIDENCE */}

                        <td
                          style={{
                            padding:
                              '10px 12px',
                          }}
                        >

                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: 8,
                            }}
                          >

                            <div
                              style={{
                                flex: 1,
                                background:
                                  '#e2e8f0',
                                borderRadius:
                                  4,
                                height: 6,
                              }}
                            >

                              <div
                                style={{
                                  width:
                                    `${
                                      Number(
                                        d.confidence
                                      ) *
                                      100
                                    }%`,

                                  background:
                                    COLORS[
                                      d.damage_type
                                    ] ||
                                    '#2E75B6',

                                  height: 6,

                                  borderRadius:
                                    4,
                                }}
                              />

                            </div>

                            <span
                              style={{
                                fontSize:
                                  13,
                                color:
                                  '#4a5568',
                                minWidth:
                                  40,
                              }}
                            >
                              {(
                                Number(
                                  d.confidence
                                ) * 100
                              ).toFixed(
                                1
                              )}
                              %
                            </span>

                          </div>

                        </td>

                        {/* BOUNDING BOX */}

                        <td
                          style={{
                            padding:
                              '10px 12px',
                            color:
                              '#718096',
                            fontSize:
                              12,
                          }}
                        >

                          {d.bounding_box ? (

                            <>
                              (
                              {Number(
                                d.bounding_box
                                  .x1
                              ).toFixed(2)}
                              ,{' '}
                              {Number(
                                d.bounding_box
                                  .y1
                              ).toFixed(2)}
                              )

                              {' → '}

                              (
                              {Number(
                                d.bounding_box
                                  .x2
                              ).toFixed(2)}
                              ,{' '}
                              {Number(
                                d.bounding_box
                                  .y2
                              ).toFixed(2)}
                              )
                            </>

                          ) : (
                            '—'
                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            ) : (

              <div
                style={{
                  textAlign:
                    'center',
                  color:
                    '#718096',
                  padding: 40,
                }}
              >

                <div
                  style={{
                    fontSize: 40,
                    marginBottom: 12,
                  }}
                >
                  ✅
                </div>

                <p
                  style={{
                    fontWeight: 500,
                  }}
                >
                  No damage detected
                  in this image.
                </p>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}