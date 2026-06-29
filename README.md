# Agentic Resume Tailor (ResumeHelper)

Agentic Resume Tailor is an automated workflow that manages a modular "source of truth" for your resume data and uses large language models (LLMs) to tailor that content to specific job descriptions. The application uses a SvelteKit frontend, MongoDB for data storage, and the AI SDK to interact with various AI providers to generate polished, high-quality resumes utilizing JSON Resume themes.

## Features

- **Agentic Tailoring**: Automatically modifies and tailors resume content to match specific job descriptions.
- **Multiple AI Providers**: Built-in support for Google Gemini, OpenAI, OpenRouter, and OpenCode AI.
- **Database Integration**: Stores base resume data and generated outputs securely using MongoDB.
- **Customizable Theming**: Preview and generate output using JSON Resume themes (e.g., Elegant, Flat, Macchiato).

## Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm
- A MongoDB cluster

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment Configuration:**

   Create a `.env` file in the root of your project and populate it with the necessary API keys and configuration values. You can refer to `.env.example` if it exists, or use the following structure:

   ```env
   # Authentication password for accessing the app
   APP_PASSWORD="your_secure_password"

   # MongoDB connection string
   MONGODB_URI="mongodb+srv://<user>:<password>@cluster0..."

   # AI Provider API Keys (Fill in the ones you plan to use)
   OPENAI_API_KEY="sk-..."
   GEMINI_API_KEY="AIza..."
   OPENROUTER_API_KEY="sk-or-v1-..."
   OPENCODE_API_KEY="sk-..."

   # Default AI provider (e.g., "openrouter", "openai", "gemini", "opencode")
   DEFAULT_AI_PROVIDER="openrouter"
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Access the application:**

   Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

## Building for Production

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with:

```bash
npm run preview
```
