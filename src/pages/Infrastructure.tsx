import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InfrastructureDiagram } from '@/components/debug/InfrastructureDiagram';

export default function Infrastructure() {
  return (
    <DashboardLayout>
      <InfrastructureDiagram />
    </DashboardLayout>
  );
}
