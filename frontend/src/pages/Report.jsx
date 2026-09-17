import { useState, useEffect } from 'react';
import {
  useParams,
  useNavigate,
} from 'react-router-dom';

import {
  getInspection,
  downloadReport,
} from '../services/api';

const COLORS = {
  longitudinal_crack: '#2E75B6',
  transverse_crack: '#27AE60',
  alligator_crack: '#E74C3C',
  pothole: '#F39C12',
};

const IMAGE_BASE =
  'http://localhost:8000/uploads';

export default function Report() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [downloading, setDownloading] =
    useState(false);

  const [error, setError] =
    useState('');

  // Actual image dimensions
  const [imageSize, setImageSize] =
    useState({
      width: 1,
      height: 1,
    });

  useEffect(() => {
    getInspection(id)
      .then(res => {
        console.log(
          'Inspection response:',
          res.data
        );

        setData(res.data);
      })
      .catch(err => {
        console.error(err);
        setError(
          'Failed to load inspection.'
        );
      })
      .finally(() =>
        setLoading(false)
      );
  }, [id]);

  async function handleDownload() {
    setDownloading(true);

    try {
      const res =
        await downloadReport(id);

      const url =
        URL.createObjectURL(
          new Blob(
            [res.data],
            {
              type:
                'application/pdf',
            }
          )
        );

      const a =
        document.createElement(
          'a'
        );

      a.href = url;

      a.download =
        `report_${id.slice(
          0,
          8
        )}.pdf`;

      document.body.appendChild(a);

      a.click();

      a.remove();

      URL.revokeObjectURL(url);

    } catch (err) {

      console.error(err);

      setError(
        'Failed to download report.'
      );

    } finally {

      setDownloading(false);

    }
  }

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

  function formatDamageType(type) {
    if (!type) return 'Unknown';

    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      );
  }

  function getImageUrl(image_url) {
    if (!image_url) return null;

    const filename =
      image_url
        .replace(/\\/g, '/')
        .split('/')
        .pop();

    return `${IMAGE_BASE}/${filename}`;
  }

  function handleImageLoad(e) {
    const img = e.target;

    console.log(
      'Report image size:',
      img.naturalWidth,
      'x',
      img.naturalHeight
    );

    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  }

  if (loading) {
    return (
      <div
        className="page"
        style={{
          textAlign: 'center',
          paddingTop: 60,
        }}
      >
        <span className="spinner"></span>
        {' '}Loading report...
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">

        <div className="error-msg">
          {error}
        </div>

        <button
          className="btn-secondary"
          style={{
            marginTop: 12,
          }}
          onClick={() =>
            navigate('/history')
          }
        >
          Back to History
        </button>

      </div>
    );
  }

  if (!data) {
    return null;
  }

  const imageUrl =
    getImageUrl(data.image_url);

  return (
    <div className="page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems:
            'flex-start',
          marginBottom: 24,
        }}
      >

        <div>

          <h1 className="page-title">
            Inspection Report
          </h1>

          <p
            className="page-subtitle"
            style={{
              fontFamily:
                'monospace',
            }}
          >
            ID: {id}
          </p>

        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >

          <button
            className="btn-secondary"
            onClick={() =>
              navigate('/history')
            }
          >
            ← Back
          </button>

          <button
            className="btn-primary"
            onClick={
              handleDownload
            }
            disabled={
              downloading
            }
          >
            {downloading ? (
              <>
                <span className="spinner"></span>
                Downloading...
              </>
            ) : (
              '⬇ Download PDF'
            )}
          </button>

        </div>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3,1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >

        {[
          {
            label:
              'Total Detections',
            value:
              data.total_detections,
          },
          {
            label: 'Severity',
            value:
              data.severity,
            color:
              severityColor(
                data.severity
              ),
          },
          {
            label: 'Status',
            value:
              data.status?.toUpperCase(),
          },
        ].map(item => (

          <div
            key={item.label}
            className="card"
            style={{
              textAlign:
                'center',
            }}
          >

            <div
              style={{
                fontSize: 28,
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
                fontSize: 13,
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

      {/* =====================================================
          INSPECTED IMAGE
      ===================================================== */}

      {imageUrl && (

        <div
          className="card"
          style={{
            marginBottom: 16,
          }}
        >

          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#1F4E79',
              marginBottom: 12,
            }}
          >
            Inspected Image
          </h3>

          {/* Colour legend */}
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
                    display:
                      'flex',
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
              IMAGE CONTAINER
          ================================================= */}

          <div
            style={{
              position:
                'relative',
              width: '100%',
              aspectRatio:
                imageSize.width >
                  1 &&
                imageSize.height >
                  1
                  ? `${imageSize.width} / ${imageSize.height}`
                  : '16 / 9',
              overflow:
                'hidden',
              borderRadius: 8,
              background:
                '#f7fafc',
            }}
          >

            {/* Original image */}
            <img
              src={imageUrl}
              alt="Inspected road"
              onLoad={
                handleImageLoad
              }
              style={{
                position:
                  'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit:
                  'contain',
                display:
                  'block',
              }}
            />

            {/* =================================================
                SVG DETECTION OVERLAY
            ================================================= */}

            {imageSize.width >
              1 &&
              imageSize.height >
                1 && (

              <svg
                viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                preserveAspectRatio="none"
                style={{
                  position:
                    'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents:
                    'none',
                }}
              >

                {data.detections?.map(
                  (
                    det,
                    index
                  ) => {

                    if (
                      !det.bounding_box
                    ) {
                      return null;
                    }

                    const x1 =
                      Number(
                        det
                          .bounding_box
                          .x1
                      );

                    const y1 =
                      Number(
                        det
                          .bounding_box
                          .y1
                      );

                    const x2 =
                      Number(
                        det
                          .bounding_box
                          .x2
                      );

                    const y2 =
                      Number(
                        det
                          .bounding_box
                          .y2
                      );

                    const width =
                      x2 - x1;

                    const height =
                      y2 - y1;

                    const color =
                      COLORS[
                        det
                          .damage_type
                      ] ||
                      '#FF0000';

                    const label =
                      `${formatDamageType(
                        det.damage_type
                      )} ${(
                        Number(
                          det.confidence
                        ) * 100
                      ).toFixed(1)}%`;

                    return (
                      <g
                        key={
                          index
                        }
                      >

                        {/* Bounding box */}
                        <rect
                          x={x1}
                          y={y1}
                          width={
                            width
                          }
                          height={
                            height
                          }
                          fill="none"
                          stroke={
                            color
                          }
                          strokeWidth="5"
                          vectorEffect="non-scaling-stroke"
                        />

                        {/* Label */}
                        <rect
                          x={x1}
                          y={Math.max(
                            0,
                            y1 -
                              32
                          )}
                          width={Math.max(
                            145,
                            label.length *
                              8
                          )}
                          height="32"
                          rx="4"
                          fill={
                            color
                          }
                        />

                        <text
                          x={
                            x1 +
                            8
                          }
                          y={Math.max(
                            21,
                            y1 -
                              10
                          )}
                          fill="white"
                          fontSize="16"
                          fontWeight="bold"
                        >
                          {
                            label
                          }
                        </text>

                      </g>
                    );
                  }
                )}

              </svg>

            )}

          </div>

        </div>

      )}

      {/* =====================================================
          INSPECTION DETAILS
      ===================================================== */}

      <div
        className="card"
        style={{
          marginBottom: 16,
        }}
      >

        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1F4E79',
            marginBottom: 12,
          }}
        >
          Inspection Details
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: 10,
            fontSize: 14,
          }}
        >

          {[
            [
              'Date',
              data.inspected_at
                ? new Date(
                    data.inspected_at
                  ).toLocaleString()
                : '—',
            ],
            [
              'Image file',
              data.image_url
                ? data.image_url
                    .replace(
                      /\\/g,
                      '/'
                    )
                    .split('/')
                    .pop()
                : '—',
            ],
            [
              'Notes',
              data.notes ||
                '—',
            ],
          ].map(
            ([label, value]) => (

              <div key={label}>

                <span
                  style={{
                    color:
                      '#718096',
                    fontSize: 12,
                  }}
                >
                  {label}
                </span>

                <div
                  style={{
                    color:
                      '#1a202c',
                    marginTop: 2,
                  }}
                >
                  {value}
                </div>

              </div>

            )
          )}

        </div>

      </div>

      {/* =====================================================
          DETECTION RESULTS TABLE
      ===================================================== */}

      <div className="card">

        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1F4E79',
            marginBottom: 14,
          }}
        >
          Detection Results (
          {data.detections?.length ||
            0}
          )
        </h3>

        {!data.detections ||
        data.detections.length ===
          0 ? (

          <p
            style={{
              color:
                '#718096',
              textAlign:
                'center',
              padding: 24,
            }}
          >
            No damage detected.
          </p>

        ) : (

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
                  color: 'white',
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

              {data.detections.map(
                (d, i) => (

                  <tr
                    key={i}
                    style={{
                      background:
                        i % 2 === 0
                          ? 'white'
                          : '#f7fafc',
                      borderBottom:
                        '1px solid #e2e8f0',
                    }}
                  >

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
                              width: `${
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
                            fontSize: 13,
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

                    <td
                      style={{
                        padding:
                          '10px 12px',
                        color:
                          '#718096',
                        fontSize: 12,
                      }}
                    >

                      {d.bounding_box ? (
                        <>
                          (
                          {Number(
                            d
                              .bounding_box
                              .x1
                          ).toFixed(
                            1
                          )}
                          ,{' '}
                          {Number(
                            d
                              .bounding_box
                              .y1
                          ).toFixed(
                            1
                          )}
                          ) → (
                          {Number(
                            d
                              .bounding_box
                              .x2
                          ).toFixed(
                            1
                          )}
                          ,{' '}
                          {Number(
                            d
                              .bounding_box
                              .y2
                          ).toFixed(
                            1
                          )}
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

        )}

      </div>

    </div>
  );
}