import json
import os
from typing import List, Dict, Tuple
from google import genai
import numpy as np


class SchemaKnowledgeBase:
    """
    Knowledge Base for storing and retrieving database schemas using RAG.
    """
    
    def __init__(self, api_key: str, storage_path: str = "schema_kb.json"):
        self.client = genai.Client(api_key=api_key)
        self.storage_path = storage_path
        self.schemas: List[Dict] = []
        self.load_schemas()
    
    def load_schemas(self):
        """Load schemas from disk."""
        if os.path.exists(self.storage_path):
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                self.schemas = json.load(f)
    
    def save_schemas(self):
        """Save schemas to disk."""
        with open(self.storage_path, 'w', encoding='utf-8') as f:
            json.dump(self.schemas, f, indent=2)
    
    def get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using Gemini API."""
        try:
            result = self.client.models.embed_content(
                model='models/text-embedding-004',
                content=text
            )
            return result.embeddings[0].values
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return []
    
    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if not a or not b:
            return 0.0
        a_np = np.array(a)
        b_np = np.array(b)
        return float(np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np)))
    
    def add_schema(self, name: str, schema: str, description: str = ""):
        """Add a new schema to the knowledge base."""
        # Create embedding for schema + description
        text_to_embed = f"{name}\n{description}\n{schema}"
        embedding = self.get_embedding(text_to_embed)
        
        schema_entry = {
            "name": name,
            "schema": schema,
            "description": description,
            "embedding": embedding
        }
        
        # Check if schema with same name exists, update if so
        for i, s in enumerate(self.schemas):
            if s["name"] == name:
                self.schemas[i] = schema_entry
                self.save_schemas()
                return
        
        self.schemas.append(schema_entry)
        self.save_schemas()
    
    def delete_schema(self, name: str) -> bool:
        """Delete a schema by name."""
        for i, s in enumerate(self.schemas):
            if s["name"] == name:
                self.schemas.pop(i)
                self.save_schemas()
                return True
        return False
    
    def list_schemas(self) -> List[Dict]:
        """List all schemas (without embeddings for efficiency)."""
        return [
            {
                "name": s["name"],
                "description": s["description"],
                "schema": s["schema"]
            }
            for s in self.schemas
        ]
    
    def retrieve_relevant_schemas(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        Retrieve the most relevant schemas for a given query using RAG.
        """
        if not self.schemas:
            return []
        
        # Get query embedding
        query_embedding = self.get_embedding(query)
        if not query_embedding:
            return []
        
        # Calculate similarities
        similarities = []
        for schema in self.schemas:
            similarity = self.cosine_similarity(query_embedding, schema["embedding"])
            similarities.append((similarity, schema))
        
        # Sort by similarity and get top_k
        similarities.sort(reverse=True, key=lambda x: x[0])
        
        # Return top_k schemas without embeddings
        return [
            {
                "name": s["name"],
                "description": s["description"],
                "schema": s["schema"],
                "relevance_score": sim
            }
            for sim, s in similarities[:top_k]
        ]
    
    def get_schema_by_name(self, name: str) -> Dict:
        """Get a specific schema by name."""
        for s in self.schemas:
            if s["name"] == name:
                return {
                    "name": s["name"],
                    "description": s["description"],
                    "schema": s["schema"]
                }
        return None
