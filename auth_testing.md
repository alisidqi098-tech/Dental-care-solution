# Auth Testing Playbook

## Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, index unique on users.email, index on login_attempts.identifier.

## Step 2: API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"alisidqi098@gmail.com","password":"DcAi-2026-Secure#7f3a"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
curl -b cookies.txt http://localhost:8001/api/demo-bookings
```
Login returns the user object and sets `access_token` + `refresh_token` httpOnly cookies.
`/me` and `/demo-bookings` must return data with cookies, 401 without.

## Step 3: Brute force
5 failed logins on same email -> 429 "Troppi tentativi" for 15 minutes.

## Step 4: Email
Create a booking via POST /api/demo-booking -> backend logs show two sends (doctor confirmation + team notification).
