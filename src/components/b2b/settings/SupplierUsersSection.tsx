import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Mail, UserPlus, Users } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface B2BSupplierUser {
  id: string;
  user_id: string;
  supplier_id: string;
  account_id: string;
  role: string;
  email: string;
  name: string | null;
  created_at: string | null;
  supplier_name?: string;
}

interface SupplierUsersSectionProps {
  isSupplierUser: boolean;
  supplierUsers: B2BSupplierUser[];
  loadingSupplierUsers: boolean;
  onInviteClick: () => void;
  onDeleteUser: (user: B2BSupplierUser) => void;
}

export function SupplierUsersSection({
  isSupplierUser,
  supplierUsers,
  loadingSupplierUsers,
  onInviteClick,
  onDeleteUser,
}: SupplierUsersSectionProps) {
  if (isSupplierUser) return null;

  return (
    <AccordionItem value="supplier-users" className="border-b">
      <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
          <span className="font-medium group-data-[state=open]:text-primary transition-colors">
            Lieferanten-Benutzer
          </span>
          {supplierUsers.length > 0 && (
            <Badge variant="secondary" className="ml-2">{supplierUsers.length}</Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 bg-primary/5">
        <p className="text-sm text-muted-foreground mb-4">
          Geben Sie Lieferanten einen eigenen Login, um ihr Portal selbst zu verwalten
        </p>
        
        <div className="space-y-4">
          <Button onClick={onInviteClick} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Benutzer einladen
          </Button>

          {loadingSupplierUsers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : supplierUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Noch keine Lieferanten-Benutzer angelegt
            </p>
          ) : (
            <div className="space-y-2">
              {supplierUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name || user.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {user.name && <span>{user.email}</span>}
                        {user.name && <span>•</span>}
                        <span>{user.supplier_name}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.role === 'owner' ? 'Eigentümer' : user.role === 'manager' ? 'Manager' : 'Betrachter'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDeleteUser(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
