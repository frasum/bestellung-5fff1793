

# Neuen Admin-Benutzer anlegen

Ich lege einen neuen Admin-Account mit folgenden Daten an:

- **E-Mail:** Lasse@founderblocks.io
- **Passwort:** Lasse2026!
- **Rolle:** Admin (wird automatisch via `handle_new_user` Trigger zugewiesen)

## Vorgehen

1. Temporäre Edge Function `create-admin-user-temp` deployen (nutzt `SUPABASE_SERVICE_ROLE_KEY` für `auth.admin.createUser`)
2. Function aufrufen mit den Zugangsdaten
3. Der DB-Trigger `handle_new_user` erstellt automatisch:
   - Eine neue Organisation ("Lasse Admin")
   - Ein Profil
   - Die Admin-Rolle in `user_roles`
   - Eine Standard-Location
4. Temporäre Function nach erfolgreicher Erstellung wieder löschen

## Ergebnis

Lasse kann sich danach direkt unter `/auth` einloggen mit den o.g. Zugangsdaten und hat volle Admin-Rechte in seiner eigenen Organisation.

