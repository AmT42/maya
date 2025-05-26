# Maya Document Scanner

Document scanning application with a React Native mobile front‑end and FastAPI back‑end.

## Requirements
- Docker & Docker Compose
- Node.js ≥16
- Python 3.9
- Xcode (for iOS)

## Backend Setup
1. Create a `.env` file and set:
   - `DATABASE_URL` – database connection string
   - `SECRET_KEY`
   - `OPENAI_API_KEY`
   - `GOOGLE_CREDENTIALS_PATH` (Google Vision)
   - `GOOGLE_CREDENTIALS_SA_PATH` (service account)
   - `GOOGLE_CREDENTIALS_CALENDAR_PATH` (Calendar credentials)
   - `ADMIN`, `POSTGRES_PASSWORD`, etc.
2. Run `docker-compose up --build`.

The API is reachable on `http://localhost:8000`.

## Mobile App (React Native)
1. `cd mobileApp`
2. `npm install`
3. `npx pod-install ios`
4. Update API URLs in `src/utils` and `src/screens` to point to the backend (e.g., `http://localhost:8000`).
5. `npm start` (Metro)
6. `npm run ios` (launch iOS simulator)

## Usage
- Register or log in from the mobile app.
- Scan documents; the backend performs OCR and LLM analysis and stores data in Postgres and ChromaDB.
- Use the search bar to query documents.