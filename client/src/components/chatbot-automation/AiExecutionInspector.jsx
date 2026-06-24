import React, { useState, useEffect } from 'react'
import { apiRequest } from '../../shared/api'

function AiExecutionInspector({ token, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await apiRequest('/api/chatbot-automation/ai-execution-logs', { token })
      if (res?.success) {
        setLogs(res.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch AI logs', err)
    } finally {
      setLoading(false)
    }
  }

  const formatJSON = (str) => {
    if (!str) return {}
    try {
      return typeof str === 'string' ? JSON.parse(str) : str
    } catch {
      return { raw: str }
    }
  }

  return (
    <div
      className="flow-tester-panel animate-slide-left"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '640px',
        height: '100%',
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        zIndex: 90,
        pointerEvents: 'auto'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1e293b'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            🔍 AI Execution Inspector
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            Trace Vector RAG retrievals, merged contexts, system prompts, and responses.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchLogs}
            style={{
              background: '#334155',
              border: 'none',
              borderRadius: '6px',
              color: '#f8fafc',
              padding: '6px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content Split */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Logs List */}
        <div
          style={{
            width: selectedLog ? '240px' : '100%',
            borderRight: selectedLog ? '1px solid #1e293b' : 'none',
            overflowY: 'auto',
            padding: '12px',
            background: '#090d16',
            transition: 'width 0.3s ease'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Loading execution logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No recent AI executions found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.map((log) => {
                const llm = formatJSON(log.llm_call)
                const isSuccess = formatJSON(log.result)?.success
                const isSelected = selectedLog?.id === log.id

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isSelected ? '#1e293b' : '#1e293b40',
                      border: isSelected ? '1px solid #3b82f6' : '1px solid #1e293b',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>{log.node_id}</span>
                      <span style={{ color: isSuccess ? '#10b981' : '#ef4444' }}>
                        {isSuccess ? '● PASS' : '● FAIL'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      "{log.user_input}"
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Detailed View */}
        {selectedLog && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                Pipeline Trace: <span style={{ color: '#3b82f6' }}>{selectedLog.execution_id}</span>
              </h4>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Close Trace ✕
              </button>
            </div>

            {/* Pipeline Step 1: Question */}
            <div style={{ background: '#1e293b50', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Question / User Input
              </div>
              <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontStyle: 'italic' }}>
                "{selectedLog.user_input}"
              </div>
            </div>

            {/* Pipeline Step 2: Retrieved Documents & Chunks */}
            <div style={{ background: '#1e293b50', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                Retrieved Documents & Chunks
              </div>

              {(() => {
                const vec = formatJSON(selectedLog.vector_retrieval)
                const kw = formatJSON(selectedLog.keyword_retrieval)
                const merged = formatJSON(selectedLog.merged_context)
                const llm = formatJSON(selectedLog.llm_call)

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* RAG Parameters */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.7rem', padding: '8px', background: '#090d16', borderRadius: '6px', border: '1px solid #1e293b' }}>
                      <div>Model: <strong style={{ color: '#f8fafc' }}>{llm.embeddingModel || 'gemini-embedding-001'}</strong></div>
                      <div>Dimensions: <strong style={{ color: '#f8fafc' }}>{llm.embeddingDims || 768}</strong></div>
                      <div style={{ gridColumn: 'span 2' }}>
                        Retrieval Latency: <strong style={{ color: '#3b82f6' }}>{llm.retrievalLatencyMs !== undefined ? `${llm.retrievalLatencyMs}ms` : '—'}</strong>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                        Vector Search: <strong style={{ color: vec.vectorSearchExecuted ? '#10b981' : '#64748b' }}>{vec.vectorSearchExecuted ? 'EXECUTED' : 'SKIPPED'}</strong>
                      </div>
                      {vec.vectorSearchExecuted && vec.topChunks && vec.topChunks.map((chunk, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', padding: '6px 8px', background: '#090d16', borderLeft: '3px solid #10b981', borderRadius: '4px', margin: '4px 0' }}>
                          <div style={{ color: '#10b981', fontWeight: 600 }}>Score: {parseFloat(vec.similarityScores[idx] || 0).toFixed(4)}</div>
                          <div style={{ color: '#cbd5e1' }}>{chunk}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                        Keyword Search: <strong style={{ color: kw.keywordSearchExecuted ? '#f59e0b' : '#64748b' }}>{kw.keywordSearchExecuted ? 'EXECUTED' : 'SKIPPED'}</strong>
                      </div>
                      {kw.keywordSearchExecuted && kw.paragraphScores && kw.paragraphScores.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', padding: '6px 8px', background: '#090d16', borderLeft: '3px solid #f59e0b', borderRadius: '4px', margin: '4px 0' }}>
                          <div style={{ color: '#f59e0b', fontWeight: 600 }}>Doc: {item.title} (Match Score: {item.score})</div>
                          <div style={{ color: '#cbd5e1' }}>{item.paragraph}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, margin: '8px 0 4px 0', textTransform: 'uppercase' }}>
                        Hybrid Ranked Chunks (Top Selected)
                      </div>
                      {merged.finalChunksSelected && merged.finalChunksSelected.length > 0 ? (
                        merged.finalChunksSelected.map((chunk, idx) => {
                          const isObj = typeof chunk === 'object' && chunk !== null
                          const textContent = isObj ? chunk.content || chunk.text : chunk
                          const title = isObj ? chunk.title : 'Document'
                          const type = isObj ? chunk.type : 'legacy'
                          
                          return (
                            <div key={idx} style={{ fontSize: '0.75rem', padding: '8px 12px', background: '#1e293b', borderRadius: '6px', margin: '8px 0', border: '1px solid #334155', color: '#f1f5f9' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>Chunk ID: {isObj && chunk.chunk_id ? chunk.chunk_id : '—'}</span>
                                <span style={{ textTransform: 'uppercase', fontSize: '9px', padding: '2px 6px', background: type === 'vector' ? '#10b98120' : type === 'keyword' ? '#f59e0b20' : '#8b5cf620', color: type === 'vector' ? '#10b981' : type === 'keyword' ? '#f59e0b' : '#a78bfa', borderRadius: '4px' }}>
                                  {type}
                                </span>
                              </div>
                              
                              <div style={{ color: '#cbd5e1', fontStyle: 'italic', marginBottom: '8px' }}>
                                "{textContent}"
                              </div>

                              {isObj && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.68rem', color: '#94a3b8' }}>
                                  <div>Vector: <span style={{ color: '#10b981', fontWeight: 600 }}>{parseFloat(chunk.vectorScore || 0).toFixed(4)}</span></div>
                                  <div>Keyword: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{parseFloat(chunk.keywordScore || 0).toFixed(4)}</span></div>
                                  <div>Freshness: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{parseFloat(chunk.freshnessScore || 0).toFixed(4)}</span></div>
                                  <div style={{ marginLeft: 'auto' }}>Final: <span style={{ color: '#f8fafc', fontWeight: 700 }}>{parseFloat(chunk.finalScore || 0).toFixed(4)}</span></div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>No chunks retrieved.</div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Pipeline Step 3: Final System Prompt */}
            <div style={{ background: '#1e293b50', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Final System Prompt Context
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  background: '#090d16',
                  padding: '8px',
                  borderRadius: '6px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  color: '#94a3b8',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}
              >
                {formatJSON(selectedLog.llm_call)?.systemPrompt}
              </pre>
            </div>

            {/* Pipeline Step 4: LLM Call Details */}
            <div style={{ background: '#1e293b50', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Gemini LLM Call Details
              </div>
              {(() => {
                const llm = formatJSON(selectedLog.llm_call)
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                    <div>Provider: <strong style={{ color: '#f8fafc' }}>{llm.provider}</strong></div>
                    <div>Model: <strong style={{ color: '#f8fafc' }}>{llm.model}</strong></div>
                    <div>Tokens Estimate: <strong style={{ color: '#f8fafc' }}>{llm.tokenEstimate}</strong></div>
                    <div>Latency: <strong style={{ color: '#f8fafc' }}>{llm.latency}ms</strong></div>
                  </div>
                )
              })()}
            </div>

            {/* Pipeline Step 5: Gemini Response */}
            <div style={{ background: '#1e293b50', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Gemini Response
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  background: '#090d16',
                  padding: '10px',
                  borderRadius: '6px',
                  color: '#10b981',
                  fontWeight: 600,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {formatJSON(selectedLog.flow_builder)?.aiResponseValue || 'No response returned.'}
              </div>
            </div>

            {/* Pipeline Step 6: Flow Output / Send Message payload */}
            <div style={{ background: '#1e293b50', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Flow Output
              </div>
              {(() => {
                const fb = formatJSON(selectedLog.flow_builder)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px' }}>Variables Generated:</div>
                      <pre style={{ margin: 0, fontSize: '0.7rem', background: '#090d16', padding: '8px', borderRadius: '4px', color: '#e2e8f0' }}>
                        {JSON.stringify(fb.variablesGenerated || {}, null, 2)}
                      </pre>
                    </div>
                    {fb.sendMessagePayload && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px' }}>Send Message Node Payload:</div>
                        <pre style={{ margin: 0, fontSize: '0.7rem', background: '#090d16', padding: '8px', borderRadius: '4px', color: '#38bdf8' }}>
                          {JSON.stringify(fb.sendMessagePayload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AiExecutionInspector
