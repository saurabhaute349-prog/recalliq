export function BillingHistoryPlaceholder() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-muted/20 px-4 py-3">
        <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Billing history
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-xs text-muted-foreground"
              >
                Invoices will appear here after your first Pro payment.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
