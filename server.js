import express from "express";
import crypto from "crypto";
import { spawn } from "child_process";
import "dotenv/config";

const app = express();

app.post("/webhook/github", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) return res.status(500).send("GITHUB_WEBHOOK_SECRET manquant");

    const sigHeader = req.header("X-Hub-Signature-256");
    if (!sigHeader) return res.status(401).send("En-tête de signature manquant");

    const expected =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(req.body).digest("hex");

    // ✅ évite le crash timingSafeEqual (sinon 502)
    const a = Buffer.from(sigHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return res.status(401).send("Signature invalide");

    const ok = crypto.timingSafeEqual(a, b);
    if (!ok) return res.status(401).send("Signature invalide");

    // Parser le payload JSON après vérification
    const payload = JSON.parse(req.body.toString("utf8"));

    const event = req.header("X-GitHub-Event");

    // ✅ répondre OK au ping (GitHub test)
    if (event === "ping") {
      return res.status(200).send("pong");
    }

    // Agir uniquement sur les push
    if (event !== "push") return res.status(200).send("Événement ignoré");

    const targetBranch = process.env.TARGET_BRANCH || "main";
    const ref = payload?.ref;

    if (ref !== `refs/heads/${targetBranch}`) {
      return res.status(200).send(`Branche ignorée ${ref}`);
    }

    const script = process.platform === "win32" ? "deploy.ps1" : "deploy.sh";
    const cmd = process.platform === "win32" ? "powershell.exe" : "bash";
    const args =
      process.platform === "win32"
        ? ["-ExecutionPolicy", "Bypass", "-File", script]
        : [script];

    spawn(cmd, args, { env: process.env, stdio: "inherit" });

    return res.status(200).send("Déploiement déclenché");
  } catch (e) {
    console.error(e);
    return res.status(500).send("Erreur serveur");
  }
});

const port = Number(process.env.WEBHOOK_PORT || 9000);
app.listen(port, () => {
  console.log(`Webhook listener sur http://localhost:${port}/webhook/github`);
});
