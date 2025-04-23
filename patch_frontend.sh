#!/bin/bash
# Skript zum automatischen Patchen der API_BASE-Integration

# Basis-Pfad zum Frontend-"pages"-Verzeichnis
PAGEDIR="frontend/src/pages"

# Liste der Dateien
FILES=("AdminPanel.jsx" "ContractForm.jsx" "Dashboard.jsx" "Login.jsx" "Profile.jsx" "Register.jsx" "Stats.jsx")

for F in "${FILES[@]}"; do
  FILE="$PAGEDIR/$F"
  if [ ! -f "$FILE" ]; then
    echo "Datei nicht gefunden: $FILE"
    continue
  fi

  echo "Patch für $FILE"

  # 1) import API_BASE einfügen (wenn nicht bereits vorhanden)
  if ! grep -q "API_BASE" "$FILE"; then
    sed -i '1,/import/{s@import React@import { API_BASE } from "../config";\nimport React@}' "$FILE"
  fi

  # 2) Ersetze const API für einfache Dateien
  if [[ "$F" != "ContractForm.jsx" ]]; then
    sed -i 's@const API = "http://192\.168\.1\.150:8001"@const API = API_BASE@' "$FILE"
  else
    # ContractForm.jsx: spezifisches Muster
    sed -i 's@const API = "http://192\.168\.1\.150:8001/contracts/"@const API = \`\${API_BASE}/contracts/\`@' "$FILE"
  fi
done

echo "Fertig! Frontend-Dateien wurden gepatcht."
