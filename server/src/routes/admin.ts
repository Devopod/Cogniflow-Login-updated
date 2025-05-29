import { Router } from "express";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Temporary route to make a user an admin
router.post("/make-admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple security check - require a specific password
    if (password !== "yashi123") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Update the user role to admin
    const [updatedUser] = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.email, email))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return success message
    return res.json({ 
      message: "User role updated to admin successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ message: "Failed to update user role" });
  }
});

export default router;