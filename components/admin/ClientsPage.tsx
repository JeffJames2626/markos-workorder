"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Label,
  TextField,
  Modal,
  useOverlayState,
} from "@heroui/react";

interface Client {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
}

export function ClientsPage({ clients: initial }: { clients: Client[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const addModal = useOverlayState();
  const editModal = useOverlayState();
  const [editing, setEditing] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const filtered = initial.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.address?.toLowerCase().includes(q) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.includes(q) ?? false)
    );
  });

  const resetForm = () => {
    setName("");
    setAddress("");
    setEmail("");
    setPhone("");
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setName(client.name);
    setAddress(client.address ?? "");
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    editModal.open();
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        address: address.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    });
    setSaving(false);
    addModal.close();
    resetForm();
    router.refresh();
  };

  const handleUpdate = async () => {
    if (!editing || !name.trim()) return;
    setSaving(true);
    await fetch(`/api/clients/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        address: address.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    });
    setSaving(false);
    editModal.close();
    resetForm();
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Clients</h1>
        <Button
          variant="primary"
          size="sm"
          onPress={() => { resetForm(); addModal.open(); }}
        >
          Add Client
        </Button>
      </div>

      <TextField fullWidth value={search} onChange={setSearch}>
        <Label className="sr-only">Search</Label>
        <Input placeholder="Search clients..." />
      </TextField>

      <p className="text-xs text-white/50">
        {filtered.length} client{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-white/40 text-sm">No clients found.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((client) => (
            <Card key={client.id} variant="default">
              <Card.Content>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{client.name}</p>
                    {client.address && (
                      <p className="text-xs text-muted truncate">{client.address}</p>
                    )}
                    {client.email && (
                      <p className="text-xs text-muted truncate">{client.email}</p>
                    )}
                    {client.phone && (
                      <p className="text-xs text-muted">{client.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button variant="ghost" size="sm" onPress={() => openEdit(client)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      onPress={() => handleDelete(client.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <Modal.Backdrop isOpen={addModal.isOpen} onOpenChange={addModal.setOpen}>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Add Client</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <ClientForm
                name={name} setName={setName}
                address={address} setAddress={setAddress}
                email={email} setEmail={setEmail}
                phone={phone} setPhone={setPhone}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">Cancel</Button>
              <Button
                variant="primary"
                isPending={saving}
                isDisabled={!name.trim() || saving}
                onPress={handleAdd}
              >
                {saving ? "Saving..." : "Add Client"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Edit Client Modal */}
      <Modal.Backdrop isOpen={editModal.isOpen} onOpenChange={editModal.setOpen}>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Edit Client</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <ClientForm
                name={name} setName={setName}
                address={address} setAddress={setAddress}
                email={email} setEmail={setEmail}
                phone={phone} setPhone={setPhone}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">Cancel</Button>
              <Button
                variant="primary"
                isPending={saving}
                isDisabled={!name.trim() || saving}
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

function ClientForm({
  name, setName,
  address, setAddress,
  email, setEmail,
  phone, setPhone,
}: {
  name: string; setName: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <TextField fullWidth value={name} onChange={setName}>
        <Label>Name</Label>
        <Input placeholder="Client name" />
      </TextField>
      <TextField fullWidth value={address} onChange={setAddress}>
        <Label>Address</Label>
        <Input placeholder="Service address" />
      </TextField>
      <TextField fullWidth value={email} onChange={setEmail}>
        <Label>Email</Label>
        <Input placeholder="Email address" type="email" />
      </TextField>
      <TextField fullWidth value={phone} onChange={setPhone}>
        <Label>Phone</Label>
        <Input placeholder="Phone number" type="tel" />
      </TextField>
    </div>
  );
}
