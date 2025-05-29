// Script to update a user's role to admin
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function updateUserRole() {
  try {
    console.log('Updating user role to admin...');
    
    // Update the user with the specified email to have admin role
    const result = await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, 'yash@devopod.co.in'))
      .returning();
    
    if (result.length > 0) {
      console.log('User updated successfully:', result[0]);
    } else {
      console.log('User not found with email: yash@devopod.co.in');
    }
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    process.exit(0);
  }
}

updateUserRole().catch(console.error);