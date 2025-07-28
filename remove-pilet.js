const fs = require('fs');
const path = require('path');

// Load the current pilet data
const snapshotPath = path.join(__dirname, 'pilets', 'db.json');

function removePilet(piletName, version = null) {
  try {
    // Read current snapshot
    let piletData = {};
    if (fs.existsSync(snapshotPath)) {
      const data = fs.readFileSync(snapshotPath, 'utf8');
      piletData = JSON.parse(data);
    }

    if (!piletData[piletName]) {
      console.log(`❌ Pilet '${piletName}' not found.`);
      return false;
    }

    const piletDir = path.join(__dirname, 'pilets', piletName);
    
    if (version) {
      // Remove specific version
      const versionDir = path.join(piletDir, version);
      const versionMetaFile = path.join(piletDir, `${version}.json`);
      
      if (!fs.existsSync(versionDir)) {
        console.log(`❌ Version '${version}' of pilet '${piletName}' not found.`);
        return false;
      }
      
      // Remove version directory and metadata file
      fs.rmSync(versionDir, { recursive: true, force: true });
      if (fs.existsSync(versionMetaFile)) {
        fs.unlinkSync(versionMetaFile);
      }
      
      // If this was the current version, update current to the latest remaining version
      if (piletData[piletName] === version) {
        const remainingVersions = fs.readdirSync(piletDir)
          .filter(file => fs.statSync(path.join(piletDir, file)).isDirectory())
          .sort();
        
        if (remainingVersions.length > 0) {
          const newCurrentVersion = remainingVersions[remainingVersions.length - 1];
          piletData[piletName] = newCurrentVersion;
          console.log(`📝 Updated current version to '${newCurrentVersion}'`);
        } else {
          // No versions left, delete the entire pilet
          delete piletData[piletName];
          fs.rmSync(piletDir, { recursive: true, force: true });
          console.log(`🗑️  Deleted entire pilet '${piletName}' (no versions remaining)`);
        }
      } else {
        console.log(`🗑️  Deleted version '${version}' of pilet '${piletName}'`);
      }
    } else {
      // Delete entire pilet
      delete piletData[piletName];
      fs.rmSync(piletDir, { recursive: true, force: true });
      console.log(`🗑️  Deleted entire pilet '${piletName}'`);
    }

    // Write back to snapshot
    const snapshotDir = path.dirname(snapshotPath);
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }
    
    fs.writeFileSync(snapshotPath, JSON.stringify(piletData, null, 2));
    console.log(`✅ Successfully updated snapshot at ${snapshotPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error removing pilet: ${error.message}`);
    return false;
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node remove-pilet.js <pilet-name> [version]');
  console.log('Examples:');
  console.log('  node remove-pilet.js trip-planner');
  console.log('  node remove-pilet.js trip-planner 1.0.24');
  process.exit(1);
}

const piletName = args[0];
const version = args[1] || null;

console.log(`🔍 Attempting to remove pilet: ${piletName}${version ? ` (version: ${version})` : ''}`);
removePilet(piletName, version); 