# CogniFlow ERP - Render Deployment Guide

## Why Render?
- ✅ **Free tier available** (750 hours/month)
- ✅ **Automatic deployments** from Git
- ✅ **Free PostgreSQL database** (90 days free, then $7/month)
- ✅ **HTTPS by default**
- ✅ **Easy environment variable management**
- ✅ **No credit card required** for free tier

## Prerequisites
1. GitHub account
2. Render account (free at https://render.com)
3. Your code pushed to a GitHub repository

## Deployment Steps

### Option 1: One-Click Deploy (Recommended)
1. Push your code to GitHub
2. Go to https://render.com
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` file and deploy both:
   - Web service (your app)
   - PostgreSQL database

### Option 2: Manual Setup
1. **Create Database:**
   - Go to Render Dashboard
   - Click "New" → "PostgreSQL"
   - Name: `cogniflow-db`
   - Plan: Free
   - Click "Create Database"
   - Copy the connection string

2. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `cogniflow-erp`
     - **Runtime:** Node
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Plan:** Free

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=[paste your database connection string]
   SESSION_SECRET=[generate a random 32+ character string]
   PORT=10000
   ```

   **Optional variables (add as needed):**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   OPENAI_API_KEY=your-openai-api-key
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   MPESA_CONSUMER_KEY=your-mpesa-consumer-key
   MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
   MPESA_SHORTCODE=your-shortcode
   MPESA_PASSKEY=your-passkey
   ```

## Important Notes

### Database Migration
- Migrations run automatically via `postinstall` script
- Database tables will be created on first deployment

### Build Process
1. `npm install` - Install dependencies
2. `npm run build` - Build frontend (Vite) and backend (esbuild)
3. `npm start` - Start the production server

### Free Tier Limitations
- **Web Service:** 750 hours/month (about 31 days if always running)
- **Database:** Free for 90 days, then $7/month
- **Sleep after 15 minutes** of inactivity (wakes up on first request)

### Custom Domain (Optional)
- Free custom domain support
- Add your domain in Render dashboard
- Update DNS records as instructed

## Troubleshooting

### Common Issues:
1. **Build fails:** Check Node.js version in `package.json` engines
2. **Database connection:** Verify DATABASE_URL environment variable
3. **App doesn't start:** Check logs in Render dashboard

### Checking Logs:
- Go to your service in Render dashboard
- Click "Logs" tab to see build and runtime logs

### Environment Variables:
- Go to your service → "Environment" tab
- Add/edit variables as needed
- Redeploy after changes

## Post-Deployment

1. **Test your application:** Visit the provided Render URL
2. **Set up monitoring:** Enable email notifications in Render
3. **Configure custom domain:** (Optional) Add your domain
4. **Set up CI/CD:** Automatic deployments on Git push

## Cost Estimation

### Free Tier:
- Web Service: Free (750 hours/month)
- Database: Free for 90 days

### After Free Tier:
- Web Service: $7/month (if you need more than 750 hours)
- Database: $7/month (after 90 days)

**Total: $0-14/month depending on usage**

## Support
- Render Documentation: https://render.com/docs
- Community Forum: https://community.render.com
- Status Page: https://status.render.com

---

**Ready to deploy?** Push your code to GitHub and follow Option 1 above!