
# Odyssey Luxe - AI Travel Architect

Welcome to Odyssey Luxe, a luxurious travel planning application powered by AI. This project uses Next.js and Google's Gemini to generate personalized, detailed, and optimized travel itineraries.

## Features

- **AI-Powered Itinerary Generation**: Users can input their destination, trip duration, budget, and personal preferences to get a custom travel plan.
- **Detailed Daily Timeline**: The generated itinerary includes a day-by-day breakdown with specific times, activity details, cost estimates, energy levels, and pro tips.
- **Advanced Optimization**: The AI is designed to group nearby attractions, suggest visits during off-peak hours, and balance high-energy activities with rest.
- **Modern & Responsive UI**: A sleek, dark-themed interface built with Tailwind CSS and ShadCN UI components for a seamless experience on all devices.
- **Client-Side Caching**: Generated itineraries are automatically saved in the browser's local storage, so you never lose your plan on a page reload.
- **PDF Export**: Download your complete, styled itinerary as a high-quality PDF to use offline on your travels.

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

3.  **Set up environment variables**:
    Create a new file named `.env` in the root of the project and add your Gemini API key:
    ```env
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
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
