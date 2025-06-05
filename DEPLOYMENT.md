# Heroku Deployment Guide for CogniFlow ERP

## Prerequisites

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Create a Heroku account: https://signup.heroku.com/
3. Have Git installed and your project in a Git repository

## Step-by-Step Deployment

### 1. Login to Heroku
```bash
heroku login
```

### 2. Create a new Heroku app
```bash
heroku create your-app-name
# Replace 'your-app-name' with your desired app name (must be unique)
```

### 3. Add Heroku Postgres addon
```bash
heroku addons:create heroku-postgresql:mini
```

### 4. Set environment variables
```bash
# Required environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)

# Optional: Add other environment variables as needed
heroku config:set OPENAI_API_KEY=your-openai-key
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password
```

### 5. Deploy to Heroku
```bash
# Add Heroku remote (if not already added)
heroku git:remote -a your-app-name

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 6. Run database migrations
```bash
heroku run npm run migrate
```

### 7. Open your app
```bash
heroku open
```

## Your app will be available at:
`https://your-app-name.herokuapp.com`

## Useful Heroku Commands

- View logs: `heroku logs --tail`
- Restart app: `heroku restart`
- Check app status: `heroku ps`
- Open app: `heroku open`
- Run commands: `heroku run <command>`

## Environment Variables

The following environment variables are automatically set by Heroku:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Port number for the web server

You may need to manually set:
- `SESSION_SECRET` - For session management
- `OPENAI_API_KEY` - If using AI features
- Email configuration variables - If using email features
- Payment gateway keys - If using Stripe/M-Pesa

## Troubleshooting

1. **Build fails**: Check the build logs with `heroku logs --tail`
2. **App crashes**: Check for missing environment variables
3. **Database issues**: Ensure migrations ran successfully
4. **Port issues**: Make sure your app uses `process.env.PORT`

## Database Management

- View database info: `heroku pg:info`
- Access database console: `heroku pg:psql`
- Reset database: `heroku pg:reset DATABASE_URL --confirm your-app-name`