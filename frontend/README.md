# Frontend - AgileSAFe AI Platform

React application built with Vite, Tailwind CSS, and modern React libraries.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **React Query (TanStack Query)** - Data fetching and caching
- **Zustand** - State management
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Environment Setup

Copy the example file and create a `.env` file:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API and socket services
├── store/         # Zustand stores
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
└── App.jsx        # Main app component
```

