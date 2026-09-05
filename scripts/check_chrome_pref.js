const fs = require('fs');
const path = require('path');

const prefPath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Preferences');
if (!fs.existsSync(prefPath)) {
  console.log('Preferences file does not exist at:', prefPath);
  process.exit(0);
}

try {
  const content = fs.readFileSync(prefPath, 'utf8');
  const data = JSON.parse(content);
  const cameraSettings = data?.profile?.content_settings?.exceptions?.media_stream_camera;
  console.log('Found cameraSettings:', JSON.stringify(cameraSettings, null, 2));

  // Also check mic settings
  const micSettings = data?.profile?.content_settings?.exceptions?.media_stream_mic;
  console.log('Found micSettings:', JSON.stringify(micSettings, null, 2));
} catch (err) {
  console.error('Error reading preferences:', err);
}
