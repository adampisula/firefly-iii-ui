import Link from "next/link";
import {
  DestroyForm,
  PurgeForm,
} from "@/features/maintenance/maintenance-forms";
import { PageHeader } from "@/components/ui/primitives";
export const dynamic = "force-dynamic";
export default function MaintenancePage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Maintenance"
        title="Destructive data maintenance"
        lede="These operations permanently change or remove financial data. Type the exact confirmation phrase and review the backend warning before proceeding."
      />
      <section className="panel">
        <h2>Delete a data family</h2>
        <DestroyForm />
      </section>
      <section className="panel">
        <h2>Purge soft-deleted records</h2>
        <PurgeForm />
        <p className="muted-note">
          Bulk transaction editing and batch finish are not exposed here because
          their selection workflow is unsupported (GAP-06); use individual
          transaction edits.
        </p>
        <Link className="text-link" href="/settings">
          Back to settings
        </Link>
      </section>
    </div>
  );
}
