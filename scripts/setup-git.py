import urllib.request
import zipfile
import os
import shutil

url = 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/MinGit-2.47.1-64-bit.zip'
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bin_dir = os.path.join(root_dir, 'bin')
dest_dir = os.path.join(bin_dir, 'mingit')
os.makedirs(dest_dir, exist_ok=True)
zip_path = os.path.join(bin_dir, 'mingit.zip')

print(f'Downloading MinGit from {url}...')
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
    shutil.copyfileobj(response, out_file)

print('Extracting MinGit to:', dest_dir)
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(dest_dir)

if os.path.exists(zip_path):
    os.remove(zip_path)

git_cmd = os.path.join(dest_dir, 'cmd', 'git.exe')
print('MinGit installed successfully!')
print('Git binary:', git_cmd)
os.system(f'"{git_cmd}" --version')
