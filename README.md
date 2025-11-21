# Sehat Link - Healthcare Platform with AI-Powered Appointments

A modern healthcare platform built with Next.js featuring AI-powered appointment transcription and structured data extraction.

## 🌟 Features

- **AI-Powered Appointments**: Live audio transcription using Deepgram STT
- **Structured Data Extraction**: Automatic extraction of appointment details with OpenAI
- **Real-time Transcription**: See transcription as you speak
- **Database Integration**: Automatic storage in Supabase
- **Beautiful UI**: Modern, responsive interface with Framer Motion animations
- **Medicine Reminders**: Track and manage medications
- **Agent Visualization**: Multi-agent health assistant system
- **Disease Distribution Map**: Real-time disease tracking across Pakistan with Google Maps integration

## 🚀 Quick Start

See [QUICK_START.md](./QUICK_START.md) for a 5-minute setup guide.

### Prerequisites

- Node.js 18+ installed
- Deepgram API key ([Get one here](https://console.deepgram.com/))
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables (see [ENV_SETUP.md](./ENV_SETUP.md) and [DISEASE_MAP_SETUP.md](./DISEASE_MAP_SETUP.md)):

Create a `.env.local` file:

```bash
DEEPGRAM_API_KEY=your_deepgram_key_here
OPENAI_API_KEY=your_openai_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation

- **[QUICK_START.md](./QUICK_START.md)**: Get started in 5 minutes
- **[APPOINTMENT_SYSTEM.md](./APPOINTMENT_SYSTEM.md)**: Comprehensive appointment system documentation
- **[DISEASE_MAP_SETUP.md](./DISEASE_MAP_SETUP.md)**: Disease map setup and configuration guide
- **[ENV_SETUP.md](./ENV_SETUP.md)**: Environment setup instructions
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)**: Developer reference and API documentation
- **[SYSTEM_FLOW.md](./SYSTEM_FLOW.md)**: Visual system flow and architecture diagrams
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**: Complete implementation details
- **[SAMPLE_DATA_STRUCTURE.md](./SAMPLE_DATA_STRUCTURE.md)**: Example data structures and API responses

## 🏥 Appointment System

The appointment system allows doctors to:
1. Click on any appointment to open the appointment page
2. Start recording the appointment conversation
3. See live transcription in real-time
4. Automatically extract structured data (symptoms, diagnosis, prescription, etc.)
5. Save all data to Supabase database

For detailed information, see [APPOINTMENT_SYSTEM.md](./APPOINTMENT_SYSTEM.md).

## 🗺️ Disease Distribution Map

The doctor dashboard includes a real-time disease tracking map that:
1. Displays a map of Pakistan using Google Maps Static API
2. Shows markers for disease reports from different cities
3. Uses different colors for different disease types
4. Provides statistics and recent reports table
5. Fetches data from Supabase `disease_report` table

For setup instructions, see [DISEASE_MAP_SETUP.md](./DISEASE_MAP_SETUP.md).

## ⚙️ Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Maps**: Google Maps Static API
- **STT**: Deepgram API
- **AI**: OpenAI GPT-4
- **Audio**: MediaRecorder API

## 🎯 What's New

This project includes a complete AI-powered appointment system with:
- ✅ Live audio recording and transcription
- ✅ Automatic extraction of symptoms, diagnosis, prescriptions
- ✅ Real-time status updates and error handling
- ✅ Automatic database storage
- ✅ Beautiful, modern UI with animations

## 📦 What's Included

- 4 API routes for appointment management
- Complete appointment recording interface
- 12 new database fields for appointment data
- Comprehensive documentation (8 guides)
- Full TypeScript support
- Production-ready error handling

## 🚨 Important Notes

- Requires microphone permissions in browser
- Works on localhost or HTTPS only (browser security)
- Deepgram and OpenAI API keys required
- See [ENV_SETUP.md](./ENV_SETUP.md) for configuration

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
