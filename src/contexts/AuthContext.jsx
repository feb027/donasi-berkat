import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import PropTypes from 'prop-types';

// Buat Context
const AuthContext = createContext(null);

// Buat Provider Component
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  // loading now strictly tracks if the *initial* auth check is done
  const [loading, setLoading] = useState(true);

  // Memoized function to fetch profile to avoid re-creating it on every render
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      // console.log(`Fetching profile for user: ${userId}`); // Debug
      const { data, error, status } = await supabase
        .from('profil')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // Ignore "No rows found" error (406)
        console.warn(`Error fetching profile for ${userId}:`, error.message);
        setProfile(null);
      } else {
        // console.log(`Profile data for ${userId}:`, data); // Debug
        setProfile(data); // data will be null if not found, which is correct
      }
    } catch (error) {
      console.error(`Catastrophic error fetching profile for ${userId}:`, error);
      setProfile(null);
    }
  }, []);

  // Effect 1: Handle Auth State Changes & Initial Loading
  useEffect(() => {
    let isMounted = true;
    // Check initial session AND set up listener
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (isMounted) {
            // console.log("Initial getSession result:", initialSession); // Debug
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
            // Initial loading is done once getSession returns
            setLoading(false);
        }
    }).catch(err => {
        // Handle error during initial getSession
        if(isMounted){
            console.error("Error getting initial session:", err);
            setLoading(false); // Still finish loading state on error
        }
    });

    // Listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (isMounted) {
          // console.log(`onAuthStateChange Event: ${_event}`, currentSession); // Debug
          // Simply update user and session state based on the event
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          // Initial loading state is managed by getSession() now
          // setLoading(false) // -> No longer set loading here
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array is correct here

  // Effect 2: Fetch Profile whenever the user state changes
  useEffect(() => {
    // console.log("User state changed, fetching profile for:", user?.id); // Debug
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      // Clear profile if user logs out
      setProfile(null);
    }
  }, [user?.id, fetchProfile]); // Depend on user ID and fetchProfile function

  // --- Auth Action Functions ---
  // These now only trigger the action and let the listener handle state updates

  const signUp = async ({ email, password, username, fullName, avatarUrl }) => {
    // setLoading(true); // REMOVED
    try {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { nama_pengguna: username, nama_lengkap: fullName, avatar_url: avatarUrl } }
        });
        if (error) throw error;
        // console.log("Signup initiated:", data);
        // setLoading(false); // REMOVED
        // Listener will handle user/session state update upon successful signup (or email confirmation if enabled)
        return { data, error: null };
    } catch (error) {
        console.error('Error signing up:', error.message);
        // setLoading(false); // REMOVED
        return { data: null, error };
    }
  };

  const signIn = async ({ email, password }) => {
    // setLoading(true); // REMOVED
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // console.log("Signin successful:", data);
        // setLoading(false); // REMOVED
        // Listener will handle user/session/profile state updates
        return { data, error: null };
    } catch (error) {
        console.error('Error signing in:', error.message);
        // setLoading(false); // REMOVED
        return { data: null, error };
    }
  };

  const signOut = async () => {
    // setLoading(true); // REMOVED
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // console.log("Signout successful");
        // setLoading(false); // REMOVED
        // Listener will handle setting user/session/profile to null
        return { error: null };
    } catch (error) {
        console.error('Error signing out:', error.message);
        // setLoading(false); // REMOVED
        return { error };
    }
  };

  // --- Context Value ---
  const value = {
    session, user, profile, setProfile,
    loading, // Keep loading for initial check
    signUp, signIn, signOut,
  };

  // Render provider, only rendering children when initial loading is complete
  // This prevents rendering parts of the app that depend on auth state before it's known
  return (
      <AuthContext.Provider value={value}>
          {!loading && children}
          {/* Or show a global loading indicator while loading: */}
          {/* {loading ? <GlobalSpinner /> : children} */}
      </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) { // Check for undefined, not null
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 