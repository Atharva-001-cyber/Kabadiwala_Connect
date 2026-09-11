import fs from 'fs';
import path from 'path';

const transPath = path.resolve(__dirname, '../../frontend/src/i18n/translations.ts');
const content = fs.readFileSync(transPath, 'utf8');

const hiMatch = content.match(/hi:\s*{([\s\S]*?)},\s*mr:/);
const mrMatch = content.match(/mr:\s*{([\s\S]*?)},\s*en:/);

function checkSection(name: string, sectionContent: string) {
  console.log(`\n=== CHECKING ${name} SECTION FOR ENGLISH LEAKS ===`);
  const lines = sectionContent.split('\n');
  lines.forEach((l, idx) => {
    // Exclude technical acronyms like CPCB, GPS, UPI, OTP, EPR, KYC, SHA, URL, ID, LED, LCD, CRT, PCB, kg, SMS
    const cleaned = l
      .replace(/CPCB/g, '')
      .replace(/GPS/g, '')
      .replace(/UPI/g, '')
      .replace(/OTP/g, '')
      .replace(/EPR/g, '')
      .replace(/KYC/g, '')
      .replace(/SHA-256/g, '')
      .replace(/URL/g, '')
      .replace(/ID/g, '')
      .replace(/LED/g, '')
      .replace(/LCD/g, '')
      .replace(/CRT/g, '')
      .replace(/PCB/g, '')
      .replace(/JSON/g, '')
      .replace(/CSV/g, '')
      .replace(/MTA/g, '')
      .replace(/AI/g, '')
      .replace(/E-Waste/g, '')
      .replace(/EW-/g, '')
      .replace(/kg/g, '');

    // Check if there are english words with 3 or more letters inside quotes
    const valueMatch = cleaned.match(/:\s*['"`](.*?)['"`]/);
    if (valueMatch) {
      const val = valueMatch[1];
      const englishWords = val.match(/[a-zA-Z]{3,}/g);
      if (englishWords && englishWords.length > 0) {
        console.log(`Line ${idx + 1}: ${l.trim()}`);
      }
    }
  });
}

if (hiMatch) checkSection('HINDI (hi)', hiMatch[1]);
if (mrMatch) checkSection('MARATHI (mr)', mrMatch[1]);
