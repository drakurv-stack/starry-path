import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Allow serving dotfiles like /.well-known/assetlinks.json required for TWA verification
  app.use(express.static(distPath, { dotfiles: "allow" }));

  // fall through to index.html if the file doesn't exist
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
