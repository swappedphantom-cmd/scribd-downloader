import React from "react";
import { useApp, useInput } from "ink";
import { downloadScribd } from "../downloader/scribd.js";
import { parseScribdUrl } from "../downloader/utils.js";
import { UrlInput } from "./components/UrlInput.js";
import { Progress } from "./components/Progress.js";
import { Result } from "./components/Result.js";
import { ErrorResult } from "./components/ErrorResult.js";

const { createElement: h, useState, useEffect, useCallback } = React;

/** Top-level TUI state machine: input -> progress -> result / error. */
export function App({ initialUrl }) {
  const [url, setUrl] = useState(initialUrl || "");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [failError, setFailError] = useState(null);
  const { exit } = useApp();

  useInput((_input, key) => {
    if (key.escape) {
      exit();
    }
  });

  const handleUrlSubmit = useCallback((submitUrl) => {
    const id = parseScribdUrl(submitUrl);
    if (!id) {
      setError("Invalid Scribd URL. Expected format: scribd.com/document/12345");
      return;
    }

    setError("");
    setProgress({ status: "launch", message: "Starting..." });

    downloadScribd(submitUrl, (p) => {
      setProgress({ ...p });
      if (p.status === "done") {
        setResult(p);
      }
      if (p.status === "error") {
        setFailError(p.message);
      }
    }).catch((err) => {
      setFailError(err.message);
    });
  }, []);

  // Auto-start a download when launched with an initial URL. Kicking this off
  // from an effect (not during render) keeps render side-effect free.
  useEffect(() => {
    if (initialUrl) {
      const t = setTimeout(() => handleUrlSubmit(initialUrl), 100);
      return () => clearTimeout(t);
    }
  }, [initialUrl, handleUrlSubmit]);

  if (failError) {
    return h(ErrorResult, { error: failError });
  }

  if (result) {
    return h(Result, { result });
  }

  if (progress) {
    return h(Progress, { progress });
  }

  return h(UrlInput, { onUrlSubmit: handleUrlSubmit, url, setUrl, error });
}
