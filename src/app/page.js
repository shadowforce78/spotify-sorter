"use client"

import Image from "next/image";
import styles from "./page.module.css";
import { useEffect, useState } from "react";

export default function Home() {
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle Spotify OAuth login
  const handleSpotifyOAuthLogin = () => {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
      'playlist-modify-private'
    ];
    
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}`;
  };

  // Function to handle Google login
  const handleGoogleLogin = () => {
    // In a real implementation, you would integrate with Google OAuth
    alert('Google authentication would be initiated here');
  };

  // Function to handle direct login with credentials
  const handleDirectLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login (in a real app, you'd call an API endpoint)
    setTimeout(() => {
      setIsLoading(false);
      alert(`Would log in with: ${credentials.email} (this is just a demo)`);
      setShowCredentialsModal(false);
    }, 1500);
  };

  // Check if we are returning from Spotify with an error
  useEffect(() => {
    if (window.location.search.includes('error')) {
      alert('Authentication failed: ' + new URLSearchParams(window.location.search).get('error'));
    }
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.logoContainer}>
          <Image
            className={styles.spotifyLogo}
            src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png"
            alt="Spotify logo"
            width={180}
            height={54}
            priority
          />
        </div>

        <h1 className={styles.title}>Spotify Sorter</h1>

        <p className={styles.description}>
          Connect to your Spotify account to organize and sort your playlists efficiently
        </p>

        <div className={styles.authOptions}>
          <button
            onClick={handleSpotifyOAuthLogin}
            className={`${styles.authButton} ${styles.spotifyButton}`}
          >
            <Image 
              src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Icon_RGB_Green.png" 
              alt="Spotify" 
              width={24} 
              height={24} 
            />
            Continue with Spotify
          </button>
          
          <button
            onClick={handleGoogleLogin}
            className={`${styles.authButton} ${styles.googleButton}`}
          >
            <Image 
              src="https://i.stack.imgur.com/1xNrV.png" 
              alt="Google" 
              width={24} 
              height={24} 
            />
            Continue with Google
          </button>
          
          <div className={styles.orDivider}>
            <span>or</span>
          </div>
          
          <button
            onClick={() => setShowCredentialsModal(true)}
            className={`${styles.authButton} ${styles.credentialsButton}`}
          >
            Login with Email and Password
          </button>
        </div>
      </main>
      
      <footer className={styles.footer}>
        <p>This app is not affiliated with Spotify AB</p>
      </footer>

      {/* Direct login modal */}
      {showCredentialsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCredentialsModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowCredentialsModal(false)}>
              ×
            </button>
            <h2>Login to Spotify</h2>
            <form onSubmit={handleDirectLogin}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  id="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                />
              </div>
              <button 
                type="submit" 
                className={`${styles.authButton} ${styles.spotifyButton}`}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p className={styles.disclaimer}>
              Note: This is for demonstration purposes only. For security reasons, you should use Spotify's official OAuth flow.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
