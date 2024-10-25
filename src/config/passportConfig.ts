import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import User from '@models/userModel';

// Define types for done callback
type DoneCallback = (
  error: any,
  user?: Express.User | false,
  options?: { message: string }
) => void;


passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
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