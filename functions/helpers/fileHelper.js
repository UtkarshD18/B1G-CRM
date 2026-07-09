const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

// ==========================================
// JSON Utilities
// ==========================================

function readJSONFile(filePath, length) {
  const { validatePath } = require('../../utils/pathSafe');
  const cleanPath = validatePath(process.cwd(), filePath);
  if (!cleanPath) return [];
  try {
    console.log('HEY');
    // Check if the file exists
    if (!fs.existsSync(cleanPath)) {
      console.error('File not found:', cleanPath);
      return []; // Return empty array if file does not exist
    }

    // Read the file content
    let fileContent = fs.readFileSync(cleanPath, 'utf8');

    if (fileContent?.endsWith('}\n]  }\n]')) {
      console.log('FOUND ENDS');
      console.log('Invalid JSON found, making it correct');
      fileContent = fileContent.replace('}\n]  }\n]', '\n}\n]');
      console.log('Correction done!');

      // Write the corrected JSON back to the file
      fs.writeFileSync(cleanPath, fileContent, 'utf8');
      console.log('Corrected JSON has been written to the file');
    }

    // Remove invalid trailing characters if they exist
    if (fileContent?.endsWith('}\n]\n}\n]')) {
      console.log('FOUND ENDS');
      console.log('Invalid JSON found, making it correct');
      fileContent = fileContent.replace('}\n]\n}\n]', '\n}\n]');
      console.log('Correction done!');

      // Write the corrected JSON back to the file
      fs.writeFileSync(cleanPath, fileContent, 'utf8');
      console.log('Corrected JSON has been written to the file');
    }

    // Try to parse the JSON
    let jsonArray;
    try {
      jsonArray = JSON.parse(fileContent);
    } catch (error) {
      console.error('Initial JSON parse error:', error.message);
      return []; // Return empty array if JSON is not valid
    }

    // Check if the parsed content is an array
    if (!Array.isArray(jsonArray)) {
      console.error('Invalid JSON format: not an array');
      return []; // Return empty array if JSON is not an array
    }

    // If length is provided, return only specified number of latest objects
    if (typeof length === 'number' && length > 0) {
      return jsonArray.slice(-length);
    }

    return jsonArray; // Return all objects if length is not provided or invalid
  } catch (err) {
    console.error('Error reading JSON file:', err);
    return [];
  }
}

function writeJsonToFile(filepath, jsonData, callback) {
  const { validatePath } = require('../../utils/pathSafe');
  const cleanPath = validatePath(process.cwd(), filepath);
  if (!cleanPath) {
    const err = new Error('Invalid filepath');
    if (callback) callback(err);
    return Promise.reject(err);
  }
  return new Promise((resolve, reject) => {
    // Ensure directory structure exists
    const directory = path.dirname(cleanPath);
    fs.mkdir(directory, { recursive: true }, function (err) {
      if (err) {
        if (callback) {
          callback(err);
        }
        reject(err);
        return;
      }

      // Convert JSON data to string
      const jsonString = JSON.stringify(jsonData, null, 2); // 2 spaces indentation for readability

      // Write JSON data to file, with 'w' flag to overwrite existing file
      fs.writeFile(cleanPath, jsonString, { flag: 'w' }, function (err) {
        if (err) {
          if (callback) {
            callback(err);
          }
          reject(err);
          return;
        }
        const message = `JSON data has been written to '${cleanPath}'.`;
        if (callback) {
          callback(null, message);
        }
        resolve(message);
      });
    });
  });
}

function saveJsonToFile(jsonData, dir) {
  const timestamp = Date.now();
  const filename = `${timestamp}.json`;
  const jsonString = JSON.stringify(jsonData, null, 2); // null and 2 for pretty formatting
  const directory = dir; // Change this to your desired directory
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, jsonString);
  console.log(`JSON data saved to ${filePath}`);
}

function readJsonFromFile(filePath) {
  const { validatePath } = require('../../utils/pathSafe');
  const cleanPath = validatePath(process.cwd(), filePath);
  if (!cleanPath) return [];
  try {
    // Read the file synchronously
    const jsonData = fs.readFileSync(cleanPath, 'utf8');
    // Parse JSON data
    const parsedData = JSON.parse(jsonData);
    // If parsed data is an array, return it, otherwise return an empty array
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (err) {
    // If any error occurs (e.g., file not found or invalid JSON), return an empty array
    console.error('Error reading JSON file:', cleanPath, err);
    return [];
  }
}

function addObjectToFile(object, filePath) {
  const { validatePath } = require('../../utils/pathSafe');
  const cleanPath = validatePath(process.cwd(), filePath);
  if (!cleanPath) return;
  const parentDir = path.dirname(cleanPath);

  // Check if the parent directory exists
  if (!fs.existsSync(parentDir)) {
    // Create the parent directory if it doesn't exist
    fs.mkdirSync(parentDir, { recursive: true });
  }

  if (fs.existsSync(cleanPath)) {
    const existingData = JSON.parse(fs.readFileSync(cleanPath));
    if (Array.isArray(existingData)) {
      existingData.push(object);
      fs.writeFileSync(cleanPath, JSON.stringify(existingData, null, 2));
    } else {
      console.error('File does not contain an array.');
    }
  } else {
    fs.writeFileSync(cleanPath, JSON.stringify([object], null, 2));
  }
}

// ==========================================
// Filesystem Utilities
// ==========================================

function folderExists(folderPath) {
  try {
    fs.accessSync(folderPath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function deleteFileIfExists(filePath) {
  const { validatePath } = require('../../utils/pathSafe');
  const cleanPath = validatePath(process.cwd(), filePath);
  if (!cleanPath) return;
  // Check if the file exists
  fs.access(cleanPath, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist, do nothing
      console.error(`File ${cleanPath} does not exist.`);
      return;
    }

    // File exists, delete it
    fs.unlink(cleanPath, (err) => {
      if (err) {
        console.error('Error deleting file:', cleanPath, err);
        return;
      }
      console.log(`File ${cleanPath} has been deleted.`);
    });
  });
}

function getFileExtension(fileName) {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex !== -1 && dotIndex !== 0) {
    const extension = fileName.substring(dotIndex + 1);
    return extension.toLowerCase();
  }
  return '';
}

// ==========================================
// Archive/Media Utilities
// ==========================================

async function downloadAndExtractFile(filesObject, outputFolderPath) {
  try {
    // Access the uploaded file from req.files
    const uploadedFile = filesObject.file;
    if (!uploadedFile) {
      return { success: false, msg: 'No file data found in FormData' };
    }

    // Create a safe output path
    const { validatePath } = require('../../utils/pathSafe');
    const safeOutputFolder = path.resolve(outputFolderPath);
    const outputPath = validatePath(safeOutputFolder, uploadedFile.name);

    // Move the file to the desired location
    await new Promise((resolve, reject) => {
      uploadedFile.mv(outputPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Extract the downloaded file
    await fs
      .createReadStream(outputPath)
      .pipe(unzipper.Extract({ path: safeOutputFolder })) // Specify the output folder path for extraction
      .promise();

    // Delete the downloaded zip file after extraction
    fs.unlinkSync(outputPath);

    return { success: true, msg: 'App was successfully installed/updated' };
  } catch (error) {
    console.error('Error downloading and extracting file:', error);
    return { success: false, msg: error.message };
  }
}

function validateMagicBytes(fileBuffer, fileName) {
  if (!fileBuffer || !fileName) return false;
  const ext = getFileExtension(fileName);
  if (!ext) return false;

  const hex = fileBuffer.toString('hex', 0, 12).toLowerCase();

  switch (ext) {
    case 'png':
      return hex.startsWith('89504e470d0a1a0a');
    case 'jpg':
    case 'jpeg':
      return hex.startsWith('ffd8ff');
    case 'gif':
      return hex.startsWith('474946383761') || hex.startsWith('474946383961');
    case 'pdf':
      return hex.startsWith('25504446');
    case 'mp4':
      return hex.slice(8, 16) === '66747970';
    case 'csv':
      return !hex.includes('00');
    default:
      return true;
  }
}

module.exports = {
  readJSONFile,
  writeJsonToFile,
  saveJsonToFile,
  readJsonFromFile,
  addObjectToFile,
  folderExists,
  deleteFileIfExists,
  getFileExtension,
  downloadAndExtractFile,
  validateMagicBytes,
};
