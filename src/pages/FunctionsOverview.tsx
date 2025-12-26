import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FunctionsOverviewDiagram } from '@/components/debug/FunctionsOverviewDiagram';

export default function FunctionsOverview() {
  return (
    <DashboardLayout>
      <FunctionsOverviewDiagram />
    </DashboardLayout>
  );
}
