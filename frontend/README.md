
  # Sportsfolio

  This is a code bundle for Sportsfolio. The original project is available at https://www.figma.com/design/jgcqQPjpcb00MePwQk4c1Q/Sportsfolio.

  ## Setup

  1. Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```

  2. Update the `.env` file:
     - For local backend: `VITE_API_URL=http://localhost:8000`
     - For remote backend: `VITE_API_URL=https://your-api-url.com`

  3. **Important**: Restart the dev server after changing `.env`

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Environment Variables

  - `VITE_API_URL` - Backend API URL
    - Local: `http://localhost:8000` (uses Vite proxy)
    - Remote: `https://your-api.com` (direct connection)
  - `VITE_API_BASE_PATH` - API base path (default: `/api/v1`)
  
  **Note**: You must restart the dev server (`npm run dev`) after changing environment variables.