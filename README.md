
# Odyssey Luxe - AI Travel Architect

Welcome to Odyssey Luxe, a luxurious travel planning application powered by AI. This project uses Next.js and Google's Gemini to generate personalized, detailed, and optimized travel itineraries.

## Features

- **AI-Powered Itinerary Generation**: Users can input their destination, trip duration, budget, and personal preferences to get a custom travel plan.
- **Detailed Daily Timeline**: The generated itinerary includes a day-by-day breakdown with specific times, activity details, cost estimates, energy levels, and pro tips.
- **Advanced Optimization**: The AI is designed to group nearby attractions, suggest visits during off-peak hours, and balance high-energy activities with rest.
- **Modern & Responsive UI**: A sleek, dark-themed interface built with Tailwind CSS and ShadCN UI components for a seamless experience on all devices.
- **Client-Side Caching**: Generated itineraries are automatically saved in the browser's local storage, so you never lose your plan on a page reload.
- **PDF Export**: Download your complete, styled itinerary as a high-quality PDF to use offline on your travels.
- **Full Authentication System**: Complete user registration and login with Supabase Auth
- **User Profiles**: Manage your personal information - full name, bio, and email
- **Trip History**: Save all your generated itineraries to your personal dashboard
- **Protected Routes**: Only logged-in users can access private pages (AI Architect, My Trips, Profile)
- **Glassmorphism Design**: Beautiful frosted glass aesthetic throughout the app

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit) with Google Gemini
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Setup

1.  **Clone the repository** (or download the source code):
    ```bash
    git clone https://github.com/your-username/odyssey-luxe.git
    cd odyssey-luxe
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Supabase** (New - Required for authentication):
    - Create a Supabase project at [supabase.com](https://supabase.com)
    - Get your Project URL and Anon Key from Settings → API
    - For detailed setup instructions, see [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)

4.  **Set up environment variables**:
    Update the `.env` file in the project root with your Supabase credentials:
    ```env
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
    NEXT_PUBLIC_BASE_URL="http://localhost:9002"
    ```

### Running the Application

You will need to run two separate processes: the Next.js frontend and the Genkit AI server.

1.  **Start the Next.js development server**:
    ```bash
    npm run dev
    ```
    This will start the main application, typically on `http://localhost:9002`.

2.  **Start the Genkit development server**:
    In a new terminal window, run:
    ```bash
    npm run genkit:watch
    ```
    This starts the AI flow server that Next.js will communicate with. It will watch for changes in your AI flow files.

Once both servers are running, you can open your browser to `http://localhost:9002` to see the application in action.

---

## 🔐 Authentication & Database

Odyssey Luxe includes a **complete authentication and database system** powered by Supabase.

### Key Features

- **User Registration & Login**: Email/password authentication
- **User Profiles**: View and edit user information (name, bio)
- **Trip History**: Save and manage all generated itineraries
- **Protected Routes**: Only authenticated users can access AI Architect, My Trips, and Profile
- **Automatic Profile Creation**: User profiles are created automatically on signup

### Quick Start

For detailed setup instructions, including database table creation and Supabase configuration, see [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md).

### Pages

- `/auth/login` - User login page
- `/auth/signup` - User registration page
- `/profile` - User profile settings
- `/my-trips` - User's saved trip history
- `/ai-architect` - AI itinerary generator (protected route)

---

## 🗄️ Database

Two main tables store application data:

### `user_profiles`
Stores user account information:
- `id` - User identifier (from Supabase Auth)
- `email` - User's email address
- `full_name` - User's full name
- `bio` - User's biography
- `created_at` / `updated_at` - Timestamps

### `itineraries`
Stores saved travel itineraries:
- `id` - Itinerary identifier
- `user_id` - Associated user
- `title` - Trip title
- `starting_location` / `ending_location` - Trip locations
- `start_date` / `end_date` - Trip dates
- `budget` - Trip budget
- `itinerary_data` - Complete itinerary JSON
- `created_at` / `updated_at` - Timestamps

---

## 📘 Documentation

- [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) - Complete auth & database setup guide
- [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) - Detailed database SQL and Row Level Security
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Token tracking system guide
- [docs/TOKEN_TRACKING.md](docs/TOKEN_TRACKING.md) - API usage tracking


