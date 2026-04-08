import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

type Gender = "female" | "male" | "non-binary" | "unknown";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const CACHE_PATH = join(process.cwd(), "gender-cache.json");

const FEMALE_QIDS = new Set(["Q6581072", "Q1052281"]);
const MALE_QIDS = new Set(["Q6581097", "Q2449503"]);
const NB_QIDS = new Set(["Q48270", "Q1097630", "Q505371"]);

function qidToGender(qid: string): Gender {
  if (FEMALE_QIDS.has(qid)) return "female";
  if (NB_QIDS.has(qid)) return "non-binary";
  if (MALE_QIDS.has(qid)) return "male";
  return "unknown";
}

// --- Cache ---

let cache: Record<string, Gender> = {};

function loadCache() {
  try {
    if (existsSync(CACHE_PATH)) {
      cache = JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
    } else {
      cache = {};
    }
  } catch {
    cache = {};
  }
}

function saveCache() {
  try {
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch {}
}

// --- PASS 1: Direct SPARQL label match ---

async function sparqlByLabels(
  names: string[]
): Promise<Map<string, Gender>> {
  const results = new Map<string, Gender>();
  if (names.length === 0) return results;

  // Build label variants for matching
  const labelSet = new Set<string>();
  const labelToOriginal = new Map<string, string>();

  for (const name of names) {
    const variants = [name];

    // Title case
    const titleCase = name.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    if (titleCase !== name) variants.push(titleCase);

    // ALL CAPS
    const upper = name.toUpperCase();
    if (upper !== name) variants.push(upper);

    // Original with first letter caps only
    const firstCap = name.charAt(0).toUpperCase() + name.slice(1);
    if (firstCap !== name) variants.push(firstCap);

    for (const v of variants) {
      if (!labelSet.has(v)) {
        labelSet.add(v);
        labelToOriginal.set(v.toLowerCase(), name);
      }
    }
  }

  // Process in chunks of 25 labels
  const allLabels = Array.from(labelSet);
  const CHUNK = 25;

  for (let i = 0; i < allLabels.length; i += CHUNK) {
    const chunk = allLabels.slice(i, i + CHUNK);
    const values = chunk
      .map((l) => `"${l.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"@en`)
      .join(" ");

    const query = `
      SELECT ?label ?gender WHERE {
        VALUES ?label { ${values} }
        ?item rdfs:label ?label .
        {
          ?item wdt:P31 wd:Q5 .
          ?item wdt:P21 ?gender .
        } UNION {
          ?item wdt:P527 ?member .
          ?member wdt:P21 ?gender .
        }
      }
    `;

    try {
      const res = await fetch(WIKIDATA_SPARQL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "auditest/1.0",
        },
        body: `query=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) continue;
      const data = await res.json();

      for (const binding of data.results.bindings) {
        const label = binding.label.value;
        const genderQid = binding.gender.value.split("/").pop()!;
        const gender = qidToGender(genderQid);
        const original = labelToOriginal.get(label.toLowerCase()) ?? label;
        const existing = results.get(original);
        if (!existing || gender === "female" || (gender === "non-binary" && existing === "male")) {
          results.set(original, gender);
        }
      }
    } catch {}
  }

  return results;
}

// --- PASS 2: wbsearchentities fallback for remaining unknowns ---

async function searchEntityQid(name: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "wbsearchentities",
    search: name,
    language: "en",
    type: "item",
    limit: "10",
    format: "json",
    origin: "*",
  });

  try {
    const res = await fetch(`${WIKIDATA_API}?${params}`, {
      headers: { "User-Agent": "auditest/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.search ?? [];

    // Pick the result most likely to be a musician
    const musicWords = /singer|musician|rapper|band|duo|trio|group|artist|songwriter|producer|dj|vocalist|composer|born \d{4}|musical|rock|pop|hip.hop|r&b|electronic|jazz|folk|country|indie|punk|soul|funk|reggae|latin/i;
    const skipWords = /given name|family name|surname|disambiguation|village|city|town|district|province|river|film|movie|television|novel|protein|gene|species|genus|asteroid|language|ethnic/i;

    for (const r of results) {
      const desc = r.description || "";
      if (musicWords.test(desc)) return r.id;
    }
    for (const r of results) {
      const desc = r.description || "";
      if (!skipWords.test(desc) && desc.length > 0) return r.id;
    }
    return null;
  } catch {
    return null;
  }
}

async function sparqlByQids(qids: Map<string, string>): Promise<Map<string, Gender>> {
  const results = new Map<string, Gender>();
  if (qids.size === 0) return results;

  const allQids = Array.from(new Set(qids.values()));
  const values = allQids.map((q) => `wd:${q}`).join(" ");

  const query = `
    SELECT ?item ?gender WHERE {
      VALUES ?item { ${values} }
      {
        ?item wdt:P21 ?gender .
      } UNION {
        ?item wdt:P527 ?member .
        ?member wdt:P21 ?gender .
      }
    }
  `;

  try {
    const res = await fetch(WIKIDATA_SPARQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "auditest/1.0",
      },
      body: `query=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return results;
    const data = await res.json();

    const qidGender = new Map<string, Gender>();
    for (const binding of data.results.bindings) {
      const itemQid = binding.item.value.split("/").pop()!;
      const genderQid = binding.gender.value.split("/").pop()!;
      const gender = qidToGender(genderQid);
      const existing = qidGender.get(itemQid);
      if (!existing || gender === "female" || (gender === "non-binary" && existing === "male")) {
        qidGender.set(itemQid, gender);
      }
    }

    // Map QIDs back to artist names
    for (const [name, qid] of qids) {
      const gender = qidGender.get(qid);
      if (gender) results.set(name, gender);
    }
  } catch {}

  return results;
}

// --- Main function ---

export async function queryArtistGenders(
  artistNames: string[]
): Promise<Map<string, Gender>> {
  loadCache();

  const nameToGender = new Map<string, Gender>();
  const uncachedNames: string[] = [];

  for (const name of artistNames) {
    const normalized = name.toLowerCase().trim();
    if (cache[normalized] && cache[normalized] !== "unknown") {
      // Only use cache for known genders — re-check unknowns
      nameToGender.set(name, cache[normalized]);
    } else {
      uncachedNames.push(name);
    }
  }

  console.log(
    `[wikidata] ${artistNames.length} total, ${artistNames.length - uncachedNames.length} cached, ${uncachedNames.length} to look up`
  );

  if (uncachedNames.length === 0) return nameToGender;

  // PASS 1: Direct SPARQL label match (fast, gets ~70%)
  const pass1 = await sparqlByLabels(uncachedNames);
  const stillUnknown: string[] = [];

  for (const name of uncachedNames) {
    if (pass1.has(name)) {
      nameToGender.set(name, pass1.get(name)!);
      cache[name.toLowerCase().trim()] = pass1.get(name)!;
    } else {
      stillUnknown.push(name);
    }
  }

  console.log(`[wikidata] pass 1 (SPARQL labels): resolved ${pass1.size}, ${stillUnknown.length} remaining`);

  // PASS 2: Search API fallback for remaining (slower but fuzzy matching)
  if (stillUnknown.length > 0) {
    const nameToQid = new Map<string, string>();
    const BATCH = 15;

    for (let i = 0; i < stillUnknown.length; i += BATCH) {
      const batch = stillUnknown.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (name) => {
          const qid = await searchEntityQid(name);
          return { name, qid };
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.qid) {
          nameToQid.set(r.value.name, r.value.qid);
        }
      }
      if (i + BATCH < stillUnknown.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    console.log(`[wikidata] pass 2 (search API): resolved ${nameToQid.size}/${stillUnknown.length} QIDs`);

    // Batch SPARQL the QIDs
    const pass2 = await sparqlByQids(nameToQid);
    for (const [name, gender] of pass2) {
      nameToGender.set(name, gender);
      cache[name.toLowerCase().trim()] = gender;
    }

    console.log(`[wikidata] pass 2 resolved ${pass2.size} more`);
  }

  // Collect remaining unknowns for pass 3
  const stillUnknownAfterPass2 = uncachedNames.filter((n) => !nameToGender.has(n));

  // PASS 3: LLM fallback (Claude Haiku) for anything still unknown
  if (stillUnknownAfterPass2.length > 0 && process.env.ANTHROPIC_API_KEY) {
    console.log(`[wikidata] pass 3 (LLM): classifying ${stillUnknownAfterPass2.length} remaining artists`);
    const llmResults = await classifyWithLLM(stillUnknownAfterPass2);
    for (const [name, gender] of llmResults) {
      nameToGender.set(name, gender);
      cache[name.toLowerCase().trim()] = gender;
    }
    console.log(`[wikidata] pass 3 resolved ${llmResults.size}`);
  }

  // Mark anything truly remaining as unknown
  for (const name of uncachedNames) {
    if (!nameToGender.has(name)) {
      nameToGender.set(name, "unknown");
      cache[name.toLowerCase().trim()] = "unknown";
    }
  }

  saveCache();
  const finalUnknown = Array.from(nameToGender.values()).filter((g) => g === "unknown").length;
  console.log(`[wikidata] done. ${nameToGender.size} artists, ${finalUnknown} unknown, cache: ${Object.keys(cache).length}`);

  return nameToGender;
}

// --- PASS 3: LLM classification ---

async function classifyWithLLM(names: string[]): Promise<Map<string, Gender>> {
  const results = new Map<string, Gender>();

  const prompt = `Classify each music artist/band's gender. Rules:
- "female" = solo female artist, or a band/duo where ANY member is female or non-binary
- "male" = solo male artist, or all-male band
- "non-binary" = solo non-binary artist
- "unknown" = only if you truly cannot determine

For bands/duos/groups: if there is AT LEAST ONE woman or non-binary person in the group, classify as "female".

Respond with ONLY a JSON object mapping artist name to gender. No explanation.

Artists to classify:
${names.map((n) => `- ${n}`).join("\n")}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-20250414",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.error(`[llm] API error: ${res.status}`);
      return results;
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return results;

    const classifications = JSON.parse(jsonMatch[0]);
    for (const [name, gender] of Object.entries(classifications)) {
      const g = (gender as string).toLowerCase();
      if (g === "female" || g === "male" || g === "non-binary") {
        // Find original name (case-insensitive match)
        const original = names.find((n) => n.toLowerCase() === name.toLowerCase()) ?? name;
        results.set(original, g as Gender);
      }
    }
  } catch (err) {
    console.error("[llm] classification error:", err);
  }

  return results;
}
