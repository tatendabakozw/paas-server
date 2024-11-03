import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import User from '@models/userModel';
import { GITHUB_CALLBACK_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '@utils/constants';
import { Strategy as GitHubStrategy } from 'passport-github2';

// Define types for done callback
type DoneCallback = (
  error: any,
  user?: Express.User | false,
  options?: { message: string }
) => void;

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: GITHUB_CALLBACK_URL,
  scope:['user', 'repo']
},
async (accessToken: string, refreshToken: string, profile: any, done: DoneCallback) => {
  try {

    // Get primary email from GitHub profile
    const email = profile.emails && profile.emails[0]?.value;
    
    if (!email) {
      throw new Error('No email provided from GitHub');
    }
    // Find or create user
    let user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          email: email,
          username: profile.username,
          githubId: profile.id,
          githubAccessToken:accessToken,
          authMethod: 'github',
          lastLogin: new Date(),
          
        }
      },
      { upsert: true, new: true }
    );

    done(null, user);
  } catch (error) {
    done(error); // Pass the error to done
  }
}));

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
    },
    async (
      email: string,
      password: string,
      done: DoneCallback
    ): Promise<void> => {
      try {
        const user = await User.findOne({ email });
        
        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user: Express.User, done: DoneCallback) => {
  done(null, user);
});

// Deserialize user
passport.deserializeUser(async (
  id: string,
  done: DoneCallback
): Promise<void> => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;