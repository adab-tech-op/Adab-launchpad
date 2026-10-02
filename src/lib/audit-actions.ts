import type { Role } from "@/lib/roles";

/**
 * Every action key written by recordAudit, with the words used to describe it
 * and the group it belongs to.
 *
 * The previous map covered 19 of the 35 keys actually recorded, so a third of
 * the log rendered as raw identifiers like `settings.update`. It also listed
 * two keys nothing writes (order.cancel, order.restore), which is the other
 * half of the same problem: nobody was checking the map against reality.
 */
export type AuditKind = "orders" | "products" | "team" | "content" | "deletions";

export const AUDIT_KINDS: { value: AuditKind | "all"; label: string }[] = [
  { value: "all", label: "All activity" },
  { value: "orders", label: "Orders" },
  { value: "products", label: "Products" },
  { value: "team", label: "Team" },
  { value: "content", label: "Content" },
  { value: "deletions", label: "Deletions" },
];

type Meta = { verb: string; kind: AuditKind; destructive?: boolean };

export const AUDIT_ACTIONS: Record<string, Meta> = {
  "order.payment_status": { verb: "set the payment status of", kind: "orders" },
  "order.delivery_status": { verb: "set the delivery status of", kind: "orders" },
  "order.payment_confirmed": { verb: "sent payment confirmation for", kind: "orders" },
  "order.follow_up": { verb: "sent a follow-up for", kind: "orders" },
  "stock.update": { verb: "updated stock for", kind: "products" },
  "product.create": { verb: "created", kind: "products" },
  "product.update": { verb: "updated", kind: "products" },
  "product.delete": { verb: "deleted", kind: "products", destructive: true },
  "product.sold_out": { verb: "marked as sold out", kind: "products" },
  "product.drop.close": { verb: "closed the drop for", kind: "products" },
  "product.drop.in_shop": { verb: "moved into the shop", kind: "products" },
  "fabric.create": { verb: "added the fabric", kind: "products" },
  "fabric.update": { verb: "updated the fabric", kind: "products" },
  "fabric.delete": { verb: "deleted the fabric", kind: "products", destructive: true },
  "coupon.create": { verb: "created the coupon", kind: "products" },
  "coupon.update": { verb: "updated the coupon", kind: "products" },
  "coupon.delete": { verb: "deleted the coupon", kind: "products", destructive: true },
  "team.invite": { verb: "invited", kind: "team" },
  "team.invite_resend": { verb: "resent the invitation to", kind: "team" },
  "team.invite_revoke": { verb: "revoked the invitation for", kind: "team" },
  "team.invite_accept": { verb: "accepted their invitation", kind: "team" },
  "team.role_change": { verb: "changed the role of", kind: "team" },
  "team.remove": { verb: "removed access for", kind: "team", destructive: true },
  "content.update": { verb: "edited the page", kind: "content" },
  "announcement.update": { verb: "updated the announcement", kind: "content" },
  "settings.update": { verb: "changed a setting", kind: "content" },
  "scrapbook.add": { verb: "added a scrapbook entry", kind: "content" },
  "scrapbook.update": { verb: "updated a scrapbook entry", kind: "content" },
  "scrapbook.delete": { verb: "deleted a scrapbook entry", kind: "content", destructive: true },
  "teaser.toggle": { verb: "toggled the teaser", kind: "content" },
  "teaser.delete": { verb: "deleted the teaser", kind: "content", destructive: true },
  "broadcast.send": { verb: "sent a broadcast to", kind: "content" },
  "data.purge_orders": { verb: "cleared all orders", kind: "deletions", destructive: true },
  "data.purge_messages_signups": { verb: "cleared the inbox and signups", kind: "deletions", destructive: true },
  "data.delete_customers": { verb: "deleted customer accounts", kind: "deletions", destructive: true },
};

/** Unknown keys still read as a sentence rather than an identifier, so a new
 *  action added without touching this file degrades instead of breaking. */
export function describeAction(action: string): Meta {
  return AUDIT_ACTIONS[action] ?? { verb: action.replace(/[._]/g, " "), kind: "content" };
}

/** Where a target can be opened, so an entry links to the thing it changed. */
export function targetHref(action: string, target: string | null): string | null {
  if (!target) return null;
  const kind = describeAction(action).kind;
  if (kind === "team") return "/studio/team";
  if (action.startsWith("product.") || action === "stock.update") return `/studio/products/${target}/edit`;
  if (kind === "orders") return "/studio/orders";
  if (action.startsWith("fabric.")) return "/studio/fabrics";
  if (action.startsWith("scrapbook.")) return "/studio/scrapbook";
  if (action.startsWith("coupon.")) return "/studio/discounts";
  if (action === "content.update") return "/studio/content";
  return null;
}

export type RoleName = Role;
