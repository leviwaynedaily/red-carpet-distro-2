import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nzqdkelbytkvvwdgywja.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cWRrZWxieXRrdnZ3ZGd5d2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MjQ5MzksImV4cCI6MjA1MzAwMDkzOX0.q91aTkOtF0YvewODoZyehIXYYSuZ_6KdRwRXF84qfho";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: async (url, options) => {
      let lastError;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          console.log(`Supabase: Attempt ${i + 1} to fetch ${url}`);
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response;
        } catch (error) {
          console.error(`Supabase: Attempt ${i + 1} failed:`, error);
          lastError = error;
          if (i < MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY * (i + 1)); // Exponential backoff
          }
        }
      }
      console.error('Supabase: All retry attempts failed');
      throw lastError;
    }
  }
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .single();

    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }

    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};