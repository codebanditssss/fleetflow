npm i --save-dev @types/bcryptjs  -> if error 
npm install
npm run db:setup
npm run dev


cp .env.example .env
Edit .env (minimum):

DATABASE_URL="file:./dev.db"
APP_BASE_URL="http://localhost:3000"
Optional for real reset emails:

RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="FleetFlow <no-reply@yourdomain.com>"
Run app:

npm install
npm run db:setup
npm run dev
Open:

http://localhost:3000
Quick test flow:

Sign up a new user.
Click Forgot Password.
If Resend not configured: token appears in UI (dev mode).
If Resend configured: check email and click reset link.
Set new password, then log in with it.