"use client"

import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  // Function to handle Spotify login
  const handleSpotifyLogin = () => {
    // This is a placeholder. You would need to implement actual Spotify OAuth
    // Example: redirect to Spotify authorization URL with your client ID and redirect URI
    // window.location.href = `https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=user-read-private%20playlist-read-private%20playlist-modify-public%20playlist-modify-private`;
    alert('Spotify authentication would be initiated here');
  };

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

        <div className={styles.ctas}>
          <button
            onClick={handleSpotifyLogin}
            className={`${styles.primary} ${styles.spotifyButton}`}
          >
            Connect to Spotify
          </button>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>This app is not affiliated with Spotify AB</p>
      </footer>
    </div>
  );
}
