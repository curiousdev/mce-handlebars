set -e
rm -rf assets/tinymce/
npm install tinymce
cp -R node_modules/tinymce assets
rm -rf node_modules
rm package.json
rm package-lock.json