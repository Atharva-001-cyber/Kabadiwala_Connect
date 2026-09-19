const https = require('https');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY=([^\r\n]+)/);
if (!match) {
  console.error('ROBOFLOW_API_KEY not found in .env');
  process.exit(1);
}
const apiKey = match[1].trim();

const targets = [
  { name: 'roboflow_motor.zip', endpoint: 'project-3swgf/electric-motor-housing1/1/yolov8' },
  { name: 'roboflow_trc.zip', endpoint: 'trcproject/e-waste-detection-model/5/yolov8' },
  { name: 'roboflow_crt.zip', endpoint: 'amandeep-etjdw/crt/1/yolov8' }
];

function getExportLink(endpoint) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.roboflow.com/${endpoint}?api_key=${apiKey}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.export && json.export.link) {
            resolve(json.export.link);
          } else {
            reject(new Error(`Export link not ready: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        https.get(res.headers.location, redirectRes => {
          redirectRes.pipe(file);
          file.on('finish', () => {
            file.close(() => resolve());
          });
        }).on('error', err => {
          fs.unlink(destPath, () => reject(err));
        });
      } else {
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve());
        });
      }
    }).on('error', err => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

async function main() {
  console.log('======================================================================');
  console.log('STEP 7: AUTHENTICATED ROBOFLOW DATASET DOWNLOAD PIPELINE');
  console.log('======================================================================');

  const stagingDir = path.resolve('dataset_staging');
  if (!fs.existsSync(stagingDir)) fs.mkdirSync(stagingDir, { recursive: true });

  for (const t of targets) {
    const dest = path.join(stagingDir, t.name);
    console.log(`\nFetching export link for ${t.endpoint}...`);
    try {
      const link = await getExportLink(t.endpoint);
      console.log(`Downloading ${t.name}...`);
      await downloadFile(link, dest);
      const stat = fs.statSync(dest);
      console.log(`Downloaded ${t.name}: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (err) {
      console.error(`Failed to download ${t.name}:`, err.message);
    }
  }
}

main().catch(err => {
  console.error('Download failed:', err);
  process.exit(1);
});
