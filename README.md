# Conntour Space Explorer – Home Assignment

## Overview

Build a small web application that allows users to explore and search a set of images retrieved from NASA. The goal is to create a smooth and intelligent experience for browsing and querying these images.

---

## Requirements

1. **Browse Images**  
   - Users should be able to view all the images retrieved from the `/sources` API.  
   - The browsing experience should be clear, visually friendly, and support viewing image metadata.

2. **Search Using Natural Language**  
   - Users should be able to type free-text queries (e.g., _“images of Mars rovers”_, _“solar flares”_).  
   - The app should return a list of images that match the query, with a **confidence score** shown per result.

3. **Search History**  
   - The app should keep a history of previous user searches and the images that were returned.  
   - Users should be able to revisit past queries and view their results again.
   - Users should be able to **delete individual searches** from their history.
   - Since history can grow large over time, the UI should **support pagination** or an alternative way to handle large result sets efficiently.

---

## Notes & Suggestions

- **Implementing real machine learning or NLP is _not_ required.**  
  You can simulate search relevance and confidence scores using a basic scoring method, such as keyword overlap or a hash function.

- There is **no need to use a persistent database**.  
  You can store data in-memory, or write to a **JSON file** if you prefer persisting data between runs.

- Focus on building an intuitive and well-structured user experience.

- Bonus points for adding filtering, pagination, or authentication — but those are not required.

---



## Project Structure
```
space-explorer/
├── backend/           # FastAPI backend
│   ├── app.py        # Main FastAPI application
│   └── data/         # Mock data
├── frontend/         # React frontend
│   ├── src/         # Source files
│   └── public/      # Static files
└── README.md        # This file
```

## Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn
- uv (Python package installer)

## Setup Instructions

### Backend Setup
1. Install uv if you haven't already:
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Create and activate virtual environment using uv:
   ```bash
   uv venv
   source .venv/bin/activate  # On Unix/MacOS
   # OR
   .venv\Scripts\activate     # On Windows
   ```
4. Install dependencies using uv:
   ```bash
   uv pip install -r requirements.txt
   ```
5. Run the FastAPI server with Uvicorn:
   ```bash
   uvicorn app:app --reload --port 5000
   ```
   The backend will run on http://localhost:5000

   - The API docs are available at http://localhost:5000/docs

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The frontend will run on http://localhost:3000

## Deliverables

- A GitHub repository with your implementation. (Fork this one if you'd like)

## Use Your Own Stack (Optional)
If you prefer, you are **not required** to fork or use this repository. You may build your own stack—language, framework, and tooling of your choice—so long as your solution:

1. Implements the *Browse Images*, *Search*, and *Search History* features described above, and
2. Consumes the public **NASA Images API** (see official docs: <https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf>).

Feel free to organize your codebase however you like and push it to a new repository.