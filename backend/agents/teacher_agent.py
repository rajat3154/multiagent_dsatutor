from controllers.groq_setup import query_groq
from langgraph.prebuilt import create_react_agent
from langchain_community.utilities import GoogleSerperAPIWrapper, WikipediaAPIWrapper, ArxivAPIWrapper
from langchain_groq import ChatGroq
from langchain_core.tools import Tool
import os
from dotenv import load_dotenv
load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0,
)

# Initialize tools
serper = GoogleSerperAPIWrapper()
wikipedia = WikipediaAPIWrapper()
arxiv = ArxivAPIWrapper()

tools = [
    Tool("Google_Serper_Search", func=serper.run, description="Web search"),
    Tool("Wikipedia_Search", func=wikipedia.run, description="Wikipedia summary"),
    Tool("Arxiv_Search", func=arxiv.run, description="Academic papers"),
]

agent = create_react_agent(llm, tools)
def teacher_agent(concept: str, language: str = "python", difficulty: str = "beginner",
                  image_url: str = None, sources: list = None) -> str:
    """Generate a Markdown-formatted explanation for a DSA concept using Groq, referencing image and sources."""

    image_section = f"\nHere is a helpful visual reference for {concept}:\n![{concept}]({image_url})\n" if image_url else ""
    sources_section = ""
    if sources and len(sources) > 0:
        sources_section = "\n### References\n" + "\n".join([f"- [{src['title']}]({src['link']})" for src in sources])

    prompt = f"""
    Explain the Data Structures and Algorithms concept '{concept}' in simple terms.
    Target audience: {difficulty} level.
    Programming Language: {language}.

    Include:
    1. A clear Definition
    2. How it works
    3. A practical example with a code snippet in {language}
    4. 3 key points to remember
    5. Real-world applications

    Also explain with reference to the image (if provided) and mention the sources below for credibility.

    {image_section}
    {sources_section}

    Format your response with clear Markdown headings.
    Use ## for main headings and ### for subheadings.
    Provide code examples in code blocks with proper syntax highlighting for {language}.
    """

    try:
        response = query_groq(prompt)
        return response
    except Exception as e:
        return f"# Error generating explanation\n\nUnable to generate explanation due to: {str(e)}"


from langchain_community.utilities import GoogleSerperAPIWrapper
import os,logging
from dotenv import load_dotenv
load_dotenv()
def fetch_concept_resources(concept: str):
    image_url = None
    sources = []

    try:
        # Web + image search
        image_results = serper.results(concept, type="images")
        if "images" in image_results and len(image_results["images"]) > 0:
            image_url = image_results["images"][0].get("imageUrl")

        text_results = serper.results(concept)
        if "organic" in text_results:
            for item in text_results["organic"][:5]:
                sources.append({"title": item.get("title"), "link": item.get("link")})

    except Exception as e:
        logging.error(f"Error fetching resources: {str(e)}")

    return image_url, sources