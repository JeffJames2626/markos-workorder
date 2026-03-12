"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Label,
  TextField,
  Select,
  ListBox,
  Modal,
  useOverlayState,
} from "@heroui/react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string | null;
  inviteToken: string | null;
  inviteExpires: string | null;
  createdAt: string;
}

const ROLES = [
  { value: "tech", label: "Tech" },
  { value: "admin", label: "Admin" },
] as const;

export function UsersPage({ users: initial, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();
  const addModal = useOverlayState();
  const editModal = useOverlayState();
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tech");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("tech");
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    editModal.open();
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        role,
        sendInvite: true,
      }),
    });
    setSaving(false);
    addModal.close();
    resetForm();
    router.refresh();
  };

  const handleUpdate = async () => {
    if (!editing || !name.trim() || !email.trim()) return;
    setSaving(true);
    const body: Record<string, string> = {
      name: name.trim(),
      email: email.trim(),
      role,
    };
    if (password) body.password = password;
    await fetch(`/api/users/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    editModal.close();
    resetForm();
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (id === currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Users</h1>
        <Button
          variant="primary"
          size="sm"
          onPress={() => { resetForm(); addModal.open(); }}
        >
          Add User
        </Button>
      </div>

      <p className="text-xs text-muted">
        {initial.length} user{initial.length !== 1 ? "s" : ""}
      </p>

      {initial.length === 0 ? (
        <div className="py-12 text-center text-muted text-sm">No users found.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {initial.map((user) => (
            <Card key={user.id} variant="default">
              <Card.Content>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        user.role === "admin"
                          ? "bg-accent-soft text-accent"
                          : "bg-default text-muted"
                      }`}>
                        {user.role}
                      </span>
                      {!user.passwordHash && user.inviteToken && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-warning-soft text-warning">
                          Invited
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button variant="ghost" size="sm" onPress={() => openEdit(user)}>
                      Edit
                    </Button>
                    {user.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onPress={() => handleDelete(user.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <Modal.Backdrop isOpen={addModal.isOpen} onOpenChange={addModal.setOpen}>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Add User</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <UserForm
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                role={role} setRole={setRole}
                showPassword={false}
              />
              <p className="text-xs text-muted mt-2">
                An invite email will be sent for the user to set their password.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">Cancel</Button>
              <Button
                variant="primary"
                isPending={saving}
                isDisabled={!name.trim() || !email.trim() || saving}
                onPress={handleAdd}
              >
                {saving ? "Sending invite..." : "Invite User"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Edit User Modal */}
      <Modal.Backdrop isOpen={editModal.isOpen} onOpenChange={editModal.setOpen}>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Edit User</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <UserForm
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                role={role} setRole={setRole}
                showPassword
                password={password} setPassword={setPassword}
                passwordRequired={false}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">Cancel</Button>
              <Button
                variant="primary"
                isPending={saving}
                isDisabled={!name.trim() || !email.trim() || saving}
                onPress={handleUpdate}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

function UserForm({
  name, setName,
  email, setEmail,
  role, setRole,
  showPassword = false,
  password, setPassword,
  passwordRequired = false,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  role: string; setRole: (v: string) => void;
  showPassword?: boolean;
  password?: string; setPassword?: (v: string) => void;
  passwordRequired?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <TextField fullWidth value={name} onChange={setName}>
        <Label>Name</Label>
        <Input placeholder="Full name" />
      </TextField>
      <TextField fullWidth value={email} onChange={setEmail}>
        <Label>Email</Label>
        <Input placeholder="Email address" type="email" />
      </TextField>
      {showPassword && setPassword && (
        <TextField fullWidth value={password ?? ""} onChange={setPassword}>
          <Label>{passwordRequired ? "Password" : "Password (leave blank to keep)"}</Label>
          <Input placeholder={passwordRequired ? "Password" : "Leave blank to keep current"} type="password" />
        </TextField>
      )}
      <Select
        aria-label="Role"
        fullWidth
        selectedKey={role}
        onSelectionChange={(key) => setRole(key as string)}
      >
        <Label>Role</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {ROLES.map((r) => (
              <ListBox.Item key={r.value} id={r.value} textValue={r.label}>
                {r.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}
