window.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupGroupJsonTool();
  setupGuideHistoryTool();
});

function $(id) {
  return document.getElementById(id);
}

function setStatus(element, message, type = "") {
  if (!element) return;
  element.textContent = message || "";
  element.className = `status ${type}`.trim();
}

function setMeta(element, message = "") {
  if (!element) return;
  element.textContent = message;
}

function escapeCsv(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function copyTextToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

function downloadText(text, filename, mime = "text/plain;charset=utf-8;") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".tool-panel");
  const chooserMessage = $("toolChooserMessage");

  function activateTab(target) {
    let foundMatch = false;

    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === target;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
      if (isActive) foundMatch = true;
    });

    panels.forEach((panel) => {
      const isActive = panel.id === `panel-${target}`;
      panel.classList.toggle("active", isActive);
      panel.hidden = !isActive;
    });

    if (chooserMessage) {
      chooserMessage.hidden = foundMatch;
    }
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateTab(button.dataset.tab);
    });
  });

  // Initial state: no tool selected
  tabButtons.forEach((btn) => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
  });

  panels.forEach((panel) => {
    panel.classList.remove("active");
    panel.hidden = true;
  });

  if (chooserMessage) {
    chooserMessage.hidden = false;
  }
}

function setupGroupJsonTool() {
  const jsonInput = $("groupJsonInput");
  const csvOutput = $("groupCsvOutput");
  const statusEl = $("groupStatus");
  const metaEl = $("groupMeta");

  const sampleData = [
    {
      textPayload:
        "Deleting ItemGroup: {StringKey:{Key:/ItemGroup,_PENDO_UNGROUPED_/ItemGroup,P6PoxNbuxj7jWSqE9ZWgi7Zu5RE} CreatedUpdatedInfo:{CreatedByUserKey:/User,6210665217589248 CreatedAt:2026-02-26 20:31:09.301373 +0000 UTC LastUpdatedByUserKey:/User,6210665217589248 LastUpdatedAt:2026-02-26 20:31:50.356918 +0000 UTC} AppKey: AppKeys:[] Attributes: Name:IQ | Global Navigation Description: Color:.groupColor07 FeedbackProductId: FeedbackVisibility: Members:[/Feature,F0gWY_v0kX-Vp9iy4EB1K5PjnpU /Feature,O8jTOuZADkykJm4Won-CAHmGitc /Feature,LNgZvuGnm9m0CMyfUceUZdEfGA4 /Feature,wLYT3KMya1TTk_Rh-W7BWEmOI38 /Feature,x8uNKwfoBr7aylKnpJEdHS0rUGc] TeamKeys:[] Type:group}",
    },
  ];

  function parseTextPayload(textPayload) {
    const groupIdMatch = textPayload.match(
      /StringKey:\{Key:\/ItemGroup,_PENDO_UNGROUPED_\/ItemGroup,([^}]+)\}/
    );
    const groupId = groupIdMatch ? groupIdMatch[1].trim() : null;

    const nameMatch = textPayload.match(/Name:(.*?) Description:/);
    const name = nameMatch ? nameMatch[1].trim() : null;

    const membersMatch = textPayload.match(/Members:\[(.*?)\] TeamKeys:/);
    const membersRaw = membersMatch ? membersMatch[1].trim() : "";

    const members = [];
    const memberRegex = /\/([^,\s]+),([^\s\]]+)/g;
    let match;

    while ((match = memberRegex.exec(membersRaw)) !== null) {
      members.push({
        type: match[1],
        itemId: match[2],
      });
    }

    return { groupId, name, members };
  }

  function convertJsonToCsv(rawJson) {
    const parsed = JSON.parse(rawJson);

    if (!Array.isArray(parsed)) {
      throw new Error("Input must be a JSON array.");
    }

    const rows = [];

    for (const item of parsed) {
      if (!item || typeof item.textPayload !== "string") continue;

      const { groupId, name, members } = parseTextPayload(item.textPayload);
      if (!groupId || members.length === 0) continue;

      for (const member of members) {
        rows.push({
          groupId,
          name,
          Type: member.type,
          itemId: member.itemId,
        });
      }
    }

    const header = ["groupId", "name", "Type", "itemId"];
    const csvLines = [header.join(",")];

    for (const row of rows) {
      csvLines.push(
        [
          escapeCsv(row.groupId),
          escapeCsv(row.name),
          escapeCsv(row.Type),
          escapeCsv(row.itemId),
        ].join(",")
      );
    }

    return {
      csv: csvLines.join("\n"),
      rowCount: rows.length,
      groupCount: new Set(rows.map((row) => row.groupId)).size,
    };
  }

  $("groupConvertBtn").addEventListener("click", () => {
    try {
      const raw = jsonInput.value.trim();

      if (!raw) {
        csvOutput.value = "";
        setMeta(metaEl, "");
        setStatus(statusEl, "Paste some JSON first.", "error");
        return;
      }

      const result = convertJsonToCsv(raw);
      csvOutput.value = result.csv;
      setStatus(statusEl, "CSV ready.", "success");
      setMeta(
        metaEl,
        `${result.rowCount} row(s) across ${result.groupCount} group(s).`
      );
    } catch (error) {
      csvOutput.value = "";
      setMeta(metaEl, "");
      setStatus(statusEl, `Could not parse input: ${error.message}`, "error");
    }
  });

  $("groupCopyBtn").addEventListener("click", async () => {
    if (!csvOutput.value) {
      setStatus(statusEl, "Nothing to copy yet.", "error");
      return;
    }

    try {
      await copyTextToClipboard(csvOutput.value);
      setStatus(statusEl, "CSV copied to clipboard.", "success");
    } catch {
      setStatus(
        statusEl,
        "Clipboard copy failed. You can still select and copy manually.",
        "error"
      );
    }
  });

  $("groupDownloadBtn").addEventListener("click", () => {
    if (!csvOutput.value) {
      setStatus(statusEl, "Nothing to download yet.", "error");
      return;
    }

    downloadText(csvOutput.value, "group-members.csv", "text/csv;charset=utf-8;");
    setStatus(statusEl, "CSV downloaded.", "success");
  });

  $("groupSampleBtn").addEventListener("click", () => {
    jsonInput.value = JSON.stringify(sampleData, null, 2);
    csvOutput.value = "";
    setMeta(metaEl, "");
    setStatus(statusEl, "Sample loaded.", "success");
  });

  $("groupClearBtn").addEventListener("click", () => {
    jsonInput.value = "";
    csvOutput.value = "";
    setMeta(metaEl, "");
    setStatus(statusEl, "Cleared. Fresh slate.");
  });
}

function setupGuideHistoryTool() {
  const jsonInput = $("guideJsonInput");
  const csvOutput = $("guideCsvOutput");
  const statusEl = $("guideStatus");
  const metaEl = $("guideMeta");
  const fieldListEl = $("guideFieldList");
  const fieldSearchEl = $("guideFieldSearch");

  const WHOLE_OBJECT_FIELDS = new Set([
    "audience",
    "audienceUiHint",
    "attributes.badge"
  ]);

  const NOISY_FIELDS = new Set([
    "audience",
    "audienceUiHint",
    "attributes.badge",
    "step_attributes.badge"
  ]);

  const DEFAULT_FIELDS = [
    "lastUpdatedAt",
    "id",
    "name",
    "lastUpdatedByUser.username",
    "state",
    "launchMethod",
    "publishedEver",
    "showsAfter",
    "currentFirstEligibleToBeSeenAt",
    "expiresAfter",
    "resetAt",
    "step_id"
  ];

  let discoveredFields = [];
  let currentRows = [];

  const sampleGuideHistory = [
    {
      lastUpdatedAt: 1773769328276,
      id: "032Zt9E1yxqsCBrFJUjuEn9b3ZM",
      name: "EE-1557 tooltip inline",
      state: "_pendingReview_",
      launchMethod: "dom",
      publishedEver: false,
      showsAfter: 0,
      currentFirstEligibleToBeSeenAt: 0,
      expiresAfter: 1774412100000,
      resetAt: 0,
      lastUpdatedByUser: {
        username: "alisyn.collins@pendo.io"
      },
      attributes: {
        device: { type: "desktop" },
        overrideAutoThrottling: true
      },
      redisplay: {
        interval: 86400000,
        timeUnit: "Day",
        maxDismissals: 2
      },
      steps: [
        {
          id: "JRKtWlZLeWZAJe8W6f0iq1ZRaLY",
          pageId: "i2uh65Cm6DX23lyt0II8KMmWELg",
          elementPathRule: "h1",
          triggerElementPathRule: "",
          confirmationElementPathRule: "",
          advanceMethod: "button"
        }
      ]
    }
  ];

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function getByPath(obj, path) {
    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (current == null) return "";
      current = current[part];
    }

    return normalizeValue(current);
  }

  function normalizeValue(value) {
    if (value == null) return "";

    if (typeof value === "number") {
      if (looksLikeTimestamp(value)) {
        return toISO(value);
      }
      return value;
    }

    if (typeof value === "string") {
      if (looksLikeTimestampString(value)) {
        return toISO(value);
      }
      return value;
    }

    if (typeof value === "boolean") return value;

    if (Array.isArray(value)) {
      if (value.every((item) => typeof item !== "object" || item == null)) {
        return value.join(" | ");
      }
      return JSON.stringify(value);
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  function looksLikeTimestamp(value) {
    return typeof value === "number" && value > 100000000000;
  }

  function looksLikeTimestampString(value) {
    if (typeof value !== "string") return false;
    if (/^\d{12,}$/.test(value)) return true;
    return !Number.isNaN(new Date(value).getTime()) && /[-T:]/.test(value);
  }

  function toISO(value) {
    if (value == null || value === "") return "";

    const num = Number(value);
    if (!Number.isNaN(num) && num > 100000000000) {
      const d = new Date(num);
      return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
    }

    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
  }

  function collectPaths(value, prefix = "", out = new Set()) {
    if (value == null) return out;

    if (Array.isArray(value)) {
      if (prefix) out.add(prefix);
      return out;
    }

    if (!isPlainObject(value)) {
      if (prefix) out.add(prefix);
      return out;
    }

    if (prefix && WHOLE_OBJECT_FIELDS.has(prefix)) {
      out.add(prefix);
      return out;
    }

    const keys = Object.keys(value);
    if (!keys.length && prefix) {
      out.add(prefix);
      return out;
    }

    for (const key of keys) {
      const next = prefix ? `${prefix}.${key}` : key;
      const child = value[key];

      if (WHOLE_OBJECT_FIELDS.has(next)) {
        out.add(next);
      } else if (Array.isArray(child)) {
        out.add(next);
      } else if (isPlainObject(child)) {
        collectPaths(child, next, out);
      } else {
        out.add(next);
      }
    }

    return out;
  }

  function isNoisyField(field) {
    if (NOISY_FIELDS.has(field)) return true;

    for (const noisy of NOISY_FIELDS) {
      if (field.startsWith(`${noisy}.`)) return true;
    }

    return false;
  }

  function flattenGuideHistory(root) {
    const items = Array.isArray(root)
      ? root
      : Array.isArray(root.history)
        ? root.history
        : [root];

    const rows = [];
    const fieldSet = new Set();

    for (const entry of items) {
      const steps = Array.isArray(entry.steps) && entry.steps.length ? entry.steps : [null];

      collectPaths(entry, "", fieldSet);

      for (const step of steps) {
        if (step) {
          collectPaths(step, "step", fieldSet);
        }

        const row = {};

        for (const path of fieldSet) {
          if (path.startsWith("steps")) continue;
          if (path.startsWith("audience")) continue;
          if (path.startsWith("audienceUiHint")) continue;
        }

        const topLevelPaths = Array.from(collectPaths(entry)).filter(
          (p) => !p.startsWith("steps") && !p.startsWith("audience") && !p.startsWith("audienceUiHint")
        );

        for (const path of topLevelPaths) {
          row[path] = getByPath(entry, path);
        }

        if (step) {
          const stepPaths = Array.from(collectPaths(step, "step"));
          for (const path of stepPaths) {
            const rawStepPath = path.replace(/^step\./, "");
            const csvName = path.replace(/^step\./, "step_");
            row[csvName] = getByPath(step, rawStepPath);
          }
        }

        rows.push(row);
      }
    }

    const discovered = new Set();
    for (const row of rows) {
      Object.keys(row).forEach((key) => discovered.add(key));
    }

    return {
      rows,
      fields: Array.from(discovered).sort((a, b) => a.localeCompare(b))
    };
  }

  function renderFieldList(fields, selected = DEFAULT_FIELDS) {
    const selectedSet = new Set(selected);
    fieldListEl.innerHTML = "";

    for (const field of fields) {
      const id = `field_${field.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      const wrapper = document.createElement("div");
      wrapper.className = "field-option";
      wrapper.dataset.field = field;
      wrapper.dataset.noisy = String(isNoisyField(field));

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = id;
      checkbox.value = field;
      checkbox.checked = selectedSet.has(field);

      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = field;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      fieldListEl.appendChild(wrapper);
    }
  }

  function getSelectedFields() {
    return Array.from(
      fieldListEl.querySelectorAll('input[type="checkbox"]:checked')
    ).map((el) => el.value);
  }

  function applyFieldFilter() {
    const term = fieldSearchEl.value.trim().toLowerCase();
    const hideNoisy = $("guideHideNoisyFields").checked;
    const options = fieldListEl.querySelectorAll(".field-option");

    options.forEach((option) => {
      const field = option.dataset.field.toLowerCase();
      const isNoisy = option.dataset.noisy === "true";

      const matchesSearch = field.includes(term);
      const allowedByNoiseToggle = !hideNoisy || !isNoisy;

      option.style.display = matchesSearch && allowedByNoiseToggle ? "" : "none";
    });
  }

  function rowsToCsv(rows, selectedFields) {
    if (!rows.length || !selectedFields.length) return "";

    const lines = [];
    lines.push(selectedFields.join(","));

    for (const row of rows) {
      const line = selectedFields
        .map((field) => escapeCsv(row[field] ?? ""))
        .join(",");
      lines.push(line);
    }

    return lines.join("\n");
  }

  function analyze() {
    try {
      const raw = jsonInput.value.trim();
      if (!raw) {
        setStatus(statusEl, "Paste some JSON first.", "error");
        setMeta(metaEl, "");
        fieldListEl.innerHTML = "";
        csvOutput.value = "";
        return;
      }

      const parsed = JSON.parse(raw);
      const result = flattenGuideHistory(parsed);

      currentRows = result.rows;
      discoveredFields = result.fields;

      renderFieldList(discoveredFields, DEFAULT_FIELDS);
      applyFieldFilter();

      setStatus(statusEl, "Fields discovered.", "success");
      setMeta(
        metaEl,
        `${currentRows.length} row(s), ${discoveredFields.length} available field(s).`
      );
    } catch (error) {
      currentRows = [];
      discoveredFields = [];
      fieldListEl.innerHTML = "";
      csvOutput.value = "";
      setMeta(metaEl, "");
      setStatus(statusEl, `Could not analyze input: ${error.message}`, "error");
    }
  }

  $("guideAnalyzeBtn").addEventListener("click", analyze);

  $("guideProcessBtn").addEventListener("click", () => {
    try {
      if (!currentRows.length) {
        analyze();
      }

      if (!currentRows.length) {
        setStatus(statusEl, "No usable rows found.", "error");
        return;
      }

      const selectedFields = getSelectedFields();
      if (!selectedFields.length) {
        setStatus(statusEl, "Select at least one field.", "error");
        return;
      }

      const csv = rowsToCsv(currentRows, selectedFields);
      csvOutput.value = csv;
      setStatus(statusEl, "CSV ready.", "success");
      setMeta(
        metaEl,
        `${currentRows.length} row(s), ${selectedFields.length} selected field(s).`
      );
    } catch (error) {
      csvOutput.value = "";
      setStatus(statusEl, `Could not build CSV: ${error.message}`, "error");
    }
  });

  $("guideSelectDefaultsBtn").addEventListener("click", () => {
    fieldListEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = DEFAULT_FIELDS.includes(checkbox.value);
    });
  });

  $("guideSelectAllBtn").addEventListener("click", () => {
    fieldListEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = true;
    });
  });

  $("guideClearFieldsBtn").addEventListener("click", () => {
    fieldListEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = false;
    });
  });

  fieldSearchEl.addEventListener("input", applyFieldFilter);

  $("guideHideNoisyFields").addEventListener("change", applyFieldFilter);

  $("guideCopyBtn").addEventListener("click", async () => {
    if (!csvOutput.value) {
      setStatus(statusEl, "Nothing to copy yet.", "error");
      return;
    }

    try {
      await copyTextToClipboard(csvOutput.value);
      setStatus(statusEl, "CSV copied to clipboard.", "success");
    } catch {
      setStatus(statusEl, "Clipboard copy failed.", "error");
    }
  });

  $("guideDownloadBtn").addEventListener("click", () => {
    if (!csvOutput.value) {
      setStatus(statusEl, "Nothing to download yet.", "error");
      return;
    }

    downloadText(csvOutput.value, "guide-history.csv", "text/csv;charset=utf-8;");
    setStatus(statusEl, "CSV downloaded.", "success");
  });

  $("guideSampleBtn").addEventListener("click", () => {
    jsonInput.value = JSON.stringify(sampleGuideHistory, null, 2);
    currentRows = [];
    discoveredFields = [];
    fieldListEl.innerHTML = "";
    csvOutput.value = "";
    setMeta(metaEl, "");
    setStatus(statusEl, "Sample loaded. Click Analyze Fields.", "success");
  });

  $("guideClearBtn").addEventListener("click", () => {
    jsonInput.value = "";
    csvOutput.value = "";
    fieldListEl.innerHTML = "";
    fieldSearchEl.value = "";
    currentRows = [];
    discoveredFields = [];
    setMeta(metaEl, "");
    setStatus(statusEl, "Cleared. Fresh slate.");
  });
}