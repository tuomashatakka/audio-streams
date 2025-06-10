import fs from 'fs'
import path from 'path'

// Define the directory to search for files
const directory = './app'

// Define the regular expression pattern to replace
const pattern = /return((\s|\n)+)\</gi

// Define the replacement string
const replacement = 'return <'

// Function to replace the pattern in a file
function replacePatternInFile (filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err}`)
      return
    }

    const newData = data.replace(pattern, replacement)

    fs.writeFile(filePath, newData, err => {
      if (err)
        console.error(`Error writing file: ${err}`); else
        console.log(`Pattern replaced in file: ${filePath}`)
    })
  })
}

// Function to walk through the directory and replace the pattern in all files
function walkDirectory (dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory())
      walkDirectory(filePath); else if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.tsx'))
      replacePatternInFile(filePath)
  })
}

// Start walking through the directory
walkDirectory(directory)
