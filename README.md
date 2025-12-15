# 🚀 SQL Generator with RAG & Database Assistant

**An intelligent SQL query generator and database exploration tool powered by Google Gemini AI and Retrieval Augmented Generation (RAG).**

---

## ✨ Features

### 🔥 Dual Interface
- **Modern Terminal UI** - Dark theme with syntax highlighting
- **Windows XP Theme** - Nostalgic retro interface

### ⚡ SQL Generator
- Convert natural language to SQL queries
- RAG-powered automatic schema retrieval
- Support for complex queries
- Detailed explanations for generated SQL
- Context-aware query generation

### 🤖 Database Assistant (9 Powerful Tools)
1. **📊 Analyze Schema** - Get insights about your database structure
2. **📋 Describe Table** - View detailed table information with columns & types
3. **🔗 Explain Relationships** - Understand table relationships and joins
4. **💡 Suggest Queries** - Get ready-to-use SQL query suggestions
5. **📝 Generate Sample Data** - Create realistic test data for any table
6. **⚡ Recommend Indexes** - Performance optimization suggestions
7. **💬 Chat About Schema** - Ask questions in natural language
8. **🔍 Explain Query** - Get plain English explanations of SQL queries
9. **🛠️ Generate CRUD Commands** - Complete INSERT, SELECT, UPDATE, DELETE examples

### 🧠 RAG Knowledge Base
- Store multiple database schemas
- Automatic schema retrieval based on query context
- Manual schema selection option
- 4 pre-loaded sample schemas (ecommerce, HR, school, hospital)

---

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.7+
- Node.js 16+
- Google Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))

### Step 1: Clone & Install Dependencies

```powershell
# Navigate to project directory
cd "c:\Users\heman\OneDrive\Desktop\Internship\Code"

# Install Python packages (if not using venv)
pip install google-generativeai flask flask-cors python-dotenv numpy

# Or activate virtual environment
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 2: Configure API Key

Create a `.env` file in the project root:

```powershell
echo "GOOGLE_API_KEY=your_gemini_api_key_here" > .env
```

### Step 3: Start Backend

```powershell
# Using virtual environment
C:/Users/heman/OneDrive/Desktop/Internship/Code/.venv/Scripts/python.exe app.py

# Or regular Python
python app.py
```

You should see:
```
============================================================
Initializing Knowledge Base with Sample Schemas
============================================================
✓ Added schema: ecommerce_db
✓ Added schema: company_hr_db
✓ Added schema: school_management_db
✓ Added schema: hospital_db
============================================================
 * Running on http://127.0.0.1:5000
```

### Step 4: Start Frontend

**Modern Terminal UI:**
```powershell
cd frontend
npm install
npm run dev
```
Open: **http://localhost:5173**

**Windows XP Theme:**
```powershell
cd frontend-xp
npm install
npm run dev
```
Open: **http://localhost:5174**

---

## 📖 Usage Guide

### SQL Generator Mode

1. **Enable RAG** (recommended) for automatic schema retrieval
2. **Enter your query** in natural language
   - Example: "Show all users who registered in the last 30 days"
3. **Check "Include Explanation"** for detailed query breakdown
4. **Click Execute** or press `Ctrl+Enter`

### Database Assistant Mode

1. **Click "🤖 DB Assistant"** tab
2. **Select an action** from dropdown (Analyze, Describe, etc.)
3. **Choose or paste schema:**
   - Enable RAG and select from knowledge base
   - Or paste schema manually
4. **Fill required fields** (table name, question, etc.)
5. **Click Execute**

### Managing Knowledge Base

1. **Click "Manage Knowledge Base"**
2. **View existing schemas** (4 pre-loaded samples)
3. **Add new schema:**
   - Enter name (e.g., "my_project_db")
   - Add description (optional)
   - Paste schema definition
   - Click "Add Schema"
4. **Delete schemas** as needed

---

## 🎯 Example Queries

### SQL Generator Examples

```
"Find all orders over $500 with customer details"
"Show top 10 products by sales"
"List employees in IT department earning above average"
"Get students with GPA above 3.5 enrolled this year"
"Find appointments for next week with doctor names"
```

### Database Assistant Examples

**Analyze Schema:**
- Get total tables, complexity, key entities

**Describe Table:**
- Table: `users`
- Shows: columns, types, constraints, sample row

**Suggest Queries:**
- Intent: "reporting and analytics"
- Returns: 5 useful queries with explanations

**Chat About Schema:**
- Question: "Which tables store customer purchase history?"
- Get: Conversational, educational answer

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend UI   │  (React + Vite)
│  Modern / XP    │
└────────┬────────┘
         │
         ↓ HTTP/REST
┌─────────────────┐
│   Flask API     │  (app.py)
│  - /convert     │  ← SQL Generation
│  - /schemas     │  ← Knowledge Base CRUD
│  - /db/*        │  ← DB Assistant Tools
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ↓          ↓
┌────────┐ ┌────────────┐
│ Gemini │ │ RAG Engine │
│  API   │ │ (schema_kb)│
└────────┘ └────────────┘
```

---

## 🔧 API Endpoints

### SQL Generation
- `POST /convert` - Convert NL to SQL with RAG

### Knowledge Base
- `GET /schemas` - List all schemas
- `POST /schemas` - Add new schema
- `DELETE /schemas/<id>` - Delete schema
- `GET /schemas/<id>` - Get specific schema

### Database Assistant
- `POST /db/analyze` - Analyze schema structure
- `POST /db/table/<name>` - Describe table
- `POST /db/relationships` - Explain relationships
- `POST /db/suggest-queries` - Suggest useful queries
- `POST /db/sample-data/<name>` - Generate sample data
- `POST /db/recommend-indexes` - Recommend indexes
- `POST /db/chat` - Chat about schema
- `POST /db/explain-query` - Explain SQL query
- `POST /db/dummy-commands/<name>` - Generate CRUD

---

## ⌨️ Keyboard Shortcuts

- `Ctrl + Enter` - Execute query (SQL Generator mode)
- `Esc` - Clear error messages
- `Tab` - Navigate between fields

---

## 🎨 Themes

### Modern Terminal
- Dark theme with cyan/green accents
- Fira Code font
- Syntax highlighting
- Smooth animations

### Windows XP
- Classic blue & beige colors
- Tahoma font
- Authentic XP window chrome
- Working window controls (minimize/maximize/close)
- Start menu & taskbar

---

## 📦 Sample Schemas

The application includes 4 pre-loaded schemas:

1. **ecommerce_db** - E-commerce with users, products, orders, payments
2. **company_hr_db** - HR system with employees, departments, projects
3. **school_management_db** - Educational system with students, courses, grades
4. **hospital_db** - Healthcare with patients, doctors, appointments, billing

---

## 🚀 Performance Tips

1. **Use RAG Mode** for better query generation
2. **Enable caching** by selecting specific schema vs auto-detect
3. **Include explanations** only when needed (faster without)
4. **Manage knowledge base** - remove unused schemas

---

## 🐛 Troubleshooting

### Backend won't start
- Check `.env` file has valid API key
- Verify all dependencies installed: `pip list`
- Check port 5000 not in use

### Frontend shows connection error
- Ensure backend is running on port 5000
- Check CORS is enabled in `app.py`
- Verify firewall not blocking connections

### RAG not retrieving schemas
- Check schemas loaded: visit http://localhost:5000/schemas
- Restart backend to auto-load sample schemas
- Verify numpy installed: `pip install numpy`

### Slow response times
- Google Gemini API may have rate limits
- Try with shorter schemas
- Disable explanation for faster generation

---

## 🤝 Contributing

Feel free to:
- Add more sample schemas to `seed_data.py`
- Improve UI/UX
- Add new DB Assistant tools
- Enhance RAG algorithm

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 🌟 Credits

- **AI Model:** Google Gemini 2.0 Flash Exp
- **Frontend:** React 19, Vite 5
- **Backend:** Flask, Python
- **RAG:** Custom implementation with vector embeddings

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API endpoint documentation
3. Ensure all dependencies are installed
4. Verify API key is valid

---

**Made with ❤️ using Google Gemini AI**
