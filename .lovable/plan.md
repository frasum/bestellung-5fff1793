

# Fix: verify-employee-pin gibt "No PIN configured" trotz vorhandenem PIN

## Problem

Die Edge Function `verify-employee-pin` führt einen Join aus:
```sql
employee:employees(id, pin_code, auto_approve_orders)
```

Supabase gibt bei einer Many-to-One-Beziehung (foreign key `employee_id → employees.id`) ein **einzelnes Objekt** zurück, nicht ein Array. Der Code behandelt es aber als Array:

```typescript
const employee = typedToken.employee?.[0]; // ← undefined!
```

Deshalb kommt immer "No PIN configured", obwohl Andis PIN korrekt in der Datenbank steht (`$2a$10$...` bcrypt Hash).

Die `verify-employee-login` Function (Employee Portal) funktioniert korrekt — nur die Token-basierte PIN-Prüfung ist betroffen.

## Lösung

In `supabase/functions/verify-employee-pin/index.ts`:

1. **Interface ändern**: `employee` von `EmployeeData[]` zu `EmployeeData | EmployeeData[]` 
2. **Zugriff anpassen**: Sowohl Objekt als auch Array unterstützen:
   ```typescript
   const emp = typedToken.employee;
   const employee = Array.isArray(emp) ? emp[0] : emp;
   ```

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `supabase/functions/verify-employee-pin/index.ts` | Interface + Zugriff auf employee-Daten fixen |

Minimale Änderung, ~3 Zeilen Code.

