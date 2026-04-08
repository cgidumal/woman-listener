type Gender = "female" | "male" | "non-binary" | "unknown";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";

// Gender QIDs
const FEMALE_QIDS = new Set(["Q6581072", "Q1052281"]); // female, trans female
const MALE_QIDS = new Set(["Q6581097", "Q2449503"]); // male, trans male
const NB_QIDS = new Set(["Q48270", "Q1097630", "Q505371"]); // non-binary, intersex, transgender

function qidToGender(qid: string): Gender {
  if (FEMALE_QIDS.has(qid)) return "female";
  if (MALE_QIDS.has(qid)) return "male";
  if (NB_QIDS.has(qid)) return "non-binary";
  return "unknown";
}

// Step 1: Resolve artist names to Wikidata QIDs using search API
async function searchEntity(name: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "wbsearchentities",
    search: name,
    language: "en",
    type: "item",
    limit: "5",
    format: "json",
    origin: "*",
  });

  try {
    const res = await fetch(`${WIKIDATA_API}?${params}`, {
      headers: { "User-Agent": "auditest/1.0 (spotify-audit-app)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Return first result (most likely match for well-known artists)
    return data.search?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

// Step 2: Batch SPARQL query for genders by QIDs
async function batchQueryGenders(
  qids: string[]
): Promise<Map<string, Gender>> {
  if (qids.length === 0) return new Map();

  const values = qids.map((q) => `wd:${q}`).join(" ");
  const query = `
    SELECT ?item ?gender WHERE {
      VALUES ?item { ${values} }
      ?item wdt:P21 ?gender .
    }
  `;

  try {
    const res = await fetch(WIKIDATA_SPARQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "auditest/1.0 (spotify-audit-app)",
      },
      body: `query=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return new Map();
    const data = await res.json();

    const results = new Map<string, Gender>();
    for (const binding of data.results.bindings) {
      const itemQid = binding.item.value.split("/").pop()!;
      const genderQid = binding.gender.value.split("/").pop()!;
      results.set(itemQid, qidToGender(genderQid));
    }
    return results;
  } catch {
    return new Map();
  }
}

// Main function: takes artist names, returns gender map
export async function queryArtistGenders(
  artistNames: string[]
): Promise<Map<string, Gender>> {
  const nameToGender = new Map<string, Gender>();

  // Step 1: Resolve names to QIDs in parallel batches
  const BATCH_SIZE = 10;
  const nameToQid = new Map<string, string>();

  for (let i = 0; i < artistNames.length; i += BATCH_SIZE) {
    const batch = artistNames.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (name) => {
        const qid = await searchEntity(name);
        return { name, qid };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.qid) {
        nameToQid.set(result.value.name, result.value.qid);
      }
    }

    // Small delay between batches to be polite
    if (i + BATCH_SIZE < artistNames.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Step 2: Batch SPARQL query for all resolved QIDs
  const qids = Array.from(nameToQid.values());
  const genderMap = await batchQueryGenders(qids);

  // Step 3: Map back to artist names
  for (const [name, qid] of nameToQid) {
    nameToGender.set(name, genderMap.get(qid) ?? "unknown");
  }

  // Mark unresolved artists as unknown
  for (const name of artistNames) {
    if (!nameToGender.has(name)) {
      nameToGender.set(name, "unknown");
    }
  }

  return nameToGender;
}
