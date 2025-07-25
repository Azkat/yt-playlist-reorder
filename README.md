# YouTube Playlist Editor

A modern web application for efficiently managing and editing YouTube playlists with an embedded video player interface.

## Features

- 🎵 **Playlist Management**: View and manage all your YouTube playlists
- 🎬 **Embedded Video Player**: Fixed left-side video player with seamless playback
- 📝 **Video Reordering**: Drag-and-drop or numeric input to reorder videos
- 🔄 **Sequential Pagination**: Navigate through videos with safe pagination
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Optimized Performance**: Efficient API usage with rate limiting
- 🔐 **Secure Authentication**: OAuth 2.0 with YouTube/Google

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **API**: YouTube Data API v3
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Console account
- YouTube account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Azkat/ytp-editor.git
   cd ytp-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google OAuth**

   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Create a new project or select an existing one
   
   c. Enable the YouTube Data API v3:
      - Go to "APIs & Services" > "Library"
      - Search for "YouTube Data API v3"
      - Click "Enable"
   
   d. Create OAuth 2.0 credentials:
      - Go to "APIs & Services" > "Credentials"
      - Click "Create Credentials" > "OAuth 2.0 Client IDs"
      - Set Application type to "Web application"
      - Add authorized origins: `http://localhost:3000`
      - Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

4. **Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-here
   YOUTUBE_CLIENT_ID=your-google-client-id
   YOUTUBE_CLIENT_SECRET=your-google-client-secret
   ```

   Generate a NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In**: Click "Sign in with YouTube" to authenticate with your Google account
2. **Select Playlist**: Choose a playlist from your YouTube account
3. **Edit Videos**: 
   - Click video thumbnails to play in the embedded player
   - Use the position input to reorder videos
   - Navigate through pages to find specific videos
4. **Apply Changes**: Click "Apply" to save your reordering changes to YouTube

## API Limits

- YouTube Data API has daily quotas (10,000 units/day for free tier)
- The app is optimized to minimize API calls:
  - Direct thumbnail URLs (no API quota usage)
  - Efficient pagination with token management
  - Rate limiting for batch operations

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── playlists/      # Playlist management pages
├── components/         # Reusable React components
│   ├── ui/            # UI components
│   └── ...
├── lib/               # Utility functions and clients
│   ├── auth.ts        # NextAuth configuration
│   ├── youtube-client.ts # YouTube API client
│   └── types.ts       # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Update Google OAuth settings with your production domain

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues

1. **OAuth Error**: Ensure your redirect URIs match exactly in Google Console
2. **API Quota Exceeded**: Check your YouTube Data API usage in Google Console
3. **Authentication Issues**: Verify your client ID and secret are correct

### Support

If you encounter any issues, please:
1. Check the [troubleshooting section](#troubleshooting)
2. Search existing [issues](https://github.com/Azkat/ytp-editor/issues)
3. Create a new issue with detailed information

## Acknowledgments

- YouTube Data API v3 for playlist management
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first CSS framework
- All contributors who help improve this project

---

**Note**: This application requires YouTube Data API access and is subject to Google's API terms of service and quota limitations.