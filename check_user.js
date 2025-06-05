// Script to check and update user role
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function checkAndUpdateUser() {
  try {
    console.log('Checking user...');
    
    // First, find the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'yash@devopod.co.in')
    });
    
    if (!user) {
      console.log('❌ User not found with email: yash@devopod.co.in');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    // Update to admin if not already
    if (user.role !== 'admin') {
      console.log('🔄 Updating user role to admin...');
      const result = await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.email, 'yash@devopod.co.in'))
        .returning();
      
      console.log('✅ User updated successfully:', result[0]);
    } else {
      console.log('✅ User is already an admin');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAndUpdateUser().catch(console.error);