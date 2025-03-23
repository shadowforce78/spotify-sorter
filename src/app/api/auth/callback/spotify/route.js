import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  // Get the code from the Spotify redirect
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange error:', error);
      return NextResponse.redirect(new URL('/?error=token_exchange', request.url));
    }

    const tokenData = await tokenResponse.json();

    // Store tokens in cookies (secure in production!)
    const cookieStore = cookies();
    cookieStore.set('spotify_access_token', tokenData.access_token, {
      maxAge: tokenData.expires_in,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    
    cookieStore.set('spotify_refresh_token', tokenData.refresh_token, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    // Redirect to the playlists page
    return NextResponse.redirect(new URL('/playlists', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
