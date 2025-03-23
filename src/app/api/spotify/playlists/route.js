import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('spotify_access_token')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    // First get the user ID
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!userResponse.ok) {
      if (userResponse.status === 401) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch user data' }, 
        { status: userResponse.status }
      );
    }
    
    const userData = await userResponse.json();
    
    // Then get the user's playlists
    const playlistsResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists?limit=50`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!playlistsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch playlists' }, 
        { status: playlistsResponse.status }
      );
    }
    
    const playlistsData = await playlistsResponse.json();
    return NextResponse.json(playlistsData);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
