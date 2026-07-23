/* eslint-disable */
// One-line-per-item logging shared by every crawler: the sneaker's name and
// whether it was actually saved as a new pending release or just matched
// something already in the database (and if so, what state that row is in).

function logSaveResult(title, response, { testMode = false } = {}) {
  const name = truncate(title || "Untitled");

  if (testMode) {
    console.log(`🧪 ${name} — test mode, not sent`);
    return;
  }

  const data = response && response.data;

  if (!data) {
    console.log(`❌ ${name} — no response from ingest`);
    return;
  }

  if (data.created) {
    console.log(`✅ ${name} — saved`);
    return;
  }

  if (data.status === "rejected" || data.status === "approved") {
    console.log(`⏭️  ${name} — already ${data.status}, skipped`);
    return;
  }

  console.log(`♻️  ${name} — already pending, updated`);
}

function truncate(value, max = 70) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

module.exports = { logSaveResult };
