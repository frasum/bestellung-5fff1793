import { memo } from 'react';
import { Phone, Mail } from 'lucide-react';

interface EmployeeContactInfoProps {
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export const EmployeeContactInfo = memo(function EmployeeContactInfo({
  phone,
  email,
  notes,
}: EmployeeContactInfoProps) {
  return (
    <>
      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
        {phone && (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span>{email}</span>
          </div>
        )}
      </div>
      
      {notes && (
        <p className="text-sm text-muted-foreground mt-2">
          {notes}
        </p>
      )}
    </>
  );
});

EmployeeContactInfo.displayName = 'EmployeeContactInfo';
