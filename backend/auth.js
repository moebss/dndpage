// Passport.js Configuration for Google OAuth
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const googleId = profile.id;
            const email = profile.emails[0].value;
            const name = profile.displayName;
            const avatarUrl = profile.photos[0]?.value;

            // Check if user exists
            let { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('google_id', googleId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            // Create new user if doesn't exist
            if (!user) {
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        google_id: googleId,
                        email: email,
                        name: name,
                        avatar_url: avatarUrl
                    }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                user = newUser;
            } else {
                // Update existing user info
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update({
                        name: name,
                        avatar_url: avatarUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                user = updatedUser;
            }

            done(null, user);
        } catch (error) {
            console.error('OAuth Error:', error);
            done(error, null);
        }
    }
));

module.exports = { passport, supabase };
