"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface LinkData {
  id: number;
  original_url: string;
  slug: string;
  click_count: number;
  is_custom: number;
  is_active: number;
  expires_at: string | null;
  created_at: string;
}

export default function UserDashboard() {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/links");
      const data = await response.json();
      if (response.ok) {
        setLinks(data.links);
      } else {
        setError(data.message || "Failed to fetch links");
      }
    } catch (err) {
      setError("An unexpected error occurred while fetching links.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!url) {
      setError("URL is required");
      return;
    }

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          customSlug: customSlug || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Link created successfully! Slug: ${data.slug}`);
        setUrl("");
        setCustomSlug("");
        setExpiresAt("");
        fetchLinks();
      } else {
        setError(data.message || "Failed to create link");
      }
    } catch (err) {
      setError("An unexpected error occurred while creating the link.");
    }
  };

  const handleDeleteLink = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    try {
      const response = await fetch(`/api/links/${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Link deleted successfully.");
        fetchLinks();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete link");
      }
    } catch (err) {
      setError("An unexpected error occurred while deleting the link.");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/logout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      setError("Logout failed.");
    }
  };

  const copyToClipboard = (slug: string) => {
    const shortUrl = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(shortUrl);
    setSuccess("Short URL copied to clipboard!");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          User Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Create New Short Link
        </Typography>
        <Box component="form" onSubmit={handleCreateLink}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Original URL"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Custom Slug (optional)"
                placeholder="my-link"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Expires At (optional)"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" size="large">
                Shorten URL
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Your Links
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Original URL</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell align="right">Clicks</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Expires At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No links found. Create one above!
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell
                    sx={{
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {link.original_url}
                  </TableCell>
                  <TableCell>{link.slug}</TableCell>
                  <TableCell align="right">{link.click_count}</TableCell>
                  <TableCell>
                    {new Date(link.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {link.expires_at
                      ? new Date(link.expires_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      title="Copy short link"
                      onClick={() => copyToClipboard(link.slug)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      title="Delete link"
                      onClick={() => handleDeleteLink(link.slug)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
