const fs = require('fs');
const path = require('path');

const prefPath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Preferences');
if (!fs.existsSync(prefPath)) {
  console.log('Preferences file does not exist at:', prefPath);
  process.exit(1);
}

try {
  const content = fs.readFileSync(prefPath, 'utf8');
  const data = JSON.parse(content);
  
  if (!data.profile) data.profile = {};
  if (!data.profile.content_settings) data.profile.content_settings = {};
  if (!data.profile.content_settings.exceptions) data.profile.content_settings.exceptions = {};
  if (!data.profile.content_settings.exceptions.media_stream_camera) {
    data.profile.content_settings.exceptions.media_stream_camera = {};
  }

  const camera = data.profile.content_settings.exceptions.media_stream_camera;
  
  // Set eih-chi.vercel.app to 1 (ALLOW)
  camera['https://eih-chi.vercel.app:443,*'] = {
    last_modified: Date.now().toString(),
    setting: 1
  };

  // Also set localhost:3000 to 1 (ALLOW)
  camera['http://localhost:3000,*'] = {
    last_modified: Date.now().toString(),
    setting: 1
  };

  fs.writeFileSync(prefPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Successfully updated Chrome camera permissions to 1 (ALLOW) for eih-chi.vercel.app and localhost:3000');
} catch (err) {
  console.error('Error updating preferences:', err);
}
