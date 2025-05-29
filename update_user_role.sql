-- SQL script to update a user's role to admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'yash@devopod.co.in';