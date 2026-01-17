# Event Hub - AI-Powered Event Companion

![Event Hub Logo](public/placeholder-logo.svg)

> Transform your event experience with AI-powered networking, personalized agendas, and intelligent recommendations that connect you with the right people and sessions.

## 🚀 Overview

Event Hub is an intelligent event companion platform that revolutionizes how attendees experience conferences, workshops, and networking events. By leveraging AI technology, it provides personalized recommendations, smart networking opportunities, and real-time assistance to maximize your event value.

### Key Features

- **🤖 AI-Powered Onboarding**: Upload your LinkedIn profile to automatically extract interests and skills
- **📅 Personalized Agenda**: Get intelligent session recommendations based on your professional interests
- **👥 Smart Networking**: Connect with relevant attendees through AI-powered matching
- **💬 AI Concierge**: 24/7 intelligent assistant for event navigation and support
- **📊 Real-time Analytics**: Track your event engagement and networking success
- **🎨 Modern UI**: Beautiful, responsive design with dark/light theme support

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Shadcn/UI
- **Fonts**: Geist Sans & Mono
- **Icons**: Lucide React
- **Charts**: Recharts
- **Carousel**: Embla Carousel

### Backend & APIs
- **Runtime**: Node.js
- **AI Integration**: Google Gemini AI
- **File Processing**: PDF parsing with pdf-parse
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: React hooks

### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Build Tool**: Next.js built-in bundler

## 📁 Project Structure

```
event-companion/
├── app/                          # Next.js App Router pages
│   ├── api/                     # API routes
│   │   └── profile-skills/      # LinkedIn PDF analysis endpoint
│   ├── agenda/                  # Personalized agenda page
│   ├── chat/                    # AI concierge chat interface
│   ├── dashboard/               # Main dashboard
│   ├── login/                   # Authentication page
│   ├── networking/              # Networking hub
│   ├── onboarding/              # User onboarding flow
│   ├── settings/                # User settings
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── components/                  # Reusable UI components
│   ├── ui/                      # Shadcn/UI components
│   ├── chat-widget.tsx          # Floating chat widget
│   ├── navigation.tsx           # Main navigation
│   └── theme-provider.tsx       # Theme context
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions
├── public/                      # Static assets
├── styles/                      # Additional stylesheets
└── test/                        # Test data and files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Google Gemini API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-companion
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Optional: Google Gemini AI integration
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_GEMINI_MODEL=gemini-2.5-flash
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 User Journey

### 1. Landing Page
- Welcome screen with feature highlights
- Clear call-to-action to start onboarding
- Responsive design for all devices

### 2. Onboarding Flow
- **Step 1**: Create profile with basic information
- **Step 2**: Upload LinkedIn PDF (optional) or skip to use default interests
- **Step 3**: Fine-tune AI-detected interests and add custom ones
- **Step 4**: Complete setup and access dashboard

### 3. Dashboard Experience
- Quick stats overview (sessions, matches, messages)
- Direct access to agenda, networking, and AI concierge
- Today's schedule preview with priority sessions

### 4. Core Features
- **Agenda**: Personalized session recommendations
- **Networking**: AI-powered attendee matching
- **Chat**: Intelligent concierge assistance
- **Settings**: Profile and preference management

## 🔧 API Endpoints

### Profile Skills Analysis
```
POST /api/profile-skills
```
Analyzes uploaded LinkedIn PDF to extract professional interests and skills.

**Request**: Multipart form data with PDF file
**Response**: JSON with detected interests array

## 🎨 Customization

### Theming
The application supports both light and dark themes. Customize colors in:
- `app/globals.css` - CSS custom properties
- `components/ui/` - Component-specific styling

### Adding New Features
1. Create new pages in the `app/` directory
2. Add components to `components/`
3. Update navigation in `components/navigation.tsx`
4. Add API routes in `app/api/`

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface
- Optimized for all screen sizes

## 🔒 Security & Privacy

- **File Upload**: Secure PDF processing with size limits (15MB max)
- **Data Handling**: No persistent storage of uploaded files
- **Privacy**: One-time analysis with immediate cleanup
- **Validation**: Input sanitization and type checking

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🧪 Testing

### Manual Testing
1. **Onboarding Flow**: Test all steps including file upload and skip options
2. **Navigation**: Verify all pages load correctly
3. **Responsive Design**: Test on various screen sizes
4. **Theme Toggle**: Verify dark/light mode switching

### Test Data
Sample PDF files and test data are available in the `test/` directory.

## 🐛 Troubleshooting

### Common Issues

**PDF Upload Fails**
- Ensure file is under 15MB
- Check file is a valid PDF
- Verify API endpoint is accessible

**Styling Issues**
- Clear browser cache
- Restart development server
- Check Tailwind CSS compilation

**Build Errors**
- Run `pnpm install` to ensure dependencies are up to date
- Check TypeScript errors with `pnpm build`
- Verify all environment variables are set

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use existing UI components from `components/ui/`
- Maintain responsive design principles
- Add proper error handling
- Include loading states for async operations

## 📋 Roadmap

### Phase 1 (Current)
- ✅ Basic onboarding flow
- ✅ Dashboard with mock data
- ✅ PDF upload and analysis
- ✅ Responsive design

### Phase 2 (Planned)
- [ ] Real-time agenda updates
- [ ] Advanced networking features
- [ ] Push notifications
- [ ] Calendar integration

### Phase 3 (Future)
- [ ] Multi-event support
- [ ] Advanced analytics
- [ ] Social features
- [ ] Mobile app

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Shadcn/UI](https://ui.shadcn.com/) for the beautiful component library
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for the icon set
- [Google Gemini](https://ai.google.dev/) for AI capabilities

## 📞 Support

For support, email support@eventhub.com or join our Discord community.

---

**Built with ❤️ for better event experiences**
