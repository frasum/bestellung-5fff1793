import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DatabaseArchitectureDiagram } from '@/components/debug/DatabaseArchitectureDiagram';

const DatabaseArchitecture = () => {
  const navigate = useNavigate();
  const [advancedMode, setAdvancedMode] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );

  useEffect(() => {
    // Redirect if advanced mode is disabled
    if (!advancedMode) {
      navigate('/settings');
    }
  }, [advancedMode, navigate]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedMode(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!advancedMode) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Datenbankarchitektur</h1>
          <p className="text-muted-foreground">Entity-Relationship-Diagramm aller Tabellen</p>
        </div>
        <DatabaseArchitectureDiagram />
      </div>
    </DashboardLayout>
  );
};

export default DatabaseArchitecture;
