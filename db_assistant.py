"""
Database Assistant - Intelligent schema exploration and conversation
"""
import google.generativeai as genai
import re


class DatabaseAssistant:
    """
    Provides conversational interface for database schema exploration,
    analysis, and recommendations without executing actual queries.
    """
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    def analyze_schema(self, schema: str, schema_name: str = "database") -> dict:
        """
        Analyze database schema and extract structured information.
        """
        prompt = f"""
You are a database expert analyzing a schema. Extract the following information from this {schema_name} schema:

Schema:
{schema}

Provide a JSON response with:
1. tables: List of table names
2. total_tables: Count of tables
3. relationships: List of foreign key relationships
4. key_entities: Main business entities identified
5. complexity: Simple/Medium/Complex
6. summary: One sentence description

Format as valid JSON.
"""
        
        try:
            response = self.model.generate_content(prompt)
            # Parse JSON from response
            import json
            text = response.text.strip()
            # Remove markdown code blocks if present
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            analysis = json.loads(text)
            return analysis
        except Exception as e:
            return {
                "error": str(e),
                "tables": [],
                "total_tables": 0,
                "relationships": [],
                "key_entities": [],
                "complexity": "Unknown",
                "summary": "Failed to analyze schema"
            }
    
    def describe_table(self, schema: str, table_name: str) -> dict:
        """
        Provide detailed description of a specific table.
        """
        prompt = f"""
You are a database expert. Given this schema, describe the table '{table_name}' in detail:

Schema:
{schema}

Provide a JSON response with:
1. table_name: The table name
2. columns: List of objects with {{name, type, constraints}}
3. primary_key: Primary key column(s)
4. foreign_keys: List of foreign key relationships
5. purpose: What this table stores (1-2 sentences)
6. sample_row: Example of what a row might look like (JSON object)

Format as valid JSON.
"""
        
        try:
            response = self.model.generate_content(prompt)
            import json
            text = response.text.strip()
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            description = json.loads(text)
            return description
        except Exception as e:
            return {
                "error": str(e),
                "table_name": table_name,
                "columns": [],
                "purpose": "Failed to describe table"
            }
    
    def explain_relationships(self, schema: str) -> dict:
        """
        Explain all relationships in the database schema.
        """
        prompt = f"""
You are a database expert. Analyze the relationships in this schema:

Schema:
{schema}

Provide a JSON response with:
1. relationships: List of objects with {{from_table, to_table, relationship_type (one-to-many, many-to-many, etc), description}}
2. diagram_description: Text description of how tables connect
3. key_joins: Most important join operations users would perform

Format as valid JSON.
"""
        
        try:
            response = self.model.generate_content(prompt)
            import json
            text = response.text.strip()
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            relationships = json.loads(text)
            return relationships
        except Exception as e:
            return {
                "error": str(e),
                "relationships": [],
                "diagram_description": "Failed to analyze relationships"
            }
    
    def suggest_queries(self, schema: str, schema_name: str, intent: str) -> dict:
        """
        Suggest useful queries based on user intent and schema.
        """
        prompt = f"""
You are a database expert. Given this {schema_name} schema and user intent: "{intent}"

Schema:
{schema}

Suggest 5 useful SQL queries that would be commonly needed. For each query provide:
1. title: Brief description of what it does
2. sql: The actual SQL query
3. use_case: When/why to use this query

Format as JSON with a 'queries' array.
"""
        
        try:
            response = self.model.generate_content(prompt)
            import json
            text = response.text.strip()
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            suggestions = json.loads(text)
            return suggestions
        except Exception as e:
            return {
                "error": str(e),
                "queries": []
            }
    
    def get_sample_data(self, schema: str, table_name: str, num_rows: int = 5) -> dict:
        """
        Generate realistic sample data structure for a table.
        """
        prompt = f"""
You are a database expert. Generate {num_rows} realistic sample rows for the '{table_name}' table based on this schema:

Schema:
{schema}

Provide a JSON response with:
1. table_name: The table name
2. columns: Array of column names
3. sample_data: Array of {num_rows} sample row objects with realistic data
4. notes: Brief explanation of the sample data

Format as valid JSON with realistic, varied sample data.
"""
        
        try:
            response = self.model.generate_content(prompt)
            import json
            text = response.text.strip()
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            sample = json.loads(text)
            return sample
        except Exception as e:
            return {
                "error": str(e),
                "table_name": table_name,
                "sample_data": []
            }
    
    def recommend_indexes(self, schema: str, schema_name: str = "database") -> dict:
        """
        Recommend indexes based on schema analysis.
        """
        prompt = f"""
You are a database performance expert. Analyze this {schema_name} schema and recommend indexes:

Schema:
{schema}

Provide a JSON response with:
1. recommendations: Array of objects with {{table, column(s), index_type, reason}}
2. priority: high/medium/low for each recommendation
3. estimated_impact: Expected performance improvement

Focus on commonly queried columns, foreign keys, and frequent WHERE/JOIN conditions.
Format as valid JSON.
"""
        
        try:
            response = self.model.generate_content(prompt)
            import json
            text = response.text.strip()
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            indexes = json.loads(text)
            return indexes
        except Exception as e:
            return {
                "error": str(e),
                "recommendations": []
            }
    
    def chat_about_schema(self, schema: str, schema_name: str, question: str) -> str:
        """
        General conversational interface about database schema.
        """
        prompt = f"""
You are a friendly database expert helping a user understand their {schema_name} database schema.

Schema:
{schema}

User Question: {question}

Provide a clear, helpful answer. If the question involves specific queries, include SQL examples.
Be conversational and educational. If asked about relationships, explain them clearly.
If asked about data, provide example structures or sample queries.
"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"I'm sorry, I encountered an error: {str(e)}"
    
    def explain_query(self, sql_query: str, schema: str = "") -> dict:
        """
        Explain what a SQL query does in plain English.
        """
        prompt = f"""
You are a database expert. Explain this SQL query in simple terms:

Query:
{sql_query}

{f"Schema Context:\n{schema}" if schema else ""}

Provide a JSON response with:
1. plain_english: What the query does in 1-2 sentences
2. breakdown: Step by step explanation of each part
3. returns: What kind of data this query returns
4. performance_notes: Any performance considerations

Format as valid JSON.
"""
        
        try:
            response = self.model.generate_content(prompt)
            import json
            text = response.text.strip()
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            explanation = json.loads(text)
            return explanation
        except Exception as e:
            return {
                "error": str(e),
                "plain_english": "Failed to explain query"
            }
    
    def generate_dummy_commands(self, schema: str, table_name: str) -> dict:
        """
        Generate dummy CRUD commands for interacting with a table (for demonstration).
        """
        prompt = f"""
You are a database expert. Generate example CRUD (Create, Read, Update, Delete) commands for the '{table_name}' table:

Schema:
{schema}

Provide a JSON response with:
1. insert: Sample INSERT statement with realistic data
2. select: Useful SELECT queries (array of 3 examples)
3. update: Sample UPDATE statement
4. delete: Sample DELETE statement
5. notes: Brief explanation of each operation

Format as valid JSON with properly formatted SQL.
"""
        
        try:
            response = self.model.generate_content(prompt)
            import json
            text = response.text.strip()
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            commands = json.loads(text)
            return commands
        except Exception as e:
            return {
                "error": str(e),
                "insert": "",
                "select": [],
                "update": "",
                "delete": ""
            }
