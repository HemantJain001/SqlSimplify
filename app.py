from flask import Flask, request, jsonify
from flask_cors import CORS
from text_to_sql import TextToSQLConverter
from schema_kb import SchemaKnowledgeBase
from db_assistant import DatabaseAssistant
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the converter and knowledge base
# Expecting GOOGLE_API_KEY or GEMINI_API_KEY in environment variables
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
converter = None
knowledge_base = None
db_assistant = None
if api_key:
    converter = TextToSQLConverter(api_key=api_key)
    knowledge_base = SchemaKnowledgeBase(api_key=api_key)
    db_assistant = DatabaseAssistant(api_key=api_key)
    
    # Initialize with sample schemas if knowledge base is empty
    from seed_data import initialize_knowledge_base
    if len(knowledge_base.schemas) == 0:
        initialize_knowledge_base(knowledge_base)

@app.route('/convert', methods=['POST'])
def convert():
    global converter, knowledge_base
    data = request.json
    
    if not converter:
        # Try to get key from request if not in env
        req_api_key = data.get('api_key')
        if req_api_key:
            converter = TextToSQLConverter(api_key=req_api_key)
            knowledge_base = SchemaKnowledgeBase(api_key=req_api_key)
        else:
            return jsonify({"error": "API Key not configured"}), 500

    nl_query = data.get('query')
    manual_schema = data.get('schema')
    with_explanation = data.get('with_explanation', False)
    use_rag = data.get('use_rag', True)  # Enable RAG by default
    selected_schema = data.get('selected_schema')  # Specific schema name

    if not nl_query:
        return jsonify({"error": "Query is required"}), 400

    # Determine which schema to use
    schema = manual_schema
    retrieved_schemas = []
    
    if use_rag and knowledge_base and not manual_schema:
        if selected_schema:
            # Use specific schema by name
            schema_obj = knowledge_base.get_schema_by_name(selected_schema)
            if schema_obj:
                schema = schema_obj['schema']
                retrieved_schemas = [schema_obj]
        else:
            # Retrieve relevant schemas using RAG
            retrieved_schemas = knowledge_base.retrieve_relevant_schemas(nl_query, top_k=3)
            if retrieved_schemas:
                # Combine top schemas into context
                schema = "\n\n".join([
                    f"-- {s['name']}: {s['description']}\n{s['schema']}"
                    for s in retrieved_schemas
                ])

    try:
        if with_explanation:
            result = converter.convert_with_explanation(nl_query, schema)
            result['retrieved_schemas'] = retrieved_schemas
            return jsonify(result)
        else:
            sql = converter.convert_to_sql(nl_query, schema)
            return jsonify({
                "sql_query": sql,
                "retrieved_schemas": retrieved_schemas
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Schema Management Endpoints
@app.route('/schemas', methods=['GET'])
def list_schemas():
    """List all schemas in the knowledge base."""
    if not knowledge_base:
        return jsonify({"error": "Knowledge base not initialized"}), 500
    
    schemas = knowledge_base.list_schemas()
    return jsonify({"schemas": schemas})

@app.route('/schemas', methods=['POST'])
def add_schema():
    """Add a new schema to the knowledge base."""
    if not knowledge_base:
        return jsonify({"error": "Knowledge base not initialized"}), 500
    
    data = request.json
    name = data.get('name')
    schema = data.get('schema')
    description = data.get('description', '')
    
    if not name or not schema:
        return jsonify({"error": "Name and schema are required"}), 400
    
    try:
        knowledge_base.add_schema(name, schema, description)
        return jsonify({"message": "Schema added successfully", "name": name})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/schemas/<name>', methods=['DELETE'])
def delete_schema(name):
    """Delete a schema from the knowledge base."""
    if not knowledge_base:
        return jsonify({"error": "Knowledge base not initialized"}), 500
    
    try:
        success = knowledge_base.delete_schema(name)
        if success:
            return jsonify({"message": f"Schema '{name}' deleted successfully"})
        else:
            return jsonify({"error": f"Schema '{name}' not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/schemas/<name>', methods=['GET'])
def get_schema(name):
    """Get a specific schema by name."""
    if not knowledge_base:
        return jsonify({"error": "Knowledge base not initialized"}), 500
    
    schema = knowledge_base.get_schema_by_name(name)
    if schema:
        return jsonify(schema)
    else:
        return jsonify({"error": f"Schema '{name}' not found"}), 404

# Database Assistant Endpoints
@app.route('/db/analyze', methods=['POST'])
def analyze_schema():
    """Analyze a database schema and extract structured information."""
    if not db_assistant:
        return jsonify({"error": "Database assistant not initialized"}), 500
    
    data = request.json
    schema = data.get('schema')
    schema_name = data.get('schema_name', 'database')
    
    if not schema:
        return jsonify({"error": "Schema is required"}), 400
    
    try:
        analysis = db_assistant.analyze_schema(schema, schema_name)
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/db/table/<table_name>', methods=['POST'])
def describe_table(table_name):
    """Get detailed description of a specific table."""
    if not db_assistant:
        return jsonify({"error": "Database assistant not initialized"}), 500
    
    data = request.json
    schema = data.get('schema')
    
    if not schema:
        return jsonify({"error": "Schema is required"}), 400
    
    try:
        description = db_assistant.describe_table(schema, table_name)
        return jsonify(description)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/db/relationships', methods=['POST'])
def explain_relationships():
    """Explain relationships in the database schema."""
    if not db_assistant:
        return jsonify({"error": "Database assistant not initialized"}), 500
    
    data = request.json
    schema = data.get('schema')
    
    if not schema:
        return jsonify({"error": "Schema is required"}), 400
    
    try:
        relationships = db_assistant.explain_relationships(schema)
        return jsonify(relationships)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/db/suggest-queries', methods=['POST'])
def suggest_queries():
    """Suggest useful queries based on schema and user intent."""
    if not db_assistant:
        return jsonify({"error": "Database assistant not initialized"}), 500
    
    data = request.json
    schema = data.get('schema')
    schema_name = data.get('schema_name', 'database')
    intent = data.get('intent', 'common operations')
    
    if not schema:
        return jsonify({"error": "Schema is required"}), 400
    
    try:
        suggestions = db_assistant.suggest_queries(schema, schema_name, intent)
        return jsonify(suggestions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/db/sample-data/<table_name>', methods=['POST'])
def get_sample_data(table_name):
    """Generate sample data for a table."""
    if not db_assistant:
        return jsonify({"error": "Database assistant not initialized"}), 500
    
    data = request.json
    schema = data.get('schema')
    num_rows = data.get('num_rows', 5)
    
    if not schema:
        return jsonify({"error": "Schema is required"}), 400
    
    try:
        sample = db_assistant.get_sample_data(schema, table_name, num_rows)
        return jsonify(sample)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/db/recommend-indexes', methods=['POST'])
def recommend_indexes():
    """Recommend indexes for the schema."""
    if not db_assistant:
        return jsonify({"error": "Database assistant not initialized"}), 500
    
    data = request.json
    schema = data.get('schema')
    schema_name = data.get('schema_name', 'database')
    
    if not schema:
        return jsonify({"error": "Schema is required"}), 400
    
    try:
        indexes = db_assistant.recommend_indexes(schema, schema_name)
        return jsonify(indexes)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/db/chat', methods=['POST'])
def chat_about_schema():
    """Conversational interface for schema questions."""
    if not db_assistant:
        return jsonify({"error": "Database assistant not initialized"}), 500
    
    data = request.json
    schema = data.get('schema')
    schema_name = data.get('schema_name', 'database')
    question = data.get('question')
    
    if not schema or not question:
        return jsonify({"error": "Schema and question are required"}), 400
    
    try:
        answer = db_assistant.chat_about_schema(schema, schema_name, question)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/db/explain-query', methods=['POST'])
def explain_query():
    """Explain a SQL query in plain English."""
    if not db_assistant:
        return jsonify({"error": "Database assistant not initialized"}), 500
    
    data = request.json
    sql_query = data.get('query')
    schema = data.get('schema', '')
    
    if not sql_query:
        return jsonify({"error": "Query is required"}), 400
    
    try:
        explanation = db_assistant.explain_query(sql_query, schema)
        return jsonify(explanation)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/db/dummy-commands/<table_name>', methods=['POST'])
def generate_dummy_commands(table_name):
    """Generate dummy CRUD commands for a table."""
    if not db_assistant:
        return jsonify({"error": "Database assistant not initialized"}), 500
    
    data = request.json
    schema = data.get('schema')
    
    if not schema:
        return jsonify({"error": "Schema is required"}), 400
    
    try:
        commands = db_assistant.generate_dummy_commands(schema, table_name)
        return jsonify(commands)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
