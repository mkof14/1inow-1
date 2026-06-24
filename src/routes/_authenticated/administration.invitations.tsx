import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchInvitations,
  createInvitation,
  cancelInvitation,
  resendInvitation,
  ROLES,
  ROLE_LABELS,
  type AppRole,
  logEmail,
} from "@/lib/admin-queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/administration/invitations")({
  component: InvitationsPage,
});

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  expired: "outline",
  canceled: "destructive",
  failed: "destructive",
};

function InvitationsPage() {
  const t = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("employee");
  const [language, setLanguage] = useState("en");
  const [message, setMessage] = useState("");

  const invitations = useQuery({ queryKey: ["admin-invitations"], queryFn: fetchInvitations });

  const create = useMutation({
    mutationFn: async () => {
      const inv = await createInvitation({
        email,
        full_name: fullName || undefined,
        role,
        language,
        custom_message: message || undefined,
      });
      await logEmail({
        template_slug: "invitation",
        language,
        recipient_email: email,
        module: "invitations",
        variables: {
          recipient_name: fullName || email,
          inviter_name: "Administrator",
          organization_name: "1inow",
          role: ROLE_LABELS[role] ?? role,
          accept_url: `${window.location.origin}/auth?invite=${(inv as any)?.token ?? ""}`,
          expires_at: new Date(Date.now() + 14 * 86400_000).toLocaleDateString(),
        },
      });
      return inv;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
      qc.invalidateQueries({ queryKey: ["admin-email-logs"] });
      toast.success("Invitation created (email sending is disabled in dev)");
      setOpen(false);
      setEmail("");
      setFullName("");
      setMessage("");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const cancelInv = useMutation({
    mutationFn: cancelInvitation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
      toast.success("Canceled");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const resend = useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
      toast.success("Resent");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(link).then(() => toast.success("Link copied"));
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("page.invitations.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("page.invitations.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-1.5" /> {t("page.invitations.new")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("page.invitations.inviteUser")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="inv-email">Email *</Label>
                <Input
                  id="inv-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-name">Full name</Label>
                <Input
                  id="inv-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="uk">Ukrainian</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="he">Hebrew</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-msg">Custom message</Label>
                <Textarea
                  id="inv-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Optional welcome message"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => create.mutate()} disabled={!email || create.isPending}>
                <Mail className="size-4 mr-1.5" />{" "}
                {create.isPending ? "Creating…" : "Send invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.recipient")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.role")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.status")}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t("tbl.expires")}</th>
                <th className="text-right px-4 py-2.5 font-medium">{t("tbl.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invitations.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!invitations.isLoading && (invitations.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {t("page.invitations.empty")}
                  </td>
                </tr>
              )}
              {invitations.data?.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{inv.full_name ?? inv.email}</div>
                    {inv.full_name && (
                      <div className="text-xs text-muted-foreground">{inv.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{ROLE_LABELS[inv.role as AppRole] ?? inv.role}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={statusVariants[inv.status] ?? "secondary"}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => copyLink(inv.token)}>
                      <Copy className="size-3.5" />
                    </Button>
                    {inv.status !== "accepted" && inv.status !== "canceled" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => resend.mutate(inv.id)}>
                          {t("btn.resend")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => cancelInv.mutate(inv.id)}
                        >
                          {t("common.cancel")}
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
