"use client"

import { useEffect, useState } from 'react';
import styles from './playlists.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function PlaylistsPage() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      try {
        // First fetch user profile
        const userResponse = await fetch('/api/spotify/me');
        
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            // Unauthorized, redirect to login
            router.push('/');
            return;
          }
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await userResponse.json();
        setUser(userData);
        
        // Then fetch user playlists
        const playlistsResponse = await fetch(`/api/spotify/playlists`);
        
        if (!playlistsResponse.ok) {
          throw new Error('Failed to fetch playlists');
        }
        
        const playlistsData = await playlistsResponse.json();
        setPlaylists(playlistsData.items || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your Spotify data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          className={styles.backButton} 
          onClick={() => router.push('/')}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          {user?.images?.length > 0 && (
            <Image 
              src={user.images[0].url} 
              alt="Profile" 
              width={50} 
              height={50} 
              className={styles.profileImage}
            />
          )}
          <div>
            <h1>Welcome, {user?.display_name}</h1>
            <p>{user?.email}</p>
          </div>
        </div>
        <button 
          className={styles.logoutButton}
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
          }}
        >
          Logout
        </button>
      </header>

      <main className={styles.main}>
        <h2>Your Playlists</h2>
        
        <div className={styles.playlistsGrid}>
          {playlists.map(playlist => (
            <div key={playlist.id} className={styles.playlistCard}>
              {playlist.images?.length > 0 ? (
                <Image 
                  src={playlist.images[0].url} 
                  alt={playlist.name} 
                  width={160} 
                  height={160} 
                  className={styles.playlistImage}
                />
              ) : (
                <div className={styles.noImage}>No Cover</div>
              )}
              <h3>{playlist.name}</h3>
              <p>{playlist.tracks.total} tracks</p>
            </div>
          ))}
        </div>

        {playlists.length === 0 && (
          <div className={styles.noPlaylists}>
            <p>You don't have any playlists yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
