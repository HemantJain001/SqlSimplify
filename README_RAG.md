# SQL Converter with RAG Pipeline

A powerful SQL query generator that uses Retrieval Augmented Generation (RAG) to automatically retrieve relevant database schemas and generate complex queries.

## 🚀 Features

### Core Functionality
- **Natural Language to SQL**: Convert plain English queries into SQL
- **RAG Pipeline**: Automatically retrieves relevant schemas from a knowledge base
- **Schema Management**: Store and manage multiple database schemas
- **Smart Context**: Uses vector embeddings to find the most relevant schemas for your query

### RAG Pipeline Architecture
```
User Query → Embedding → Vector Search → Top-K Schemas → Context → LLM → SQL Query
```

## 📦 Installation

1. **Install Python Dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set up Environment Variables**:
Create a `.env` file:
```
GEMINI_API_KEY=your_api_key_here
```

3. **Start the Backend**:
```bash
python app.py
```

4. **Start the Frontend** (Modern Theme):
```bash
cd frontend
npm install
npm run dev
```

5. **Start the XP Frontend** (Optional):
```bash
cd frontend-xp
npm install
npm run dev
```

## 🎯 How to Use

### 1. Add Schemas to Knowledge Base
Click "Manage Knowledge Base" and add your database schemas:
- **Name**: e.g., "ecommerce_db"
- **Description**: Brief description to help with retrieval
- **Schema**: Your table definitions

Example:
```sql
users(id INT, name VARCHAR, email VARCHAR, created_at TIMESTAMP)
orders(id INT, user_id INT, total DECIMAL, status VARCHAR, created_at TIMESTAMP)
products(id INT, name VARCHAR, price DECIMAL, stock INT)
```

### 2. Enable RAG
Check "Use RAG" to automatically retrieve relevant schemas based on your query.

### 3. Write Your Query
Just type in natural language:
- "Show me all orders from last month"
- "Find users who spent more than $1000"
- "List top 10 products by sales"

### 4. Get Results
The system will:
1. Find relevant schemas from your knowledge base
2. Show which schemas were used (with relevance scores)
3. Generate the SQL query
4. Optionally explain the query

## 🧠 RAG Pipeline Details

### Vector Embeddings
- Uses Google's `text-embedding-004` model
- Embeds schema name + description + definition
- Stores embeddings in local JSON file

### Retrieval Process
1. User query is embedded
2. Cosine similarity calculated against all stored schemas
3. Top-K most relevant schemas retrieved
4. Schemas combined as context for LLM

### Benefits
- **No manual schema entry**: System remembers all your databases
- **Smart retrieval**: Only relevant tables are used
- **Complex queries**: Works across multiple related schemas
- **Scalable**: Add unlimited schemas to knowledge base

## 🛠️ API Endpoints

### SQL Conversion
```
POST /convert
Body: {
  "query": "your natural language query",
  "use_rag": true,
  "with_explanation": false,
  "selected_schema": "optional_specific_schema"
}
```

### Schema Management
```
GET /schemas - List all schemas
POST /schemas - Add new schema
GET /schemas/<name> - Get specific schema
DELETE /schemas/<name> - Delete schema
```

## 📊 Architecture

```
Frontend (React)
    ↓
Flask API (app.py)
    ↓
├─→ SchemaKnowledgeBase (RAG)
│   ├─ Vector Embeddings
│   ├─ Similarity Search
│   └─ Schema Retrieval
│
└─→ TextToSQLConverter
    └─ Gemini AI (Query Generation)
```

## 💡 Use Cases

1. **Complex Database Analysis**: Query multiple related tables without remembering exact structure
2. **Multi-Database Management**: Store schemas from different projects
3. **Team Collaboration**: Share schema knowledge base with team
4. **Learning Tool**: See how natural language maps to SQL
5. **Query Optimization**: Get explanations for generated queries

## 🔧 Configuration

Edit `schema_kb.py` to customize:
- `top_k`: Number of schemas to retrieve (default: 3)
- Embedding model: Change model name
- Storage path: Change JSON file location

## 🎨 UI Themes

### Modern Terminal Theme (frontend/)
- Dark theme with terminal aesthetics
- Syntax highlighting
- Code editor feel

### Windows XP Theme (frontend-xp/)
- Nostalgic classic Windows design
- Bliss wallpaper background
- Internet Explorer window style

## 📝 Example Workflow

```
1. Add ecommerce schema:
   - users, orders, products tables

2. Query: "Show me users who made orders worth more than $500"

3. RAG retrieves:
   - ecommerce_db (95% relevance)

4. Generated SQL:
   SELECT u.* FROM users u
   JOIN orders o ON u.id = o.user_id
   GROUP BY u.id
   HAVING SUM(o.total) > 500
```

## 🔐 Security Notes

- API key stored in `.env` file (not committed)
- Schema data stored locally in `schema_kb.json`
- No external database required
- CORS enabled for local development

## 🤝 Contributing

Feel free to:
- Add new embedding models
- Improve retrieval algorithms
- Add more UI themes
- Enhance query generation

## 📄 License

MIT License - Feel free to use in your projects!
