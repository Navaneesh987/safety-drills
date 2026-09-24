SAFETY DRILL WEBSITE - SETUP

1. FIREBASE CONFIG
Open firebase-config.js and paste the firebaseConfig values you copied from:
Firebase Console > Project settings > Your apps > SDK setup and configuration > Config.

2. FIRESTORE RULES
Open firestore.rules.
Replace:
REPLACE_WITH_YOUR_ADMIN_EMAIL
with the exact email address of your Firebase administrator account.

In Firebase Console:
Firestore Database > Rules
Paste the contents of firestore.rules and Publish.

3. AUTHENTICATION
Firebase Console > Authentication > Users
Make sure your administrator user exists.

4. TEST LOCALLY
Geolocation generally requires HTTPS (or localhost). GitHub Pages supplies HTTPS, so test there.

5. GITHUB PAGES
Create a GitHub repository and upload:
index.html
style.css
app.js
firebase-config.js
admin.html
admin.js

firestore.rules and this README are for your reference.

GitHub:
Repository > Settings > Pages
Source: Deploy from a branch
Branch: main
Folder: / (root)
Save.

Your participant page will be:
https://YOUR-USERNAME.github.io/REPOSITORY/

Your admin page will be:
https://YOUR-USERNAME.github.io/REPOSITORY/admin.html

6. PRIVACY
Use this only for participants who have been informed that the drill records their location and who voluntarily grant browser location permission.

The browser permission prompt cannot and should not be bypassed.
