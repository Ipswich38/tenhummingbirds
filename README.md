# TenHummingbirds 🐦

An intelligent AI-powered trading research assistant with advanced market analysis, portfolio management, and browser automation capabilities.

## Features

- **AI Market Analysis**: Real-time market insights powered by Groq AI
- **Smart Watchlists**: Customizable stock tracking with alerts
- **Portfolio Analytics**: Comprehensive performance tracking
- **Browser Automation**: "Humm" AI agent for web scraping and interaction
- **Mobile-First Design**: Optimized for all devices
- **Secure Authentication**: JWT-based passcode authentication
- **Real-time Chat**: Contextual AI assistant for trading queries

## Quick Start

### Development

1. Clone the repository:
```bash
git clone https://github.com/Ipswich38/tenhummingbirds.git
cd tenhummingbirds
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your API keys in `.env.local`:
```env
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
TENHUMMINGBIRDS_PASSCODE=your_secure_passcode
JWT_SECRET=your_jwt_secret_key_32_chars_minimum
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment

#### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set the following environment variables in Vercel:
   - `GROQ_API_KEY`
   - `HUGGINGFACE_API_KEY`
   - `TENHUMMINGBIRDS_PASSCODE`
   - `JWT_SECRET`
   - `DISABLE_BROWSER_AUTOMATION=true`
   - `NODE_ENV=production`

4. Deploy automatically on push to main branch

#### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq AI API key | Yes |
| `HUGGINGFACE_API_KEY` | Hugging Face API key (fallback) | Yes |
| `TENHUMMINGBIRDS_PASSCODE` | Secure passcode for authentication | Yes |
| `JWT_SECRET` | JWT secret key (32+ characters) | Yes |
| `DISABLE_BROWSER_AUTOMATION` | Disable Playwright in production | Production |
| `NODE_ENV` | Environment (development/production) | Yes |

## Project Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── ai-chat/         # AI chat endpoint
│   │   ├── ai-agent/        # Browser automation endpoint
│   │   └── trading-research/ # Market analysis endpoint
│   └── page.tsx             # Main application page
├── components/
│   ├── ui/                  # UI components
│   ├── login.tsx            # Authentication component
│   └── trading-research-assistant.tsx # Main app component
└── lib/
    ├── groq-ai.ts           # Groq AI integration
    ├── ai-agent.ts          # AI agent orchestration
    └── humm-browser.ts      # Browser automation tool
```

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI**: Groq API, Hugging Face Transformers
- **Authentication**: JWT, localStorage
- **Browser Automation**: Playwright
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with custom design system

## Security Features

- JWT-based authentication
- Secure passcode access
- Environment variable protection
- HTTPS enforcement in production
- XSS and CSRF protection headers
- Browser automation disabled in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
