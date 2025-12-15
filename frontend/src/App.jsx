import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [mode, setMode] = useState('sql-gen') // 'sql-gen' or 'db-assistant'
  const [query, setQuery] = useState('')
  const [schema, setSchema] = useState('')
  const [withExplanation, setWithExplanation] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [useRAG, setUseRAG] = useState(true)
  const [schemas, setSchemas] = useState([])
  const [selectedSchema, setSelectedSchema] = useState('')
  const [showSchemaManager, setShowSchemaManager] = useState(false)
  const [newSchemaName, setNewSchemaName] = useState('')
  const [newSchemaContent, setNewSchemaContent] = useState('')
  const [newSchemaDesc, setNewSchemaDesc] = useState('')
  
  // DB Assistant states
  const [dbAction, setDbAction] = useState('analyze') // analyze, describe, relationships, suggest, sample, indexes, chat, explain, crud
  const [tableName, setTableName] = useState('')
  const [chatQuestion, setChatQuestion] = useState('')
  const [dbResult, setDbResult] = useState(null)
  const [numRows, setNumRows] = useState(5)
  const [intent, setIntent] = useState('common operations')

  useEffect(() => {
    loadSchemas()
  }, [])

  const loadSchemas = async () => {
    try {
      const response = await axios.get('http://localhost:5000/schemas')
      setSchemas(response.data.schemas)
    } catch (err) {
      console.error('Error loading schemas:', err)
    }
  }

  const handleConvert = async () => {
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.post('http://localhost:5000/convert', {
        query,
        schema: schema || undefined,
        with_explanation: withExplanation,
        use_rag: useRAG,
        selected_schema: selectedSchema || undefined
      })
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while processing your request')
    } finally {
      setLoading(false)
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
        description: newSchemaDesc
      })
      setNewSchemaName('')
      setNewSchemaContent('')
      setNewSchemaDesc('')
      loadSchemas()
      alert('Schema added successfully!')
    } catch (err) {
      alert('Error adding schema: ' + (err.response?.data?.error || 'Unknown error'))
    }
  }

  const handleDeleteSchema = async (name) => {
    if (!confirm(`Delete schema "${name}"?`)) return

    try {
      await axios.delete(`http://localhost:5000/schemas/${name}`)
      loadSchemas()
      if (selectedSchema === name) {
        setSelectedSchema('')
      }
    } catch (err) {
      alert('Error deleting schema: ' + (err.response?.data?.error || 'Unknown error'))
    }
  }

  const handleDbAssistant = async () => {
    const selectedSchemaObj = schemas.find(s => s.name === selectedSchema)
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

  return (
    <div className="app-wrapper">
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="window-controls">
            <span className="control red"></span>
            <span className="control yellow"></span>
            <span className="control green"></span>
          </div>
          <div className="terminal-title">
            user@dev-machine: ~/{mode === 'sql-gen' ? 'sql-converter' : 'db-assistant'}
          </div>
        </div>
        
        <div className="terminal-body">
          <h1 className="main-title">
            <span className="prompt">&gt;</span> SQL_Generator_RAG<span className="cursor">_</span>
          </h1>

          <div className="mode-switcher">
            <button 
              className={`mode-btn ${mode === 'sql-gen' ? 'active' : ''}`}
              onClick={() => setMode('sql-gen')}
            >
              <span className="icon">⚡</span> SQL Generator
            </button>
            <button 
              className={`mode-btn ${mode === 'db-assistant' ? 'active' : ''}`}
              onClick={() => setMode('db-assistant')}
            >
              <span className="icon">🤖</span> DB Assistant
            </button>
          </div>

          {mode === 'sql-gen' && (
          <>
          <div className="rag-controls">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={useRAG} 
                onChange={(e) => setUseRAG(e.target.checked)} 
              />
              <span className="checkmark"></span>
              <span className="label-text">Use RAG (Auto-retrieve schemas)</span>
            </label>
            
            <button className="schema-btn" onClick={() => setShowSchemaManager(!showSchemaManager)}>
              {showSchemaManager ? 'Hide' : 'Manage'} Knowledge Base
            </button>
          </div>

          {showSchemaManager && (
            <div className="schema-manager">
              <h3 className="section-title">📚 Schema Knowledge Base</h3>
              
              <div className="schema-list">
                <h4>Stored Schemas ({schemas.length})</h4>
                {schemas.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-icon">📚</p>
                    <p className="empty-msg">No schemas stored yet.</p>
                    <p className="empty-hint">Add your first schema below or restart the backend to load sample schemas automatically.</p>
                  </div>
                ) : (
                  <div className="schema-items">
                    {schemas.map((s) => (
                      <div key={s.name} className="schema-item">
                        <div className="schema-info">
                          <strong>{s.name}</strong>
                          {s.description && <p>{s.description}</p>}
                        </div>
                        <div className="schema-actions">
                          <button onClick={() => setSelectedSchema(s.name)} className={selectedSchema === s.name ? 'active' : ''}>
                            {selectedSchema === s.name ? '✓ Selected' : 'Select'}
                          </button>
                          <button onClick={() => handleDeleteSchema(s.name)} className="delete-btn">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="add-schema-form">
                <h4>Add New Schema</h4>
                <input 
                  type="text"
                  placeholder="Schema name (e.g., 'ecommerce_db')"
                  value={newSchemaName}
                  onChange={(e) => setNewSchemaName(e.target.value)}
                  className="schema-input"
                />
                <input 
                  type="text"
                  placeholder="Description (optional)"
                  value={newSchemaDesc}
                  onChange={(e) => setNewSchemaDesc(e.target.value)}
                  className="schema-input"
                />
                <textarea 
                  placeholder="Paste schema definition here..."
                  value={newSchemaContent}
                  onChange={(e) => setNewSchemaContent(e.target.value)}
                  rows={5}
                  className="schema-textarea"
                />
                <button onClick={handleAddSchema} className="add-btn">Add Schema</button>
              </div>
            </div>
          )}
          
          <div className="input-group">
            <label className="code-label">
              <span className="keyword">const</span> manualSchema <span className="operator">=</span>
              <span className="hint">(Optional - leave empty to use RAG)</span>
            </label>
            <textarea 
              className="code-input"
              value={schema} 
              onChange={(e) => setSchema(e.target.value)} 
              placeholder="// Override RAG: Enter schema manually if needed
// Leave empty to let RAG retrieve relevant schemas automatically"
              rows={3}
              spellCheck="false"
            />
          </div>

          <div className="input-group">
            <label className="code-label">
              <span className="keyword">const</span> query <span className="operator">=</span>
            </label>
            <textarea 
              className="code-input"
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey && query.trim()) {
                  e.preventDefault()
                  handleConvert()
                }
              }}
              placeholder="// Enter your natural language query...
// Example: Show me all employees with salary > 50000
// Press Ctrl+Enter to execute"
              rows={3}
              spellCheck="false"
            />
          </div>

          <div className="controls-row">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={withExplanation} 
                onChange={(e) => setWithExplanation(e.target.checked)} 
              />
              <span className="checkmark"></span>
              <span className="label-text">--with-explanation</span>
            </label>

            <button className="run-btn" onClick={handleConvert} disabled={loading || !query.trim()} title="Generate SQL from natural language query">
              {loading ? '⏳ Running...' : '▶ EXECUTE'}
            </button>
          </div>

          {error && (
            <div className="error-console">
              <span className="error-prefix">Error:</span> {error}
            </div>
          )}

          {result && (
            <div className="output-console">
              <div className="output-header">Output Terminal</div>
              
              {result.retrieved_schemas && result.retrieved_schemas.length > 0 && (
                <div className="retrieved-schemas-block">
                  <div className="line">
                    <span className="comment">// RAG Retrieved Schemas (Relevance Scores)</span>
                  </div>
                  {result.retrieved_schemas.map((s, idx) => (
                    <div key={idx} className="retrieved-schema">
                      <span className="schema-badge">
                        {s.name} ({(s.relevance_score * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="code-block">
                <div className="line">
                  <span className="comment">-- Generated SQL Query</span>
                </div>
                <pre className="sql-output">{result.sql_query}</pre>
              </div>
              
              {result.explanation && (
                <div className="explanation-block">
                  <div className="line">
                    <span className="comment">/* Explanation */</span>
                  </div>
                  <p className="explanation-text">{result.explanation}</p>
                </div>
              )}
            </div>
          )}
          </>
          )}

          {mode === 'db-assistant' && (
          <div className="db-assistant-panel">
            <div className="section-header">
              <span className="prompt">$</span> Database Assistant - Interactive Schema Explorer
            </div>

            <div className="db-action-selector">
              <label>Action:</label>
              <select value={dbAction} onChange={(e) => setDbAction(e.target.value)} className="input-field">
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
            </div>

            {useRAG && selectedSchema && (
              <div className="selected-schema-info">
                <span className="prompt">📂</span> Using: <strong>{schemas.find(s => s.name === selectedSchema)?.name}</strong>
              </div>
            )}

            {!useRAG && (
              <div className="input-group">
                <label>
                  <span className="prompt">$</span> Database Schema:
                </label>
                <textarea
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  placeholder="Paste your database schema here..."
                  rows={6}
                  className="input-field"
                />
              </div>
            )}

            {(dbAction === 'describe' || dbAction === 'sample' || dbAction === 'crud') && (
              <div className="input-group">
                <label>
                  <span className="prompt">$</span> Table Name:
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g., users, products, orders"
                  className="input-field"
                />
              </div>
            )}

            {dbAction === 'sample' && (
              <div className="input-group">
                <label>
                  <span className="prompt">$</span> Number of Rows:
                </label>
                <input
                  type="number"
                  value={numRows}
                  onChange={(e) => setNumRows(parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="input-field"
                />
              </div>
            )}

            {dbAction === 'suggest' && (
              <div className="input-group">
                <label>
                  <span className="prompt">$</span> Intent/Purpose:
                </label>
                <input
                  type="text"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="e.g., reporting, analytics, user management"
                  className="input-field"
                />
              </div>
            )}

            {dbAction === 'chat' && (
              <div className="input-group">
                <label>
                  <span className="prompt">$</span> Your Question:
                </label>
                <textarea
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  placeholder="Ask anything about the database schema..."
                  rows={3}
                  className="input-field"
                />
              </div>
            )}

            {dbAction === 'explain' && (
              <div className="input-group">
                <label>
                  <span className="prompt">$</span> SQL Query to Explain:
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Paste SQL query here..."
                  rows={4}
                  className="input-field"
                />
              </div>
            )}

            <button
              onClick={handleDbAssistant}
              disabled={loading}
              className="execute-btn"
            >
              <span className="prompt">$</span> {loading ? 'Processing...' : 'Execute'}
            </button>

            {error && (
              <div className="error-message">
                <span className="prompt">✗</span> {error}
              </div>
            )}

            {dbResult && (
              <div className="db-result-panel">
                <div className="result-header">
                  <span className="prompt">✓</span> Results:
                </div>
                <div className="result-content">
                  {/* Analyze Results */}
                  {dbAction === 'analyze' && (
                    <div className="analysis-result">
                      <div className="stat-grid">
                        <div className="stat-item">
                          <span className="stat-label">Total Tables:</span>
                          <span className="stat-value">{dbResult.total_tables}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Complexity:</span>
                          <span className="stat-value">{dbResult.complexity}</span>
                        </div>
                      </div>
                      {dbResult.summary && (
                        <div className="summary-box">
                          <strong>Summary:</strong>
                          <p>{dbResult.summary}</p>
                        </div>
                      )}
                      {dbResult.tables && dbResult.tables.length > 0 && (
                        <div className="list-box">
                          <strong>Tables ({dbResult.tables.length}):</strong>
                          <ul>
                            {dbResult.tables.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      )}
                      {dbResult.key_entities && dbResult.key_entities.length > 0 && (
                        <div className="list-box">
                          <strong>Key Entities:</strong>
                          <ul>
                            {dbResult.key_entities.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Table Description */}
                  {dbAction === 'describe' && (
                    <div className="table-description">
                      <h3>{dbResult.table_name}</h3>
                      {dbResult.purpose && <p className="purpose">{dbResult.purpose}</p>}
                      {dbResult.columns && (
                        <div className="columns-list">
                          <strong>Columns:</strong>
                          <table className="data-table">
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
                        </div>
                      )}
                      {dbResult.sample_row && (
                        <div className="sample-row">
                          <strong>Sample Row:</strong>
                          <pre>{JSON.stringify(dbResult.sample_row, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Relationships */}
                  {dbAction === 'relationships' && (
                    <div className="relationships-result">
                      {dbResult.diagram_description && (
                        <div className="diagram-desc">
                          <strong>Overview:</strong>
                          <p>{dbResult.diagram_description}</p>
                        </div>
                      )}
                      {dbResult.relationships && dbResult.relationships.length > 0 && (
                        <div className="relationships-list">
                          <strong>Relationships:</strong>
                          {dbResult.relationships.map((rel, i) => (
                            <div key={i} className="relationship-item">
                              <span className="from-table">{rel.from_table}</span>
                              <span className="arrow">→</span>
                              <span className="to-table">{rel.to_table}</span>
                              <span className="rel-type">({rel.relationship_type})</span>
                              {rel.description && <p>{rel.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Query Suggestions */}
                  {dbAction === 'suggest' && dbResult.queries && (
                    <div className="queries-list">
                      {dbResult.queries.map((q, i) => (
                        <div key={i} className="query-suggestion">
                          <div className="query-title">{i + 1}. {q.title}</div>
                          {q.use_case && <div className="use-case">{q.use_case}</div>}
                          <pre className="sql-code">{q.sql}</pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sample Data */}
                  {dbAction === 'sample' && dbResult.sample_data && (
                    <div className="sample-data-result">
                      {dbResult.notes && <p className="notes">{dbResult.notes}</p>}
                      <div className="table-wrapper">
                        <table className="data-table">
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

                  {/* Index Recommendations */}
                  {dbAction === 'indexes' && dbResult.recommendations && (
                    <div className="indexes-result">
                      {dbResult.recommendations.map((rec, i) => (
                        <div key={i} className="index-recommendation">
                          <div className="index-header">
                            <span className={`priority priority-${rec.priority}`}>[{rec.priority}]</span>
                            <span className="table-name">{rec.table}</span>
                          </div>
                          <div className="index-details">
                            <strong>Columns:</strong> {Array.isArray(rec.columns) ? rec.columns.join(', ') : rec.columns}
                          </div>
                          {rec.index_type && <div className="index-type">Type: {rec.index_type}</div>}
                          {rec.reason && <div className="reason">{rec.reason}</div>}
                          {rec.estimated_impact && <div className="impact">Impact: {rec.estimated_impact}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chat Answer */}
                  {dbAction === 'chat' && dbResult.answer && (
                    <div className="chat-answer">
                      <div className="answer-content">{dbResult.answer}</div>
                    </div>
                  )}

                  {/* Query Explanation */}
                  {dbAction === 'explain' && (
                    <div className="query-explanation">
                      {dbResult.plain_english && (
                        <div className="plain-english">
                          <strong>What it does:</strong>
                          <p>{dbResult.plain_english}</p>
                        </div>
                      )}
                      {dbResult.breakdown && (
                        <div className="breakdown">
                          <strong>Breakdown:</strong>
                          <p>{dbResult.breakdown}</p>
                        </div>
                      )}
                      {dbResult.returns && (
                        <div className="returns">
                          <strong>Returns:</strong>
                          <p>{dbResult.returns}</p>
                        </div>
                      )}
                      {dbResult.performance_notes && (
                        <div className="performance">
                          <strong>Performance Notes:</strong>
                          <p>{dbResult.performance_notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CRUD Commands */}
                  {dbAction === 'crud' && (
                    <div className="crud-commands">
                      {dbResult.notes && <p className="notes">{dbResult.notes}</p>}
                      {dbResult.insert && (
                        <div className="crud-section">
                          <div className="crud-header">INSERT (Create)</div>
                          <pre className="sql-code">{dbResult.insert}</pre>
                        </div>
                      )}
                      {dbResult.select && Array.isArray(dbResult.select) && (
                        <div className="crud-section">
                          <div className="crud-header">SELECT (Read)</div>
                          {dbResult.select.map((q, i) => (
                            <pre key={i} className="sql-code">{q}</pre>
                          ))}
                        </div>
                      )}
                      {dbResult.update && (
                        <div className="crud-section">
                          <div className="crud-header">UPDATE (Modify)</div>
                          <pre className="sql-code">{dbResult.update}</pre>
                        </div>
                      )}
                      {dbResult.delete && (
                        <div className="crud-section">
                          <div className="crud-header">DELETE (Remove)</div>
                          <pre className="sql-code">{dbResult.delete}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {dbResult.error && (
                    <div className="error-message">
                      <span className="prompt">✗</span> {dbResult.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
