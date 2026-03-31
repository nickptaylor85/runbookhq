import { redisGet } from '@/lib/redis';
import SignupForm from './SignupForm';
import SignupClosed from './SignupClosed';

const PLATFORM_KEY = 'wt:platform:settings';

export const dynamic = 'force-dynamic'; // always check Redis, never cache

export default async function SignupPage() {
  let signupEnabled = true;
  try {
    const raw = await redisGet(PLATFORM_KEY);
    if (raw) {
      const settings = JSON.parse(raw);
      if (settings.signup_enabled === false) signupEnabled = false;
    }
  } catch {}

  if (!signupEnabled) return <SignupClosed />;
  return <SignupForm />;
}
