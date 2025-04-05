## 1. Einführung

### 1.1 Projektbeschreibung

PlanPago stellt eine Webanwendung zur Verfügung, die Privatpersonen bei der effizienten Verwaltung von Verträgen, Zahlungsverpflichtungen und Fristen unterstützt. Kernfunktion ist die übersichtliche Darstellung aller relevanten Vertragsdaten und automatisierte Erinnerung per E-Mail an wichtige Termine.

### 1.2 Zielsetzung

Das Projektziel besteht darin, Nutzern eine strukturierte und leicht bedienbare digitale Plattform anzubieten, um ihre Vertragsverwaltung, Zahlungsverpflichtungen und Fristen übersichtlich zu organisieren.

---

## 2. Allgemeine Anforderungen

### 2.1 Zielgruppe

Privatpersonen, welche ihre vertraglichen Verpflichtungen effizient organisieren wollen.

### 2.2 Bedienbarkeit

- Webbasierte Applikation
    
- Intuitive Bedienung
    
- Responsives Design für unterschiedliche Endgeräte (Smartphone, Tablet, Desktop)
    

---

## 3. Funktionale Anforderungen

### 3.1 Vertragserstellung und -verwaltung

- Erstellung neuer Verträge mit folgenden Eingabefeldern:
    
    - Vertragsname
        
    - Vertragsart (z.B. Mietvertrag, Versicherung, Gehalt)
        
    - Vertragsdauer (Start- und Enddatum)
        
    - Zahlungsintervall (monatlich, quartalsweise, jährlich)
        
    - Zahlbetrag
        
    - Nächste Zahlungsfrist
        
    - Optionale Notizen
        
- Upload von Vertragsdokumenten (PDF oder Bilddatei) mit sicherer Speicherung
    
- Dynamische Eingabeformulare angepasst an die Vertragsart (z.B. Brutto-Netto-Gehaltsberechnung beim Gehaltsvertrag)
    

### 3.2 Dashboard-Übersicht

- Übersicht aller aktiven Verträge
    
- Filter- und Sortieroptionen nach Zeitraum, Vertragsart und Status
    
- Diagramme zur Visualisierung der Ausgabenverteilung und anstehender Zahlungen
    
- Automatische Berechnung monatlicher Fixkosten
    

### 3.3 Automatisiertes Reminder-System

- Versand individueller Erinnerungs-E-Mails zu bevorstehenden Fristen und Zahlungen
    
- Anpassung der Erinnerungsmailinhalte nach Vertragsart (z.B. Kündigungsfristen, Gehaltszahlungstermine)
    

---

## 4. Nicht-funktionale Anforderungen

### 4.1 Technische Anforderungen

- **Frontend:** React.js, Tailwind CSS für modernes Design
    
- **Backend:** Python mit FastAPI für eine REST-API
    
- **Datenbank:** SQLite
    
- **E-Mail-Versand:** SMTP (Gmail oder alternativer SMTP-Dienst wie Mailgun oder Sendinblue)
    
- Sichere Speicherung hochgeladener Dateien auf dem Server
    
- Sicherung und Verschlüsselung personenbezogener Daten
    

### 4.2 Sicherheit und Datenschutz

- Verwendung von HTTPS für sicheren Datenaustausch
    
- DSGVO-konforme Datenspeicherung und -verarbeitung
    
- Sichere Authentifizierung und Benutzerrechteverwaltung
    

---

## 5. Optionale Anforderungen

### 5.1 Exportfunktionen (Optional)

- Export der Vertragsübersicht und Zahlungsdaten im CSV-Format
    
- Export von einzelnen Verträgen inklusive Details und Notizen im PDF-Format
    

### 5.2 Erweiterte Diagramme und Berichte (Optional)

- Erweiterte Diagramme mit tiefergehender Analyse der Zahlungsstrukturen (z.B. Jahresübersicht der Ausgabenentwicklung)
    

### 5.3 Erweiterte Benachrichtigungen (Optional)

- Push-Benachrichtigungen für mobile Endgeräte
    
- Integration weiterer Kommunikationskanäle wie SMS oder Messenger-Dienste
    

---

## 6. Schnittstellenanforderungen

### 6.1 Benutzerschnittstelle (Frontend)

- Klar strukturierte Bedienoberfläche
    
- Dynamische Formularvalidierung und Benutzereingabeführung
    

### 6.2 Programmierschnittstelle (Backend-API)

- REST-konforme Schnittstelle
    
- Umfangreiche Dokumentation aller API-Endpunkte
    
- Status- und Fehlercodes gemäß HTTP-Standards
    

---

## 7. Datenbankanforderungen (SQLite)

### 7.1 Datenbankstruktur

- Tabelle "Contracts" (Vertragsinformationen)
    
- Tabelle "Payments" (Zahlungsinformationen, Fristen)
    
- Tabelle "Users" (Benutzerinformationen und Zugangsdaten)
    
- Tabelle "Reminders" (E-Mail-Erinnerungseinstellungen und Log)
    

### 7.2 Sicherungs- und Backupstrategie

- Regelmäßige Backups der SQLite-Datenbank
    
- Möglichkeit zur automatischen Wiederherstellung nach Datenverlust
    

---

## 8. Qualitätsanforderungen

### 8.1 Performance

- Schnelle Ladezeiten der Webanwendung
    
- Schnelle Abfragen und Verarbeitung der Datenbank
    

### 8.2 Zuverlässigkeit

- Hohe Verfügbarkeit der Anwendung (mind. 99 % Uptime)
    
- Robustes Fehlerhandling und schnelle Fehlerbehebung
    

---

## 9. Erweiterbarkeit und Wartbarkeit

- Modularer und dokumentierter Code für zukünftige Erweiterungen
    
- Einfache Integration zusätzlicher Vertragsarten und Funktionen
    

---

## 10. Abnahmekriterien

- Vollständige Umsetzung der in diesem Pflichtenheft definierten Anforderungen
    
- Erfolgreiche Durchführung von Testfällen (z.B. Erstellung, Bearbeitung und Löschung von Verträgen, E-Mail-Versandtests, Export-Funktionstests)
    
- Einhaltung aller Sicherheits- und Datenschutzanforderungen
    

---

## 11. Abschlussbemerkung

Dieses Pflichtenheft definiert alle wesentlichen Anforderungen an das Projekt „PlanPago“. Die Umsetzung sämtlicher Kernfunktionen ist verpflichtend, während die optionalen Anforderungen je nach verfügbarem Zeitrahmen und Ressourcenlage implementiert werden können.
