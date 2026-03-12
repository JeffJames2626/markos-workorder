"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Card, Input } from "@heroui/react";

export function CompleteAccountForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invite token.");
      setLoading(false);
      return;
    }
    fetch(`/api/auth/complete-account?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Invalid invite link");
        }
        return res.json();
      })
      .then((data) => {
        setName(data.name);
        setEmail(data.email);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch("/api/auth/complete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete account");
      }
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted text-sm">Loading...</div>
    );
  }

  if (done) {
    return (
      <Card variant="default" className="w-full max-w-sm">
        <Card.Header>
          <Card.Title>Account Ready</Card.Title>
          <Card.Description>Your password has been set. You can now sign in.</Card.Description>
        </Card.Header>
        <Card.Content>
          <Button variant="primary" fullWidth onPress={() => router.push("/login")}>
            Go to Sign In
          </Button>
        </Card.Content>
      </Card>
    );
  }

  if (error && !name) {
    return (
      <Card variant="default" className="w-full max-w-sm">
        <Card.Header>
          <Card.Title>Invalid Invite</Card.Title>
          <Card.Description>{error}</Card.Description>
        </Card.Header>
        <Card.Content>
          <Button variant="secondary" fullWidth onPress={() => router.push("/login")}>
            Back to Sign In
          </Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card variant="default" className="w-full max-w-sm">
      <Card.Header>
        <Card.Title>Complete Your Account</Card.Title>
        <Card.Description>
          Welcome, {name}! Set a password to activate your account.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            aria-label="Email"
            value={email}
            fullWidth
            readOnly
            className="opacity-60"
          />
          <Input
            type="password"
            placeholder="Password (min 6 characters)"
            aria-label="Password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Input
            type="password"
            placeholder="Confirm password"
            aria-label="Confirm password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            fullWidth
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isPending={isPending}
            isDisabled={isPending}
          >
            {isPending ? "Setting up..." : "Set Password"}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
