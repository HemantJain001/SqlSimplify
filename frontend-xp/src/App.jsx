import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [schema, setSchema] = useState('')
  const [withExplanation, setWithExplanation] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [windowState, setWindowState] = useState('normal') // normal, maximized, minimized, closed
  const [mode, setMode] = useState('sql-gen') // 'sql-gen' or 'db-assistant'
  
  // RAG related states
  const [useRAG, setUseRAG] = useState(false)
  const [schemas, setSchemas] = useState([])
  const [selectedSchema, setSelectedSchema] = useState('')
  const [showSchemaManager, setShowSchemaManager] = useState(false)
  const [newSchemaName, setNewSchemaName] = useState('')
  const [newSchemaContent, setNewSchemaContent] = useState('')
  const [newSchemaDescription, setNewSchemaDescription] = useState('')
  const [retrievedSchemas, setRetrievedSchemas] = useState([])
  
  // DB Assistant states
  const [dbAction, setDbAction] = useState('analyze')
  const [tableName, setTableName] = useState('')
  const [chatQuestion, setChatQuestion] = useState('')
  const [dbResult, setDbResult] = useState(null)
  const [numRows, setNumRows] = useState(5)
  const [intent, setIntent] = useState('common operations')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadSchemas()
  }, [])

  const loadSchemas = async () => {
    try {
      const response = await axios.get('http://localhost:5000/schemas')
      setSchemas(response.data.schemas || [])
    } catch (err) {
      console.error('Failed to load schemas:', err)
    }
  }

  const handleAddSchema = async () => {
    if (!newSchemaName || !newSchemaContent) {
      alert('Please provide schema name and content')
      return
    }
    
    try {
      await axios.post('http://localhost:5000/schemas', {
        name: newSchemaName,
        schema: newSchemaContent,
        description: newSchemaDescription
      })
      setNewSchemaName('')
      setNewSchemaContent('')
      setNewSchemaDescription('')
      loadSchemas()
      alert('Schema added to knowledge base!')
    } catch (err) {
      alert('Failed to add schema: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleDeleteSchema = async (schemaId) => {
    if (!confirm('Are you sure you want to delete this schema?')) return
    
    try {
      await axios.delete(`http://localhost:5000/schemas/${schemaId}`)
      loadSchemas()
    } catch (err) {
      alert('Failed to delete schema: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleDbAssistant = async () => {
    const selectedSchemaObj = schemas.find(s => s.id === selectedSchema)
    const schemaToUse = selectedSchemaObj?.schema || schema
    
    if (!schemaToUse) {
      setError('Please provide a schema or select one from knowledge base')
      return
    }

    setLoading(true)
    setError(null)
    setDbResult(null)

    try {
      let response
      const schemaName = selectedSchemaObj?.name || 'database'

      switch (dbAction) {
        case 'analyze':
          response = await axios.post('http://localhost:5000/db/analyze', {
            schema: schemaToUse,
            schema_name: schemaName
          })
          break
        case 'describe':
          if (!tableName) {
            setError('Please enter a table name')
            setLoading(false)
            return
          }
          response = await axios.post(`http://localhost:5000/db/table/${tableName}`, {
            schema: schemaToUse
          })
          break
        case 'relationships':
          response = await axios.post('http://localhost:5000/db/relationships', {
            schema: schemaToUse
          })
          break
        case 'suggest':
          response = await axios.post('http://localhost:5000/db/suggest-queries', {
            schema: schemaToUse,
            schema_name: schemaName,
            intent: intent
          })
          break
        case 'sample':
          if (!tableName) {
            setError('Please enter a table name')
            setLoading(false)
            return
          }
          response = await axios.post(`http://localhost:5000/db/sample-data/${tableName}`, {
            schema: schemaToUse,
            num_rows: numRows
          })
          break
        case 'indexes':
          response = await axios.post('http://localhost:5000/db/recommend-indexes', {
            schema: schemaToUse,
            schema_name: schemaName
          })
          break
        case 'chat':
          if (!chatQuestion) {
            setError('Please enter a question')
            setLoading(false)
            return
          }
          response = await axios.post('http://localhost:5000/db/chat', {
            schema: schemaToUse,
            schema_name: schemaName,
            question: chatQuestion
          })
          break
        case 'explain':
          if (!query) {
            setError('Please enter a SQL query to explain')
            setLoading(false)
            return
          }
          response = await axios.post('http://localhost:5000/db/explain-query', {
            query: query,
            schema: schemaToUse
          })
          break
        case 'crud':
          if (!tableName) {
            setError('Please enter a table name')
            setLoading(false)
            return
          }
          response = await axios.post(`http://localhost:5000/db/dummy-commands/${tableName}`, {
            schema: schemaToUse
          })
          break
      }

      setDbResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMinimize = () => {
    setWindowState('minimized')
  }

  const handleMaximize = () => {
    setWindowState(prev => prev === 'maximized' ? 'normal' : 'maximized')
  }

  const handleClose = () => {
    setWindowState('closed')
  }

  const handleTaskbarClick = () => {
    if (windowState === 'minimized') {
      setWindowState('normal')
    } else {
      setWindowState('minimized')
    }
  }

  const handleDesktopIconDoubleClick = () => {
    setWindowState('normal')
  }

  const handleConvert = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setRetrievedSchemas([])

    try {
      const payload = {
        query,
        schema: !useRAG ? schema : '',
        with_explanation: withExplanation,
        use_rag: useRAG,
        schema_id: useRAG && selectedSchema ? selectedSchema : null
      }
      
      const response = await axios.post('http://localhost:5000/convert', payload)
      setResult(response.data)
      
      if (response.data.retrieved_schemas) {
        setRetrievedSchemas(response.data.retrieved_schemas)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="xp-desktop">
      <div 
        className="desktop-icon" 
        onDoubleClick={handleDesktopIconDoubleClick}
      >
        <img src="/vite.svg" alt="icon" />
        <span>SQL Converter</span>
      </div>

      {windowState !== 'closed' && windowState !== 'minimized' && (
        <div className={`xp-window ${windowState === 'maximized' ? 'maximized' : ''}`}>
          <div className="title-bar" onDoubleClick={handleMaximize}>
            <div className="title-bar-text">
              <img src="/vite.svg" alt="icon" className="window-icon" />
              SQL Converter - Microsoft Internet Explorer
            </div>
            <div className="title-bar-controls">
              <button aria-label="Minimize" className="control-btn minimize" onClick={handleMinimize}></button>
              <button aria-label="Maximize" className="control-btn maximize" onClick={handleMaximize}></button>
              <button aria-label="Close" className="control-btn close" onClick={handleClose}></button>
            </div>
          </div>
          
          <div className="menu-bar">
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Favorites</span>
          <span>Tools</span>
          <span>Help</span>
        </div>

        <div className="address-bar">
          <span className="address-label">Address</span>
          <div className="address-input-wrapper">
            <img src="/vite.svg" className="address-icon" />
            <input type="text" value="http://localhost:5000/convert" readOnly className="address-input" />
          </div>
          <button className="go-btn">Go</button>
        </div>

        <div className="window-body">
          <div className="xp-content">
            <div className="sidebar">
              <div className="sidebar-box">
                <div className="sidebar-header">RAG Controls</div>
                <div className="sidebar-content">
                  <label className="xp-checkbox">
                    <input 
                      type="checkbox" 
                      checked={useRAG} 
                      onChange={(e) => setUseRAG(e.target.checked)} 
                    />
                    Enable RAG
                  </label>
                  {useRAG && schemas.length > 0 && (
                    <div style={{marginTop: '10px'}}>
                      <select 
                        value={selectedSchema} 
                        onChange={(e) => setSelectedSchema(e.target.value)}
                        className="xp-select"
                      >
                        <option value="">Auto-detect</option>
                        {schemas.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div 
                    className="task-item" 
                    onClick={() => setShowSchemaManager(!showSchemaManager)}
                    style={{marginTop: '10px', fontWeight: 'bold'}}
                  >
                    📚 Knowledge Base ({schemas.length})
                  </div>
                </div>
              </div>
              <div className="sidebar-box">
                <div className="sidebar-header">SQL Tasks</div>
                <div className="sidebar-content">
                  <div className="task-item">Write Query</div>
                  <div className="task-item">View Schema</div>
                  <div className="task-item">Generate SQL</div>
                </div>
              </div>
            </div>

            <div className="main-area">
              <div className="mode-switcher-xp">
                <button 
                  className={`mode-tab ${mode === 'sql-gen' ? 'active' : ''}`}
                  onClick={() => setMode('sql-gen')}
                >
                  ⚡ SQL Generator
                </button>
                <button 
                  className={`mode-tab ${mode === 'db-assistant' ? 'active' : ''}`}
                  onClick={() => setMode('db-assistant')}
                >
                  🤖 DB Assistant
                </button>
              </div>

              {mode === 'sql-gen' && (
              <>
              <h2 className="xp-heading">Text to SQL Wizard</h2>
              <p className="xp-description">This wizard helps you convert natural language into SQL queries.</p>
              
              {!useRAG && (
                <div className="form-group">
                  <fieldset>
                    <legend>Database Schema</legend>
                    <textarea 
                      value={schema} 
                      onChange={(e) => setSchema(e.target.value)} 
                      placeholder="Enter schema here (e.g. employees(id, name)...)"
                      rows={4}
                      className="xp-input"
                    />
                  </fieldset>
                </div>
              )}
              
              {useRAG && (
                <div className="rag-info-box">
                  <strong>🤖 RAG Mode Active</strong>
                  <p>The system will automatically retrieve relevant schemas from the knowledge base.</p>
                  {selectedSchema && (
                    <p style={{marginTop: '5px'}}>
                      Selected: <strong>{schemas.find(s => s.id === selectedSchema)?.name}</strong>
                    </p>
                  )}
                </div>
              )}

              <div className="form-group">
                <fieldset>
                  <legend>Natural Language Query</legend>
                  <textarea 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="What do you want to know?"
                    rows={3}
                    className="xp-input"
                  />
                </fieldset>
              </div>

              <div className="options-row">
                <label className="xp-checkbox">
                  <input 
                    type="checkbox" 
                    checked={withExplanation} 
                    onChange={(e) => setWithExplanation(e.target.checked)} 
                  />
                  Include Explanation
                </label>
              </div>

              <div className="action-row">
                <button 
                  className="xp-button" 
                  onClick={handleConvert} 
                  disabled={loading || !query.trim()}
                  title="Convert natural language to SQL"
                >
                  {loading ? '⏳ Working...' : '▶ Convert'}
                </button>
              </div>

              {error && (
                <div className="xp-error">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Error.svg/1200px-Error.svg.png" width="32" />
                  <span>{error}</span>
                </div>
              )}

              {result && (
                <div className="xp-result">
                  {retrievedSchemas.length > 0 && (
                    <div className="retrieved-schemas">
                      <div className="result-header">🔍 Retrieved Schemas (RAG)</div>
                      {retrievedSchemas.map((rs, idx) => (
                        <div key={idx} className="schema-badge">
                          <span className="schema-name">{rs.schema.name}</span>
                          <span className="relevance-score">{(rs.score * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="result-header">Generated SQL</div>
                  <pre className="sql-code">{result.sql_query}</pre>
                  
                  {result.explanation && (
                    <>
                      <div className="result-header">Explanation</div>
                      <div className="explanation-text">{result.explanation}</div>
                    </>
                  )}
                </div>
              )}
              </>
              )}

              {mode === 'db-assistant' && (
              <div className="db-assistant-xp">
                <h2 className="xp-heading">Database Assistant</h2>
                <p className="xp-description">Interactive schema exploration and analysis tools.</p>

                <div className="form-group">
                  <fieldset>
                    <legend>Select Action</legend>
                    <select value={dbAction} onChange={(e) => setDbAction(e.target.value)} className="xp-input">
                      <option value="analyze">📊 Analyze Schema</option>
                      <option value="describe">📋 Describe Table</option>
                      <option value="relationships">🔗 Explain Relationships</option>
                      <option value="suggest">💡 Suggest Queries</option>
                      <option value="sample">📝 Generate Sample Data</option>
                      <option value="indexes">⚡ Recommend Indexes</option>
                      <option value="chat">💬 Chat About Schema</option>
                      <option value="explain">🔍 Explain Query</option>
                      <option value="crud">🛠️ Generate CRUD Commands</option>
                    </select>
                  </fieldset>
                </div>

                {useRAG && selectedSchema && (
                  <div className="selected-schema-display">
                    Using Schema: <strong>{schemas.find(s => s.id === selectedSchema)?.name}</strong>
                  </div>
                )}

                {!useRAG && (
                  <div className="form-group">
                    <fieldset>
                      <legend>Database Schema</legend>
                      <textarea 
                        value={schema} 
                        onChange={(e) => setSchema(e.target.value)} 
                        placeholder="Paste your database schema here..."
                        rows={6}
                        className="xp-input"
                      />
                    </fieldset>
                  </div>
                )}

                {(dbAction === 'describe' || dbAction === 'sample' || dbAction === 'crud') && (
                  <div className="form-group">
                    <fieldset>
                      <legend>Table Name</legend>
                      <input
                        type="text"
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        placeholder="e.g., users, products, orders"
                        className="xp-input"
                      />
                    </fieldset>
                  </div>
                )}

                {dbAction === 'sample' && (
                  <div className="form-group">
                    <fieldset>
                      <legend>Number of Rows</legend>
                      <input
                        type="number"
                        value={numRows}
                        onChange={(e) => setNumRows(parseInt(e.target.value))}
                        min="1"
                        max="20"
                        className="xp-input"
                      />
                    </fieldset>
                  </div>
                )}

                {dbAction === 'suggest' && (
                  <div className="form-group">
                    <fieldset>
                      <legend>Intent/Purpose</legend>
                      <input
                        type="text"
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        placeholder="e.g., reporting, analytics"
                        className="xp-input"
                      />
                    </fieldset>
                  </div>
                )}

                {dbAction === 'chat' && (
                  <div className="form-group">
                    <fieldset>
                      <legend>Your Question</legend>
                      <textarea
                        value={chatQuestion}
                        onChange={(e) => setChatQuestion(e.target.value)}
                        placeholder="Ask anything about the database schema..."
                        rows={3}
                        className="xp-input"
                      />
                    </fieldset>
                  </div>
                )}

                {dbAction === 'explain' && (
                  <div className="form-group">
                    <fieldset>
                      <legend>SQL Query to Explain</legend>
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Paste SQL query here..."
                        rows={4}
                        className="xp-input"
                      />
                    </fieldset>
                  </div>
                )}

                <div className="action-row">
                  <button 
                    className="xp-button" 
                    onClick={handleDbAssistant} 
                    disabled={loading}
                    title="Execute database assistant action"
                  >
                    {loading ? '⏳ Processing...' : '▶ Execute'}
                  </button>
                </div>

                {error && (
                  <div className="xp-error">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Error.svg/1200px-Error.svg.png" width="32" />
                    <span>{error}</span>
                  </div>
                )}

                {dbResult && (
                  <div className="xp-result db-result-xp">
                    <div className="result-header">Results</div>
                    
                    {dbAction === 'analyze' && (
                      <div className="db-analysis">
                        <div className="stats-row">
                          <div className="stat-box">
                            <strong>Tables:</strong> {dbResult.total_tables}
                          </div>
                          <div className="stat-box">
                            <strong>Complexity:</strong> {dbResult.complexity}
                          </div>
                        </div>
                        {dbResult.summary && (
                          <div className="info-box">
                            <strong>Summary:</strong>
                            <p>{dbResult.summary}</p>
                          </div>
                        )}
                        {dbResult.tables && dbResult.tables.length > 0 && (
                          <div className="info-box">
                            <strong>Tables:</strong>
                            <ul>
                              {dbResult.tables.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {dbAction === 'describe' && (
                      <div className="table-info">
                        <h3>{dbResult.table_name}</h3>
                        {dbResult.purpose && <p className="purpose-text">{dbResult.purpose}</p>}
                        {dbResult.columns && (
                          <table className="xp-table">
                            <thead>
                              <tr>
                                <th>Column</th>
                                <th>Type</th>
                                <th>Constraints</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dbResult.columns.map((col, i) => (
                                <tr key={i}>
                                  <td>{col.name}</td>
                                  <td>{col.type}</td>
                                  <td>{col.constraints || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {dbResult.sample_row && (
                          <div className="info-box">
                            <strong>Sample Row:</strong>
                            <pre>{JSON.stringify(dbResult.sample_row, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {dbAction === 'relationships' && (
                      <div className="relationships-info">
                        {dbResult.diagram_description && (
                          <div className="info-box">
                            <strong>Overview:</strong>
                            <p>{dbResult.diagram_description}</p>
                          </div>
                        )}
                        {dbResult.relationships && dbResult.relationships.map((rel, i) => (
                          <div key={i} className="rel-item">
                            <span className="rel-from">{rel.from_table}</span>
                            <span className="rel-arrow">→</span>
                            <span className="rel-to">{rel.to_table}</span>
                            <span className="rel-type">({rel.relationship_type})</span>
                            {rel.description && <p>{rel.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {dbAction === 'suggest' && dbResult.queries && (
                      <div className="queries-list-xp">
                        {dbResult.queries.map((q, i) => (
                          <div key={i} className="query-item-xp">
                            <div className="query-title-xp">{i + 1}. {q.title}</div>
                            {q.use_case && <div className="use-case-xp">{q.use_case}</div>}
                            <pre className="sql-code">{q.sql}</pre>
                          </div>
                        ))}
                      </div>
                    )}

                    {dbAction === 'sample' && dbResult.sample_data && (
                      <div className="sample-data-xp">
                        {dbResult.notes && <p>{dbResult.notes}</p>}
                        <div className="table-scroll">
                          <table className="xp-table">
                            <thead>
                              <tr>
                                {dbResult.columns?.map((col, i) => <th key={i}>{col}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {dbResult.sample_data.map((row, i) => (
                                <tr key={i}>
                                  {dbResult.columns?.map((col, j) => (
                                    <td key={j}>{JSON.stringify(row[col])}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {dbAction === 'indexes' && dbResult.recommendations && (
                      <div className="indexes-xp">
                        {dbResult.recommendations.map((rec, i) => (
                          <div key={i} className="index-item">
                            <div className="index-header-xp">
                              <span className={`priority-badge priority-${rec.priority}`}>{rec.priority}</span>
                              <strong>{rec.table}</strong>
                            </div>
                            <div>Columns: {Array.isArray(rec.columns) ? rec.columns.join(', ') : rec.columns}</div>
                            {rec.reason && <p>{rec.reason}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {dbAction === 'chat' && dbResult.answer && (
                      <div className="chat-response">
                        <div className="answer-text">{dbResult.answer}</div>
                      </div>
                    )}

                    {dbAction === 'explain' && (
                      <div className="explanation-xp">
                        {dbResult.plain_english && (
                          <div className="info-box">
                            <strong>What it does:</strong>
                            <p>{dbResult.plain_english}</p>
                          </div>
                        )}
                        {dbResult.breakdown && (
                          <div className="info-box">
                            <strong>Breakdown:</strong>
                            <p>{dbResult.breakdown}</p>
                          </div>
                        )}
                        {dbResult.returns && (
                          <div className="info-box">
                            <strong>Returns:</strong>
                            <p>{dbResult.returns}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {dbAction === 'crud' && (
                      <div className="crud-xp">
                        {dbResult.insert && (
                          <div className="crud-block">
                            <div className="crud-label">INSERT</div>
                            <pre className="sql-code">{dbResult.insert}</pre>
                          </div>
                        )}
                        {dbResult.select && Array.isArray(dbResult.select) && (
                          <div className="crud-block">
                            <div className="crud-label">SELECT</div>
                            {dbResult.select.map((q, i) => (
                              <pre key={i} className="sql-code">{q}</pre>
                            ))}
                          </div>
                        )}
                        {dbResult.update && (
                          <div className="crud-block">
                            <div className="crud-label">UPDATE</div>
                            <pre className="sql-code">{dbResult.update}</pre>
                          </div>
                        )}
                        {dbResult.delete && (
                          <div className="crud-block">
                            <div className="crud-label">DELETE</div>
                            <pre className="sql-code">{dbResult.delete}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="status-bar">
          <div className="status-item">Done</div>
          <div className="status-item right">Internet</div>
        </div>
      </div>
      )}

      <div className="taskbar">
        <button 
          className={`start-button ${isStartOpen ? 'active' : ''}`}
          onClick={() => setIsStartOpen(!isStartOpen)}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png" alt="logo" className="start-logo" />
          start
        </button>
        <div className="taskbar-divider"></div>
        {windowState !== 'closed' && (
          <div 
            className={`taskbar-window ${windowState !== 'minimized' ? 'active' : ''}`}
            onClick={handleTaskbarClick}
          >
            <img src="/vite.svg" alt="icon" />
            SQL Converter
          </div>
        )}
        <div className="system-tray">
          <div className="tray-icons">
            {/* Icons would go here */}
          </div>
          <div className="clock">{formatTime(currentTime)}</div>
        </div>
      </div>
      
      {showSchemaManager && (
        <div className="xp-modal-overlay" onClick={() => setShowSchemaManager(false)}>
          <div className="xp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="title-bar">
              <div className="title-bar-text">
                <img src="/vite.svg" alt="icon" className="window-icon" />
                Schema Knowledge Base Manager
              </div>
              <div className="title-bar-controls">
                <button 
                  aria-label="Close" 
                  className="control-btn close" 
                  onClick={() => setShowSchemaManager(false)}
                ></button>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="schema-form">
                <fieldset>
                  <legend>Add New Schema</legend>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Schema Name (e.g., ecommerce_db)"
                      value={newSchemaName}
                      onChange={(e) => setNewSchemaName(e.target.value)}
                      className="xp-input"
                    />
                  </div>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Description"
                      value={newSchemaDescription}
                      onChange={(e) => setNewSchemaDescription(e.target.value)}
                      className="xp-input"
                    />
                  </div>
                  <div className="form-row">
                    <textarea
                      placeholder="Schema content (tables, columns, relationships...)"
                      value={newSchemaContent}
                      onChange={(e) => setNewSchemaContent(e.target.value)}
                      rows={6}
                      className="xp-input"
                    />
                  </div>
                  <button className="xp-button" onClick={handleAddSchema}>
                    Add to Knowledge Base
                  </button>
                </fieldset>
              </div>
              
              <div className="schema-list">
                <fieldset>
                  <legend>Existing Schemas ({schemas.length})</legend>
                  {schemas.length === 0 ? (
                    <p style={{fontSize: '11px', color: '#666'}}>No schemas in knowledge base yet.</p>
                  ) : (
                    <div className="schema-items">
                      {schemas.map(s => (
                        <div key={s.id} className="schema-item-xp">
                          <div className="schema-info">
                            <strong>{s.name}</strong>
                            {s.description && <p>{s.description}</p>}
                          </div>
                          <button 
                            className="delete-btn" 
                            onClick={() => handleDeleteSchema(s.id)}
                            title="Delete schema"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isStartOpen && (
        <div className="start-menu">
          <div className="start-header">
            <img src="https://github.com/github.png" className="user-avatar" />
            <span className="username">Administrator</span>
          </div>
          <div className="start-body">
            <div className="start-left">
              <div className="start-item">Internet</div>
              <div className="start-item">E-mail</div>
              <div className="start-divider"></div>
              <div className="start-item">Notepad</div>
              <div className="start-item">Paint</div>
            </div>
            <div className="start-right">
              <div className="start-item">My Documents</div>
              <div className="start-item">My Recent Documents</div>
              <div className="start-item">My Pictures</div>
              <div className="start-item">My Music</div>
              <div className="start-item">My Computer</div>
              <div className="start-divider"></div>
              <div className="start-item">Control Panel</div>
              <div className="start-item">Connect To</div>
              <div className="start-item">Printers and Faxes</div>
              <div className="start-divider"></div>
              <div className="start-item">Help and Support</div>
              <div className="start-item">Search</div>
              <div className="start-item">Run...</div>
            </div>
          </div>
          <div className="start-footer">
            <div className="footer-item">Log Off</div>
            <div className="footer-item">Turn Off Computer</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
