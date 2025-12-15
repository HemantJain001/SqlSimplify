import os
from typing import Optional, Dict
from google import genai


class TextToSQLConverter:
    """
    Text → SQL converter using the NEW Google GenAI SDK
    """

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name

    @staticmethod
    def _clean_sql(text: str) -> str:
        """Remove markdown / code fences if model adds them."""
        return (
            text.replace("```sql", "")
                .replace("```", "")
                .strip()
        )

    def _build_prompt(
        self,
        nl_query: str,
        schema: Optional[str],
        with_explanation: bool = False,
    ) -> str:
        prompt = (
            "You are an expert SQL query generator.\n"
            "Generate a syntactically correct SQL query.\n\n"
        )

        if schema:
            prompt += f"Database Schema:\n{schema}\n\n"

        prompt += f"Natural Language Query:\n{nl_query}\n\n"

        if with_explanation:
            prompt += (
                "Return the response in EXACTLY this format:\n"
                "SQL Query: <query>\n"
                "Explanation: <brief explanation>\n"
            )
        else:
            prompt += (
                "Rules:\n"
                "- Return ONLY the SQL query\n"
                "- No explanation\n"
                "- No markdown or code blocks\n"
            )

        return prompt

    def convert_to_sql(
        self,
        natural_language_query: str,
        database_schema: Optional[str] = None,
    ) -> str:
        """Convert natural language to SQL (SQL only)."""
        try:
            prompt = self._build_prompt(
                natural_language_query, database_schema
            )

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )

            return self._clean_sql(response.text)

        except Exception as e:
            return f"Error generating SQL: {e}"

    def convert_with_explanation(
        self,
        natural_language_query: str,
        database_schema: Optional[str] = None,
    ) -> Dict[str, str]:
        """Convert natural language to SQL with explanation."""
        try:
            prompt = self._build_prompt(
                natural_language_query, database_schema, with_explanation=True
            )

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )

            sql_query = ""
            explanation = ""

            for line in response.text.splitlines():
                if line.startswith("SQL Query:"):
                    sql_query = line.replace("SQL Query:", "").strip()
                elif line.startswith("Explanation:"):
                    explanation = line.replace("Explanation:", "").strip()

            return {
                "sql_query": self._clean_sql(sql_query),
                "explanation": explanation,
            }

        except Exception as e:
            return {
                "sql_query": "",
                "explanation": f"Error: {e}",
            }


def main():
    print("=" * 60)
    print("Text → SQL Converter (Gemini – New SDK)")
    print("=" * 60)

    api_key = 'AIzaSyDIlrBND86tSQuOQFY8GjmCxZp7dn0Z2RI'

    converter = TextToSQLConverter(api_key)

    schema = """
    employees(id INT, name VARCHAR, department VARCHAR, salary DECIMAL, hire_date DATE)
    departments(id INT, name VARCHAR, manager_id INT)
    projects(id INT, name VARCHAR, department_id INT, budget DECIMAL, start_date DATE)
    """

    while True:
        print("\n1. Convert Text → SQL")
        print("2. Convert Text → SQL + Explanation")
        print("3. Exit")

        choice = input("Choose (1-3): ").strip()

        if choice == "3":
            print("Goodbye!")
            break

        query = input("Enter natural language query: ").strip()
        if not query:
            print("Query cannot be empty.")
            continue

        if choice == "1":
            print("\nGenerated SQL:\n")
            print(converter.convert_to_sql(query, schema))

        elif choice == "2":
            result = converter.convert_with_explanation(query, schema)
            print("\nGenerated SQL:\n")
            print(result["sql_query"])
            print("\nExplanation:\n")
            print(result["explanation"])
        else:
            print("Invalid choice.")


if __name__ == "__main__":
    main()
