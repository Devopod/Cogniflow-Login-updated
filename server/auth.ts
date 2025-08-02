import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";
import { db } from "./db";
import { users as usersTable, companies } from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";
import { isWorkEmailSync } from "./utils/emailValidator";

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Create session middleware that can be shared
function createSessionMiddleware() {
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = randomBytes(32).toString('hex');
    console.warn('No SESSION_SECRET environment variable set, using a random value. Sessions will be invalidated on server restart.');
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  return session(sessionSettings);
}

// Export the session middleware
export const sessionMiddleware = createSessionMiddleware();

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          } 
          
          if (!user.isActive) {
            return done(null, false, { message: "Account is deactivated" });
          }
          
          // Update last login timestamp
          await storage.updateUser(user.id, {
            lastLogin: new Date(),
            failedLoginAttempts: 0
          });
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate that the email is a work email
      const emailValidation = isWorkEmailSync(req.body.email);
      if (!emailValidation.isValid) {
        return res.status(400).json({ message: emailValidation.message });
      }

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
  
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
  
      // Create new user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isActive: true,
        emailVerified: false,
        emailVerificationToken: randomBytes(32).toString("hex"),
        companyId: null, // Ensure no company is set initially
      });
  
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without sensitive data
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message || "An unexpected error occurred" });
    }
  });

  app.post("/api/login", async (req, res, next) => {
    // Validate that the email is a work email
    const emailValidation = isWorkEmailSync(req.body.email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    passport.authenticate("local", async (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, async (err) => {
        if (err) {
          return next(err);
        }
        // Return user without sensitive data
        const { password, ...userWithoutPassword } = user;
        
        // Check if user has a company
        if (user.companyId) {
          try {
            const [company] = await db.select().from(companies).where(eq(companies.id, user.companyId));
            if (company) {
              return res.status(200).json({
                ...userWithoutPassword,
                companyName: company.legalName
              });
            }
          } catch (error) {
            console.error("Error fetching company:", error);
          }
        }
        
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Set cache headers (60 seconds)
    res.setHeader('Cache-Control', 'private, max-age=60');
    
    // Return user without sensitive data
    const { password, ...userWithoutPassword } = req.user as UserType;
    
    // Check if user has a company
    if (req.user.companyId) {
      try {
        const [company] = await db.select().from(companies).where(eq(companies.id, req.user.companyId));
        if (company) {
          return res.json({
            ...userWithoutPassword,
            companyName: company.legalName
          });
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      }
    }
    
    res.json(userWithoutPassword);
  });
  
  app.post("/api/password-reset/request", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        const token = randomBytes(32).toString("hex");
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
        
        await storage.updateUser(user.id, {
          passwordResetToken: token,
          passwordResetExpires: expires
        });
        
        // TODO: Send email with reset link
        console.log(`Password reset requested for ${email}. Token: ${token}`);
      }
      
      // Always return success even if user doesn't exist to prevent email enumeration
      res.status(200).json({ message: "If your email is registered, you will receive reset instructions." });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });
  
  app.post("/api/password-reset/confirm", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      // Find user with this reset token
      const now = new Date();
      const users = await db.select().from(usersTable).where(
        and(
          eq(usersTable.passwordResetToken, token),
          gte(usersTable.passwordResetExpires, now)
        )
      );
      
      if (users.length === 0) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      const user = users[0];
      
      // Update password and clear reset token
      await storage.updateUser(user.id, {
        password: await hashPassword(password),
        passwordResetToken: null,
        passwordResetExpires: null
      });
      
      res.status(200).json({ message: "Password successfully reset" });
    } catch (error) {
      console.error("Password reset confirmation error:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  // Email domain management endpoints (admin only)
  app.post("/api/email-domains/allowlist", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      const { addToAllowlist } = require('./utils/emailValidator');
      addToAllowlist(domain);
      
      res.status(200).json({ message: `Domain ${domain} added to allowlist` });
    } catch (error) {
      console.error("Error adding domain to allowlist:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  app.delete("/api/email-domains/allowlist", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      const { removeFromAllowlist } = require('./utils/emailValidator');
      removeFromAllowlist(domain);
      
      res.status(200).json({ message: `Domain ${domain} removed from allowlist` });
    } catch (error) {
      console.error("Error removing domain from allowlist:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  app.post("/api/email-domains/blocklist", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      const { addToBlocklist } = require('./utils/emailValidator');
      addToBlocklist(domain);
      
      res.status(200).json({ message: `Domain ${domain} added to blocklist` });
    } catch (error) {
      console.error("Error adding domain to blocklist:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  app.delete("/api/email-domains/blocklist", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      const { removeFromBlocklist } = require('./utils/emailValidator');
      removeFromBlocklist(domain);
      
      res.status(200).json({ message: `Domain ${domain} removed from blocklist` });
    } catch (error) {
      console.error("Error removing domain from blocklist:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  // Get current email domain lists
  app.get("/api/email-domains", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      // Import the arrays directly from the module
      const emailValidator = require('./utils/emailValidator');
      
      res.status(200).json({
        freeEmailDomains: emailValidator.FREE_EMAIL_DOMAINS,
        disposableEmailDomains: emailValidator.DISPOSABLE_EMAIL_DOMAINS,
        allowedDomains: emailValidator.ALLOWED_DOMAINS,
        blockedDomains: emailValidator.BLOCKED_DOMAINS
      });
    } catch (error) {
      console.error("Error fetching email domains:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });
  
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      
      const users = await db.select().from(usersTable).where(
        eq(usersTable.emailVerificationToken, token)
      );
      
      if (users.length === 0) {
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      const user = users[0];
      
      // Mark email as verified
      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null
      });
      
      res.status(200).json({ message: "Email successfully verified" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  app.delete("/api/email-domains/allowlist", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      const { removeFromAllowlist } = require('./utils/emailValidator');
      removeFromAllowlist(domain);
      
      res.status(200).json({ message: `Domain ${domain} removed from allowlist` });
    } catch (error) {
      console.error("Error removing domain from allowlist:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  app.post("/api/email-domains/blocklist", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      const { addToBlocklist } = require('./utils/emailValidator');
      addToBlocklist(domain);
      
      res.status(200).json({ message: `Domain ${domain} added to blocklist` });
    } catch (error) {
      console.error("Error adding domain to blocklist:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  app.delete("/api/email-domains/blocklist", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      const { removeFromBlocklist } = require('./utils/emailValidator');
      removeFromBlocklist(domain);
      
      res.status(200).json({ message: `Domain ${domain} removed from blocklist` });
    } catch (error) {
      console.error("Error removing domain from blocklist:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  // Get current email domain lists
  app.get("/api/email-domains", (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      // Import the arrays directly from the module
      const emailValidator = require('./utils/emailValidator');
      
      res.status(200).json({
        freeEmailDomains: emailValidator.FREE_EMAIL_DOMAINS,
        disposableEmailDomains: emailValidator.DISPOSABLE_EMAIL_DOMAINS,
        allowedDomains: emailValidator.ALLOWED_DOMAINS,
        blockedDomains: emailValidator.BLOCKED_DOMAINS
      });
    } catch (error) {
      console.error("Error fetching email domains:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });
}